import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ6.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ6.pdf';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { admOrderMapping } from "../../Survey/survey";

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_SIM_DATA = gql`
    query GetSimAlignment($evalNumber: Float!){
        getAllSimAlignmentByEval(evalNumber: $evalNumber)
    }`;

const HEADERS = ['Delegator_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Alignment score (Delegator_Text|Delegator_Sim)']


export function RQ6() {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 4 } });
    const [formattedData, setFormattedData] = React.useState([]);
    const [ta1s, setTA1s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog, dataSim?.getAllSimAlignmentByEval) {
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const participantLog = dataParticipantLog.getParticipantLog;
            const simData = dataSim.getAllSimAlignmentByEval;
            const allObjs = [];
            const allTA1s = [];
            const allScenarios = [];
            const allAttributes = [];

            // find participants that have completed the delegation survey
            const completed_surveys = surveyResults.filter((res) => res.results?.surveyVersion == 4 && isDefined(res.results['Post-Scenario Measures']));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response;
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
                    entryObj['Alignment score (Delegator_Text|Delegator_Sim)'] = simData.find((x) => x.pid == pid &&
                        (['QOL', 'VOL'].includes(entry['Attribute']) ? x.ta1 == 'st' : x.ta1 == 'ad') &&
                        x.scenario_id.toUpperCase().includes(entry['Attribute'].replace('IO', 'MJ')))?.data?.alignment?.vr_vs_text;

                    allObjs.push(entryObj);
                }
            }
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
        }
    }, [dataParticipantLog, dataSurveyResults, dataSim]);


    const exportToExcel = async () => {
        // Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Adjust column widths
        const colWidths = HEADERS.map(header => ({ wch: Math.max(header.length, 20) }));
        ws['!cols'] = colWidths;

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Survey Data');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'RQ-6 data' + fileExtension);
    };

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
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute']))
            ));
        }
    }, [formattedData, ta1Filters, scenarioFilters, attributeFilters]);

    if (loadingParticipantLog || loadingSurveyResults || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorSim) return <p>Error :</p>;

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
                <button className='downloadBtn' onClick={exportToExcel}>Download All Data</button>
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
                                return (<td key={dataSet['Delegator_ID'] + '-' + val}>
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
                <RQDefinitionTable downloadName={'Definitions_RQ6.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}
