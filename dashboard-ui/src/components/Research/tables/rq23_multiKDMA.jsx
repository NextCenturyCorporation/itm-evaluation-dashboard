import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, TextField, Modal } from "@mui/material";
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ2.3_PH2.xlsx';
import { DownloadButtons } from "./download-buttons";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { Checkbox, FormControlLabel } from "@material-ui/core";

const getAnalysisData = gql`
    query getMultiKdmaAnalysisData {
        getMultiKdmaAnalysisData
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const HEADERS = ['ADM Name', 'PID', 'Human Scenario', 'Target Type', 'MJ Alignment Target', 'IO Alignment Target', 'MJ KDMA_Aligned - MJ2', 'MJ KDMA_Aligned - MJ4', 'MJ KDMA_Aligned - MJ5', 'MJ KDMA_Aligned - AVE', 'IO KDMA_Aligned - MJ2', 'IO KDMA_Aligned - MJ4', 'IO KDMA_Aligned - MJ5', 'IO KDMA_Aligned - AVE', 'Alignment (Target|ADM_MJ2)_Aligned', 'Alignment (Target|ADM_MJ4)_Aligned', 'Alignment (Target|ADM_MJ5)_Aligned', 'Alignment Average (Target|ADM)_Aligned', 'MJ KDMA_Baseline - MJ2', 'MJ KDMA_Baseline - MJ4', 'MJ KDMA_Baseline - MJ5', 'MJ KDMA_Baseline - AVE', 'IO KDMA_Baseline - MJ2', 'IO KDMA_Baseline - MJ4', 'IO KDMA_Baseline - MJ5', 'IO KDMA_Baseline - AVE', 'Alignment (Target|ADM_MJ2)_Baseline', 'Alignment (Target|ADM_MJ4)_Baseline', 'Alignment (Target|ADM_MJ5)_Baseline', 'Alignment Average (Target|ADM)_Baseline'];

export function MultiKDMA_RQ23() {
    const { loading: loading, error: error, data: data } = useQuery(getAnalysisData);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [admNames, setAdmNames] = React.useState([]);
    const scenarios = ['MJ2', 'MJ4', 'MJ5'];
    const targetTypes = ['Overall', 'Narr', 'Train'];
    // filter options that have been chosen
    const [admNameFilters, setAdmNameFilters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetTypeFilters, setTargetTypeFilters] = React.useState([]);
    // data with filters applied
    const [filteredData, setFilteredData] = React.useState([]);
    // variables for checking completed surveys
    const [onlyShowCompletedSurveys, setOnlyShowCompletedSurveys] = React.useState(false);
    const [pidsWithCompleteSurveys, setPidsWithCompleteSurveys] = React.useState([]);

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    const updateOnlyShowSurveyStatus = (event) => {
        setOnlyShowCompletedSurveys(event.target.checked);
    };

    React.useEffect(() => {
        if (data?.getMultiKdmaAnalysisData && dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults) {
            const analysisData = data.getMultiKdmaAnalysisData;

            // find participants shown in RQ 134
            const rq134Pids = [];
            const surveyResults = dataSurveyResults?.getAllSurveyResults;
            const participantLog = dataParticipantLog?.getParticipantLog;
            const textResults = dataTextResults?.getAllScenarioResults;
            const completed_surveys = surveyResults.filter((res) => (res.results?.evalNumber == 4 && isDefined(res.results['Post-Scenario Measures'])) || ((res.results?.evalNumber == 5 || res.results?.evalNumber == 6) && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
                if (!isDefined(res.results['Post-Scenario Measures']) && surveyResults.filter((res) => res.results?.['Participant ID Page']?.questions['Participant ID']?.response == pid && isDefined(res.results['Post-Scenario Measures']))) {
                    // filter incomplete surveys from participants who have a complete survey
                    continue;
                }
                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => log['ParticipantID'] == pid && log['Type'] != 'Test'
                );
                const textCount = textResults.filter((x) => x.participantID == pid).length;
                if (!logData || textCount < 5) {
                    continue;
                }
                rq134Pids.push(pid);
            }
            setPidsWithCompleteSurveys(rq134Pids);

            const allObjs = [];
            const allAdmNames = [];

            for (const admGroup of analysisData) {
                const entryObj = {};
                const admName = admGroup.admName;
                if (admName.toLowerCase().includes('baseline'))
                    continue;
                entryObj['ADM Name'] = admName;
                allAdmNames.push(admName);
                entryObj['PID'] = admGroup['pid'];
                entryObj['Human Scenario'] = admGroup['humanScenario'];
                entryObj['Target Type'] = capitalizeFirstLetter(admGroup['targetType']);
                entryObj['MJ Alignment Target'] = admGroup['mjTarget'];
                entryObj['IO Alignment Target'] = admGroup['ioTarget'];
                entryObj['MJ KDMA_Aligned - MJ2'] = admGroup['mjAD1_kdma'];
                entryObj['MJ KDMA_Aligned - MJ4'] = admGroup['mjAD2_kdma'];
                entryObj['MJ KDMA_Aligned - MJ5'] = admGroup['mjAD3_kdma'];
                entryObj['MJ KDMA_Aligned - AVE'] = admGroup['mjAve_kdma'];
                entryObj['IO KDMA_Aligned - MJ2'] = admGroup['ioAD1_kdma'];
                entryObj['IO KDMA_Aligned - MJ4'] = admGroup['ioAD2_kdma'];
                entryObj['IO KDMA_Aligned - MJ5'] = admGroup['ioAD3_kdma'];
                entryObj['IO KDMA_Aligned - AVE'] = admGroup['ioAve_kdma'];
                entryObj['Alignment (Target|ADM_MJ2)_Aligned'] = admGroup['AD1_align'];
                entryObj['Alignment (Target|ADM_MJ4)_Aligned'] = admGroup['AD2_align'];
                entryObj['Alignment (Target|ADM_MJ5)_Aligned'] = admGroup['AD3_align'];
                entryObj['Alignment Average (Target|ADM)_Aligned'] = admGroup['ave_align'];

                const baseline = analysisData.find((x) => x['pid'] == admGroup['pid'] && x['admName'].toLowerCase().includes('baseline') && capitalizeFirstLetter(x['targetType']) == entryObj['Target Type']);
                if (baseline) {
                    entryObj['MJ KDMA_Baseline - MJ2'] = baseline['mjAD1_kdma'];
                    entryObj['MJ KDMA_Baseline - MJ4'] = baseline['mjAD2_kdma'];
                    entryObj['MJ KDMA_Baseline - MJ5'] = baseline['mjAD3_kdma'];
                    entryObj['MJ KDMA_Baseline - AVE'] = baseline['mjAve_kdma'];
                    entryObj['IO KDMA_Baseline - MJ2'] = baseline['ioAD1_kdma'];
                    entryObj['IO KDMA_Baseline - MJ4'] = baseline['ioAD2_kdma'];
                    entryObj['IO KDMA_Baseline - MJ5'] = baseline['ioAD3_kdma'];
                    entryObj['IO KDMA_Baseline - AVE'] = baseline['ioAve_kdma'];
                    entryObj['Alignment (Target|ADM_MJ2)_Baseline'] = baseline['AD1_align'];
                    entryObj['Alignment (Target|ADM_MJ4)_Baseline'] = baseline['AD2_align'];
                    entryObj['Alignment (Target|ADM_MJ5)_Baseline'] = baseline['AD3_align'];
                    entryObj['Alignment Average (Target|ADM)_Baseline'] = baseline['ave_align'];
                }
                for (const key of Array.from(Object.keys(entryObj))) {
                    if (entryObj[key] == -1) {
                        entryObj[key] = '-';
                    }
                }
                allObjs.push(entryObj);
            }

            allObjs.sort((a, b) => {
                // Compare ADM Name
                if (a['ADM Name'] < b['ADM Name']) return -1;
                if (a['ADM Name'] > b['ADM Name']) return 1;

                // If ADM Name is equal, compare Type
                if (a['ADM Type'] < b['ADM Type']) return -1;
                if (a['ADM Type'] > b['ADM Type']) return 1;

                // If Type is equal, compare Scenario
                return a.Scenario - b.Scenario;
            });

            if (allObjs.length > 0) {
                setFormattedData(allObjs);
                setFilteredData(allObjs);
            }
            else {
                setFormattedData([{ 'ADM Name': '-' }]);
                setFilteredData([{ 'ADM Name': '-' }]);
            }
            setAdmNames(Array.from(new Set(allAdmNames)));
        }
    }, [data, dataSurveyResults, dataParticipantLog, dataTextResults]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (admNameFilters.length == 0 || admNameFilters.includes(x['ADM Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.filter((sf) => x['Human Scenario'].includes(sf)).length > 0) &&
                (targetTypeFilters.length == 0 || targetTypeFilters.includes(x['Target Type'])) &&
                (!onlyShowCompletedSurveys || pidsWithCompleteSurveys.length == 0 || pidsWithCompleteSurveys.includes(x['PID']))
            ));
        }
    }, [formattedData, admNameFilters, scenarioFilters, targetTypeFilters, onlyShowCompletedSurveys]);

    const capitalizeFirstLetter = (str) => {
        if (!isDefined(str) || str.length < 2)
            return str;
        return str[0].toUpperCase() + str.slice(1);
    };

    if (loading || loadingParticipantLog || loadingSurveyResults || loadingTextResults) return <p>Loading...</p>;
    if (error || errorParticipantLog || errorSurveyResults || errorTextResults) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ 2.3 Data
            <div>
                <FormControlLabel control={<Checkbox value={onlyShowCompletedSurveys} onChange={updateOnlyShowSurveyStatus} />} label="Only Show Participants with Survey Data" />
            </div>
        </h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    style={{ 'min-width': '300px' }}
                    multiple
                    options={admNames}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="ADM Name"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setAdmNameFilters(newVal)}
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
                    options={targetTypes}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Target Type"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTargetTypeFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-23 data'} extraAction={openModal} />
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
                        return (<tr key={dataSet['ADM Name'] + '-' + dataSet['Alignment Target'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['ADM Name'] + '-' + dataSet['Alignment Target'] + '-' + val}>
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
                <RQDefinitionTable downloadName={`Definitions_RQ23_eval7.xlsx`} xlFile={ph2DefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
