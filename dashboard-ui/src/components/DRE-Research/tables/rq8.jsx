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


const GET_HUMAN_RESULTS = gql`
    query getAllRawSimData {
        getAllRawSimData
  }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const HEADERS = ['Delegator_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Delegator KDMA', 'Alignment score (Delegator|selected target)', 'Assess_patient', 'Assess_total', 'Treat_patient', 'Treat_total', 'Triage_time',
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
    const { loading: loadingRawSim, error: errorRawSim, data: dataRawSim } = useQuery(GET_HUMAN_RESULTS);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
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
        if (dataSurveyResults?.getAllSurveyResults && dataRawSim?.getAllRawSimData && dataParticipantLog?.getParticipantLog) {
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const simData = dataRawSim.getAllRawSimData;
            const participantLog = dataParticipantLog.getParticipantLog;
            const allObjs = [];
            const allTA1s = [];
            const allScenarios = [];
            const allAttributes = [];

            // find participants that have completed the delegation survey
            const completed_surveys = surveyResults.filter((res) => res.results?.surveyVersion == 4 && isDefined(res.results['Post-Scenario Measures']));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response;
                // see if participant has completed the open world scenario
                const openWorld = simData.find(
                    log => log['pid'] == pid && log['openWorld'] == true
                );
                if (!openWorld) {
                    continue;
                }
                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => log['ParticipantID'] == pid
                );
                if (!logData) {
                    continue;
                }
                const admOrder = admOrderMapping[logData['ADMOrder']];
                const st_scenario = logData['Del-1'].includes('ST') ? logData['Del-1'] : logData['Del-2'];
                const ad_scenario = logData['Del-1'].includes('AD') ? logData['Del-1'] : logData['Del-2'];


                for (const entry of admOrder) {
                    const entryObj = {};
                    entryObj['Delegator_ID'] = pid;
                    entryObj['TA1_Name'] = entry['TA1'].replace('ST', 'SoarTech').replace('Adept', 'ADEPT');
                    allTA1s.push(entryObj['TA1_Name']);
                    entryObj['Attribute'] = entry['Attribute'];
                    allAttributes.push(entryObj['Attribute']);
                    entryObj['Scenario'] = entry['TA1'] == 'Adept' ? ad_scenario : st_scenario;
                    allScenarios.push(entryObj['Scenario']);

                    allObjs.push(entryObj);
                }
            }
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
        }
    }, [dataRawSim, dataSurveyResults, dataParticipantLog]);


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
    }, [ta1Filters, scenarioFilters, attributeFilters, filteredData, formattedData]);

    if (loadingRawSim || loadingSurveyResults || loadingParticipantLog) return <p>Loading...</p>;
    if (errorRawSim || errorSurveyResults || errorParticipantLog) return <p>Error :</p>;

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
            <div className="option-section">
                <button className='downloadBtn' onClick={() => exportToExcel('RQ-8 data', formattedData, HEADERS)}>Download All Data</button>
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
                        return (<tr key={dataSet['Delegator_ID'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['Delegator_ID'] + '-' + val + '-' + index}>
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
