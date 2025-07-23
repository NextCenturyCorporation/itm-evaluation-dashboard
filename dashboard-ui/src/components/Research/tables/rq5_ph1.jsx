import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import ph1DefinitionXLFile from '../variables/Variable Definitions RQ5_PH1.xlsx';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { getAlignments } from "../utils";
import { DownloadButtons } from "./download-buttons";

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_COMPARISON_DATA = gql`
    query getHumanToADMComparison {
        getHumanToADMComparison,
        getADMTextProbeMatches
    }`;

const SCENARIO_MAP = {
    "phase1-adept-eval-MJ2": "DryRunEval-MJ2-eval",
    "phase1-adept-eval-MJ4": "DryRunEval-MJ4-eval",
    "phase1-adept-eval-MJ5": "DryRunEval-MJ5-eval",
    "phase1-adept-train-MJ1": "DryRunEval.MJ1",
    "phase1-adept-train-IO1": "DryRunEval.IO1",
    "qol-ph1-eval-2": "qol-ph1-eval-2",
    "qol-ph1-eval-3": "qol-ph1-eval-3",
    "qol-ph1-eval-4": "qol-ph1-eval-4",
    "vol-ph1-eval-2": "vol-ph1-eval-2",
    "vol-ph1-eval-3": "vol-ph1-eval-3",
    "vol-ph1-eval-4": "vol-ph1-eval-4"
}

const HEADERS = ['Participant_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Target', 'Alignment score (Participant|target)', 'ADM Name', 'Alignment score (Participant|ADM(target))', 'Match']

const ADMs = ['ALIGN-ADM-OutlinesBaseline', 'ALIGN-ADM-ComparativeRegression-ICL-Template', 'TAD-severity-baseline', 'TAD-aligned'];

