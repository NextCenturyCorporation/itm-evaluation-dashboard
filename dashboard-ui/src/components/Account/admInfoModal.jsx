import '../../css/admInfo.css';
import { Modal } from "@mui/material";
import { determineChoiceProcessJune2025 } from '../Research/utils';
import { formatTargetWithDecimal } from "../Survey/surveyUtils";

const MULTI_KDMA_CONFIG = {
    'AF-PS': { kdmas: ['affiliation', 'personal_safety'], labels: ['Affiliation', 'Personal Safety'], test: id => id.includes('AF') && id.includes('PS') && !id.includes('MF') },
    'MF-PS': { kdmas: ['merit', 'personal_safety'], labels: ['Merit', 'Personal Safety'], test: id => id.includes('MF') && id.includes('PS') && !id.includes('AF') },
    'MF-SS': { kdmas: ['merit', 'search'], labels: ['Merit', 'Search'], test: id => id.includes('MF') && id.includes('SS') }
};

function getMultiKDMAConfig(id) {
    return Object.values(MULTI_KDMA_CONFIG).find(c => c.test(id)) || null;
}

function extractKDMACode(scenarioId) {
    const match = scenarioId.match(/^([a-z]+)-|^[^-]+-([A-Z]+)\d+-(?:eval|observe)$/);
    const code = match?.[1] || match?.[2] || '';
    if (code) return code;
    if (scenarioId.startsWith('Feb2026-')) {
        return scenarioId.split('-')[1]?.replace(/\d+$/, '') || '';
    }
    return '';
}

function filterAlignments(arr, include, exclude) {
    return (arr || []).filter(o => {
        const key = Object.keys(o)[0];
        if (key.split("-").pop().includes("_")) return false;
        return include.every(c => key.includes(c)) && !exclude.some(c => key.includes(c));
    });
}

function renderKDMAList(kdmas, labels, source) {
    return (
        <div className="adm-info-block-value adm-kdma-params">
            {kdmas.map((name, i) => {
                const e = source?.find(k => k.kdma === name);
                if (!e) return null;
                if (e.parameters?.length) return (
                    <div key={name} style={{ marginBottom: '0.5rem' }}>
                        <strong>{labels[i]}:</strong>
                        {e.parameters.map(p => <div key={p.name} style={{ marginLeft: '0.75rem' }}>{p.name}: {p.value.toFixed(4)}</div>)}
                    </div>
                );
                if (e.value !== undefined) return <div key={name}>{labels[i]}: {e.value.toFixed(3)}</div>;
                return null;
            })}
        </div>
    );
}

