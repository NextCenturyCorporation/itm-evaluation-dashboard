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

const QUERIES = {
    analysisData: gql`query getMultiKdmaAnalysisData { getMultiKdmaAnalysisData }`,
    analysisDataEval11: gql`query getMultiKdmaAnalysisDataEval11 { getMultiKdmaAnalysisDataEval11 }`,
    surveyResults: gql`query GetAllResults { getAllSurveyResults }`,
    participantLog: gql`query GetParticipantLog { getParticipantLog }`,
    textResults: gql`query GetAllResults { getAllScenarioResults }`
};

// [headerName, dbField], [headerName, dbField, 'baseline'] for baseline fields, [headerName, dbField, true] for capitalize
const EVAL7_FIELD_MAP = [
    ['ADM Name', 'admName'], ['PID', 'pid'], ['Human Scenario', 'humanScenario'], ['Target Type', 'targetType', true],
    ['MJ Alignment Target', 'mjTarget'], ['IO Alignment Target', 'ioTarget'],
    ['MJ KDMA_Aligned - MJ2', 'mjAD1_kdma'], ['MJ KDMA_Aligned - MJ4', 'mjAD2_kdma'], ['MJ KDMA_Aligned - MJ5', 'mjAD3_kdma'], ['MJ KDMA_Aligned - AVE', 'mjAve_kdma'],
    ['IO KDMA_Aligned - MJ2', 'ioAD1_kdma'], ['IO KDMA_Aligned - MJ4', 'ioAD2_kdma'], ['IO KDMA_Aligned - MJ5', 'ioAD3_kdma'], ['IO KDMA_Aligned - AVE', 'ioAve_kdma'],
    ['Alignment (Target|ADM_MJ2)_Aligned', 'AD1_align'], ['Alignment (Target|ADM_MJ4)_Aligned', 'AD2_align'], ['Alignment (Target|ADM_MJ5)_Aligned', 'AD3_align'], ['Alignment Average (Target|ADM)_Aligned', 'ave_align'],
    ['MJ KDMA_Baseline - MJ2', 'mjAD1_kdma', 'baseline'], ['MJ KDMA_Baseline - MJ4', 'mjAD2_kdma', 'baseline'], ['MJ KDMA_Baseline - MJ5', 'mjAD3_kdma', 'baseline'], ['MJ KDMA_Baseline - AVE', 'mjAve_kdma', 'baseline'],
    ['IO KDMA_Baseline - MJ2', 'ioAD1_kdma', 'baseline'], ['IO KDMA_Baseline - MJ4', 'ioAD2_kdma', 'baseline'], ['IO KDMA_Baseline - MJ5', 'ioAD3_kdma', 'baseline'], ['IO KDMA_Baseline - AVE', 'ioAve_kdma', 'baseline'],
    ['Alignment (Target|ADM_MJ2)_Baseline', 'AD1_align', 'baseline'], ['Alignment (Target|ADM_MJ4)_Baseline', 'AD2_align', 'baseline'], ['Alignment (Target|ADM_MJ5)_Baseline', 'AD3_align', 'baseline'], ['Alignment Average (Target|ADM)_Baseline', 'ave_align', 'baseline']
];

const EVAL11_FIELD_MAP = [
    ['ADM Name', 'admName'], ['PID', 'pid'], ['Human Set', 'human_set'],
    ['MF Alignment Target', 'mfTarget'], ['AF Alignment Target', 'afTarget'], ['PS Alignment Target', 'psTarget'], ['SS Alignment Target', 'ssTarget'],
    ...['mf', 'af', 'ps', 'ss'].flatMap(k => [
        [`${k.toUpperCase()} KDMA_Aligned - set1`, `${k}_kdma_aligned_set1`], [`${k.toUpperCase()} KDMA_Aligned - set2`, `${k}_kdma_aligned_set2`],
        [`${k.toUpperCase()} KDMA_Aligned - set3`, `${k}_kdma_aligned_set3`], [`${k.toUpperCase()} KDMA_Aligned - AVE`, `${k}_kdma_aligned_avg`]
    ]),
    ['4D Alignment (Target|ADM_set1)_Aligned', 'set1_aligned_alignment'], ['4D Alignment (Target|ADM_set2)_Aligned', 'set2_aligned_alignment'],
    ['4D Alignment (Target|ADM_set3)_Aligned', 'set3_aligned_alignment'], ['4D Alignment Average (Target|ADM)_Aligned', 'avg_aligned_alignment'],
    ...['mf', 'af', 'ps', 'ss'].flatMap(k => [
        [`${k.toUpperCase()} KDMA_Baseline - set1`, `${k}_kdma_baseline_set1`], [`${k.toUpperCase()} KDMA_Baseline - set2`, `${k}_kdma_baseline_set2`],
        [`${k.toUpperCase()} KDMA_Baseline - set3`, `${k}_kdma_baseline_set3`], [`${k.toUpperCase()} KDMA_Baseline - AVE`, `${k}_kdma_baseline_avg`]
    ]),
    ['4D Alignment (Target|ADM_set1)_Baseline', 'set1_baseline_alignment'], ['4D Alignment (Target|ADM_set2)_Baseline', 'set2_baseline_alignment'],
    ['4D Alignment (Target|ADM_set3)_Baseline', 'set3_baseline_alignment'], ['4D Alignment Average (Target|ADM)_Baseline', 'avg_baseline_alignment']
];

