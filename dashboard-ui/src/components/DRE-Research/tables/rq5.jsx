import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ5.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ5.pdf';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { admOrderMapping, delEnvMapping } from "../../Survey/survey";

const HEADERS = ['Delegator_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Most aligned target', 'Least aligned target', 'Alignment score (Delegator|Most aligned target)', 'Alignment score (Delegator|Least aligned target)', 'Group target', 'Alignment score (Delegator|group target)', 'TA2_Name', 'Alignment score (Delegator|ADM(most))', 'Alignment score (Delegator|ADM(least))', 'Match_MostAligned', 'Match_LeastAligned', 'Match_GrpMembers']
const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;


export function RQ5() {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });

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
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults) {
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const participantLog = dataParticipantLog.getParticipantLog;
            const textResults = dataTextResults.getAllScenarioResults;
            const allObjs = [];
            const allTA1s = [];
            const allTA2s = [];
            const allScenarios = [];
            const allGroupTargets = [];
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

                const textResultsForPID = textResults.filter((data) => data.evalNumber == 4 && data.participantID == pid);
                const alignments = [];
                let addedMJ = false;
                for (const textRes of textResultsForPID) {
                    if (Object.keys(textRes).includes("combinedAlignmentData")) {
                        if (!addedMJ) {
                            alignments.push(...textRes['combinedAlignmentData']);
                            addedMJ = true;
                        }
                    }
                    else {
                        alignments.push(...textRes['alignmentData'])
                    }
                }

                for (const entry of admOrder) {
                    const entryObj = {};
                    entryObj['Delegator_ID'] = pid;
                    entryObj['TA1_Name'] = entry['TA1'].replace('ST', 'SoarTech').replace('Adept', 'ADEPT');
                    allTA1s.push(entryObj['TA1_Name']);
                    entryObj['Attribute'] = entry['Attribute'];
                    allAttributes.push(entryObj['Attribute']);
                    entryObj['Scenario'] = entry['TA1'] == 'Adept' ? ad_scenario : st_scenario;
                    allScenarios.push(entryObj['Scenario']);
                    entryObj['TA2_Name'] = entry['TA2'];
                    allTA2s.push(entry['TA2']);
                    // get most/least aligned targets
                    const types = ['aligned', 'misaligned'];
                    for (const t of types) {
                        let page = Object.keys(res.results).find((k) => {
                            const obj = res.results[k];
                            const alignMatches = obj['admAlignment'] == t;
                            const ta2Matches = obj['admAuthor'] == (entry['TA2'] == 'Kitware' ? 'kitware' : 'TAD');
                            let scenario = false;
                            if (entry['TA1'] == 'Adept') {
                                scenario = entry['Attribute'] == 'MJ' ? delEnvMapping[ad_scenario][0] : delEnvMapping[ad_scenario][1];
                            }
                            else {
                                scenario = entry['Attribute'] == 'QOL' ? delEnvMapping[st_scenario][0] : delEnvMapping[st_scenario][1];
                            }

                            const scenarioMatches = obj['scenarioIndex'] == scenario;

                            return alignMatches && ta2Matches && scenarioMatches;
                        });
                        if (!page) {
                            // likely from missing misaligned/aligned for those few parallax adms
                            entryObj[(t == 'aligned' ? 'Most' : 'Least') + ' aligned target'] = '-';
                            entryObj['Alignment score (Delegator|' + (t == 'aligned' ? 'Most' : 'Least') + ' aligned target)'] = '-';
                            continue;
                        }
                        page = res.results[page];
                        entryObj[(t == 'aligned' ? 'Most' : 'Least') + ' aligned target'] = page['admTarget'];
                        entryObj['Alignment score (Delegator|' + (t == 'aligned' ? 'Most' : 'Least') + ' aligned target)'] = alignments.find((x) => x.target == page['admTarget'])?.score ?? '-';
                    }
                    allObjs.push(entryObj);
                }
            }
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setTA2s(Array.from(new Set(allTA2s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setGroupTargets(Array.from(new Set(allGroupTargets)));
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults]);

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
        FileSaver.saveAs(data, 'RQ-5 data' + fileExtension);
    };

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        setFilteredData(formattedData.filter((x) =>
            (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
            (ta2Filters.length == 0 || ta2Filters.includes(x['TA2_Name'])) &&
            (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
            (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute'])) &&
            (groupTargetFilters.length == 0 || groupTargetFilters.includes(x['Group_Target']))
        ));
    }, [ta1Filters, ta2Filters, scenarioFilters, attributeFilters, groupTargetFilters]);

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults) return <p>Error :</p>;

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
                        return (<tr key={dataSet['ParticipantId'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['ParticipantId'] + '-' + val}>
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
                <RQDefinitionTable downloadName={'Definitions_RQ5.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}
