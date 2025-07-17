import React from "react";
import '../SurveyResults/resultsTable.css';
import '../../css/admInfo.css';
import { Autocomplete, TextField, Modal } from "@mui/material";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { DownloadButtons } from "../Research/tables/download-buttons";
import { isDefined } from "../AggregateResults/DataFunctions";
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { Spinner } from 'react-bootstrap';
import { setScenarioCompletion, SCENARIO_HEADERS } from "./progressUtils";

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

const HEADERS_PHASE1_NO_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];
const HEADERS_PHASE1_WITH_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];

const HEADERS_PHASE2_NO_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Del-5', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3'];
const HEADERS_PHASE2_WITH_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Del-5', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3'];

export function ParticipantProgressTable({ canViewProlific = false }) {
    const KDMA_MAP = { AF: 'affiliation', MF: 'merit', PS: 'personal_safety', SS: 'search' };
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog, refetch: refetchPLog } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults, refetch: refetchSurveyResults } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults, refetch: refetchTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingSim, error: errorSim, data: dataSim, refetch: refetchSimData } = useQuery(GET_SIM_DATA);
    const [formattedData, setFormattedData] = React.useState([]);
    const [types, setTypes] = React.useState([]);
    const [evals, setEvals] = React.useState([]);
    const [typeFilters, setTypeFilters] = React.useState([]);
    const [evalFilters, setEvalFilters] = React.useState([]);
    const [completionFilters, setCompletionFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [columnsToHide, setColumnsToHide] = React.useState([]);
    const [sortOptions] = React.useState(['Participant ID ↑', 'Participant ID ↓', 'Text Start Time ↑', 'Text Start Time ↓', 'Sim Count ↑', 'Sim Count ↓', 'Del Count ↑', 'Del Count ↓', 'Text Count ↑', 'Text Count ↓'])
    const [sortBy, setSortBy] = React.useState('Participant ID ↑');
    const [searchPid, setSearchPid] = React.useState('');
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [selectedPhase, setSelectedPhase] = React.useState('Phase 1');

    const getHeaders = () => {
        if (selectedPhase === 'Phase 2') {
            return canViewProlific ? HEADERS_PHASE2_WITH_PROLIFIC : HEADERS_PHASE2_NO_PROLIFIC;
        }
        return canViewProlific ? HEADERS_PHASE1_WITH_PROLIFIC : HEADERS_PHASE1_NO_PROLIFIC;
    };
    const HEADERS = getHeaders();

    const getCompletionOptions = () => {
        const textThreshold = selectedPhase === 'Phase 2' ? 4 : 5;
        const baseOptions = [`All Text (${textThreshold})`, 'Missing Text', 'Delegation (1)', 'No Delegation', 'All Sim (4)', 'Any Sim', 'No Sim'];
        
        if (selectedPhase === 'Phase 1') {
            // phase 1 option
            baseOptions.splice(-1, 0, 'Adept + OW Sim');
        }
        
        return baseOptions;
    };

    const [popupInfo, setPopupInfo] = React.useState({
        open: false,
        pid: null,
        scenarioId: null
    });

    const openPopup = (pid, scenarioId) => {
        setPopupInfo({ open: true, pid, scenarioId});
    };

    const closePopup = () => {
        setPopupInfo({ open: false, pid: null, scenarioId: null });
    };

    React.useEffect(() => {
        if (dataParticipantLog?.getParticipantLog && dataSurveyResults?.getAllSurveyResults && dataTextResults?.getAllScenarioResults && dataSim?.getAllSimAlignment) {
            const participantLog = dataParticipantLog.getParticipantLog;
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const textResults = dataTextResults?.getAllScenarioResults || [];
            const simResults = dataSim.getAllSimAlignment;
            const allObjs = [];
            const allTypes = [];
            const allEvals = [];

            for (const res of participantLog) {
                const obj = {};
                const pid = res['ParticipantID']?.toString();
                obj['Participant ID'] = pid;
                obj['Participant Type'] = res['Type'];
                if (res['Type']) {
                    allTypes.push(res['Type']);
                }

                const sims = simResults.filter((x) => x.pid == pid).sort((a, b) => a.timestamp - b.timestamp);
                obj['Evaluation'] = sims[0]?.evalName;
                if (canViewProlific) {
                    obj['Prolific ID'] = res['prolificId'];
                    obj['Contact ID'] = res['contactId'];
                    if (res['prolificId']) {
                        const urlParam = obj['Evaluation'] === 'June 2025 Collaboration' || pid.startsWith('202506') ? 'caciProlific' : 'adeptQualtrix';
                        obj['Survey Link'] = `${window.location.protocol}//${window.location.host}/remote-text-survey?${urlParam}=true&PROLIFIC_PID=${res['prolificId']}&ContactID=${res['contactId']}&pid=${pid}&class=Online&startSurvey=true`;
                    }
                }
                const sim_date = new Date(sims[0]?.timestamp);
                obj['Sim Date-Time'] = sim_date != 'Invalid Date' ? `${sim_date?.getMonth() + 1}/${sim_date?.getDate()}/${sim_date?.getFullYear()} - ${sim_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Sim Count'] = res['simEntryCount'] || 0;
                obj['Sim-1'] = sims[0]?.scenario_id;
                obj['Sim-2'] = sims[1]?.scenario_id;
                obj['Sim-3'] = sims[2]?.scenario_id;
                obj['Sim-4'] = sims[3]?.scenario_id;

                const surveys = surveyResults.filter((x) => ((x.results?.pid && (x.results.pid == pid)) || (x.results?.['Participant ID Page']?.questions?.['Participant ID']?.response ?? x.results?.pid) == pid)
                    && x.results?.['Post-Scenario Measures']);
                const incompleteSurveys = surveyResults.filter((x) => ((x.results?.pid && (x.results.pid == pid)) || x.results?.['Participant ID Page']?.questions?.['Participant ID']?.response == pid));
                const lastSurvey = surveys?.slice(-1)?.[0];
                const survey_start_date = lastSurvey ? new Date(lastSurvey?.results?.startTime) : new Date(incompleteSurveys?.slice(-1)?.[0]?.results?.startTime);
                const survey_end_date = new Date(lastSurvey?.results?.timeComplete);
                obj['Del Start Date-Time'] = survey_start_date != 'Invalid Date' ? `${survey_start_date?.getMonth() + 1}/${survey_start_date?.getDate()}/${survey_start_date?.getFullYear()} - ${survey_start_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Del End Date-Time'] = survey_end_date != 'Invalid Date' ? `${survey_end_date?.getMonth() + 1}/${survey_end_date?.getDate()}/${survey_end_date?.getFullYear()} - ${survey_end_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Delegation'] = surveys.length;
                const delScenarios = lastSurvey?.results?.orderLog?.filter((x) => x.includes(' vs '));
                if (delScenarios) {
                    obj['Del-1'] = lastSurvey?.results?.[delScenarios[0]]?.scenarioIndex;
                    obj['Del-2'] = lastSurvey?.results?.[delScenarios[1]]?.scenarioIndex;
                    obj['Del-3'] = lastSurvey?.results?.[delScenarios[2]]?.scenarioIndex;
                    obj['Del-4'] = lastSurvey?.results?.[delScenarios[3]]?.scenarioIndex;
                    if (delScenarios.length > 4) {
                        obj['Del-5'] = lastSurvey?.results?.[delScenarios[4]]?.scenarioIndex;
                    }
                }
                if (obj['Delegation'] > 0) obj['Survey Link'] = null;

                obj['Evaluation'] = obj['Evaluation'] ?? lastSurvey?.evalName ?? lastSurvey?.results?.evalName;

                const scenarios = textResults.filter((x) => x.participantID == pid);
                const lastScenario = scenarios?.slice(-1)?.[0];
                const text_start_date = new Date(scenarios[0]?.startTime);
                const text_end_date = new Date(lastScenario?.timeComplete);
                obj['Text Start Date-Time'] = text_start_date != 'Invalid Date' ? `${text_start_date?.getMonth() + 1}/${text_start_date?.getDate()}/${text_start_date?.getFullYear()} - ${text_start_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Text End Date-Time'] = text_end_date != 'Invalid Date' ? `${text_end_date?.getMonth() + 1}/${text_end_date?.getDate()}/${text_end_date?.getFullYear()} - ${text_end_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Text'] = scenarios.length;

                obj['Evaluation'] = obj['Evaluation'] ?? lastScenario?.evalName;
                const completedScenarios = scenarios.map((x) => x.scenario_id);

                const textThreshold = obj['Evaluation'] === 'June 2025 Collaboration' ? 4 : 5;
                if (obj['Text'] < textThreshold) {
                    obj['Survey Link'] = null;
                }

                if (!obj['Evaluation']) {
                    // Fall back if no sim, del, or text based scenarios
                    if (pid.startsWith('202506')) {
                        obj['Evaluation'] = 'June 2025 Collaboration';
                    }
                }

                // set scenario completions using utility function
                setScenarioCompletion(obj, completedScenarios);

                if (res['Type']) {
                    allObjs.push(obj);
                }
                obj['Evaluation'] && allEvals.push(obj['Evaluation']);
            }
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            sortData();
            setTypes(Array.from(new Set(allTypes)));
            setEvals(Array.from(new Set(allEvals)));
        }
    }, [dataParticipantLog, dataSim, dataSurveyResults, dataTextResults]);

    const formatCell = (header, dataSet) => {
        const val = dataSet[header];
        const scenarioResults = dataTextResults?.getAllScenarioResults || [];

        if (selectedPhase === 'Phase 2' && /^Del-\d+$/.test(header) && val) {
          const exists = scenarioResults.some(r => r.participantID === dataSet['Participant ID']);
          if (exists && val.split('-').slice(1, -1).length === 1) { //Ensure we only render buttons for single kdma scenarios
            console.log(dataSet['Participant ID'] + " " + val);
            return (
              <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell'>
                <button
                  className="view-adm-btn"
                  onClick={() => openPopup(dataSet['Participant ID'], val)}
                >
                  {val}
                </button>
              </td>
            );
          }
        }

        const getClassName = (header, val) => {
            if (SCENARIO_HEADERS.includes(header) && isDefined(val)) {
                return 'li-green-cell';
            }
            // phase dependent
            const textThreshold = selectedPhase === 'Phase 2' ? 4 : 5;
            if ((header == 'Delegation' && val == 1) ||
                (header == 'Text' && val >= textThreshold) ||
                (header == 'Sim Count' && val == 4)) {
                return 'dk-green-cell';
            }
            return 'white-cell';
        };
        return (<td key={dataSet['Participant_ID'] + '-' + header} className={getClassName(header, val) + ' ' + (header.length < 5 ? 'small-column' : '') + ' ' + (header.length > 17 ? 'large-column' : '')}>
            {header == 'Survey Link' && val ? <button onClick={() => copyLink(val)} className='downloadBtn'>Copy Link</button> : <span>{val ?? '-'}</span>}
        </td>);
    };

    const copyLink = (linkToCopy) => {
        navigator.clipboard.writeText(linkToCopy);
    };

    const getEvalsForPhase = () => {
        return evals.filter(evaluation => {
            const isPhase2Eval = evaluation === 'June 2025 Collaboration';
            return selectedPhase === 'Phase 2' ? isPhase2Eval : !isPhase2Eval;
        });
    };

    const getTypesForPhase = () => {
        const phaseParticipants = formattedData.filter(participant => {
            const isPhase2Eval = participant['Evaluation'] === 'June 2025 Collaboration';
            return selectedPhase === 'Phase 2' ? isPhase2Eval : !isPhase2Eval;
        });

        const phaseTypes = phaseParticipants
            .map(participant => participant['Participant Type'])
            .filter(type => type);

        return Array.from(new Set(phaseTypes));
    };

    React.useEffect(() => {
        if (formattedData.length > 0) {
            const textThreshold = selectedPhase === 'Phase 2' ? 4 : 5;
            setFilteredData(formattedData.filter((x) => {
                const isPhase2Eval = x['Evaluation'] === 'June 2025 Collaboration';
                const shouldShowInPhase = selectedPhase === 'Phase 2' ? isPhase2Eval : !isPhase2Eval;

                if (!shouldShowInPhase) return false;

                const sims = [x['Sim-1'], x['Sim-2'], x['Sim-3'], x['Sim-4']];
                const didAdept = sims.filter((s) => s?.includes('MJ')).length > 0;
                const didOW = sims.filter((s) => s?.includes('open_world')).length > 0;
                return (typeFilters.length == 0 || typeFilters.includes(x['Participant Type'])) &&
                    (evalFilters.length == 0 || evalFilters.includes(x['Evaluation'])) &&
                    (!completionFilters.includes(`All Text (${textThreshold})`) || x['Text'] >= textThreshold) &&
                    (!completionFilters.includes('Missing Text') || x['Text'] < textThreshold) &&
                    (!completionFilters.includes('Delegation (1)') || x['Delegation'] >= 1) &&
                    (!completionFilters.includes('No Delegation') || x['Delegation'] == 0) &&
                    (!completionFilters.includes('All Sim (4)') || x['Sim Count'] >= 4) &&
                    (!completionFilters.includes('Any Sim') || x['Sim Count'] >= 1) &&
                    (!completionFilters.includes('Adept + OW Sim') || (didAdept && didOW)) &&
                    (!completionFilters.includes('No Sim') || x['Sim Count'] == 0) &&
                    (searchPid.length == 0 || x['Participant ID'].includes(searchPid))
            }));
        }
    }, [formattedData, typeFilters, evalFilters, completionFilters, searchPid, selectedPhase]);

    React.useEffect(() => {
        const validEvals = getEvalsForPhase();
        const validEvalFilters = evalFilters.filter(filter => validEvals.includes(filter));
        if (validEvalFilters.length !== evalFilters.length) {
            setEvalFilters(validEvalFilters);
        }

        const validTypes = getTypesForPhase();
        const validTypeFilters = typeFilters.filter(filter => validTypes.includes(filter));
        if (validTypeFilters.length !== typeFilters.length) {
            setTypeFilters(validTypeFilters);
        }
    }, [selectedPhase, evals, formattedData]);

    const getDateFromString = (s) => {
        if (s) {
            const t = 'T' + s.split(' - ')[1];
            const mdy = s.split(' - ')[0].split('/');
            const ydm = mdy[2] + '-' + mdy[0].toString().padStart(2, '0') + '-' + mdy[1].toString().padStart(2, '0');
            let date = new Date(ydm + t);
            return date == 'Invalid Date' ? -1 : date.getTime();
        }
        return -1;
    }

    const sortData = () => {
        const dataCopy = structuredClone(filteredData);
        const sortKeyMap = {
            "Participant ID": "Participant ID",
            "Text Start Time": "Text Start Date-Time",
            "Sim Count": "Sim Count",
            "Del Count": "Delegation",
            "Text Count": "Text"
        }
        dataCopy.sort((a, b) => {
            const simpleK = sortKeyMap[sortBy.split(' ').slice(0, -1).join(' ')];
            const incOrDec = sortBy.split(' ').slice(-1)[0] == '↑' ? 'i' : 'd';
            let aVal = a[simpleK];
            let bVal = b[simpleK];
            if (simpleK.includes('Date-Time')) {
                aVal = getDateFromString(aVal);
                bVal = getDateFromString(bVal);
            }
            if (incOrDec == 'i') {
                return (aVal > bVal) ? 1 : -1;
            } else {
                return (aVal < bVal) ? 1 : -1;
            }
        });
        setFilteredData(dataCopy);
    };

    React.useEffect(() => {
        if (sortBy) {
            sortData();
        }
    }, [sortBy]);

    const refreshData = async () => {
        setIsRefreshing(true);
        const resPLog = await refetchPLog();
        const resSim = await refetchSimData();
        const resSurvey = await refetchSurveyResults();
        const resText = await refetchTextResults();
        if (resPLog && resSim && resSurvey && resText) {
            sortData();
            setIsRefreshing(false);
        }
    };

    const hideColumn = (val) => {
        setColumnsToHide([...columnsToHide, val]);
    };

    const refineData = (origData) => {
        // remove unwanted headers from download
        const updatedData = structuredClone(origData);
        const currentHeaders = getHeaders();
        updatedData.map((x) => {
            for (const h of columnsToHide) {
                delete x[h];
            }
            // remove fields that aren't in the current phase's headers
            const keysToDelete = Object.keys(x).filter(key => !currentHeaders.includes(key));
            for (const key of keysToDelete) {
                delete x[key];
            }
            return x;
        });
        return updatedData;
    };

    const updatePidSearch = (event) => {
        setSearchPid(event.target.value);
    };

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorSim) return <p>Error :</p>;

    return (<>
        <h2 className='progress-header'>Participant Progress</h2>
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    options={['Phase 1', 'Phase 2']}
                    value={selectedPhase}
                    size="small"
                    style={{ width: '200px' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Phase"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setSelectedPhase(newVal || 'Phase 1')}
                />
            </div>
        </section>
        {(() => {
            const currentPhaseData = formattedData.filter((x) => {
                const isPhase2Eval = x['Evaluation'] === 'June 2025 Collaboration';
                return selectedPhase === 'Phase 2' ? isPhase2Eval : !isPhase2Eval;
            });
            return filteredData.length < currentPhaseData.length && (
                <p className='filteredText'>Showing {filteredData.length} of {currentPhaseData.length} rows based on filters</p>
            );
        })()}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={getTypesForPhase()}
                    filterSelectedOptions
                    size="small"
                    value={typeFilters}
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
                    options={getEvalsForPhase()}
                    filterSelectedOptions
                    size="small"
                    style={{ width: '400px' }}
                    value={evalFilters}
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
                    options={getCompletionOptions()}
                    filterSelectedOptions
                    size="small"
                    style={{ width: '600px' }}
                    value={completionFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Progress"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setCompletionFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={HEADERS}
                    size="small"
                    limitTags={1}
                    style={{ width: '600px' }}
                    value={columnsToHide}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Hidden Columns"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setColumnsToHide(newVal)}
                />
                <Autocomplete
                    options={sortOptions}
                    size="small"
                    style={{ width: '600px' }}
                    value={sortBy}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Sort By"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setSortBy(newVal)}
                />
                <TextField label="Search PIDs" size="small" value={searchPid} onInput={updatePidSearch}></TextField>
            </div>
            <DownloadButtons
                formattedData={refineData(formattedData.filter((x) => {
                    const isPhase2Eval = x['Evaluation'] === 'June 2025 Collaboration';
                    return selectedPhase === 'Phase 2' ? isPhase2Eval : !isPhase2Eval;
                }))}
                filteredData={refineData(filteredData)}
                HEADERS={HEADERS.filter((x) => !columnsToHide.includes(x))}  // ← Use HEADERS instead
                fileName={'Participant_Progress'}
                extraAction={refreshData}
                extraActionText={'Refresh Data'}
                isParticipantData={true}
            />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (!columnsToHide.includes(val) && <th key={'header-' + index} className={val.length < 5 ? 'small-column' : ''}>
                                {val} <button className='hide-header' onClick={() => hideColumn(val)}><VisibilityOffIcon size={'small'} /></button>
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {isRefreshing ?
                        <tr className='refreshing-row'>
                            <td colSpan={9}>
                                <div className='refreshing-td'>
                                    <Spinner animation="border" role="status" variant="dark" className='refresh-spinner' size="large" />
                                    <span className='refreshing-label'>Fetching Data...</span>
                                </div>
                            </td>
                        </tr>
                        : filteredData.map((dataSet, index) => {
                            return (<tr key={dataSet['Participant_ID'] + '-' + index}>
                                {HEADERS.map((val) => {
                                    return !columnsToHide.includes(val) && formatCell(val, dataSet);
                                })}
                            </tr>);
                        })}
                </tbody>
            </table>
        </div>
        <Modal open={popupInfo.open && selectedPhase === 'Phase 2'} onClose={closePopup}>
            <div className="adm-popup-body">
                <button className="close-popup" onClick={closePopup}>Close</button>
                <h2>ADM Loading Information</h2>
                <div className="adm-info-block">
                    <div className="adm-info-block-label">Participant ID</div>
                    <div className="adm-info-block-value">{popupInfo.pid}</div>
                </div>
                <div className="adm-info-block">
                    <div className="adm-info-block-label">Scenario ID</div>
                    <div className="adm-info-block-value">{popupInfo.scenarioId}</div>
                </div>

                {(() => {
                    const allScenarios = dataTextResults.getAllScenarioResults;
                    const doc = allScenarios.find(r => r.participantID === popupInfo.pid);
                    if (!doc) return <p>No data available.</p>;

                    const match = popupInfo.scenarioId.match(/^[^-]+-([A-Z]+)\d+-eval$/);
                    const code = match?.[1] || '';
                    const target = KDMA_MAP[code] || code.toLowerCase();

                    const entry = doc.mostLeastAligned.find(o => o.target === target);
                    const arr = entry?.response || [];
                    if (arr.length === 0) return <p>No alignments.</p>;

                    const singleArr = arr.filter(o => {
                      const key = Object.keys(o)[0];
                      const lastSeg = key.split('-').pop();
                      return !lastSeg.includes('_');
                    });

                    const useArr = singleArr.length ? singleArr : arr; //Fallback that will prevent a runtime warning if the filtered array is empty

                    const mostObj  = useArr[0];
                    const mostKey  = Object.keys(mostObj)[0];
                    const mostScore = mostObj[mostKey];

                    const leastObj  = useArr[useArr.length - 1];
                    const leastKey  = Object.keys(leastObj)[0];
                    const leastScore = leastObj[leastKey];

                    return (
                        <>
                        <div className="adm-info-block">
                            <div className="adm-info-block-label">Attribute</div>
                            <div className="adm-info-block-value">{target.replace('_', ' ')}</div>
                        </div>
                        <div className="adm-divider" />

                        <div className="aligned-section">
                            <p>
                                <strong>Most aligned:</strong> {mostKey} <em>({mostScore.toFixed(3)})</em>
                            </p>
                            <p>
                               <strong>Least aligned:</strong> {leastKey} <em>({leastScore.toFixed(3)})</em>
                            </p>
                        </div>
                        </>
                    );
                })()}
            </div>
         </Modal>
    </>);
}