export function RQ5_PH1({ evalNum }) {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA);

    const [formattedData, setFormattedData] = React.useState([]);
    const [ta1s, setTA1s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);

    React.useEffect(() => {
        if (dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && comparisonData?.getHumanToADMComparison && comparisonData?.getADMTextProbeMatches) {
            const allObjs = [];
            const allTA1s = [];
            const allScenarios = [];
            const allAttributes = [];
            const allTargets = [];
            const participantLog = dataParticipantLog.getParticipantLog;

            const textResults = dataTextResults.getAllScenarioResults.filter((x) => x.evalNumber === evalNum);
            const comparisons = comparisonData.getHumanToADMComparison.filter((x) => x.evalNumber === evalNum);
            const matches = comparisonData.getADMTextProbeMatches.filter((x) => x.evalNumber ===evalNum);

            const pids = [];
            const recorded = {};

            for (const res of textResults) {
                const pid = res['participantID'];
                if (pids.includes(pid)) {
                    continue;
                }
                recorded[pid] = [];

                const { textResultsForPID } = getAlignments(evalNum, textResults, pid);

                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
                );
                if (!logData) {
                    continue;
                }
                const st_scenario = logData['Text-1'].includes('ST') ? logData['Text-1'] : logData['Text-2'];
                const ad_scenario = logData['Text-1'].includes('AD') ? logData['Text-1'] : logData['Text-2'];
                for (const entry of textResultsForPID) {
                    // don't include duplicate entries
                    if (recorded[pid]?.includes(entry['serverSessionId'])) {
                        continue;
                    }
                    else {
                        recorded[pid].push(entry['serverSessionId']);
                    }
                    // ignore training scenarios
                    if (entry['scenario_id'].includes('MJ1') || entry['scenario_id'].includes('IO1')) {
                        continue;
                    }
                    let attributes = ['MJ', 'IO'];
                    if (entry['scenario_id'].includes('qol')) {
                        attributes = ['QOL'];
                    }
                    else if (entry['scenario_id'].includes('vol')) {
                        attributes = ['VOL'];
                    }
                    for (const att of attributes) {
                        const adeptSubstr = att === 'MJ' ? 'Moral' : 'Ingroup';
                        const mostLeastAligned = entry['mostLeastAligned'].length === 1 ? entry['mostLeastAligned'][0] :
                            (entry['mostLeastAligned'][0]['target'].includes(adeptSubstr) ? entry['mostLeastAligned'][0] : entry['mostLeastAligned'][1]);
                        for (let targetSet of mostLeastAligned['response']) {
                            for (const adm of ADMs) {
                                const target = targetSet['target'] ?? Object.keys(targetSet)[0];
                                const align = targetSet['score'] ?? targetSet[Object.keys(targetSet)[0]];
                                const entryObj = {};
                                entryObj['Participant_ID'] = pid;
                                entryObj['TA1_Name'] = entry['scenario_id'].includes('DryRunEval') || entry['scenario_id'].includes('adept') ? 'ADEPT' : 'SoarTech';
                                allTA1s.push(entryObj['TA1_Name']);
                                entryObj['Attribute'] = att;
                                allAttributes.push(att);
                                entryObj['Scenario'] = entryObj['TA1_Name'] === 'ADEPT' ? ad_scenario : st_scenario;
                                allScenarios.push(entryObj['Scenario']);
                                entryObj['Target'] = target;
                                allTargets.push(target);
                                entryObj['Alignment score (Participant|target)'] = align;
                                entryObj['ADM Name'] = adm;
                                if (comparisons.filter((x) =>
                                    String(x['pid']) === pid && x['probe_subset'] === false && x['scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                    String(x['adm_name']) === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                ).length > 1) {
                                    console.warn('too many comparison entries found!!');
                                }
                                entryObj['Alignment score (Participant|ADM(target))'] = comparisons.find((x) =>
                                    x['pid'] === pid && x['probe_subset'] === false && x['scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                    x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                )?.['score'];
                                if (matches.filter((x) =>
                                    x['pid'] === pid && x['probe_subset'] === false && x['text_scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                    x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                ).length > 1) {
                                    console.warn('too many match entries found!!');
                                }
                                entryObj['Match'] = matches.find((x) =>
                                    x['pid'] === pid && x['probe_subset'] === false && x['text_scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                    x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                )?.['score']
                                allObjs.push(entryObj);
                            }
                        }
                        if (entry['group_targets']) {
                            for (let target of Object.keys(entry['group_targets'])) {
                                if ((target.includes('Ingroup') && att !== 'IO') || (target.includes('Moral') && att !== 'MJ') ||
                                    (target.includes('vol') && att !== 'VOL') || (target.includes('qol') && att !== 'QOL')) {
                                    continue;
                                }
                                for (const adm of ADMs) {
                                    const align = entry['group_targets'][target];
                                    const entryObj = {};
                                    entryObj['Participant_ID'] = pid;
                                    entryObj['TA1_Name'] = entry['scenario_id'].includes('DryRunEval') || entry['scenario_id'].includes('adept') ? 'ADEPT' : 'SoarTech';
                                    allTA1s.push(entryObj['TA1_Name']);
                                    entryObj['Attribute'] = att;
                                    allAttributes.push(att);
                                    entryObj['Scenario'] = entryObj['TA1_Name'] === 'ADEPT' ? ad_scenario : st_scenario;
                                    allScenarios.push(entryObj['Scenario']);
                                    entryObj['Target'] = target;
                                    allTargets.push(target);
                                    entryObj['Alignment score (Participant|target)'] = align;
                                    entryObj['ADM Name'] = adm;
                                    if (comparisons.filter((x) =>
                                        x['pid'] === pid && x['probe_subset'] === false && x['scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                        x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                    ).length > 1) {
                                        console.warn('too many comparison entries found!!');
                                    }
                                    entryObj['Alignment score (Participant|ADM(target))'] = comparisons.find((x) =>
                                        x['pid'] === pid && x['probe_subset'] === false && x['scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                        x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                    )?.['score'];
                                    if (matches.filter((x) =>
                                        x['pid'] === pid && x['probe_subset'] === false && x['text_scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                        x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                    ).length > 1) {
                                        console.warn('too many match entries found!!');
                                    }
                                    entryObj['Match'] = matches.find((x) =>
                                        x['pid'] === pid && x['probe_subset'] === false && x['text_scenario'] === SCENARIO_MAP[entry['scenario_id']] &&
                                        x['adm_name'] === adm && (x['adm_alignment_target'] === target || x['adm_alignment_target'].replace('.', '') === target)
                                    )?.['score']
                                    allObjs.push(entryObj);
                                }
                            }
                        }
                    }
                    pids.push(pid);
                }

            }
            // sort
            allObjs.sort((a, b) => {
                // Compare PID
                if (Number(a['Participant_ID']) < Number(b['Participant_ID'])) return -1;
                if (Number(a['Participant_ID']) > Number(b['Participant_ID'])) return 1;

                // If PID is equal, compare TA1
                if (a.TA1_Name < b.TA1_Name) return -1;
                if (a.TA1_Name > b.TA1_Name) return 1;

                // If TA1 is equal, compare target
                if (a.Target < b.Target) return -1;
                if (a.Target > b.Target) return 1;

                // if Scenario is equal, compare attribute
                return a.Attribute - b.Attribute;
            });
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setTargets(Array.from(new Set(allTargets)));
        }
    }, [dataParticipantLog, dataTextResults, comparisonData, evalNum]);

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length === 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (scenarioFilters.length === 0 || scenarioFilters.includes(x['Scenario'])) &&
                (attributeFilters.length === 0 || attributeFilters.includes(x['Attribute'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target']))
            ));
        }
    }, [formattedData, ta1Filters, scenarioFilters, attributeFilters, targetFilters]);

    const formatData = (dataSet, key) => {
        const v = dataSet[key];
        if (isDefined(v)) {
            if (typeof v === 'number') {
                // round to 4 decimals when displaying (full value will still show in download)
                return Math.floor(v * 10000) / 10000;
            }
            else {
                return v;
            }
        }
        else {
            return '-';
        }
    }

    if (loadingParticipantLog || loadingTextResults || loadingComparisonData) return <p>Loading...</p>;
    if (errorParticipantLog || errorTextResults || errorComparisonData) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ5 Data</h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={ta1s}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="TA1"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTA1Filters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={attributes}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Attributes"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setAttributeFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={scenarios}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Scenarios"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setScenarioFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={targets}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Targets"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTargetFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-5 data'} extraAction={openModal} />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (<th key={'header-' + index}>
                                {val}
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((dataSet, index) => {
                        return (<tr key={dataSet['Participant_ID'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['Participant_ID'] + '-' + val}>
                                    {formatData(dataSet, val)}
                                </td>);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
        <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
            <div className='modal-body'>
                <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                <RQDefinitionTable downloadName={`Definitions_RQ5_eval${evalNum}.xlsx`} xlFile={ph1DefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
