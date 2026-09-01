import '../../css/admInfo.css';
import { Modal } from "@mui/material";
import { determineChoiceProcessJune2025 } from '../Research/utils';
import { formatTargetWithDecimal } from "../Survey/surveyUtils";

const MULTI_KDMA_CONFIG = {
    'AF-PS': { kdmas: ['affiliation', 'personal_safety'], labels: ['Affiliation', 'Personal Safety'], test: id => id.includes('AF') && id.includes('PS') && !id.includes('MF') },
    'MF-PS': { kdmas: ['merit', 'personal_safety'], labels: ['Merit', 'Personal Safety'], test: id => id.includes('MF') && id.includes('PS') && !id.includes('AF') },
    'MF-SS': { kdmas: ['merit', 'search'], labels: ['Merit', 'Search'], test: id => id.includes('MF') && id.includes('SS') }
};

const ATTR_CODE = { merit: 'MF', search: 'SS', affiliation: 'AF', personal_safety: 'PS' };

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

// AF3, PS8 -> AF3-PS8
function synthesizeCombined2DRanking(response, codes, targetPrefix = 'Feb2026') {
    const [c1, c2] = codes;
    const soloRanking = code =>
        filterAlignments(response, [code], ['MF', 'SS', 'AF', 'PS'].filter(c => c !== code))
            .map(o => ({ index: Object.keys(o)[0].match(/(\d+)$/)?.[1], score: o[Object.keys(o)[0]] }))
            .filter(o => o.index != null);
    const r1 = soloRanking(c1), r2 = soloRanking(c2);
    const combos = [];
    for (const a of r1) for (const b of r2) {
        combos.push({ [`${targetPrefix}-${c1}${a.index}-${c2}${b.index}`]: a.score + b.score });
    }
    return combos.sort((x, y) => Object.values(y)[0] - Object.values(x)[0]);
}

