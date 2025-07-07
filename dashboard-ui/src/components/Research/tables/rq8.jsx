import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import dreDefinitionXLFile from '../variables/Variable Definitions RQ8_DRE.xlsx';
import ph1DefinitionXLFile from '../variables/Variable Definitions RQ8_PH1.xlsx';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getAlignments } from "../utils";
import { DownloadButtons } from "./download-buttons";
import { Checkbox, FormControlLabel } from "@material-ui/core";


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

const HEADERS = ['Participant_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Participant Text KDMA', 'Participant Sim KDMA', 'Alignment score (Participant|high target)', 'Alignment score (Participant|low target)', 'Assess_patient', 'Assess_total', 'Treat_patient', 'Treat_total', 'Triage_time',
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


export function RQ8({ evalNum }) {
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
    const [includeDRE, setIncludeDRE] = React.useState(false);
    const [includeJAN, setIncludeJAN] = React.useState(false);

    React.useEffect(() => {
        // reset toggles on render
        setIncludeDRE(false);
        setIncludeJAN(false);
    }, [evalNum]);


    React.useEffect(() => {
        if (dataTextResults?.getAllScenarioResults && dataSim?.getAllSimAlignment && dataParticipantLog?.getParticipantLog) {
            const allObjs = [];
            const allTA1s = [];
            const allScenarios = [];
            const allAttributes = [];
            const simData = dataSim.getAllSimAlignment;
            const participantLog = dataParticipantLog.getParticipantLog;

            const evals = [evalNum];
            if (includeDRE && Number(evalNum) !== 4) {
                evals.push(4);
            }
            if (includeJAN && Number(evalNum) !== 6) {
                evals.push(6);
            };

            for (let evalNum of evals) {
                const textResults = dataTextResults.getAllScenarioResults.filter((x) => Number(x.evalNumber) === Number(evalNum));

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
                        log => String(log['pid']) === String(pid) && Boolean(log['openWorld']) === true
                    );
                    if (!openWorld) {
                        continue;
                    }

                    const simEntries = simData.filter(
                        log => String(log['pid']) === String(pid)
                    );

                    const { textResultsForPID, alignments } = getAlignments(evalNum, textResults, pid);

                    // see if participant is in the participantLog
                    const logData = participantLog.find(
                        log => String(log['ParticipantID']) === String(pid) && String(log['Type']) !== 'Test'
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
                            entryObj['TA1_Name'] = entry['scenario_id'].includes('DryRunEval') || entry['scenario_id'].includes('adept') ? 'ADEPT' : 'SoarTech';
                            allTA1s.push(entryObj['TA1_Name']);
                            entryObj['Attribute'] = att;
                            allAttributes.push(att);
                            entryObj['Scenario'] = entryObj['TA1_Name'] === 'ADEPT' ? ad_scenario : st_scenario;
                            allScenarios.push(entryObj['Scenario']);
                            const kdmas = Array.isArray(entry['kdmas']) ? entry['kdmas'] : entry['kdmas']?.['computed_kdma_profile'];
                            const att_map = {
                                'MJ': 'Moral judgement',
                                'IO': 'Ingroup Bias',
                                'QOL': 'QualityOfLife',
                                'VOL': 'PerceivedQuantityOfLivesSaved'
                            }
                            entryObj['Participant Text KDMA'] = kdmas?.find((x) => String(x['kdma']) === att_map[att])?.value ?? '-';
                            const sim_entry = simEntries.find((x) => {
                                const kdma_data = x?.data?.alignment?.kdmas?.computed_kdma_profile ?? x?.data?.alignment?.kdmas;
                                return Array.isArray(kdma_data) && kdma_data?.find((y) => String(y.kdma) === att_map[att]);
                            });
                            const sim_kdmas = sim_entry?.data?.alignment?.kdmas?.computed_kdma_profile ?? sim_entry?.data?.alignment?.kdmas;
                            entryObj['Participant Sim KDMA'] = Array.isArray(sim_kdmas) ? sim_kdmas?.find((y) => String(y.kdma) === att_map[att])?.value : '-';
                            if (Number(evalNum) === 4) {
                                entryObj['Alignment score (Participant|high target)'] = alignments?.find((x) => String(x.target) === (att === 'IO' ? 'ADEPT-DryRun-Ingroup Bias-1.0' : att === 'MJ' ? 'ADEPT-DryRun-Moral judgement-1.0' : att === 'QOL' ? 'qol-synth-HighExtreme' : att === 'VOL' ? 'vol-synth-HighExtreme' : ''))?.score ?? '-';
                                entryObj['Alignment score (Participant|low target)'] = alignments?.find((x) => String(x.target) === (att === 'IO' ? 'ADEPT-DryRun-Ingroup Bias-0.0' : att === 'MJ' ? 'ADEPT-DryRun-Moral judgement-0.0' : att === 'QOL' ? 'qol-synth-LowExtreme' : att === 'VOL' ? 'vol-synth-LowExtreme' : ''))?.score ?? '-';
                            }
                            else {
                                entryObj['Alignment score (Participant|high target)'] = alignments?.find((x) => String(x.target) === (att === 'IO' ? 'ADEPT-DryRun-Ingroup Bias-08' : att === 'MJ' ? 'ADEPT-DryRun-Moral judgement-08' : att === 'QOL' ? 'qol-synth-HighExtreme-ph1' : att === 'VOL' ? 'vol-synth-HighCluster-ph1' : ''))?.score ?? '-';
                                entryObj['Alignment score (Participant|low target)'] = alignments?.find((x) => String(x.target) === (att === 'IO' ? 'ADEPT-DryRun-Ingroup Bias-02' : att === 'MJ' ? 'ADEPT-DryRun-Moral judgement-02' : att === 'QOL' ? 'qol-synth-LowExtreme-ph1' : att === 'VOL' ? 'vol-synth-LowExtreme-ph1' : ''))?.score ?? '-';
                            }
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
    }, [dataSim, dataTextResults, dataParticipantLog, evalNum, includeDRE, includeJAN]);


    const openModal = () => {
        setShowDefinitions(true);
    };

    const closeModal = () => {
        setShowDefinitions(false);
    };

    const updateDREStatus = (event) => {
        setIncludeDRE(event.target.checked);
    };

    const updateJANStatus = (event) => {
        setIncludeJAN(event.target.checked);
    };

    React.useEffect(() => {
        setFilteredData(formattedData.filter((x) =>
            (ta1Filters.length === 0 || ta1Filters.includes(x['TA1_Name'])) &&
            (scenarioFilters.length === 0 || scenarioFilters.includes(x['Scenario'])) &&
            (attributeFilters.length === 0 || attributeFilters.includes(x['Attribute']))
        ));
    }, [ta1Filters, scenarioFilters, attributeFilters, formattedData]);

    if (loadingSim || loadingTextResults || loadingParticipantLog) return <p>Loading...</p>;
    if (errorSim || errorTextResults || errorParticipantLog) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ8 Data
            {Number(evalNum) === 5 &&
                <div className='stacked-checkboxes'>
                    <FormControlLabel className='floating-toggle' control={<Checkbox value={includeDRE} onChange={updateDREStatus} />} label="Include DRE Data" />
                    <FormControlLabel className='floating-toggle' control={<Checkbox value={includeJAN} onChange={updateJANStatus} />} label="Include Jan 2025 Eval Data" />
                </div>}
        </h2>
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
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-8 data'} extraAction={openModal} />
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
                <RQDefinitionTable downloadName={`Definitions_RQ8_eval${evalNum}.xlsx`} xlFile={(Number(evalNum) === 5 || Number(evalNum) === 6) ? ph1DefinitionXLFile : dreDefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