const EVAL_CONFIG = {
    7: { fieldMap: EVAL7_FIELD_MAP, scenarios: ['MJ2', 'MJ4', 'MJ5'], scenarioLabel: 'Scenarios', definitionFile: ph2DefinitionXLFile, hasTargetType: true },
    11: { fieldMap: EVAL11_FIELD_MAP, scenarios: ['1', '2', '3'], scenarioLabel: 'Human Set', definitionFile: eval11DefinitionXLFile, hasTargetType: false }
};

const capitalize = (str) => (!isDefined(str) || str.length < 2) ? str : str[0].toUpperCase() + str.slice(1);

const getCompletedPids = (surveyResults, participantLog, textResults, evalNum) => {
    const validEvals = evalNum === 11 ? [8, 9, 10] : [4, 5, 6];
    const textLength = evalNum === 11 ? 4 : 5;
    return surveyResults.filter(res => 
        (res.results?.evalNumber === 4 && isDefined(res.results['Post-Scenario Measures'])) || 
        (validEvals.includes(res.results?.evalNumber) && Object.keys(res.results).some(pg => pg.includes(' vs ')))
    ).reduce((pids, res) => {
        const pid = res.results['pid'] ?? res.results['Participant ID Page']?.questions['Participant ID']?.response;
        if (!isDefined(res.results['Post-Scenario Measures']) && 
            surveyResults.some(r => r.results?.['Participant ID Page']?.questions['Participant ID']?.response === pid && isDefined(r.results['Post-Scenario Measures']))) return pids;
        const logData = participantLog.find(log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test');
        if (logData && textResults.filter(x => x.participantID === pid).length >= textLength) pids.push(pid);
        return pids;
    }, []);
};

export function MultiKDMA_RQ23({ evalNum = 7 }) {
    const config = EVAL_CONFIG[evalNum];
    const HEADERS = config.fieldMap.map(([header]) => header);
    
    const { loading, error, data } = useQuery(QUERIES.analysisData, { skip: evalNum !== 7 });
    const { loading: loadingEval11, error: errorEval11, data: dataEval11 } = useQuery(QUERIES.analysisDataEval11, { skip: evalNum !== 11 });
    const { loading: loadingSurvey, error: errorSurvey, data: dataSurvey } = useQuery(QUERIES.surveyResults);
    const { loading: loadingText, error: errorText, data: dataText } = useQuery(QUERIES.textResults, { fetchPolicy: 'no-cache' });
    const { loading: loadingLog, error: errorLog, data: dataLog } = useQuery(QUERIES.participantLog);
    
    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [admNames, setAdmNames] = React.useState([]);
    const [admNameFilters, setAdmNameFilters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetTypeFilters, setTargetTypeFilters] = React.useState([]);
    const [onlyShowCompletedSurveys, setOnlyShowCompletedSurveys] = React.useState(false);
    const [pidsWithCompleteSurveys, setPidsWithCompleteSurveys] = React.useState([]);

    React.useEffect(() => {
        setAdmNameFilters([]); setScenarioFilters([]); setTargetTypeFilters([]);
        setFormattedData([]); setFilteredData([]);
    }, [evalNum]);

    React.useEffect(() => {
        const analysisData = evalNum === 7 ? data?.getMultiKdmaAnalysisData : dataEval11?.getMultiKdmaAnalysisDataEval11;
        if (!analysisData || !dataSurvey?.getAllSurveyResults || !dataLog?.getParticipantLog || !dataText?.getAllScenarioResults) return;

        setPidsWithCompleteSurveys(getCompletedPids(dataSurvey.getAllSurveyResults, dataLog.getParticipantLog, dataText.getAllScenarioResults, evalNum));
        
        const allAdmNames = [];
        const allObjs = analysisData.reduce((objs, doc) => {
            if (evalNum === 7 && doc.admName.toLowerCase().includes('baseline')) return objs;
            
            const baseline = evalNum === 7 ? analysisData.find(x => x.pid === doc.pid && x.admName.toLowerCase().includes('baseline') && capitalize(x.targetType) === capitalize(doc.targetType)) : null;
            const entry = config.fieldMap.reduce((obj, [header, field, modifier]) => {
                if (modifier === true) obj[header] = capitalize(doc[field]);
                else if (modifier === 'baseline') obj[header] = baseline?.[field];
                else obj[header] = doc[field];
                if (obj[header] === -1) obj[header] = '-';
                return obj;
            }, {});
            
            allAdmNames.push(doc.admName);
            objs.push(entry);
            return objs;
        }, []);

        allObjs.sort((a, b) => a['ADM Name'].localeCompare(b['ADM Name']) || String(a['PID']).localeCompare(String(b['PID'])));
        setFormattedData(allObjs.length ? allObjs : [{ 'ADM Name': '-' }]);
        setFilteredData(allObjs.length ? allObjs : [{ 'ADM Name': '-' }]);
        setAdmNames([...new Set(allAdmNames)]);
    }, [data, dataEval11, dataSurvey, dataLog, dataText, evalNum, config.fieldMap]);

    React.useEffect(() => {
        if (!formattedData.length) return;
        setFilteredData(formattedData.filter(x => 
            (!admNameFilters.length || admNameFilters.includes(x['ADM Name'])) &&
            (!scenarioFilters.length || (evalNum === 7 ? scenarioFilters.some(sf => x['Human Scenario']?.includes(sf)) : scenarioFilters.includes(String(x['Human Set'])))) &&
            (evalNum !== 7 || !targetTypeFilters.length || targetTypeFilters.includes(x['Target Type'])) &&
            (!onlyShowCompletedSurveys || !pidsWithCompleteSurveys.length || pidsWithCompleteSurveys.includes(x['PID']))
        ));
    }, [formattedData, admNameFilters, scenarioFilters, targetTypeFilters, onlyShowCompletedSurveys, pidsWithCompleteSurveys, evalNum]);

    const isLoading = (evalNum === 7 ? loading : loadingEval11) || loadingLog || loadingSurvey || loadingText;
    const hasError = (evalNum === 7 ? error : errorEval11) || errorLog || errorSurvey || errorText;

    if (isLoading) return <p>Loading...</p>;
    if (hasError) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>RQ 2.3 Data
            <div><FormControlLabel control={<Checkbox value={onlyShowCompletedSurveys} onChange={e => setOnlyShowCompletedSurveys(e.target.checked)} />} label="Only Show Participants with Survey Data" /></div>
        </h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete style={{ minWidth: '300px' }} multiple options={admNames} filterSelectedOptions size="small"
                    renderInput={(params) => <TextField {...params} label="ADM Name" />} onChange={(_, v) => setAdmNameFilters(v)} value={admNameFilters} />
                <Autocomplete multiple options={config.scenarios} filterSelectedOptions size="small"
                    renderInput={(params) => <TextField {...params} label={config.scenarioLabel} />} onChange={(_, v) => setScenarioFilters(v)} value={scenarioFilters} />
                {config.hasTargetType && <Autocomplete multiple options={['Overall', 'Narr', 'Train']} filterSelectedOptions size="small"
                    renderInput={(params) => <TextField {...params} label="Target Type" />} onChange={(_, v) => setTargetTypeFilters(v)} value={targetTypeFilters} />}
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={`RQ-23 data eval${evalNum}`} extraAction={() => setShowDefinitions(true)} />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead><tr>{HEADERS.map((val, i) => <th key={i}>{val}</th>)}</tr></thead>
                <tbody>{filteredData.map((row, i) => <tr key={`${row['ADM Name']}-${row['PID']}-${i}`}>{HEADERS.map(h => <td key={h}>{row[h] ?? '-'}</td>)}</tr>)}</tbody>
            </table>
        </div>
        <Modal className='table-modal' open={showDefinitions} onClose={() => setShowDefinitions(false)}>
            <div className='modal-body'>
                <span className='close-icon' onClick={() => setShowDefinitions(false)}><CloseIcon /></span>
                <RQDefinitionTable downloadName={`Definitions_RQ23_eval${evalNum}.xlsx`} xlFile={config.definitionFile} />
            </div>
        </Modal>
    </>);
}