// A medic is "Normal" when its target is the expected pick for its slot — the
// most-aligned target for the aligned slot, the least-aligned target for the
// misaligned slot. If it sits elsewhere in the ranking it's an "Exemption"
function rankingLoading(medic, slot, ranking, formatLoading) {
    if (!medic) return "N/A";
    const keyOf = o => Object.keys(o)[0];
    if (!ranking.length) return medic.admChoiceProcess ? formatLoading(medic.admChoiceProcess) : "Normal";
    const ref = slot === 'misaligned' ? keyOf(ranking[ranking.length - 1]) : keyOf(ranking[0]);
    if (medic.admTarget === ref) return 'Normal';
    if (!ranking.some(o => keyOf(o) === medic.admTarget)) {
        return medic.admChoiceProcess ? formatLoading(medic.admChoiceProcess) : 'Normal';
    }
    return 'Exemption';
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

// Shared builder for single-attribute / fixed-attribute blocks (June2026 AF/PS/AF-SS, MF).
// Medics are identified by admAlignment config.docPredicate selects the doc (falls back to config.doc scenario_id match).
function buildAlignmentBlock(config, ctx) {
    const { docs, cmpPage, getMedicByAlignment, formatLoading } = ctx;
    const doc = config.docPredicate ? docs.find(config.docPredicate) : docs.find(d => d.scenario_id === config.doc);
    if (!doc) return { error: `No alignment data found for ${config.doc || config.label || 'this block'}` };

    const entry = doc[config.field]?.find(o => o.target === null) ?? doc[config.field]?.[0];
    const filteredArr = filterAlignments(entry?.response, config.include, config.exclude);

    const { baselineName, misalignedTarget } = cmpPage;
    const aligned = getMedicByAlignment("aligned");
    const misaligned = getMedicByAlignment("misaligned");

    const medicData = [
        { type: "Baseline", admName: baselineName || "-", target: "N/A", loading: "N/A" },
        { type: "Aligned", admName: aligned?.admName || "-", target: cmpPage.alignedTarget || "-", loading: rankingLoading(aligned, "aligned", filteredArr, formatLoading) },
    ];
    if (misalignedTarget) {
        medicData.push({ type: "Misaligned", admName: misaligned?.admName || "-", target: misalignedTarget || "-", loading: rankingLoading(misaligned, "misaligned", filteredArr, formatLoading) });
    }

    const leftContent = {
        label: config.labels.join(' + '),
        labelKey: config.labels.length > 1 ? 'Attributes' : 'Attribute',
        kdmaLabel: 'KDMA Parameters',
        kdmaDisplay: renderKDMAList(config.kdmas, config.labels, doc[config.kdmaField])
    };

    return { doc, filteredArr, medicData, leftContent };
}

// July 2025 multi-KDMA (AF + MF)
function resolveLegacyMulti(ctx) {
    const { docs, medicIds, getMedicPage } = ctx;
    let doc = null;
    for (const d of docs) {
        if (d.kdmas?.some(k => k.kdma === 'merit') && d.kdmas?.some(k => k.kdma === 'affiliation')) { doc = d; break; }
    }
    const medicData = medicIds.map(id => getMedicPage(id)).filter(p => p?.pageType === "singleMedic").map(p => ({
        type: p.admAlignment.charAt(0).toUpperCase() + p.admAlignment.slice(1),
        admName: p.admName || "-", target: p.admTarget || "-", loading: "Normal"
    }));
    const m = doc?.kdmas?.find(k => k.kdma === 'merit')?.value;
    const a = doc?.kdmas?.find(k => k.kdma === 'affiliation')?.value;
    const leftContent = {
        label: "Multi-KDMA Comparison", labelKey: "Type",
        kdmaDisplay: (m !== undefined || a !== undefined)
            ? <>{m !== undefined && <div>Merit: {m.toFixed(3)}</div>}{a !== undefined && <div>Affiliation: {a.toFixed(3)}</div>}</>
            : <div>No KDMA scores available</div>,
        kdmaLabel: "KDMA Scores"
    };
    return { doc, filteredArr: [], medicData, leftContent };
}

// Eval 15+ multi-KDMA (AF-PS, MF-PS, MF-SS).
function resolveMultiKDMA(ctx) {
    const { scenarioId, docs, cmpPage, medicIds, getMedicPage, formatLoading } = ctx;
    const multiKDMA = getMultiKDMAConfig(scenarioId);
    const multiKey = Object.keys(MULTI_KDMA_CONFIG).find(k => MULTI_KDMA_CONFIG[k] === multiKDMA);
    let doc = null;
    for (const d of docs) {
        if (multiKDMA.kdmas.every(name => (d?.[`${multiKey}_kdmas`] || d?.kdmas)?.some(k => k.kdma === name))) { doc = d; break; }
    }
    const mlaSource = doc?.[`${multiKey}_mostLeastAligned`] || doc?.mostLeastAligned;
    const kdmaSource = doc?.[`${multiKey}_kdmas`] || doc?.kdmas;
    const entry = mlaSource?.find(o => o.target === null);
    const allCodes = ['MF', 'SS', 'AF', 'PS'];
    const requiredCodes = multiKDMA.kdmas.map(k => ATTR_CODE[k]);
    let filteredArr = filterAlignments(entry?.response, requiredCodes, allCodes.filter(c => !requiredCodes.includes(c)));
    // Eval 18: ADEPT returns no combined 2D key, so i make it myself combining the two 1d attr
    if (!filteredArr.length && entry?.response) {
        filteredArr = synthesizeCombined2DRanking(entry.response, requiredCodes);
    }

    const { alignedTarget, baselineTarget, misalignedTarget } = cmpPage;
    const aligned = getMedicPage(medicIds.find(id => getMedicPage(id)?.admTarget === alignedTarget));
    const baseline = getMedicPage(medicIds.find(id => getMedicPage(id)?.admTarget === baselineTarget));
    const misaligned = misalignedTarget ? getMedicPage(medicIds.find(id => getMedicPage(id)?.admTarget === misalignedTarget)) : null;

    const medicData = [
        { type: "Baseline", admName: baseline?.admName || "-", target: baselineTarget || "N/A", loading: "N/A" },
        { type: "Aligned", admName: aligned?.admName || "-", target: alignedTarget || "-", loading: rankingLoading(aligned, "aligned", filteredArr, formatLoading) },
    ];
    if (misalignedTarget) medicData.push({ type: "Misaligned", admName: misaligned?.admName || "-", target: misalignedTarget || "-", loading: rankingLoading(misaligned, "misaligned", filteredArr, formatLoading) });

    const leftContent = {
        label: multiKDMA.labels.join(' + '), labelKey: "Attribute",
        kdmaDisplay: renderKDMAList(multiKDMA.kdmas, multiKDMA.labels, kdmaSource),
        kdmaLabel: "KDMA Parameters"
    };
    return { doc, filteredArr, medicData, leftContent };
}

// Eval 16 Oracle (AF or MF)
function resolveApril2026Oracle(ctx) {
    const { scenarioId, docs, medicIds, getMedicPage } = ctx;
    const attrCode = scenarioId.includes('AF') ? 'AF' : 'MF';
    const attrMap = { AF: 'affiliation', MF: 'merit' };
    const target_ = attrMap[attrCode];
    const assessId = attrCode === 'AF' ? 'April2026-AF-assess' : 'April2026-MF-assess';
    const doc = docs.find(d => d.scenario_id === assessId);
    if (!doc) return { error: `No alignment data found for ${assessId}` };

    const combinedIdx = attrCode === 'AF' ? 0 : 1;
    const entry = doc.combinedMostLeastAligned?.[combinedIdx];
    const otherCodes = ['MF', 'SS', 'AF', 'PS'].filter(c => c !== attrCode);
    const filteredArr = filterAlignments(entry?.response, [attrCode], otherCodes);

    const mostAlignedTarget = filteredArr.length > 0 ? Object.keys(filteredArr[0])[0] : null;
    const leastAlignedTarget = filteredArr.length > 0 ? Object.keys(filteredArr[filteredArr.length - 1])[0] : null;

    const getOracleLoading = (idx, admTarget) => {
        const ref = idx === 2 ? leastAlignedTarget : mostAlignedTarget;
        return admTarget === ref ? 'Normal' : 'Exemption';
    };

    const medicData = medicIds.map((id, idx) => {
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
    const leftContent = {
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
    return { doc, filteredArr, medicData, leftContent };
}

// June 2026 single-attribute binary/trinary (AF, PS) + AF-SS 2D
function resolveJune2026(ctx) {
    const { scenarioId } = ctx;
    const isAFSS = scenarioId.includes('AF') && scenarioId.includes('SS');
    const isTrinary = scenarioId.includes('trinary');
    const configs = {
        'AF': { doc: isTrinary ? 'June2026-AF-assess-trinary' : 'June2026-AF-assess', field: 'combinedMostLeastAligned', kdmaField: 'combinedKdmas', include: ['AF'], exclude: ['MF', 'PS', 'SS'], kdmas: ['affiliation'], labels: ['Affiliation'] },
        'PS': { doc: isTrinary ? 'June2026-PS-assess-trinary' : 'June2026-PS-assess', field: 'combinedMostLeastAligned', kdmaField: 'combinedKdmas', include: ['PS'], exclude: ['MF', 'AF', 'SS'], kdmas: ['personal_safety'], labels: ['Personal Safety'] },
        'AF-SS': { doc: 'June2026-AF-assess', field: 'AF-SS_mostLeastAligned', kdmaField: 'AF-SS_kdmas', include: ['AF', 'SS'], exclude: ['MF', 'PS'], kdmas: ['affiliation', 'search'], labels: ['Affiliation', 'Search'] },
    };
    const attrCode = isAFSS ? 'AF-SS' : scenarioId.includes('AF') ? 'AF' : scenarioId.includes('PS') ? 'PS' : null;
    const config = attrCode && configs[attrCode];
    if (!config) return { error: `No alignment data found for ${scenarioId}` };
    return buildAlignmentBlock(config, ctx);
}

// MF single-attribute block (pages: Feb2026-MF{n}-observe). Shared by eval 15 and eval 18,
//   eval 18 -> June2026-MF-assess (combined*),   keys Jun2026-MF-n (page targets Feb2026-MF-n)
//   eval 15 -> Feb2026-{..}-assess (individual*), keys Feb2026-MF-n
function resolveMFSingle(ctx) {
    const { docs } = ctx;
    const sources = [
        { docPredicate: d => d.scenario_id === 'June2026-MF-assess' && d.combinedMostLeastAligned, field: 'combinedMostLeastAligned', kdmaField: 'combinedKdmas' },
        { docPredicate: d => d.individualMostLeastAligned?.length, field: 'individualMostLeastAligned', kdmaField: 'individualKdmas' },
    ];
    const src = sources.find(s => docs.some(s.docPredicate));
    if (!src) return { error: 'No MF alignment data found' };
    return buildAlignmentBlock({ ...src, include: ['MF'], exclude: ['AF', 'PS', 'SS'], kdmas: ['merit'], labels: ['Merit'] }, ctx);
}

// legacy single-attribute (2025 / DryRun / qol / vol)
function resolveSingleAttribute(ctx) {
    const { scenarioId, docs, cmpPage, getMedicByAlignment, formatLoading, KDMA_MAP } = ctx;
    const derivedCode = extractKDMACode(scenarioId);
    const target_ = KDMA_MAP[derivedCode] || derivedCode.toLowerCase();

    let doc = null, entry = null;
    for (const d of docs) {
        entry = d.mostLeastAligned?.find(o => o.target === target_) || d.individualMostLeastAligned?.find(o => o.target === target_);
        if (entry) { doc = d; break; }
    }
    if (!doc || !entry) return { error: 'No alignments found for target.' };

    const arr = entry.response || [];
    if (!arr.length) return { error: 'No alignments.' };
    const otherCodes = ['MF', 'SS', 'AF', 'PS'].filter(c => c !== derivedCode);
    const filteredArr = filterAlignments(arr, [], otherCodes);

    const { baselineName, alignedTarget, misalignedTarget } = cmpPage;
    const aligned = getMedicByAlignment("aligned"), misaligned = getMedicByAlignment("misaligned");

    const getLoading = (page, align) => {
        if (page?.admChoiceProcess) return formatLoading(page.admChoiceProcess);
        return page ? formatLoading(determineChoiceProcessJune2025([doc], page, align)) : "N/A";
    };

    const medicData = [
        { type: "Baseline", admName: baselineName || "-", target: "N/A", loading: "N/A" },
        { type: "Aligned", admName: aligned?.admName || "-", target: alignedTarget || "-", loading: getLoading(aligned, "aligned") },
        { type: "Misaligned", admName: misaligned?.admName || "-", target: misalignedTarget || "-", loading: getLoading(misaligned, "misaligned") }
    ];
    const leftContent = {
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
    return { doc, filteredArr, medicData, leftContent };
}

const RESOLVERS = [
    { match: id => id.includes('AF') && id.includes('MF'), resolve: resolveLegacyMulti },
    { match: id => getMultiKDMAConfig(id) !== null, resolve: resolveMultiKDMA },
    { match: id => id.startsWith('April2026-') && id.endsWith('-observe'), resolve: resolveApril2026Oracle },
    { match: id => id.startsWith('June2026-'), resolve: resolveJune2026 },
    { match: id => /^Feb2026-MF\d/.test(id), resolve: resolveMFSingle },
    { match: () => true, resolve: resolveSingleAttribute },
];

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

                    const medicIds = cmpPage.pageName.split(" vs ");
                    const getMedicPage = id => surveyEntry.results?.[id];
                    const getMedicByAlignment = align => getMedicPage(medicIds.find(id => getMedicPage(id)?.admAlignment === align));

                    const ctx = { scenarioId, docs, cmpPage, medicIds, getMedicPage, getMedicByAlignment, formatLoading, KDMA_MAP };
                    const result = RESOLVERS.find(r => r.match(scenarioId)).resolve(ctx);
                    if (result.error) return <p>{result.error}</p>;

                    const { filteredArr = [], medicData = [], leftContent = {} } = result;

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