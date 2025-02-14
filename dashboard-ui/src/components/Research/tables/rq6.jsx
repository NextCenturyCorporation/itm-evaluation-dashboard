import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ6.xlsx';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getAlignments } from "../utils";
import { DownloadButtons } from "./download-buttons";
import { Checkbox, FormControlLabel } from "@material-ui/core";


const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_SIM_DATA = gql`
    query GetSimAlignment($evalNumber: Float!){
        getAllSimAlignmentByEval(evalNumber: $evalNumber)
    }`;

const HEADERS = ['Participant_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Alignment score (Participant_Text|Participant_Sim)']


export function RQ6({ evalNum }) {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": evalNum } });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
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
        if (dataTextResults?.getAllScenarioResults && dataParticipantLog?.getParticipantLog && dataSim?.getAllSimAlignmentByEval) {
            const participantLog = dataParticipantLog.getParticipantLog;
            const simData = dataSim.getAllSimAlignmentByEval;
            const allObjs = [];
            const allTA1s = [];
            const allScenarios = [];
            const allAttributes = [];

            const evals = [evalNum];
            if (includeDRE && evalNum != 4) {
                evals.push(4);
            }
            if (includeJAN && evalNum != 6) {
                evals.push(6);
            };

            for (let evalNum of evals) {
                const textResults = dataTextResults.getAllScenarioResults.filter((x) => x.evalNumber == evalNum);

                const pids = [];
                const recorded = {};

                for (const res of textResults) {
                    const pid = res['participantID'];
                    if (pids.includes(pid)) {
                        continue;
                    }
                    recorded[pid] = [];

                    const { textResultsForPID, _ } = getAlignments(evalNum, textResults, pid);

                    // see if participant is in the participantLog
                    const logData = participantLog.find(
                        log => log['ParticipantID'] == pid && log['Type'] != 'Test' && log['Type'] != 'Online'
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
                            entryObj['Scenario'] = entryObj['TA1_Name'] == 'ADEPT' ? ad_scenario : st_scenario;
                            allScenarios.push(entryObj['Scenario']);
                            const vrVsText = simData.find((x) => x.pid == pid &&
                                (['QOL', 'VOL'].includes(entryObj['Attribute']) ? x.ta1 == 'st' : x.ta1 == 'ad') &&
                                x.scenario_id.toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')))?.data?.alignment?.vr_vs_text;
                            entryObj['Alignment score (Participant_Text|Participant_Sim)'] = ['QOL', 'VOL'].includes(att) ? vrVsText : vrVsText?.[att];
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
    }, [dataParticipantLog, dataTextResults, dataSim, evalNum, includeDRE, includeJAN]);


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
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute']))
            ));
        }
    }, [formattedData, ta1Filters, scenarioFilters, attributeFilters]);

    if (loadingParticipantLog || loadingTextResults || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorTextResults || errorSim) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ6 Data
            {evalNum == 5 &&
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
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-6 data'} extraAction={openModal} />
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
                                    {dataSet[val]}
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
                <RQDefinitionTable downloadName={'Definitions_RQ6.xlsx'} xlFile={definitionXLFile} />
            </div>
        </Modal>
    </>);
}
