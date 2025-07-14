import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal } from "@mui/material";
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ8_PH2.xlsx';
import * as XLSX from 'xlsx-js-style';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
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


export function PH2RQ8({ evalNum }) {
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_HUMAN_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [formattedData, setFormattedData] = React.useState([]);
    const [, setAttributes] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [filteredData, setFilteredData] = React.useState([]);
    const [variableFields, setVariableFields] = React.useState([]);
    const [HEADERS, setHeaders] = React.useState([]);


    React.useEffect(() => {
        async function fetchVariableFields() {
            const response = await fetch(ph2DefinitionXLFile);
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            // row index of variables
            const variablesRowIdx = data.findIndex(row => row[0] === 'Variables');
            if (variablesRowIdx === -1) {
                console.error('Could not find Variables row in Excel sheet');
                setVariableFields([]);
                return;
            }
            const variablesRow = data[variablesRowIdx];
            // first column we need to grab, go from there
            const startColIdx = variablesRow.findIndex(cell => cell === 'Desert Personal_safety');
            if (startColIdx === -1) {
                setVariableFields([]);
                return;
            }
            const variableFields = variablesRow.slice(startColIdx).filter(Boolean);
            setVariableFields(variableFields);
        }
        fetchVariableFields();
    }, []);

    React.useEffect(() => {
        if (variableFields.length === 0) return;
        if (dataTextResults?.getAllScenarioResults && dataSim?.getAllSimAlignment && dataParticipantLog?.getParticipantLog) {
            const allObjs = [];
            const allAttributes = [];
            const simData = dataSim.getAllSimAlignment;
            const participantLog = dataParticipantLog.getParticipantLog;
            const evals = [evalNum];

            for (let evalNum of evals) {
                const textResults = dataTextResults.getAllScenarioResults.filter((x) => x.evalNumber === evalNum);

                const pids = [];
                for (const res of textResults) {
                    const pid = res['participantID'];
                    if (pids.includes(pid)) {
                        continue;
                    }
                    // see if participant has completed the open world scenario
                    const sim_entries = simData.filter((x) => x['pid'] === pid);
                    const openWorld = sim_entries.find((x) => x['openWorld'] === true);
                    if (!openWorld) {
                        continue;
                    }

                    // see if participant is in the participantLog
                    const logData = participantLog.find(
                        log => log['ParticipantID'] === Number(pid) && log['Type'] !== 'Test'
                    );
                    if (!logData) {
                        continue;
                    }

                    // Create one row per participant with all KDMA values
                    const entryObj = {};
                    entryObj['Participant_ID'] = pid;
                    // this batch of sim data was before all sets were of the same group, V for various
                    if (openWorld.evalName.includes('June')) {
                        entryObj['Probe Set Assessment'] = 'Various';
                    } 

                    let attributes = ['AF', 'MF', 'PS', 'SS'];
                    const att_map = {
                        'MF': 'merit',
                        'AF': 'affiliation',
                        'PS': 'personal_safety',
                        'SS': 'search'
                    }

                    // kdma values from text results
                    const kdmas = res['kdmas'];
                    for (const att of attributes) {
                        allAttributes.push(att);
                        entryObj[`Participant Text ${att} KDMA`] = kdmas?.find((x) => x['kdma'] === att_map[att])?.value;
                    }

                    const desert_entry = sim_entries.find((x) => x['scenario_id']?.toLowerCase().includes('desert'));
                    const urban_entry = sim_entries.find((x) => x['scenario_id']?.toLowerCase().includes('urban'));

                    const desert_kdmas = desert_entry?.data?.alignment?.kdmas;
                    if (desert_kdmas) {

                        entryObj['Desert MF KDMA'] = desert_kdmas?.find((x) => x['kdma'] === 'merit')?.value;
                        entryObj['Desert AF KDMA'] = desert_kdmas?.find((x) => x['kdma'] === 'affiliation')?.value;
                    }
                    const urban_kdmas = urban_entry?.data?.alignment?.kdmas;
                    if (urban_kdmas) {
                        entryObj['Urban MF KDMA'] = urban_kdmas?.find((x) => x['kdma'] === 'merit')?.value;
                        entryObj['Urban AF KDMA'] = urban_kdmas?.find((x) => x['kdma'] === 'affiliation')?.value;
                    }

                    for (const field of variableFields) {
                        let value = openWorld.Desert_data?.[field];
                        if (value === undefined) {
                            value = openWorld.Urban_data?.[field];
                        }
                        entryObj[field] = value ?? '';
                    }

                    allObjs.push(entryObj);
                    pids.push(pid);
                }
            }
            // sort
            allObjs.sort((a, b) => {
                // Compare PID
                if (Number(a['Participant_ID']) < Number(b['Participant_ID'])) return -1;
                if (Number(a['Participant_ID']) > Number(b['Participant_ID'])) return 1;
                return 0;
            });

            // if none of the rows have a value for a key, don't include it in the headers
            const allKeys = Object.keys(allObjs[0] || {});
            const filteredHeaders = allKeys.filter(key =>
                allObjs.some(row => row[key] !== undefined && row[key] !== null && row[key] !== '')
            );

            setHeaders(filteredHeaders);
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setAttributes(Array.from(new Set(allAttributes)));
        }
    }, [dataSim, dataTextResults, dataParticipantLog, evalNum, variableFields]);


    const openModal = () => {
        setShowDefinitions(true);
    };

    const closeModal = () => {
        setShowDefinitions(false);
    };

    React.useEffect(() => {
        setFilteredData(formattedData)
    }, [ formattedData]);

    if (loadingSim || loadingTextResults || loadingParticipantLog) return <p>Loading...</p>;
    if (errorSim || errorTextResults || errorParticipantLog) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ8 Data
        </h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className='filters'></div>
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
                <RQDefinitionTable downloadName={`Definitions_RQ8_eval${evalNum}.xlsx`} xlFile={ph2DefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
