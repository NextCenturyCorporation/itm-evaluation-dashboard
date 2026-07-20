import React from "react";
import "../../../css/resultsTable.css";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from "@material-ui/icons/Close";
import { Modal } from "@mui/material";
import ph2June26DefinitionXLFile from "../variables/Variable Definitions RQ8_PH2_JUNE26.xlsx";
import * as XLSX from "xlsx-js-style";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { DownloadButtons } from "./download-buttons";

const GET_HUMAN_RESULTS = gql`
    query getAllSimAlignment {
        getAllSimAlignment
    }
`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }
`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }
`;

export function PH2RQ8June26({ evalNum }) {
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_HUMAN_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(
        GET_TEXT_RESULTS,
        { fetchPolicy: "no-cache" }
    );
    const {
        loading: loadingParticipantLog,
        error: errorParticipantLog,
        data: dataParticipantLog
    } = useQuery(GET_PARTICIPANT_LOG);

    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [definitionFields, setDefinitionFields] = React.useState([]);
    const [HEADERS, setHeaders] = React.useState([]);
    const [processedForEval, setProcessedForEval] = React.useState(null);

    const definitionFile = ph2June26DefinitionXLFile

    const evalsToUse = React.useMemo(() => {
            return  [evalNum]
        }, [evalNum]);

    const roundIfNumber = React.useCallback((value) => {
        if (typeof value === "number" && !isNaN(value)) {
            return Math.round(value * 100) / 100;
        }
        return value;
    }, []);

    const normalizeBlank = React.useCallback((value) => {
        if (value === undefined || value === null) return "";
        return value;
    }, []);

    const buildProbeFieldsFromEntry = React.useCallback((entry, envLabel) => {
        if (!entry?.data?.data || !entry?.actionAnalysis) return;

        const fieldPrefix = `${envLabel} Probe`;
        const scenes = entry.data.data;
        let afCount = 1;
        let mfCount = 1;
        let afmfCount = 1;

        for (const scene of scenes) {
            if (!scene?.found_match) continue;

            const probeId = scene.probe_id || "";
            let fieldName = fieldPrefix;

            if (/[a-zA-Z]/.test(probeId.slice(-1))) {
                fieldName += `_AFMF${afmfCount}`;
                afmfCount += 1;
            } else {
                const isAF = probeId.includes("-AF-");
                fieldName += isAF ? `_AF${afCount}` : `_MF${mfCount}`;
                if (isAF) {
                    afCount += 1;
                } else {
                    mfCount += 1;
                }
            }

            entry.actionAnalysis[fieldName] = `Patient ${scene?.response?.slice(-1)}`;
        }

        entry.actionAnalysis[`${fieldPrefix}_PS2`] =
            entry.actionAnalysis[`${fieldPrefix}_PS2`] ??
            entry.actionAnalysis[`${envLabel} Personal_safety2`] ??
            "";

        entry.actionAnalysis[`${fieldPrefix}_PS1_Actions`] =
            entry.actionAnalysis[`${fieldPrefix}_PS1_Actions`] ?? "";

        entry.actionAnalysis[`${fieldPrefix}_PS2_Actions`] =
            entry.actionAnalysis[`${fieldPrefix}_PS2_Actions`] ?? "";

    }, []);

    const ensureBaseFields = React.useCallback((fields) => {
        const baseFields = ["Participant_ID", "Probe Set Assessment"];
        const result = [...fields];

        for (let i = baseFields.length - 1; i >= 0; i--) {
            if (!result.includes(baseFields[i])) {
                result.unshift(baseFields[i]);
            }
        }

        return result;
    }, []);

    const getKdmaParam = React.useCallback((kdmas, kdmaName, paramName) => {
        const k = kdmas?.find((x) => x?.kdma === kdmaName);
        return k?.parameters?.find((p) => p?.name === paramName)?.value;
    }, []);


    React.useEffect(() => {
        async function fetchDefinitionFields() {
            const response = await fetch(definitionFile);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const variablesRowIdx = data.findIndex((row) => row[0] === "Variables");
            if (variablesRowIdx === -1) {
                console.error("Could not find Variables row in Excel sheet");
                setDefinitionFields([]);
                return;
            }

            const variablesRow = data[variablesRowIdx].slice(1).filter(Boolean);

            const expandedFields = [];
            for (const field of variablesRow) {
                if (field.includes("{N}")) {
                    const isDesert = field.includes("Desert");
                    const maxN = isDesert ? 12 : 10;

                    for (let n = 1; n <= maxN; n++) {
                        expandedFields.push(field.replace("{N}", n));
                    }
                } else {
                    expandedFields.push(field);
                }
            }

            setDefinitionFields(ensureBaseFields(expandedFields));
        }

        fetchDefinitionFields();
    }, [definitionFile, ensureBaseFields]);

    React.useEffect(() => {
        if (definitionFields.length === 0) return;
        if (!dataTextResults?.getAllScenarioResults) return;
        if (!dataSim?.getAllSimAlignment) return;
        if (!dataParticipantLog?.getParticipantLog) return;

        const allObjs = [];
        const simData = dataSim.getAllSimAlignment;
        const participantLog = dataParticipantLog.getParticipantLog;

        for (const currentEvalNum of evalsToUse) {
            const textResults = dataTextResults.getAllScenarioResults.filter(
                (x) => x?.evalNumber === currentEvalNum
            );

            const pids = [];

            for (const res of textResults) {
                const pid = res?.participantID;

                if (!pid) continue;
                if (pids.includes(pid)) continue;
                if (res?.scenario_id?.includes("PS-AF")) continue;

                const simEntries = simData.filter((x) => x?.pid === pid);
                const openWorld = simEntries.find(
                    (x) => x?.openWorld === true || x?.evalNumber >= 8
                );
                if (!openWorld) continue;

                const logData = participantLog.find(
                    (log) => log?.ParticipantID === Number(pid) && log?.Type !== "Test"
                );
                if (!logData) continue;

                const desertEntry = simEntries.find((x) =>
                    x?.scenario_id?.toLowerCase().includes("desert")
                );
                const urbanEntry = simEntries.find((x) =>
                    x?.scenario_id?.toLowerCase().includes("urban")
                );

                const desertKdmas = desertEntry?.data?.alignment?.kdmas
                const urbanKdmas = urbanEntry?.data?.alignment?.kdmas

                buildProbeFieldsFromEntry(desertEntry, "Desert");
                buildProbeFieldsFromEntry(urbanEntry, "Urban");

                const valueMap = {};
                const textKdmaFields = openWorld?.text_kdmas || {};

                valueMap["Participant_ID"] = pid;
                valueMap["Probe Set Assessment"] = openWorld?.evalName?.includes("June")
                    ? "Various"
                    : logData["AF-text-scenario"];


                valueMap["AF_intercept_Text"] =
                    textKdmaFields["Participant Text AF intercept KDMA"] ?? "";
                valueMap["AF_medical_Text"] =
                    textKdmaFields["Participant Text AF medical_weight KDMA"] ?? "";
                valueMap["AF_attribute_Text"] =
                    textKdmaFields["Participant Text AF attr_weight KDMA"] ?? "";

                valueMap["MF_intercept_Text"] =
                    textKdmaFields["Participant Text MF intercept KDMA"] ?? "";
                valueMap["MF_medical_Text"] =
                    textKdmaFields["Participant Text MF medical_weight KDMA"] ?? "";
                valueMap["MF_attribute_Text"] =
                    textKdmaFields["Participant Text MF attr_weight KDMA"] ?? "";

                valueMap["PS_intercept_Text"] =
                    textKdmaFields["Participant Text PS intercept KDMA"] ?? "";
                valueMap["PS_medical_Text"] =
                    textKdmaFields["Participant Text PS medical_weight KDMA"] ?? "";
                valueMap["PS_attribute_Text"] =
                    textKdmaFields["Participant Text PS attr_weight KDMA"] ?? "";

                valueMap["SS_intercept_Text"] =
                    textKdmaFields["Participant Text SS intercept KDMA"] ?? "";
                valueMap["SS_medical_Text"] =
                    textKdmaFields["Participant Text SS medical_weight KDMA"] ?? "";
                valueMap["SS_attribute_Text"] =
                    textKdmaFields["Participant Text SS attr_weight KDMA"] ?? "";

                valueMap["AF_intercept_Desert"] = getKdmaParam(desertKdmas, "affiliation", "intercept");
                valueMap["AF_medical_Desert"] = getKdmaParam(desertKdmas, "affiliation", "medical_weight");
                valueMap["AF_attribute_Desert"] = getKdmaParam(desertKdmas, "affiliation", "attr_weight");
                valueMap["MF_intercept_Desert"] = getKdmaParam(desertKdmas, "merit", "intercept");
                valueMap["MF_medical_Desert"] = getKdmaParam(desertKdmas, "merit", "medical_weight");
                valueMap["MF_attribute_Desert"] = getKdmaParam(desertKdmas, "merit", "attr_weight");
                valueMap["AF_intercept_Urban"] = getKdmaParam(urbanKdmas, "affiliation", "intercept");
                valueMap["AF_medical_Urban"] = getKdmaParam(urbanKdmas, "affiliation", "medical_weight");
                valueMap["AF_attribute_Urban"] = getKdmaParam(urbanKdmas, "affiliation", "attr_weight");
                valueMap["MF_intercept_Urban"] = getKdmaParam(urbanKdmas, "merit", "intercept");
                valueMap["MF_medical_Urban"] = getKdmaParam(urbanKdmas, "merit", "medical_weight");
                valueMap["MF_attribute_Urban"] = getKdmaParam(urbanKdmas, "merit", "attr_weight");

                valueMap["AF Alignment_Desert"] = desertEntry?.alignment_scores?.["AF Alignment_Desert"];
                valueMap["MF Alignment_Desert"] = desertEntry?.alignment_scores?.["MF Alignment_Desert"];
                valueMap["AF Alignment_Urban"] = urbanEntry?.alignment_scores?.["AF Alignment_Urban"];
                valueMap["MF Alignment_Urban"] = urbanEntry?.alignment_scores?.["MF Alignment_Urban"];

                valueMap["Patient_map_shown"] = desertEntry?.patientMapShown ?? urbanEntry?.patientMapShown ?? openWorld?.patientMapShown ?? "";

                for (const field of definitionFields) {
                    if (field === "Participant_ID" || field === "Probe Set Assessment") continue;
                    if (valueMap[field] !== undefined) continue;

                    let value = desertEntry?.actionAnalysis?.[field];
                    if (value === undefined) {
                        value = urbanEntry?.actionAnalysis?.[field];
                    }

                    valueMap[field] = roundIfNumber(normalizeBlank(value));
                }

                const entryObj = {};
                for (const field of definitionFields) {
                    entryObj[field] = roundIfNumber(normalizeBlank(valueMap[field]));
                }

                allObjs.push(entryObj);
                pids.push(pid);
            }
        }

        allObjs.sort((a, b) => {
            if (Number(a["Participant_ID"]) < Number(b["Participant_ID"])) return -1;
            if (Number(a["Participant_ID"]) > Number(b["Participant_ID"])) return 1;
            return 0;
        });

        const filteredObjs = allObjs.filter((row) => {
            return Object.entries(row).some(([key, value]) => {
                if (key === "Participant_ID" || key === "Probe Set Assessment") {
                    return false;
                }
                return value !== undefined && value !== null && value !== "";
            });
        });

        const filteredHeaders = definitionFields.filter((key) =>
            filteredObjs.some(
                (row) => row[key] !== undefined && row[key] !== null && row[key] !== ""
            )
        );

        setHeaders(filteredHeaders);
        setFormattedData(filteredObjs);
        setFilteredData(filteredObjs);
        setProcessedForEval(evalNum);
    }, [
        dataSim,
        dataTextResults,
        dataParticipantLog,
        evalsToUse,
        definitionFields,
        buildProbeFieldsFromEntry,
        normalizeBlank,
        roundIfNumber
    ]);

    React.useEffect(() => {
        setFilteredData(formattedData);
    }, [formattedData]);

    const openModal = () => {
        setShowDefinitions(true);
    };

    const closeModal = () => {
        setShowDefinitions(false);
    };

    if (loadingSim || loadingTextResults || loadingParticipantLog || (formattedData.length === 0 && processedForEval !== evalNum)) return <p>Loading...</p>;
    if (errorSim || errorTextResults || errorParticipantLog) return <p>Error :</p>;

    return (
        <>
            <h2 className="rq134-header">RQ8 Data</h2>

            {filteredData.length < formattedData.length && (
                <p className="filteredText">
                    Showing {filteredData.length} of {formattedData.length} rows based on filters
                </p>
            )}

            {formattedData.length === 0 && processedForEval === evalNum ? <p>This table is not available for the selected evaluation.</p>: formattedData.length > 0 ? 
            <>
            <section className="tableHeader">
                <div className="filters"></div>
                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={filteredData}
                    HEADERS={HEADERS}
                    fileName={"Ph2 RQ-8 data"}
                    extraAction={openModal}
                />
            </section>

            <div className="resultTableSection">
                <table className="itm-table">
                    <thead>
                        <tr>
                            {HEADERS.map((val, index) => (
                                <th key={`header-${index}`}>{val}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((dataSet, index) => (
                            <tr key={`${dataSet["Participant_ID"]}-${index}`}>
                                {HEADERS.map((val) => (
                                    <td key={`${dataSet["Participant_ID"]}-${val}-${index}`}>
                                        {dataSet[val] ?? "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </>
            : null
            }

            <Modal className="table-modal" open={showDefinitions} onClose={closeModal}>
                <div className="modal-body">
                    <span className="close-icon" onClick={closeModal}>
                        <CloseIcon />
                    </span>
                    <RQDefinitionTable
                        downloadName={`Definitions_RQ8_eval${evalNum}.xlsx`}
                        xlFile={definitionFile}
                    />
                </div>
            </Modal>
        </>
    );
}