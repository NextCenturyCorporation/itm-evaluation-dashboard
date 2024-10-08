import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ5.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ5.pdf';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { exportToExcel, getAlignments } from "../utils";
import { admOrderMapping, delEnvMapping } from "../../Survey/survey";

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

const HEADERS = ['Participant_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Most aligned target', 'Least aligned target', 'Alignment score (Participant|Most aligned target)', 'Alignment score (Participant|Least aligned target)', 'Group target', 'Alignment score (Participant|group target)', 'TA2_Name', 'Alignment score (Participant|ADM(most))', 'Alignment score (Participant|ADM(least))', 'Match_MostAligned', 'Match_LeastAligned', 'Match_GrpMembers']

export function RQ5() {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA);

    const [formattedData, setFormattedData] = React.useState([]);
    const [ta1s, setTA1s] = React.useState([]);
    const [ta2s, setTA2s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [groupTargets, setGroupTargets] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [ta2Filters, setTA2Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [groupTargetFilters, setGroupTargetFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);

    React.useEffect(() => {
        if (dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && comparisonData?.getHumanToADMComparison && comparisonData?.getADMTextProbeMatches) {
            const participantLog = dataParticipantLog.getParticipantLog;
            const textResults = dataTextResults.getAllScenarioResults;
            const comparisons = comparisonData.getHumanToADMComparison;
            const matches = comparisonData.getADMTextProbeMatches;
            const allObjs = [];
            const allTA1s = [];
            const allTA2s = [];
            const allScenarios = [];
            const allGroupTargets = [];
            const allAttributes = [];
            const pids = [];
            const recorded = {};

            for (const res of textResults) {
                const pid = res['participantID'];
                if (pids.includes(pid)) {
                    continue;
                }
                recorded[pid] = [];

                const { textResultsForPID, alignments } = getAlignments(textResults, pid);

                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => log['ParticipantID'] == pid
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
                        const ta2s = ['Kitware', 'Parallax'];
                        for (const ta2 of ta2s) {
                            const entryObj = {};
                            entryObj['Participant_ID'] = pid;
                            entryObj['TA1_Name'] = entry['scenario_id'].includes('DryRunEval') ? 'ADEPT' : 'SoarTech';
                            allTA1s.push(entryObj['TA1_Name']);
                            entryObj['TA2_Name'] = ta2;
                            allTA2s.push(ta2);
                            entryObj['Attribute'] = att;
                            allAttributes.push(att);
                            entryObj['Scenario'] = entryObj['TA1_Name'] == 'ADEPT' ? ad_scenario : st_scenario;
                            allScenarios.push(entryObj['Scenario']);
                            const group_targets = entry['group_targets'];
                            if (isDefined(group_targets)) {
                                for (const t of Object.keys(group_targets)) {
                                    if ((t.includes('Moral') && att == 'MJ') || (t.includes('qol') && att == 'QOL') ||
                                        (t.includes('vol') && att == 'VOL') || (t.includes('Ingroup') && att == 'IO')) {
                                        entryObj['Group target'] = t;
                                        entryObj['Alignment score (Participant|group target)'] = group_targets[t];
                                        break;
                                    }
                                }
                            }

                            // get most/least aligned targets
                            const { most, least } = getMostLeastTarget(alignments, entryObj['Attribute']);
                            entryObj['Most aligned target'] = most.target;
                            entryObj['Least aligned target'] = least.target;
                            entryObj['Alignment score (Participant|Most aligned target)'] = most.score;
                            entryObj['Alignment score (Participant|Least aligned target)'] = least.score;
                            const comparison_entry_most = comparisons?.find((x) => x['adm_type'] == 'most aligned' && x['pid'] == pid && admAuthorMatch(ta2, x) && x['text_scenario'].toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                            entryObj['Alignment score (Participant|ADM(most))'] = comparison_entry_most?.score ?? '-';
                            const comparison_entry_least = comparisons?.find((x) => x['adm_type'] == 'least aligned' && x['pid'] == pid && admAuthorMatch(ta2, x) && x['text_scenario'].toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                            entryObj['Alignment score (Participant|ADM(least))'] = comparison_entry_least?.score ?? '-';
                            const probe_matches_most = matches.find((x) => x['adm_type'] == 'most aligned' && x['pid'] == pid && admAuthorMatch(ta2, x) && x['text_scenario'].toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                            entryObj['Match_MostAligned'] = probe_matches_most?.score ?? '-';
                            const probe_matches_least = matches.find((x) => x['adm_type'] == 'least aligned' && x['pid'] == pid && admAuthorMatch(ta2, x) && x['text_scenario'].toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                            entryObj['Match_LeastAligned'] = probe_matches_least?.score ?? '-';
                            allObjs.push(entryObj);
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

                // if Scenario is equal, compare attribute
                if (a.Attribute < b.Attribute) return -1;
                if (a.Attribute > b.Attribute) return 1;

                // if attribute is equal, compare TA2
                return a.TA2_Name - b.TA2_Name;
            });
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setTA2s(Array.from(new Set(allTA2s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setGroupTargets(Array.from(new Set(allGroupTargets)));
        }
    }, [dataParticipantLog, dataTextResults, comparisonData]);

    const admAuthorMatch = (ta2, entry2) => {
        return ((ta2 == 'Parallax' && entry2['adm_author'] == 'TAD') || (ta2 == 'Kitware' && entry2['adm_author'] == 'kitware'));
    };


    const getMostLeastTarget = (alignments, attribute) => {
        let most = '';
        let mostVal = 0;
        let least = '';
        let leastVal = 1;
        const attributeMap = { 'MJ': 'Moral judgement', 'IO': 'Ingroup Bias', 'VOL': 'vol', 'QOL': 'qol' };
        for (const alignment of alignments) {
            if (alignment.target.includes(attributeMap[attribute])) {
                if (alignment.score > mostVal) {
                    mostVal = alignment.score;
                    most = alignment;
                }
                else if (alignment.score < leastVal) {
                    leastVal = alignment.score;
                    least = alignment;
                }
            }
        }
        return { most, least };
    }

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (ta2Filters.length == 0 || ta2Filters.includes(x['TA2_Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute'])) &&
                (groupTargetFilters.length == 0 || groupTargetFilters.includes(x['Group_Target']))
            ));
        }
    }, [formattedData, ta1Filters, ta2Filters, scenarioFilters, attributeFilters, groupTargetFilters]);

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
                    options={ta2s}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="TA2"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTA2Filters(newVal)}
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
                    options={groupTargets}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Group Targets"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setGroupTargetFilters(newVal)}
                />
            </div>
            <div className="option-section">
                <button className='downloadBtn' onClick={() => exportToExcel('RQ-5 data', formattedData, HEADERS)}>Download All Data</button>
                <button className='downloadBtn' onClick={openModal}>View Variable Definitions</button>
            </div>
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
                <RQDefinitionTable downloadName={'Definitions_RQ5.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}
