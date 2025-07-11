import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import ph1DefinitionXLFile from '../variables/Variable Definitions RQ8_PH1.xlsx';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getAlignments } from "../utils";
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

const HEADERS = [ 'Participant_ID', 'Participant Text MF KDMA', 'Participant Text AF KDMA', 'Participant Text PS KDMA', 'Participant Text SS KDMA']


export function PH2RQ8({ evalNum }) {
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_HUMAN_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [formattedData, setFormattedData] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);


    React.useEffect(() => {
        if (dataTextResults?.getAllScenarioResults && dataSim?.getAllSimAlignment && dataParticipantLog?.getParticipantLog) {
            const allObjs = [];
            const allScenarios = [];
            const allAttributes = [];
            const simData = dataSim.getAllSimAlignment;
            const participantLog = dataParticipantLog.getParticipantLog;
            const evals = [evalNum];

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
                    // see if participant has completed the open world scenario
                    const openWorld = simData.find(
                        log => log['pid'] == pid && log['openWorld'] == true
                    );
                    if (!openWorld) {
                        continue;
                    }

                    const simEntries = simData.filter(
                        log => log['pid'] == pid
                    );

                    const { textResultsForPID, alignments } = getAlignments(evalNum, textResults, pid);

                    // see if participant is in the participantLog
                    const logData = participantLog.find(
                        log => log['ParticipantID'] === Number(pid) && log['Type'] != 'Test'
                    );
                    if (!logData) {
                        continue;
                    }

                    for (const entry of textResultsForPID) {
                        // don't include duplicate entries
                        if (recorded[pid]?.includes(entry['serverSessionId'])) {
                            continue;
                        }
                        else {
                            recorded[pid].push(entry['serverSessionId']);
                        }
                        
                        // Create one row per participant with all KDMA values
                        const entryObj = {};
                        entryObj['Participant_ID'] = pid;
                        
                        let attributes = ['AF', 'MF', 'PS', 'SS'];
                        const att_map = {
                            'MF': 'merit',
                            'AF': 'affiliation',
                            'PS': 'personal_safety',
                            'SS': 'search'
                        }
                        
                        // kdma values from text results
                        const kdmas = entry['kdmas'];

                        const sim_entry = simEntries.find((x) => {
                            const kdma_data = x?.data?.alignment?.kdmas?.computed_kdma_profile ?? x?.data?.alignment?.kdmas;
                            return Array.isArray(kdma_data) && kdma_data?.find((y) => y.kdma == att_map['MF']);
                        });
                        console.log(sim_entry);

                        for (const att of attributes) {
                            allAttributes.push(att);
                            entryObj[`Participant Text ${att} KDMA`] = kdmas?.find((x) => x['kdma'] == att_map[att])?.value;
                            // need to grab the sim attributes for mf and af
                            if (!['MF', 'AF'].includes(att)) { continue; }
                        }
                        
                        const sim_kdmas = sim_entry?.data?.alignment?.kdmas?.computed_kdma_profile ?? sim_entry?.data?.alignment?.kdmas;

                        const owData = openWorld['data'];

                        for (let i = 1; i < 9; i++) {
                            entryObj[`Patient${i}_time`] = owData?.[`Patient ${i}_time`];
                            entryObj[`Patient${i}_order`] = owData?.[`Patient ${i}_order`];
                            entryObj[`Patient${i}_evac`] = owData?.[`Patient ${i}_evac`];
                            entryObj[`Patient${i}_assess`] = owData?.[`Patient ${i}_assess`];
                            entryObj[`Patient${i}_treat`] = owData?.[`Patient ${i}_treat`];
                            entryObj[`Patient${i}_tag`] = owData?.[`Patient ${i}_tag`];
                        }

                        allObjs.push(entryObj);
                        pids.push(pid);
                    }
                }
            }
            // sort
            allObjs.sort((a, b) => {
                // Compare PID
                if (Number(a['Participant_ID']) < Number(b['Participant_ID'])) return -1;
                if (Number(a['Participant_ID']) > Number(b['Participant_ID'])) return 1;
                return 0;
            });
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
        }
    }, [dataSim, dataTextResults, dataParticipantLog, evalNum,]);


    const openModal = () => {
        setShowDefinitions(true);
    };

    const closeModal = () => {
        setShowDefinitions(false);
    };

    React.useEffect(() => {
        setFilteredData(formattedData.filter((x) =>
            (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario']))
        ));
    }, [ scenarioFilters, formattedData]);

    if (loadingSim || loadingTextResults || loadingParticipantLog) return <p>Loading...</p>;
    if (errorSim || errorTextResults || errorParticipantLog) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ8 Data
        </h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
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
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'Ph2 RQ-8 data'} extraAction={openModal} />
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
                <RQDefinitionTable downloadName={`Definitions_RQ8_eval${evalNum}.xlsx`} xlFile={ph1DefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
