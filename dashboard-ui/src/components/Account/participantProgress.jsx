import React from "react";
import '../SurveyResults/resultsTable.css';
import { Autocomplete, TextField } from "@mui/material";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { DownloadButtons } from "../DRE-Research/tables/download-buttons";
import { isDefined } from "../AggregateResults/DataFunctions";

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

const GET_SIM_DATA = gql`
    query GetAllSimAlignment {
        getAllSimAlignment
    }`;

const HEADERS_NO_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];
const HEADERS_WITH_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];


export function ParticipantProgressTable({ canViewProlific = false }) {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog, refetch: refetchPLog } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults, refetch: refetchSurveyResults } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults, refetch: refetchTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingSim, error: errorSim, data: dataSim, refetch: refetchSimData } = useQuery(GET_SIM_DATA);
    const [formattedData, setFormattedData] = React.useState([]);
    const [types, setTypes] = React.useState([]);
    const [evals, setEvals] = React.useState([]);
    const [completion] = React.useState(['All Text (5)', 'Missing Text', 'Delegation (1)', 'No Delegation', 'All Sim (4)', 'Any Sim', 'Adept + OW Sim', 'No Sim']);
    const [typeFilters, setTypeFilters] = React.useState([]);
    const [evalFilters, setEvalFilters] = React.useState([]);
    const [completionFilters, setCompletionFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const HEADERS = canViewProlific ? HEADERS_WITH_PROLIFIC : HEADERS_NO_PROLIFIC;

    React.useEffect(() => {
        if (dataParticipantLog?.getParticipantLog && dataSurveyResults?.getAllSurveyResults && dataTextResults?.getAllScenarioResults && dataSim?.getAllSimAlignment) {
            const participantLog = dataParticipantLog.getParticipantLog;
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const textResults = dataTextResults.getAllScenarioResults;
            const simResults = dataSim.getAllSimAlignment;
            const allObjs = [];
            const allTypes = [];
            const allEvals = [];

            for (const res of participantLog) {
                const obj = {};
                const pid = res['ParticipantID']?.toString();
                obj['Participant ID'] = pid;
                obj['Participant Type'] = res['Type'];
                allTypes.push(res['Type']);

                const sims = simResults.filter((x) => x.pid == pid).sort((a, b) => a.timestamp - b.timestamp);
                obj['Evaluation'] = sims[0]?.evalName;
                if (canViewProlific) {
                    obj['Prolific ID'] = res['prolificId'];
                    obj['Contact ID'] = res['contactId'];
                    if (res['prolificId']) obj['Survey Link'] = `${window.location.protocol}//${window.location.host}/remote-text-survey?adeptQualtrix=true&PROLIFIC_PID=${res['prolificId']}&ContactID=${res['contactId']}&pid=${pid}&class=Online&startSurvey=true`;
                }
                const sim_date = new Date(sims[0]?.timestamp);
                obj['Sim Date-Time'] = sim_date != 'Invalid Date' ? `${sim_date?.getMonth() + 1}/${sim_date?.getDate()}/${sim_date?.getFullYear()} - ${sim_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Sim Count'] = sims.length;
                obj['Sim-1'] = sims[0]?.scenario_id;
                obj['Sim-2'] = sims[1]?.scenario_id;
                obj['Sim-3'] = sims[2]?.scenario_id;
                obj['Sim-4'] = sims[3]?.scenario_id;


                const surveys = surveyResults.filter((x) => ((x.results?.pid && (x.results.pid == pid)) || x.results?.['Participant ID Page']?.questions?.['Participant ID']?.response == pid)
                    && x.results?.['Post-Scenario Measures']);
                const lastSurvey = surveys?.slice(-1)?.[0];
                const survey_date = new Date(lastSurvey?.results?.timeComplete);
                obj['Del Date-Time'] = survey_date != 'Invalid Date' ? `${survey_date?.getMonth() + 1}/${survey_date?.getDate()}/${survey_date?.getFullYear()} - ${survey_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Delegation'] = surveys.length;
                const delScenarios = lastSurvey?.results?.orderLog?.filter((x) => x.includes(' vs '));
                if (delScenarios) {
                    obj['Del-1'] = lastSurvey?.results?.[delScenarios[0]]?.scenarioIndex;
                    obj['Del-2'] = lastSurvey?.results?.[delScenarios[1]]?.scenarioIndex;
                    obj['Del-3'] = lastSurvey?.results?.[delScenarios[2]]?.scenarioIndex;
                    obj['Del-4'] = lastSurvey?.results?.[delScenarios[3]]?.scenarioIndex;
                }
                if (obj['Delegation'] > 0) obj['Survey Link'] = null;

                obj['Evaluation'] = obj['Evaluation'] ?? lastSurvey?.evalName;


                const scenarios = textResults.filter((x) => x.participantID == pid);
                const lastScenario = scenarios?.slice(-1)?.[0];
                const text_date = new Date(lastScenario?.timeComplete);
                obj['Text Date-Time'] = text_date != 'Invalid Date' ? `${text_date?.getMonth() + 1}/${text_date?.getDate()}/${text_date?.getFullYear()} - ${text_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Text'] = scenarios.length;
                if (obj['Text'] < 5) obj['Survey Link'] = null;
                obj['Evaluation'] = obj['Evaluation'] ?? lastScenario?.evalName;
                const completedScenarios = scenarios.map((x) => x.scenario_id);
                obj['IO1'] = completedScenarios.includes('DryRunEval.IO1') || completedScenarios.includes('phase1-adept-train-IO1') ? 'y' : null;
                obj['MJ1'] = completedScenarios.includes('DryRunEval.MJ1') || completedScenarios.includes('phase1-adept-train-MJ1') ? 'y' : null;
                obj['MJ2'] = completedScenarios.includes('DryRunEval-MJ2-eval') || completedScenarios.includes('phase1-adept-eval-MJ2') ? 'y' : null;
                obj['MJ4'] = completedScenarios.includes('DryRunEval-MJ4-eval') || completedScenarios.includes('phase1-adept-eval-MJ4') ? 'y' : null;
                obj['MJ5'] = completedScenarios.includes('DryRunEval-MJ5-eval') || completedScenarios.includes('phase1-adept-eval-MJ5') ? 'y' : null;
                obj['QOL1'] = completedScenarios.includes('qol-dre-1-eval') ? 'y' : null;
                obj['QOL2'] = completedScenarios.includes('qol-dre-2-eval') || completedScenarios.includes('qol-ph1-eval-2') ? 'y' : null;
                obj['QOL3'] = completedScenarios.includes('qol-dre-3-eval') || completedScenarios.includes('qol-ph1-eval-3') ? 'y' : null;
                obj['QOL4'] = completedScenarios.includes('qol-ph1-eval-4') ? 'y' : null;
                obj['VOL1'] = completedScenarios.includes('vol-dre-1-eval') ? 'y' : null;
                obj['VOL2'] = completedScenarios.includes('vol-dre-2-eval') || completedScenarios.includes('vol-ph1-eval-2') ? 'y' : null;
                obj['VOL3'] = completedScenarios.includes('vol-dre-3-eval') || completedScenarios.includes('vol-ph1-eval-3') ? 'y' : null;
                obj['VOL4'] = completedScenarios.includes('vol-ph1-eval-4') ? 'y' : null;

                allObjs.push(obj);
                obj['Evaluation'] && allEvals.push(obj['Evaluation']);
            }
            // // sort
            allObjs.sort((a, b) => {
                // Compare PID
                if (Number(a['Participant_ID']) < Number(b['Participant_ID'])) return -1;
                if (Number(a['Participant_ID']) > Number(b['Participant_ID'])) return 1;
            });
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTypes(Array.from(new Set(allTypes)));
            setEvals(Array.from(new Set(allEvals)));
        }
    }, [dataParticipantLog, dataSim, dataSurveyResults, dataTextResults]);

    const formatCell = (header, dataSet) => {
        const val = dataSet[header];
        const getClassName = (header, val) => {
            const lightGreenIfNotNull = ['Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];
            if (lightGreenIfNotNull.includes(header) && isDefined(val)) {
                return 'li-green-cell';
            }
            if ((header == 'Delegation' && val == 1) || (header == 'Text' && val == 5) || (header == 'Sim Count' && val == 4)) {
                return 'dk-green-cell';
            }
            return 'white-cell';
        };
        return (<td key={dataSet['Participant_ID'] + '-' + header} className={getClassName(header, val) + ' ' + (header.length < 5 ? 'small-column' : '')}>
            {header == 'Survey Link' && val ? <button onClick={() => copyLink(val)} className='downloadBtn'>Copy Link</button> : <span>{val ?? '-'}</span>}
        </td>);
    };

    const copyLink = (linkToCopy) => {
        navigator.clipboard.writeText(linkToCopy);
    };

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) => {
                const sims = [x['Sim-1'], x['Sim-2'], x['Sim-3'], x['Sim-4']];
                const didAdept = sims.filter((s) => s?.includes('MJ')).length > 0;
                const didOW = sims.filter((s) => s?.includes('open_world')).length > 0;
                return (typeFilters.length == 0 || typeFilters.includes(x['Participant Type'])) &&
                    (evalFilters.length == 0 || evalFilters.includes(x['Evaluation'])) &&
                    (!completionFilters.includes('All Text (5)') || x['Text'] >= 5) &&
                    (!completionFilters.includes('Missing Text') || x['Text'] < 5) &&
                    (!completionFilters.includes('Delegation (1)') || x['Delegation'] >= 1) &&
                    (!completionFilters.includes('No Delegation') || x['Delegation'] == 0) &&
                    (!completionFilters.includes('All Sim (4)') || x['Sim Count'] >= 4) &&
                    (!completionFilters.includes('Any Sim') || x['Sim Count'] >= 1) &&
                    (!completionFilters.includes('Adept + OW Sim') || (didAdept && didOW)) &&
                    (!completionFilters.includes('No Sim') || x['Sim Count'] == 0)
            }));
        }
    }, [formattedData, typeFilters, evalFilters, completionFilters]);

    const refreshData = async () => {
        await refetchPLog();
        await refetchSimData();
        await refetchSurveyResults();
        await refetchTextResults();
    };

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorSim) return <p>Error :</p>;

    return (<>
        <h2 className='progress-header'>Participant Progress</h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={types}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Type"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTypeFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={evals}
                    filterSelectedOptions
                    size="small" 
                    style={{ width: '400px' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Eval"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setEvalFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={completion}
                    filterSelectedOptions
                    size="small"
                    style={{ width: '600px' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Progress"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setCompletionFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'Participant_Progress'} extraAction={refreshData} extraActionText={'Refresh Data'} isParticipantData={true} />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (<th key={'header-' + index} className={val.length < 5 ? 'small-column' : ''}>
                                {val}
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((dataSet, index) => {
                        return (<tr key={dataSet['Participant_ID'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return formatCell(val, dataSet);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </>);
}