export default function AdmInfoModal({ open, onClose, pid, scenarioId, dataTextResults, dataSurveyResults, KDMA_MAP, formatLoading }) {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="adm-popup-body">
                {(() => {
                    const docs = dataTextResults.getAllScenarioResults.filter(r => r.participantID === pid);
                    if (!docs.length) return <p>No data available.</p>;

                    const surveyEntry = dataSurveyResults.getAllSurveyResults.find(s => {
                        const r = s.results;
                        if (!r) return false;
                        const pidOk = r.pid === pid || r["Participant ID Page"]?.questions?.["Participant ID"]?.response === pid;
                        return pidOk && Object.values(r).some(p => p?.pageType === "comparison" && p?.scenarioIndex === scenarioId);
                    });
                    if (!surveyEntry) return <p>No data available.</p>;

                    const cmpPage = Object.values(surveyEntry.results).find(p => p?.pageType === "comparison" && p?.scenarioIndex === scenarioId);
                    if (!cmpPage) return <p>No comparison page for {scenarioId}</p>;

                    const multiKDMA = getMultiKDMAConfig(scenarioId);
                    const isLegacyMulti = scenarioId.includes('AF') && scenarioId.includes('MF');
                    const medicIds = cmpPage.pageName.split(" vs ");
                    const getMedicPage = id => surveyEntry.results?.[id];
                    const getMedicByAlignment = align => getMedicPage(medicIds.find(id => getMedicPage(id)?.admAlignment === align));
                    const getAdmLoading = (page) => {
                        if (!page) return "N/A";
                        if (page?.admChoiceProcess) return formatLoading(page.admChoiceProcess);
                        return "Normal";
                    };

                    let doc = null, filteredArr = [], medicData = [], leftContent = {};

                    if (isLegacyMulti) {
                        // July 2025 multi kdma logic
                        for (const d of docs) {
                            if (d.kdmas?.some(k => k.kdma === 'merit') && d.kdmas?.some(k => k.kdma === 'affiliation')) { doc = d; break; }
                        }
                        medicData = medicIds.map(id => getMedicPage(id)).filter(p => p?.pageType === "singleMedic").map(p => ({
                            type: p.admAlignment.charAt(0).toUpperCase() + p.admAlignment.slice(1),
                            admName: p.admName || "-", target: p.admTarget || "-", loading: "Normal"
                        }));
                        const m = doc?.kdmas?.find(k => k.kdma === 'merit')?.value;
                        const a = doc?.kdmas?.find(k => k.kdma === 'affiliation')?.value;
                        leftContent = {
                            label: "Multi-KDMA Comparison", labelKey: "Type",
                            kdmaDisplay: m !== undefined || a !== undefined
                                ? <>{m !== undefined && <div>Merit: {m.toFixed(3)}</div>}{a !== undefined && <div>Affiliation: {a.toFixed(3)}</div>}</>
                                : <div>No KDMA scores available</div>,
                            kdmaLabel: "KDMA Scores"
                        };

                    } else if (multiKDMA) {
                        // Eval 15+ multi-KDMA (AF-PS, MF-PS, or MF-SS)
                        const multiKey = Object.keys(MULTI_KDMA_CONFIG).find(k => MULTI_KDMA_CONFIG[k] === multiKDMA);
                        for (const d of docs) {
                            if (multiKDMA.kdmas.every(name => (d?.[`${multiKey}_kdmas`] || d?.kdmas)?.some(k => k.kdma === name))) { doc = d; break; }
                        }
                        const mlaSource = doc?.[`${multiKey}_mostLeastAligned`] || doc?.mostLeastAligned;
                        const kdmaSource = doc?.[`${multiKey}_kdmas`] || doc?.kdmas;
                        const entry = mlaSource?.find(o => o.target === null);
                        const allCodes = ['MF', 'SS', 'AF', 'PS'];
                        const requiredCodes = multiKDMA.kdmas.map(k => k === 'merit' ? 'MF' : k === 'search' ? 'SS' : k === 'affiliation' ? 'AF' : 'PS');
                        filteredArr = filterAlignments(entry?.response, requiredCodes, allCodes.filter(c => !requiredCodes.includes(c)));

                        const { alignedTarget, baselineTarget, misalignedTarget } = cmpPage;
                        const aligned = getMedicPage(medicIds.find(id => getMedicPage(id)?.admTarget === alignedTarget));
                        const baseline = getMedicPage(medicIds.find(id => getMedicPage(id)?.admTarget === baselineTarget));
                        const misaligned = misalignedTarget ? getMedicPage(medicIds.find(id => getMedicPage(id)?.admTarget === misalignedTarget)) : null;

                        medicData = [
                            { type: "Baseline", admName: baseline?.admName || "-", target: baselineTarget || "N/A", loading: "N/A" },
                            { type: "Aligned", admName: aligned?.admName || "-", target: alignedTarget || "-", loading: getAdmLoading(aligned) },
                        ];
                        if (misalignedTarget) medicData.push({ type: "Misaligned", admName: misaligned?.admName || "-", target: misalignedTarget || "-", loading: getAdmLoading(misaligned) });

                        leftContent = {
                            label: multiKDMA.labels.join(' + '), labelKey: "Attribute",
                            kdmaDisplay: renderKDMAList(multiKDMA.kdmas, multiKDMA.labels, kdmaSource),
                            kdmaLabel: "KDMA Parameters"
                        };

                    } else if (scenarioId.startsWith('April2026-') && scenarioId.endsWith('-observe')) {
                        // Eval 16 Oracle (AF or MF)
                        const attrCode = scenarioId.includes('AF') ? 'AF' : 'MF';
                        const attrMap = { AF: 'affiliation', MF: 'merit' };
                        const target_ = attrMap[attrCode];
                        const assessId = attrCode === 'AF' ? 'April2026-AF-assess' : 'April2026-MF-assess';
                        doc = docs.find(d => d.scenario_id === assessId);
                        if (!doc) return <p>No alignment data found for {assessId}</p>;

                        const combinedIdx = attrCode === 'AF' ? 0 : 1;
                        const entry = doc.combinedMostLeastAligned?.[combinedIdx];
                        const otherCodes = ['MF', 'SS', 'AF', 'PS'].filter(c => c !== attrCode);
                        filteredArr = filterAlignments(entry?.response, [attrCode], otherCodes);

                        const mostAlignedTarget = filteredArr.length > 0 ? Object.keys(filteredArr[0])[0] : null;
                        const leastAlignedTarget = filteredArr.length > 0 ? Object.keys(filteredArr[filteredArr.length - 1])[0] : null;

                        const getOracleLoading = (idx, admTarget) => {
                            const ref = idx === 2 ? leastAlignedTarget : mostAlignedTarget;
                            return admTarget === ref ? 'Normal' : 'Exemption';
                        };

                        medicData = medicIds.map((id, idx) => {
                            const p = getMedicPage(id);
                            if (!p) return null;
                            const type = idx === 0
                                ? `Aligned (Subpop ${p.subpop})`
                                : idx === 1
                                    ? `Other Subpop (${p.subpop})`
                                    : `Least Aligned (Subpop ${p.subpop})`;
                            return { type, admName: p.admName || '-', target: p.admTarget || '-', loading: getOracleLoading(idx, p.admTarget) };
                        }).filter(Boolean);

                        const kdmaEntry = doc.combinedKdmas?.find(k => k.kdma === target_);
                        leftContent = {
                            label: target_.charAt(0).toUpperCase() + target_.slice(1),
                            labelKey: 'Attribute',
                            kdmaLabel: 'KDMA Parameters',
                            kdmaDisplay: kdmaEntry?.parameters?.length ? (
                                <div className="adm-info-block-value adm-kdma-params">
                                    {kdmaEntry.parameters.map(p => (
                                        <div key={p.name}>{p.name}: {p.value.toFixed(4)}</div>
                                    ))}
                                </div>
                            ) : <div>No KDMA data</div>
                        };

                    } else if (scenarioId.startsWith('June2026-')) {
                        // June 2026 single-attribute binary/trinary (AF, PS) + AF-SS 2D
                        const isAFSS = scenarioId.includes('AF') && scenarioId.includes('SS');
                        const isTrinary = scenarioId.includes('trinary');
                        const attrCode = isAFSS ? 'AF-SS'
                            : scenarioId.includes('AF') ? 'AF'
                                : scenarioId.includes('PS') ? 'PS'
                                    : scenarioId.includes('MF') ? 'MF' : 'SS';

                        const v17Configs = {
                            'AF': { doc: isTrinary ? 'June2026-AF-assess-trinary' : 'June2026-AF-assess', field: 'combinedMostLeastAligned', kdmaField: 'combinedKdmas', include: ['AF'], exclude: ['MF', 'PS', 'SS'], kdmas: ['affiliation'], labels: ['Affiliation'] },
                            'PS': { doc: isTrinary ? 'June2026-PS-assess-trinary' : 'June2026-PS-assess', field: 'combinedMostLeastAligned', kdmaField: 'combinedKdmas', include: ['PS'], exclude: ['MF', 'AF', 'SS'], kdmas: ['personal_safety'], labels: ['Personal Safety'] },
                            'AF-SS': { doc: 'June2026-AF-assess', field: 'AF-SS_mostLeastAligned', kdmaField: 'AF-SS_kdmas', include: ['AF', 'SS'], exclude: ['MF', 'PS'], kdmas: ['affiliation', 'search'], labels: ['Affiliation', 'Search'] },
                        };
                        const config = v17Configs[attrCode];
                        doc = docs.find(d => d.scenario_id === config.doc);
                        if (!doc) return <p>No alignment data found for {config.doc}</p>;

                        const entry = doc[config.field]?.find(o => o.target === null) ?? doc[config.field]?.[0];
                        filteredArr = filterAlignments(entry?.response, config.include, config.exclude);

                        const { baselineName, alignedTarget, baselineTarget, misalignedTarget } = cmpPage;
                        const aligned = getMedicByAlignment("aligned");
                        const misaligned = getMedicByAlignment("misaligned");

                        const getLoading = (page, align) =>
                            page ? formatLoading(determineChoiceProcessJune2025(null, page, align, filteredArr)) : "N/A";

                        medicData = [
                            { type: "Baseline", admName: baselineName || "-", target: "N/A", loading: "N/A" },
                            { type: "Aligned", admName: aligned?.admName || "-", target: alignedTarget || "-", loading: getLoading(aligned, "aligned") },
                        ];
                        if (misalignedTarget) {
                            medicData.push({ type: "Misaligned", admName: misaligned?.admName || "-", target: misalignedTarget || "-", loading: getLoading(misaligned, "misaligned") });
                        }

                        leftContent = {
                            label: config.labels.join(' + '),
                            labelKey: config.labels.length > 1 ? 'Attributes' : 'Attribute',
                            kdmaLabel: 'KDMA Parameters',
                            kdmaDisplay: renderKDMAList(config.kdmas, config.labels, doc[config.kdmaField])
                        };
                    }
                    else {
                        // Single-attribute
                        const derivedCode = extractKDMACode(scenarioId);
                        const target_ = KDMA_MAP[derivedCode] || derivedCode.toLowerCase();
                        let entry = null;
                        for (const d of docs) {
                            entry = d.mostLeastAligned?.find(o => o.target === target_) || d.individualMostLeastAligned?.find(o => o.target === target_);
                            if (entry) { doc = d; break; }
                        }
                        if (!doc || !entry) return <p>No alignments found for target.</p>;

                        const arr = entry.response || [];
                        if (!arr.length) return <p>No alignments.</p>;
                        const otherCodes = ['MF', 'SS', 'AF', 'PS'].filter(c => c !== derivedCode);
                        filteredArr = filterAlignments(arr, [], otherCodes);

                        const { baselineName, alignedTarget, misalignedTarget } = cmpPage;
                        const aligned = getMedicByAlignment("aligned"), misaligned = getMedicByAlignment("misaligned");

                        const getLoading = (page, align) => {
                            if (page?.admChoiceProcess) return formatLoading(page.admChoiceProcess);
                            return page ? formatLoading(determineChoiceProcessJune2025([doc], page, align)) : "N/A";
                        };

                        medicData = [
                            { type: "Baseline", admName: baselineName || "-", target: "N/A", loading: "N/A" },
                            { type: "Aligned", admName: aligned?.admName || "-", target: alignedTarget || "-", loading: getLoading(aligned, "aligned") },
                            { type: "Misaligned", admName: misaligned?.admName || "-", target: misalignedTarget || "-", loading: getLoading(misaligned, "misaligned") }
                        ];
                        leftContent = {
                            label: target_.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()), labelKey: "Attribute"
                        };

                        const kdmaEntry = doc?.kdmas?.find(k => k.kdma === target_) || doc?.individualKdmas?.find(k => k.kdma === target_);
                        if (kdmaEntry) {
                            if (kdmaEntry.parameters?.length) {
                                leftContent.kdmaLabel = "KDMA Parameters";
                                leftContent.kdmaDisplay = (
                                    <div className="adm-info-block-value adm-kdma-params">
                                        {kdmaEntry.parameters.map(p => (
                                            <div key={p.name} style={{ marginLeft: '0.75rem' }}>{p.name}: {p.value.toFixed(4)}</div>
                                        ))}
                                    </div>
                                );
                            } else if (kdmaEntry.value !== undefined) {
                                leftContent.kdmaLabel = "KDMA Score";
                                leftContent.kdmaDisplay = <div>{kdmaEntry.value.toFixed(3)}</div>;
                            }
                        }
                    }

                    return (
                        <>
                            <div className="adm-header">
                                <h2>ADM Information</h2>
                                <button className="close-popup" onClick={onClose}>Close</button>
                            </div>
                            <div className="adm-popup-content">
                                <div className="adm-left">
                                    <div className="adm-info-block">
                                        <div className="adm-info-block-label">Participant ID</div>
                                        <div className="adm-info-block-value">{pid}</div>
                                    </div>
                                    <div className="adm-info-block">
                                        <div className="adm-info-block-label">Scenario ID</div>
                                        <div className="adm-info-block-value">{scenarioId}</div>
                                    </div>
                                    <div className="adm-info-block">
                                        <div className="adm-info-block-label">{leftContent.labelKey}</div>
                                        <div className="adm-info-block-value">{leftContent.label}</div>
                                    </div>
                                    {leftContent.kdmaDisplay && (
                                        <div className="adm-info-block">
                                            <div className="adm-info-block-label">{leftContent.kdmaLabel}</div>
                                            {leftContent.kdmaDisplay}
                                        </div>
                                    )}
                                    {filteredArr.length > 0 && (
                                        <div className="adm-info-block">
                                            <div className="adm-info-block-value adm-align-list">
                                                {filteredArr.map((o, idx) => {
                                                    const key = (o.target && o.score !== undefined) ? o.target : Object.keys(o)[0];
                                                    const score = (o.target && o.score !== undefined) ? o.score : o[Object.keys(o)[0]];
                                                    return (
                                                        <div key={key}>
                                                            {idx === 0 && (
                                                                <>
                                                                    <span className="adm-info-block-label" style={{ marginBottom: '0.75rem' }}>
                                                                        All Alignments (Highest to Lowest)
                                                                    </span>
                                                                    <br />
                                                                </>
                                                            )}
                                                            {formatTargetWithDecimal(key)} ({score.toFixed(3)})
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="adm-right">
                                    <table>
                                        <colgroup>
                                            <col style={{ width: '14%' }} />
                                            <col style={{ width: '48%' }} />
                                            <col style={{ width: '22%' }} />
                                            <col style={{ width: '15%' }} />
                                        </colgroup>
                                        <thead>
                                            <tr><th>Type</th><th>ADM Name</th><th>Target</th><th>ADM Loading</th></tr>
                                        </thead>
                                        <tbody>
                                            {medicData.map((m, i) => (
                                                <tr key={i}><td>{m.type}</td><td>{m.admName}</td><td>{m.target}</td><td>{m.loading}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </Modal>
    );
}

AdmInfoModal.displayName = 'AdmInfoModal';
