import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ8.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ8.pdf';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { exportToExcel, getAlignments } from "../utils";
import { DownloadButtons } from "./download-buttons";


const GET_HUMAN_RESULTS = gql`
    query getAllSimAlignment {
        getAllSimAlignment
  }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const HEADERS = ['Participant_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Participant KDMA', 'Alignment score (Participant|high target)', 'Alignment score (Participant|low target)', 'Assess_patient', 'Assess_total', 'Treat_patient', 'Treat_total', 'Triage_time',
    'Triage_time_patient', 'Engage_patient', 'Tag_ACC', 'Tag_Expectant',
    'Patient1_time', 'Patient1_order', 'Patient1_evac', 'Patient1_assess', 'Patient1_treat', 'Patient1_tag',
    'Patient2_time', 'Patient2_order', 'Patient2_evac', 'Patient2_assess', 'Patient2_treat', 'Patient2_tag',
    'Patient3_time', 'Patient3_order', 'Patient3_evac', 'Patient3_assess', 'Patient3_treat', 'Patient3_tag',
    'Patient4_time', 'Patient4_order', 'Patient4_evac', 'Patient4_assess', 'Patient4_treat', 'Patient4_tag',
    'Patient5_time', 'Patient5_order', 'Patient5_evac', 'Patient5_assess', 'Patient5_treat', 'Patient5_tag',
    'Patient6_time', 'Patient6_order', 'Patient6_evac', 'Patient6_assess', 'Patient6_treat', 'Patient6_tag',
    'Patient7_time', 'Patient7_order', 'Patient7_evac', 'Patient7_assess', 'Patient7_treat', 'Patient7_tag',
    'Patient8_time', 'Patient8_order', 'Patient8_evac', 'Patient8_assess', 'Patient8_treat', 'Patient8_tag'
]


export function RQ8() {
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_HUMAN_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    }); 
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [formattedData, setFormattedData] = React.useState([]);
    const [ta1s, setTA1s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);

    React.useEffect(() => {
        if (dataTextResults?.getAllScenarioResults && dataSim?.getAllSimAlignment && dataParticipantLog?.getParticipantLog) {
            const textResults = dataTextResults.getAllScenarioResults;
            const simData = dataSim.getAllSimAlignment;
            const participantLog = dataParticipantLog.getParticipantLog;
            const allObjs = [];
            const allTA1s = [];
            const allScenarios = [];
            const allAttributes = [];
            const pids = [];
            const recorded = {};

            for (const res of textResults) {
                const pid = res['participantID'];
                if (pids.includes(pid)) {
                    continue;
                }
                recorded[pid] = [];
                // see if participant has completed the open world scenario
                const openWorld = simData.find(
                    log => log['pid'] == pid && log['openWorld'] == true
                );
                if (!openWorld) {
                    continue;
                }

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
                        const entryObj = {};
                        entryObj['Participant_ID'] = pid;
                        entryObj['TA1_Name'] = entry['scenario_id'].includes('DryRunEval') ? 'ADEPT' : 'SoarTech';
                        allTA1s.push(entryObj['TA1_Name']);
                        entryObj['Attribute'] = att;
                        allAttributes.push(att);
                        entryObj['Scenario'] = entryObj['TA1_Name'] == 'ADEPT' ? ad_scenario : st_scenario;
                        allScenarios.push(entryObj['Scenario']);
                        entryObj['Participant KDMA'] = entryObj['TA1_Name'] == 'ADEPT' ? entry['kdmas']?.find((x) => x['kdma'] == (att == 'MJ' ? 'Moral judgement' : 'Ingroup Bias'))?.value ?? '-' : '-';
                        entryObj['Alignment score (Participant|high target)'] = alignments?.find((x) => x.target == (att == 'IO' ? 'ADEPT-DryRun-Ingroup Bias-1.0' : att == 'MJ' ? 'ADEPT-DryRun-Moral judgement-1.0' : att == 'QOL' ? 'qol-synth-HighExtreme' : att == 'VOL' ? 'vol-synth-HighExtreme' : ''))?.score ?? '-';
                        entryObj['Alignment score (Participant|low target)'] = alignments?.find((x) => x.target == (att == 'IO' ? 'ADEPT-DryRun-Ingroup Bias-0.0' : att == 'MJ' ? 'ADEPT-DryRun-Moral judgement-0.0' : att == 'QOL' ? 'qol-synth-LowExtreme' : att == 'VOL' ? 'vol-synth-LowExtreme' : ''))?.score ?? '-';
                        const owData = openWorld['data'];
                        entryObj['Assess_patient'] = owData?.assess_patient;
                        entryObj['Assess_total'] = owData?.assess_total;
                        entryObj['Treat_patient'] = owData?.treat_patient;
                        entryObj['Treat_total'] = owData?.treat_total;
                        entryObj['Triage_time'] = owData?.triage_time;
                        entryObj['Triage_time_patient'] = owData?.triage_time_patient;
                        entryObj['Engage_patient'] = owData?.engage_patient;
                        entryObj['Tag_ACC'] = owData?.tag_acc;
                        entryObj['Tag_Expectant'] = owData?.tag_expectant;

                        for (let i = 1; i < 9; i++) {
                            entryObj[`Patient${i}_time`] = owData?.[`Patient ${i}_time`];
                            entryObj[`Patient${i}_order`] = owData?.[`Patient ${i}_order`];
                            entryObj[`Patient${i}_evac`] = owData?.[`Patient ${i}_evac`];
                            entryObj[`Patient${i}_assess`] = owData?.[`Patient ${i}_assess`];
                            entryObj[`Patient${i}_treat`] = owData?.[`Patient ${i}_treat`];
                            entryObj[`Patient${i}_tag`] = owData?.[`Patient ${i}_tag`];
                        }

                        allObjs.push(entryObj);
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

                // if TA1 is equal, compare attribute
                return a.Attribute - b.Attribute;
            });
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
        }
    }, [dataSim, dataTextResults, dataParticipantLog]);


    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        setFilteredData(formattedData.filter((x) =>
            (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
            (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
            (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute']))
        ));
    }, [ta1Filters, scenarioFilters, attributeFilters, formattedData]);

    if (loadingSim || loadingTextResults || loadingParticipantLog) return <p>Loading...</p>;
    if (errorSim || errorTextResults || errorParticipantLog) return <p>Error :</p>;

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
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-8 data'} openModal={openModal} />
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
                                return (<td key={dataSet['Participant_ID'] + '-' + val + '-' + index}>
                                    {dataSet[val] ?? '-'}
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
                <RQDefinitionTable downloadName={'Definitions_RQ8.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}
