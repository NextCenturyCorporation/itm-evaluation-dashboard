import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, TextField, Modal } from "@mui/material";
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ2.3_MultiKDMA.xlsx';
import eval11DefinitionXLFile from '../variables/Variable Definitions_RQ23_eval11.xlsx';
import { DownloadButtons } from "./download-buttons";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { Checkbox, FormControlLabel } from "@material-ui/core";

const getAnalysisData = gql`
    query getMultiKdmaAnalysisData {
        getMultiKdmaAnalysisData
    }`;

const getAnalysisDataEval11 = gql`
    query getMultiKdmaAnalysisDataEval11 {
        getMultiKdmaAnalysisDataEval11
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

// eval 7 multi kdma
const HEADERS_EVAL7 = ['ADM Name', 'PID', 'Human Scenario', 'Target Type', 'MJ Alignment Target', 'IO Alignment Target', 'MJ KDMA_Aligned - MJ2', 'MJ KDMA_Aligned - MJ4', 'MJ KDMA_Aligned - MJ5', 'MJ KDMA_Aligned - AVE', 'IO KDMA_Aligned - MJ2', 'IO KDMA_Aligned - MJ4', 'IO KDMA_Aligned - MJ5', 'IO KDMA_Aligned - AVE', 'Alignment (Target|ADM_MJ2)_Aligned', 'Alignment (Target|ADM_MJ4)_Aligned', 'Alignment (Target|ADM_MJ5)_Aligned', 'Alignment Average (Target|ADM)_Aligned', 'MJ KDMA_Baseline - MJ2', 'MJ KDMA_Baseline - MJ4', 'MJ KDMA_Baseline - MJ5', 'MJ KDMA_Baseline - AVE', 'IO KDMA_Baseline - MJ2', 'IO KDMA_Baseline - MJ4', 'IO KDMA_Baseline - MJ5', 'IO KDMA_Baseline - AVE', 'Alignment (Target|ADM_MJ2)_Baseline', 'Alignment (Target|ADM_MJ4)_Baseline', 'Alignment (Target|ADM_MJ5)_Baseline', 'Alignment Average (Target|ADM)_Baseline'];

// 4d exp
const HEADERS_EVAL11 = [
    'ADM Name', 'PID', 'Human Set',
    'MF Alignment Target', 'AF Alignment Target', 'PS Alignment Target', 'SS Alignment Target',
    'MF KDMA_Aligned - set1', 'MF KDMA_Aligned - set2', 'MF KDMA_Aligned - set3', 'MF KDMA_Aligned - AVE',
    'AF KDMA_Aligned - set1', 'AF KDMA_Aligned - set2', 'AF KDMA_Aligned - set3', 'AF KDMA_Aligned - AVE',
    'PS KDMA_Aligned - set1', 'PS KDMA_Aligned - set2', 'PS KDMA_Aligned - set3', 'PS KDMA_Aligned - AVE',
    'SS KDMA_Aligned - set1', 'SS KDMA_Aligned - set2', 'SS KDMA_Aligned - set3', 'SS KDMA_Aligned - AVE',
    '4D Alignment (Target|ADM_set1)_Aligned', '4D Alignment (Target|ADM_set2)_Aligned', '4D Alignment (Target|ADM_set3)_Aligned', '4D Alignment Average (Target|ADM)_Aligned',
    'MF KDMA_Baseline - set1', 'MF KDMA_Baseline - set2', 'MF KDMA_Baseline - set3', 'MF KDMA_Baseline - AVE',
    'AF KDMA_Baseline - set1', 'AF KDMA_Baseline - set2', 'AF KDMA_Baseline - set3', 'AF KDMA_Baseline - AVE',
    'PS KDMA_Baseline - set1', 'PS KDMA_Baseline - set2', 'PS KDMA_Baseline - set3', 'PS KDMA_Baseline - AVE',
    'SS KDMA_Baseline - set1', 'SS KDMA_Baseline - set2', 'SS KDMA_Baseline - set3', 'SS KDMA_Baseline - AVE',
    '4D Alignment (Target|ADM_set1)_Baseline', '4D Alignment (Target|ADM_set2)_Baseline', '4D Alignment (Target|ADM_set3)_Baseline', '4D Alignment Average (Target|ADM)_Baseline'
];

export function MultiKDMA_RQ23({ evalNum = 7 }) {
    const { loading, error, data } = useQuery(getAnalysisData, { skip: evalNum !== 7 });
    const { loading: loadingEval11, error: errorEval11, data: dataEval11 } = useQuery(getAnalysisDataEval11, { skip: evalNum !== 11 });
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [admNames, setAdmNames] = React.useState([]);
    const scenarios = evalNum === 7 ? ['MJ2', 'MJ4', 'MJ5'] : ['1', '2', '3'];
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

    // Get the appropriate headers based on evalNum prop
    const HEADERS = evalNum === 7 ? HEADERS_EVAL7 : HEADERS_EVAL11;

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    const updateOnlyShowSurveyStatus = (event) => {
        setOnlyShowCompletedSurveys(event.target.checked);
    };

    // Reset filters when evalNum changes
    React.useEffect(() => {
        setAdmNameFilters([]);
        setScenarioFilters([]);
        setTargetTypeFilters([]);
        setFormattedData([]);
        setFilteredData([]);
    }, [evalNum]);

    // Process eval 7 data
    React.useEffect(() => {
        if (evalNum !== 7) return;
        if (data?.getMultiKdmaAnalysisData && dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults) {
            const analysisData = data.getMultiKdmaAnalysisData;

            // find participants shown in RQ 134
            const rq134Pids = [];
            const surveyResults = dataSurveyResults?.getAllSurveyResults;
            const participantLog = dataParticipantLog?.getParticipantLog;
            const textResults = dataTextResults?.getAllScenarioResults;
            const completed_surveys = surveyResults.filter((res) => (res.results?.evalNumber === 4 && isDefined(res.results['Post-Scenario Measures'])) || ((res.results?.evalNumber === 5 || res.results?.evalNumber === 6) && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
                if (!isDefined(res.results['Post-Scenario Measures']) && surveyResults.filter((res) => res.results?.['Participant ID Page']?.questions['Participant ID']?.response === pid && isDefined(res.results['Post-Scenario Measures']))) {
                    // filter incomplete surveys from participants who have a complete survey
                    continue;
                }
                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
                );
                const textCount = textResults.filter((x) => x.participantID === pid).length;
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

                const baseline = analysisData.find((x) => x['pid'] === admGroup['pid'] && x['admName'].toLowerCase().includes('baseline') && capitalizeFirstLetter(x['targetType']) === entryObj['Target Type']);
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
                    if (entryObj[key] === -1) {
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
    }, [data, dataSurveyResults, dataParticipantLog, dataTextResults, evalNum]);

    // Process eval 11 data
    React.useEffect(() => {
        if (evalNum !== 11) return;
        if (dataEval11?.getMultiKdmaAnalysisDataEval11 && dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults) {
            const analysisData = dataEval11.getMultiKdmaAnalysisDataEval11;

            // find participants with complete surveys (similar logic as eval 7)
            const rq134Pids = [];
            const surveyResults = dataSurveyResults?.getAllSurveyResults;
            const participantLog = dataParticipantLog?.getParticipantLog;
            const textResults = dataTextResults?.getAllScenarioResults;
            const completed_surveys = surveyResults.filter((res) => (res.results?.evalNumber === 4 && isDefined(res.results['Post-Scenario Measures'])) || ((res.results?.evalNumber === 5 || res.results?.evalNumber === 6 || res.results?.evalNumber === 11) && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
                if (!isDefined(res.results['Post-Scenario Measures']) && surveyResults.filter((res) => res.results?.['Participant ID Page']?.questions['Participant ID']?.response === pid && isDefined(res.results['Post-Scenario Measures']))) {
                    continue;
                }
                const logData = participantLog.find(
                    log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
                );
                const textCount = textResults.filter((x) => x.participantID === pid).length;
                if (!logData || textCount < 5) {
                    continue;
                }
                rq134Pids.push(pid);
            }
            setPidsWithCompleteSurveys(rq134Pids);

            const allObjs = [];
            const allAdmNames = [];

            for (const doc of analysisData) {
                const entryObj = {};
                const admName = doc.admName;
                
                entryObj['ADM Name'] = admName;
                allAdmNames.push(admName);
                entryObj['PID'] = doc['pid'];
                entryObj['Human Set'] = doc['human_set'];
                
                // 4D alignment targets
                entryObj['MF Alignment Target'] = doc['mfTarget'];
                entryObj['AF Alignment Target'] = doc['afTarget'];
                entryObj['PS Alignment Target'] = doc['psTarget'];
                entryObj['SS Alignment Target'] = doc['ssTarget'];
                
                // MF KDMA Aligned
                entryObj['MF KDMA_Aligned - set1'] = doc['mf_kdma_aligned_set1'];
                entryObj['MF KDMA_Aligned - set2'] = doc['mf_kdma_aligned_set2'];
                entryObj['MF KDMA_Aligned - set3'] = doc['mf_kdma_aligned_set3'];
                entryObj['MF KDMA_Aligned - AVE'] = doc['mf_kdma_aligned_avg'];
                
                // AF KDMA Aligned
                entryObj['AF KDMA_Aligned - set1'] = doc['af_kdma_aligned_set1'];
                entryObj['AF KDMA_Aligned - set2'] = doc['af_kdma_aligned_set2'];
                entryObj['AF KDMA_Aligned - set3'] = doc['af_kdma_aligned_set3'];
                entryObj['AF KDMA_Aligned - AVE'] = doc['af_kdma_aligned_avg'];
                
                // PS KDMA Aligned
                entryObj['PS KDMA_Aligned - set1'] = doc['ps_kdma_aligned_set1'];
                entryObj['PS KDMA_Aligned - set2'] = doc['ps_kdma_aligned_set2'];
                entryObj['PS KDMA_Aligned - set3'] = doc['ps_kdma_aligned_set3'];
                entryObj['PS KDMA_Aligned - AVE'] = doc['ps_kdma_aligned_avg'];
                
                // SS KDMA Aligned
                entryObj['SS KDMA_Aligned - set1'] = doc['ss_kdma_aligned_set1'];
                entryObj['SS KDMA_Aligned - set2'] = doc['ss_kdma_aligned_set2'];
                entryObj['SS KDMA_Aligned - set3'] = doc['ss_kdma_aligned_set3'];
                entryObj['SS KDMA_Aligned - AVE'] = doc['ss_kdma_aligned_avg'];
                
                // 4D Alignment Aligned
                entryObj['4D Alignment (Target|ADM_set1)_Aligned'] = doc['set1_aligned_alignment'];
                entryObj['4D Alignment (Target|ADM_set2)_Aligned'] = doc['set2_aligned_alignment'];
                entryObj['4D Alignment (Target|ADM_set3)_Aligned'] = doc['set3_aligned_alignment'];
                entryObj['4D Alignment Average (Target|ADM)_Aligned'] = doc['avg_aligned_alignment'];

                // MF KDMA Baseline
                entryObj['MF KDMA_Baseline - set1'] = doc['mf_kdma_baseline_set1'];
                entryObj['MF KDMA_Baseline - set2'] = doc['mf_kdma_baseline_set2'];
                entryObj['MF KDMA_Baseline - set3'] = doc['mf_kdma_baseline_set3'];
                entryObj['MF KDMA_Baseline - AVE'] = doc['mf_kdma_baseline_avg'];
                
                // AF KDMA Baseline
                entryObj['AF KDMA_Baseline - set1'] = doc['af_kdma_baseline_set1'];
                entryObj['AF KDMA_Baseline - set2'] = doc['af_kdma_baseline_set2'];
                entryObj['AF KDMA_Baseline - set3'] = doc['af_kdma_baseline_set3'];
                entryObj['AF KDMA_Baseline - AVE'] = doc['af_kdma_baseline_avg'];
                
                // PS KDMA Baseline
                entryObj['PS KDMA_Baseline - set1'] = doc['ps_kdma_baseline_set1'];
                entryObj['PS KDMA_Baseline - set2'] = doc['ps_kdma_baseline_set2'];
                entryObj['PS KDMA_Baseline - set3'] = doc['ps_kdma_baseline_set3'];
                entryObj['PS KDMA_Baseline - AVE'] = doc['ps_kdma_baseline_avg'];
                
                // SS KDMA Baseline
                entryObj['SS KDMA_Baseline - set1'] = doc['ss_kdma_baseline_set1'];
                entryObj['SS KDMA_Baseline - set2'] = doc['ss_kdma_baseline_set2'];
                entryObj['SS KDMA_Baseline - set3'] = doc['ss_kdma_baseline_set3'];
                entryObj['SS KDMA_Baseline - AVE'] = doc['ss_kdma_baseline_avg'];
                
                // 4D Alignment Baseline
                entryObj['4D Alignment (Target|ADM_set1)_Baseline'] = doc['set1_baseline_alignment'];
                entryObj['4D Alignment (Target|ADM_set2)_Baseline'] = doc['set2_baseline_alignment'];
                entryObj['4D Alignment (Target|ADM_set3)_Baseline'] = doc['set3_baseline_alignment'];
                entryObj['4D Alignment Average (Target|ADM)_Baseline'] = doc['avg_baseline_alignment'];

                // Replace -1 values with '-'
                for (const key of Array.from(Object.keys(entryObj))) {
                    if (entryObj[key] === -1) {
                        entryObj[key] = '-';
                    }
                }
                allObjs.push(entryObj);
            }

            allObjs.sort((a, b) => {
                if (a['ADM Name'] < b['ADM Name']) return -1;
                if (a['ADM Name'] > b['ADM Name']) return 1;
                // If ADM Name is equal, compare by PID
                if (a['PID'] < b['PID']) return -1;
                if (a['PID'] > b['PID']) return 1;
                return 0;
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
    }, [dataEval11, dataSurveyResults, dataParticipantLog, dataTextResults, evalNum]);

    // Apply filters
    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) => {
                const admNameMatch = admNameFilters.length === 0 || admNameFilters.includes(x['ADM Name']);
                // For eval 11, filter by Human Set; for eval 7, filter by Human Scenario
                const scenarioMatch = scenarioFilters.length === 0 || 
                    (evalNum === 7 
                        ? scenarioFilters.filter((sf) => x['Human Scenario']?.includes(sf)).length > 0
                        : scenarioFilters.includes(String(x['Human Set'])));
                // Target Type filter only applies to eval 7
                const targetTypeMatch = evalNum !== 7 || targetTypeFilters.length === 0 || targetTypeFilters.includes(x['Target Type']);
                const completeSurveyMatch = !onlyShowCompletedSurveys || pidsWithCompleteSurveys.length === 0 || pidsWithCompleteSurveys.includes(x['PID']);
                
                return admNameMatch && scenarioMatch && targetTypeMatch && completeSurveyMatch;
            }));
        }
    }, [formattedData, admNameFilters, scenarioFilters, targetTypeFilters, onlyShowCompletedSurveys, pidsWithCompleteSurveys, evalNum]);

    const capitalizeFirstLetter = (str) => {
        if (!isDefined(str) || str.length < 2)
            return str;
        return str[0].toUpperCase() + str.slice(1);
    };

    const isLoading = (evalNum === 7 && loading) || (evalNum === 11 && loadingEval11) || loadingParticipantLog || loadingSurveyResults || loadingTextResults;
    const hasError = (evalNum === 7 && error) || (evalNum === 11 && errorEval11) || errorParticipantLog || errorSurveyResults || errorTextResults;

    if (isLoading) return <p>Loading...</p>;
    if (hasError) return <p>Error :</p>;

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
                    style={{ 'minWidth': '300px' }}
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
                    value={admNameFilters}
                />
                <Autocomplete
                    multiple
                    options={scenarios}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={evalNum === 7 ? "Scenarios" : "Human Set"}
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setScenarioFilters(newVal)}
                    value={scenarioFilters}
                />
                {evalNum === 7 && (
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
                        value={targetTypeFilters}
                    />
                )}
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={`RQ-23 data eval${evalNum}`} extraAction={openModal} />
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
                        return (<tr key={dataSet['ADM Name'] + '-' + dataSet['PID'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['ADM Name'] + '-' + dataSet['PID'] + '-' + val}>
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
                <RQDefinitionTable 
                    downloadName={evalNum === 7 ? `Definitions_RQ23_eval7.xlsx` : `Definitions_RQ23_eval11.xlsx`} 
                    xlFile={evalNum === 7 ? ph2DefinitionXLFile : eval11DefinitionXLFile} 
                />
            </div>
        </Modal>
    </>);
}