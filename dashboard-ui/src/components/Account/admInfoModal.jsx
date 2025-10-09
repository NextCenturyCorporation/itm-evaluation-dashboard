import '../../css/admInfo.css';
import { Modal } from "@mui/material";
import { determineChoiceProcessJune2025 } from '../Research/utils';
import { formatTargetWithDecimal } from "../Survey/surveyUtils";

export default function AdmInfoModal({
    open,
    onClose,
    pid,
    scenarioId,
    dataTextResults,
    dataSurveyResults,
    KDMA_MAP,
    formatLoading
}) {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="adm-popup-body">
                {(() => {
                    const allScenarios = dataTextResults.getAllScenarioResults;
                    const docs = allScenarios.filter(r => r.participantID === pid);
                    if (docs.length === 0) return <p>No data available.</p>;

                    const match = scenarioId.match(/^([a-z]+)-|^[^-]+-([A-Z]+)\d+-eval$/);
                    const code = match?.[1] || match?.[2] || '';

                    const allSurveys = dataSurveyResults.getAllSurveyResults;

                    const surveyEntry = allSurveys.find(s => {
                        const r = s.results;
                        if (!r) return false;
                        const pidMatches = r.pid === pid || r["Participant ID Page"]?.questions?.["Participant ID"]?.response === pid;
                        return pidMatches && Object.values(r).some(page => page?.pageType === "comparison" && page?.scenarioIndex === scenarioId);
                    });

                    if (!surveyEntry) return <p>No data available.</p>;

                    const cmpPage = Object.values(surveyEntry.results).find(page => page?.pageType === "comparison" && page?.scenarioIndex === scenarioId);

                    if (!cmpPage) return <p>No comparison page for {scenarioId}</p>;

                    // need to handle multi kdma differently
                    const isMultiKDMA = scenarioId.includes('AF') && scenarioId.includes('MF');

                    let medicData = [];

                    let target = '';
                    let filteredArr = [];
                    let doc = null;

                    if (isMultiKDMA) {
                        const medicIds = cmpPage.pageName.split(" vs ");

                        medicIds.forEach(medicId => {
                            const singlePage = surveyEntry?.results?.[medicId];
                            if (singlePage?.pageType === "singleMedic") {
                                medicData.push({
                                    type: singlePage.admAlignment.charAt(0).toUpperCase() + singlePage.admAlignment.slice(1),
                                    admName: singlePage.admName || "-",
                                    target: singlePage.admTarget || "-",
                                    // there is no exemption loading for multi kdma
                                    loading: 'Normal'
                                });
                            }
                        });
                    } else {
                        const { baselineName, alignedTarget, misalignedTarget } = cmpPage;
                        target = KDMA_MAP[code] || code.toLowerCase();

                        let entry = null;
                        let doc = null;
                        for (const d of docs) {
                            entry = d.mostLeastAligned.find(o => o.target === target);
                            if (entry) {
                                doc = d;
                                break;
                            }
                        }

                        if (!doc || !entry) return <p>No alignments found for target.</p>;

                        const arr = entry.response || [];

                        if (arr.length === 0) return <p>No alignments.</p>;

                        filteredArr = arr.filter(o => {
                            const key = Object.keys(o)[0];
                            return !key.split("-").pop().includes("_");
                        });

                        const medicIds = cmpPage.pageName.split(" vs ");
                        let alignedName = "-";
                        let misalignedName = "-";
                        medicIds.forEach(id => {
                            const singlePage = surveyEntry?.results?.[id];
                            if (singlePage?.pageType === "singleMedic") {
                                if (singlePage.admAlignment === "aligned") alignedName = singlePage.admName;
                                if (singlePage.admAlignment === "misaligned") misalignedName = singlePage.admName;
                            }
                        });

                        const alignedPage = surveyEntry.results[medicIds.find(id => surveyEntry.results[id]?.admAlignment === "aligned")];
                        const misalignedPage = surveyEntry.results[medicIds.find(id => surveyEntry.results[id]?.admAlignment === "misaligned")];

                        const alignedLoading = alignedPage ? determineChoiceProcessJune2025([doc], alignedPage, "aligned") : "N/A";
                        const misalignedLoading = misalignedPage ? determineChoiceProcessJune2025([doc], misalignedPage, "misaligned") : "N/A";

                        medicData = [
                            { type: "Baseline", admName: baselineName || "-", target: "N/A", loading: "N/A" },
                            { type: "Aligned", admName: alignedName || "-", target: alignedTarget || "-", loading: formatLoading(alignedLoading) },
                            { type: "Misaligned", admName: misalignedName || "-", target: misalignedTarget || "-", loading: formatLoading(misalignedLoading) }
                        ];
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
                                    {!isMultiKDMA ? (
                                        <>
                                            <div className="adm-info-block">
                                                <div className="adm-info-block-label">Attribute</div>
                                                <div className="adm-info-block-value">
                                                    {target.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                                </div>
                                            </div>
                                            <div className="adm-info-block">
                                                <div className="adm-info-block-value adm-align-list">
                                                    {filteredArr.map((o, idx) => {
                                                        let key, score;

                                                        if (typeof o === 'object' && o.target && o.score !== undefined) {
                                                            // st way
                                                            key = o.target;
                                                            score = o.score;
                                                        } else {
                                                            // adept way
                                                            key = Object.keys(o)[0];
                                                            score = o[key];
                                                        }

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
                                        </>
                                    ) : (
                                        <>
                                            <div className="adm-info-block">
                                                <div className="adm-info-block-label">Type</div>
                                                <div className="adm-info-block-value">Multi-KDMA Comparison</div>
                                            </div>
                                            <div className="adm-info-block">
                                                <div className="adm-info-block-label">KDMA Scores</div>

                                                {(() => {
                                                    const meritScore = doc.kdmas?.find(k => k.kdma === 'merit')?.value;
                                                    const affiliationScore = doc.kdmas?.find(k => k.kdma === 'affiliation')?.value;

                                                    return (
                                                        <>
                                                            {meritScore !== undefined && (
                                                                <div>Merit: {meritScore.toFixed(3)}</div>
                                                            )}
                                                            {affiliationScore !== undefined && (
                                                                <div>Affiliation: {affiliationScore.toFixed(3)}</div>
                                                            )}
                                                            {meritScore === undefined && affiliationScore === undefined && (
                                                                <div>No KDMA scores available</div>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                            </div>
                                        </>
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
                                            <tr>
                                                <th>Type</th>
                                                <th>ADM Name</th>
                                                <th>Target</th>
                                                <th>ADM Loading</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {medicData.map((medic, index) => (
                                                <tr key={index}>
                                                    <td>{medic.type}</td>
                                                    <td>{medic.admName}</td>
                                                    <td>{medic.target}</td>
                                                    <td>{medic.loading}</td>
                                                </tr>
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
