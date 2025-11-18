import React, { useCallback } from "react";
import '../SurveyResults/resultsTable.css';
import '../../css/admInfo.css';
import { Autocomplete, TextField, Modal, Box, Snackbar, Alert } from "@mui/material";
import { useMutation, useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { DownloadButtons } from "../Research/tables/download-buttons";
import { isDefined } from "../AggregateResults/DataFunctions";
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { Spinner } from 'react-bootstrap';
import { setScenarioCompletion, SCENARIO_HEADERS } from "./progressUtils";
import DeleteIcon from '@material-ui/icons/Delete';
import { accountsClient } from "../../services/accountsService";
import AdmInfoModal from "./admInfoModal";

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

const DELETE_PID_DATA = gql`
    mutation deleteDataByPID($caller: JSON!, $pid: String!) {
        deleteDataByPID(caller: $caller, pid: $pid) 
    }
`;

const HEADERS_PHASE1_NO_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];
const HEADERS_PHASE1_WITH_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];

const HEADERS_PHASE2_NO_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Del-5', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3', 'PS-AF1', 'PS-AF2'];
const HEADERS_PHASE2_WITH_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Del-5', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3', 'PS-AF1', 'PS-AF2'];

const HEADERS_UK_NO_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ5', 'VOL2'];
const HEADERS_UK_WITH_PROLIFIC = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ5', 'VOL2'];


function formatLoading(val) {
    if (val === 'exemption') return 'Exemption';
    if (val === 'most aligned' || val === 'least aligned') return 'Normal';
    return val;
}

export function ParticipantProgressTable({ canViewProlific = false, isAdmin = false, currentUser = null }) {
    const KDMA_MAP = { AF: 'affiliation', MF: 'merit', PS: 'personal_safety', SS: 'search', MJ: 'Moral judgement', IO: 'Ingroup Bias', vol: 'PerceivedQuantityOfLivesSaved' };
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog, refetch: refetchPLog } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults, refetch: refetchSurveyResults } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults, refetch: refetchTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingSim, error: errorSim, data: dataSim, refetch: refetchSimData } = useQuery(GET_SIM_DATA);
    const [formattedData, setFormattedData] = React.useState([]);
    const [, setTypes] = React.useState([]);
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
    const [selectedPhase, setSelectedPhase] = React.useState('UK Phase 1');
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = React.useState(false);
    const [rowToDelete, setRowToDelete] = React.useState({});
    const [deleteInput, setDeleteInput] = React.useState('');
    const [deleteResultMessage, setDeleteResultMessage] = React.useState('');
    const [deleteUser] = useMutation(DELETE_PID_DATA);

    const getHeaders = () => {
        let headers = [];
        if (selectedPhase === 'Phase 2') {
            headers = canViewProlific ? [...HEADERS_PHASE2_WITH_PROLIFIC] : [...HEADERS_PHASE2_NO_PROLIFIC];
        }
        else if (selectedPhase === 'UK Phase 1') {
            headers = canViewProlific ? [...HEADERS_UK_WITH_PROLIFIC] : [...HEADERS_UK_NO_PROLIFIC];
        }
        else {
            headers = canViewProlific ? [...HEADERS_PHASE1_WITH_PROLIFIC] : [...HEADERS_PHASE1_NO_PROLIFIC];
        }
        if (isAdmin) {
            headers.splice(3, 0, "Delete");
        }
        return headers;
    };

    const HEADERS = [...getHeaders()];

    const getCompletionOptions = () => {
        const textThreshold = selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1' ? 4 : 5;
        const delThreshold = selectedPhase === 'Phase 2' ? 5 : selectedPhase === 'UK Phase 1' ? 3 : 4;
        const baseOptions = [`All Text (${textThreshold})`, 'Missing Text', `Delegation (${delThreshold})`, 'No Delegation', 'All Sim (4)', 'Any Sim', 'No Sim'];

        if (selectedPhase === 'Phase 1') {
            // phase 1 option
            baseOptions.splice(-1, 0, 'Adept + OW Sim');
        }

        return baseOptions;
    };

    const getParticipantPhase = (participant) => {
        const evalNumber = participant['_evalNumber'];
        if (evalNumber === 12) {
            return 'UK1';
        }
        return participant['_phase'] || 1;
    };

    const [popupInfo, setPopupInfo] = React.useState({
        open: false,
        pid: null,
        scenarioId: null
    });

    const openPopup = (pid, scenarioId) => {
        setPopupInfo({ open: true, pid, scenarioId });
    };

    const closePopup = () => {
        setPopupInfo({ open: false, pid: null, scenarioId: null });
    };

    const cancelDeletion = () => {
        setDeleteConfirmationOpen(false);
    };

    const updateDeleteInput = (e) => {
        setDeleteInput(e.target.value);
    };

    const closeSnackbar = () => {
        setDeleteResultMessage('');
    }

    const activateDelete = async () => {
        if (!isData24HoursOld(rowToDelete)) {
            setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was not deleted. Data is not old enough.`);
            setDeleteConfirmationOpen(false);
            setDeleteInput('');
            await refreshData();
            return;
        }
        const tokens = await accountsClient.getTokens();
        const res = await deleteUser({
            variables: {
                pid: rowToDelete['Participant ID'],
                caller: { user: currentUser, tokens: tokens }
            }
        });
        if (!res.data?.deleteDataByPID) {
            setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was not deleted.`);
        }
        else {
            let wasDeleted = true;
            for (const k of Object.keys(res.data.deleteDataByPID)) {
                if (!res.data.deleteDataByPID[k].ok) {
                    wasDeleted = false;
                    setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was not deleted.`);
                    break;
                }
            }
            if (wasDeleted) {
                setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was deleted.`)
            }
        }
        setDeleteConfirmationOpen(false);
        setDeleteInput('');
        await refreshData();
    };

    const isData24HoursOld = (row) => {
        const oldEnough = (milliseconds) => {
            // del or text end time does not exist and had not been started, so we ignore
            if (isNaN(milliseconds)) {
                return true;
            }
            return (milliseconds / (1000 * 60 * 60)) >= 24;
        };

        const now = new Date();
        const participantCreation = row['Participant Creation Date-Time'];
        if (isDefined(participantCreation)) {
            const timeSincePID = now - new Date(participantCreation);
            if (!oldEnough(timeSincePID)) {
                return false;
            }
        }
        // check if it was started, unfinished, and not yet 24 hours old (if text or survey is 24 hours old, it's probably not real data and can be deleted)
        const delInProgress = isDefined(row['Del Start Date-Time']) && !isDefined(row['Del End Date-Time']) && !oldEnough(now - row['Unformatted Delegation Start']);
        const textInProgress = isDefined(row['Text Start Date-Time']) && !isDefined(row['Text End Date-Time']) && !oldEnough(now - row['Unformatted Text Start']);
        if (delInProgress || textInProgress) {
            return false;
        }
        const delEnd = row['Unformatted Delegation End'];
        const textEnd = row['Unformatted Text End'];
        const timeSinceDel = now - delEnd;
        const timeSinceText = now - textEnd;
        return oldEnough(timeSinceDel) && oldEnough(timeSinceText);

    };

    const sortData = React.useCallback((data) => {
        if (typeof sortBy !== 'string' || !sortBy) return;
        const dataCopy = structuredClone(data);
        const sortKeyMap = {
            "Participant ID": "Participant ID",
            "Text Start Time": "Text Start Date-Time",
            "Sim Count": "Sim Count",
            "Del Count": "Delegation",
            "Text Count": "Text"
        }
        dataCopy.sort((a, b) => {
            const simpleK = sortKeyMap[sortBy.split(' ').slice(0, -1).join(' ')];
            const incOrDec = sortBy.split(' ').slice(-1)[0] === '↑' ? 'i' : 'd';
            let aVal = a[simpleK];
            let bVal = b[simpleK];
            if (simpleK.includes('Date-Time')) {
                aVal = getDateFromString(aVal);
                bVal = getDateFromString(bVal);
            }
            if (incOrDec === 'i') {
                return (aVal > bVal) ? 1 : -1;
            } else {
                return (aVal < bVal) ? 1 : -1;
            }
        });
        setFilteredData(dataCopy);
    }, [sortBy]);

    const findPagesV10 = (survey) => {
        if (!survey?.results?.orderLog) {
            return [];
        }

        const uniquePageKeys = [];
        const seenIndices = new Set();

        for (const pageName of survey.results.orderLog) {
            if (pageName.includes('Medic') && !pageName.includes('vs.')) {
                const scenarioIndex = survey.results[pageName]?.scenarioIndex;

                if (scenarioIndex && !seenIndices.has(scenarioIndex)) {
                    seenIndices.add(scenarioIndex);
                    uniquePageKeys.push(pageName);
                }
            }
        }

        return uniquePageKeys;
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
                obj['Participant Creation Date-Time'] = res['timeCreated'];
                if (res['Type']) {
                    allTypes.push(res['Type']);
                }

                const sims = simResults.filter((x) => x.pid === pid).sort((a, b) => a.timestamp - b.timestamp);

                let evalNumber = null;

                if (sims[0]?.evalNumber) {
                    evalNumber = sims[0].evalNumber;
                }

                obj['Evaluation'] = sims[0]?.evalName;

                if (canViewProlific) {
                    obj['Prolific ID'] = res['prolificId'];
                    obj['Contact ID'] = res['contactId'];
                    if (res['prolificId']) {
                        const urlParam = evalNumber >= 8 || pid.startsWith('202506') ? 'caciProlific' : 'adeptQualtrix';
                        obj['Survey Link'] = `${window.location.protocol}//${window.location.host}/remote-text-survey?${urlParam}=true&PROLIFIC_PID=${res['prolificId']}&ContactID=${res['contactId']}&pid=${pid}&class=Online&startSurvey=true`;
                    }
                }
                const sim_date = new Date(sims[0]?.timestamp);
                obj['Sim Date-Time'] = String(sim_date) !== 'Invalid Date' ? `${sim_date?.getMonth() + 1}/${sim_date?.getDate()}/${sim_date?.getFullYear()} - ${sim_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Sim Count'] = res['simEntryCount'] || 0;
                obj['Sim-1'] = sims[0]?.scenario_id;
                obj['Sim-2'] = sims[1]?.scenario_id;
                obj['Sim-3'] = sims[2]?.scenario_id;
                obj['Sim-4'] = sims[3]?.scenario_id;

                const surveys = surveyResults.filter((x) => ((x.results?.pid && (x.results.pid === pid)) || (x.results?.['Participant ID Page']?.questions?.['Participant ID']?.response ?? x.results?.pid) === pid)
                    && x.results?.['Post-Scenario Measures']);
                const incompleteSurveys = surveyResults.filter((x) => ((x.results?.pid && (x.results.pid === pid)) || x.results?.['Participant ID Page']?.questions?.['Participant ID']?.response === pid));
                const lastSurvey = surveys?.slice(-1)?.[0];
                const lastIncompleteSurvey = incompleteSurveys?.slice(-1)?.[0];
                const surveyToUse = lastSurvey || lastIncompleteSurvey;
                const survey_start_date = new Date(surveyToUse?.results?.startTime);
                const survey_end_date = new Date(lastSurvey?.results?.timeComplete);
                obj['Unformatted Delegation Start'] = survey_start_date;
                obj['Unformatted Delegation End'] = survey_end_date;
                obj['Del Start Date-Time'] = String(survey_start_date) !== 'Invalid Date' ? `${survey_start_date?.getMonth() + 1}/${survey_start_date?.getDate()}/${survey_start_date?.getFullYear()} - ${survey_start_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Del End Date-Time'] = String(survey_end_date) !== 'Invalid Date' ? `${survey_end_date?.getMonth() + 1}/${survey_end_date?.getDate()}/${survey_end_date?.getFullYear()} - ${survey_end_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                const delScenarios = surveyToUse?.results?.evalNumber < 10 ? surveyToUse?.results?.orderLog?.filter((x) => x.includes(' vs ')) : findPagesV10(surveyToUse);
                if (delScenarios) {
                    obj['Del-1'] = surveyToUse?.results?.[delScenarios[0]]?.scenarioIndex;
                    obj['Del-2'] = surveyToUse?.results?.[delScenarios[1]]?.scenarioIndex;
                    obj['Del-3'] = surveyToUse?.results?.[delScenarios[2]]?.scenarioIndex;
                    obj['Del-4'] = surveyToUse?.results?.[delScenarios[3]]?.scenarioIndex;
                    if (delScenarios.length > 4) {
                        obj['Del-5'] = surveyToUse?.results?.[delScenarios[4]]?.scenarioIndex;
                    }
                }
                if (obj['Delegation'] > 0) obj['Survey Link'] = null;

                const delKeys = ['Del-1', 'Del-2', 'Del-3', 'Del-4', 'Del-5'];
                obj['Delegation'] = delKeys.filter(key => !!obj[key]).length;

                if (!evalNumber && lastSurvey) {
                    evalNumber = lastSurvey.evalNumber ?? lastSurvey.results?.evalNumber;
                }

                obj['Evaluation'] = obj['Evaluation'] ?? lastSurvey?.evalName ?? lastSurvey?.results?.evalName;

                const scenarios = textResults.filter((x) => x.participantID === pid);
                const lastScenario = scenarios?.slice(-1)?.[0];
                const text_start_date = new Date(scenarios[0]?.startTime);
                const text_end_date = new Date(lastScenario?.timeComplete);
                obj['Unformatted Text Start'] = text_start_date;
                obj['Unformatted Text End'] = text_end_date;
                obj['Text Start Date-Time'] = String(text_start_date) !== 'Invalid Date' ? `${text_start_date?.getMonth() + 1}/${text_start_date?.getDate()}/${text_start_date?.getFullYear()} - ${text_start_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Text End Date-Time'] = String(text_end_date) !== 'Invalid Date' ? `${text_end_date?.getMonth() + 1}/${text_end_date?.getDate()}/${text_end_date?.getFullYear()} - ${text_end_date?.toLocaleTimeString('en-US', { hour12: false })}` : undefined;
                obj['Text'] = scenarios.length;

                if (!evalNumber && lastScenario?.evalNumber) {
                    evalNumber = lastScenario.evalNumber;
                }

                obj['Evaluation'] = (obj['Evaluation'] ?? lastScenario?.evalName)?.replace(/Phase 2\s*/g, '');
                const completedScenarios = scenarios.map((x) => x.scenario_id);

                const isPhase2 = evalNumber >= 8;

                obj['_phase'] = isPhase2 ? 2 : 1;
                obj['_evalNumber'] = evalNumber;

                const textThreshold = isPhase2 ? 4 : 5;
                if (obj['Text'] < textThreshold) {
                    obj['Survey Link'] = null;
                }

                if (!evalNumber) {
                    if (pid > 202506100) {
                        obj['_phase'] = 2;
                        obj['_evalNumber'] = 8;
                    } else {
                        obj['_phase'] = 1;
                        obj['_evalNumber'] = 1;
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
            setTypes(Array.from(new Set(allTypes)));
            setEvals(Array.from(new Set(allEvals)));
        }
    }, [dataParticipantLog, dataSim, dataSurveyResults, dataTextResults, canViewProlific, sortData]);

    const confirmDeletion = async (toDelete) => {
        setRowToDelete(toDelete);
        setDeleteConfirmationOpen(true);
    };

    const formatCell = (header, dataSet) => {
        if (header === 'Delete') {
            if (isData24HoursOld(dataSet)) {
                return <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell delete-column'>
                    <button className="delete-btn" onClick={() => confirmDeletion(dataSet)}>
                        <DeleteIcon />
                    </button>
                </td>
            }
            else return <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell delete-column'>-</td>
        }
        const val = dataSet[header];
        const scenarioResults = dataTextResults?.getAllScenarioResults || [];

        if ((selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1') && /^Del-\d+$/.test(header) && val && dataSet['Delegation'] > 0) {
            const exists = scenarioResults.some(r => r.participantID === dataSet['Participant ID']);
            if (exists) {
                return (
                    <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell'>
                        {dataSet['_evalNumber'] !== 10 ? <button
                            className="view-adm-btn"
                            onClick={() => openPopup(dataSet['Participant ID'], val)}
                        >
                            {val}
                        </button> :
                            <p>{val}</p>
                        }
                    </td>
                );
            }
        }

        const getClassName = (header, val, dataSet) => {
            if (SCENARIO_HEADERS.includes(header) && isDefined(val)) {
                return 'li-green-cell';
            }
            const isPH2OrUK = selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1';
            const isUK = selectedPhase === 'UK Phase 1';
            const isEval13 = dataSet['_evalNumber'] === 13;

            // phase dependent
            let textThreshold;
            if (isEval13) {
                textThreshold = 12;
            } else if (isPH2OrUK) {
                textThreshold = 4;
            } else {
                textThreshold = 5;
            }

            const delThreshold = isUK ? 3 : (isPH2OrUK && dataSet['_evalNumber'] !== 10) ? 5 : 4;
            if ((header === 'Delegation' && val >= delThreshold) ||
                (header === 'Text' && val == textThreshold) ||
                (header === 'Sim Count' && (val === 4 || (isPH2OrUK && val === 2)))) {
                return 'dk-green-cell';
            }
            return 'white-cell';
        };
        return (<td key={dataSet['Participant_ID'] + '-' + header} className={getClassName(header, val, dataSet) + ' ' + (header.length < 5 ? 'small-column ' : ' ') + (header.length > 17 ? 'large-column' : '')}>
            {header === 'Survey Link' && val ? <button onClick={() => copyLink(val)} className='downloadBtn'>Copy Link</button> : <span>{val ?? '-'}</span>}
        </td>);
    };

    const copyLink = (linkToCopy) => {
        navigator.clipboard.writeText(linkToCopy);
    };

    const getEvalsForPhase = useCallback(() => {
        return evals.filter(evaluation => {
            const participant = formattedData.find(p => p['Evaluation'] === evaluation);
            if (!participant) return false;

            const participantPhase = getParticipantPhase(participant);
            return selectedPhase === (participantPhase === 'UK1' ? 'UK Phase 1' : `Phase ${participantPhase}`);
        });
    }, [evals, selectedPhase, formattedData]);

    const getTypesForPhase = useCallback(() => {
        const phaseParticipants = formattedData.filter(participant => {
            const participantPhase = getParticipantPhase(participant);
            return selectedPhase === (participantPhase === 'UK1' ? 'UK Phase 1' : `Phase ${participantPhase}`);
        });

        const phaseTypes = phaseParticipants
            .map(participant => participant['Participant Type'])
            .filter(type => type);

        return Array.from(new Set(phaseTypes));
    }, [formattedData, selectedPhase]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            const textThreshold = selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1' ? 4 : 5;
            const delThreshold = selectedPhase === 'Phase 2' ? 5 : selectedPhase === 'UK Phase 1' ? 3 : 4;

            setFilteredData(formattedData.filter((x) => {
                const participantPhase = getParticipantPhase(x);
                const shouldShowInPhase = selectedPhase === (participantPhase === 'UK1' ? 'UK Phase 1' : `Phase ${participantPhase}`);

                if (!shouldShowInPhase) return false;

                const sims = [x['Sim-1'], x['Sim-2'], x['Sim-3'], x['Sim-4']];
                const didAdept = sims.filter((s) => s?.includes('MJ')).length > 0;
                const didOW = sims.filter((s) => s?.includes('open_world')).length > 0;
                return (typeFilters.length === 0 || typeFilters.includes(x['Participant Type'])) &&
                    (evalFilters.length === 0 || evalFilters.includes(x['Evaluation'])) &&
                    (!completionFilters.includes(`All Text (${textThreshold})`) || x['Text'] >= textThreshold) &&
                    (!completionFilters.includes('Missing Text') || x['Text'] < textThreshold) &&
                    (!completionFilters.includes(`Delegation (${delThreshold})`) || x['Delegation'] >= delThreshold) &&
                    (!completionFilters.includes('No Delegation') || x['Delegation'] === 0) &&
                    (!completionFilters.includes('All Sim (4)') || x['Sim Count'] >= 4) &&
                    (!completionFilters.includes('Any Sim') || x['Sim Count'] >= 1) &&
                    (!completionFilters.includes('Adept + OW Sim') || (didAdept && didOW)) &&
                    (!completionFilters.includes('No Sim') || x['Sim Count'] === 0) &&
                    (searchPid.length === 0 || x['Participant ID'].includes(searchPid))
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
    }, [selectedPhase, evals, formattedData, evalFilters, getEvalsForPhase, getTypesForPhase, typeFilters]);

    const getDateFromString = (s) => {
        if (s) {
            const t = 'T' + s.split(' - ')[1];
            const mdy = s.split(' - ')[0].split('/');
            const ydm = mdy[2] + '-' + mdy[0].toString().padStart(2, '0') + '-' + mdy[1].toString().padStart(2, '0');
            let date = new Date(ydm + t);
            return (isNaN(date.getTime()) || String(date) === 'Invalid Date') ? -1 : date.getTime();
        }
        return -1;
    }

    React.useEffect(() => {
        if (sortBy && filteredData.length > 0) {
            sortData(filteredData);
        }
    }, [sortBy, sortData, filteredData.length]);

    const refreshData = async () => {
        setIsRefreshing(true);
        const resPLog = await refetchPLog();
        const resSim = await refetchSimData();
        const resSurvey = await refetchSurveyResults();
        const resText = await refetchTextResults();
        if (resPLog && resSim && resSurvey && resText) {
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
            delete x['_phase'];
            // remove fields that aren't in the current phase's headers
            const keysToDelete = Object.keys(x).filter(key =>
                !currentHeaders.includes(key) && key !== '_evalNumber'
            );
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
                    options={['Phase 1', 'Phase 2', 'UK Phase 1']}
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
                const participantPhase = getParticipantPhase(x);
                return selectedPhase === (participantPhase === 'UK1' ? 'UK Phase 1' : `Phase ${participantPhase}`);
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
                    const participantPhase = getParticipantPhase(x);
                    return selectedPhase === (participantPhase === 'UK1' ? 'UK Phase 1' : `Phase ${participantPhase}`);
                }))}
                filteredData={refineData(filteredData)}
                HEADERS={HEADERS.filter((x) => !columnsToHide.includes(x) && x !== 'Delete')}
                fileName={'Participant_Progress'}
                extraAction={refreshData}
                extraActionText={'Refresh Data'}
                isParticipantData={true}
                selectedPhase={selectedPhase}
            />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (!columnsToHide.includes(val) && <th key={'header-' + index} className={(val.length < 5 ? 'small-column ' : ' ') + (val === 'Delete' ? 'delete-column' : '')}>
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
        <Modal open={deleteConfirmationOpen} onClose={cancelDeletion}>
            <Box className='delete-modal-box'>
                <h2 className="deletion-header">
                    Confirm Deletion
                </h2>
                <p>All sim data, survey data, and text scenario data related to this participant will be permanently deleted.</p>
                <div className='delete-table-container'>
                    <table className='itm-table'>
                        <thead>
                            <tr>
                                {HEADERS.map((header) => {
                                    if (header !== 'Delete') {
                                        return <th key={'delete-' + header}>
                                            {header}
                                        </th>
                                    }
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {HEADERS.map((header) => {
                                    if (header !== 'Delete') {
                                        return formatCell(header, rowToDelete)
                                    }
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="type-to-delete">
                    <p>Type in the Participant ID to confirm deletion:</p>
                    <TextField className='delete-input' value={deleteInput} onInput={updateDeleteInput} />
                </div>
                <div className='delete-btn-group'>
                    <button className='downloadBtn' onClick={cancelDeletion}>Cancel</button>
                    <button className='downloadBtn' disabled={deleteInput !== rowToDelete['Participant ID']} onClick={activateDelete}>Delete Participant</button>
                </div>
            </Box>
        </Modal >
        <Snackbar open={deleteResultMessage !== ''} autoHideDuration={10000} onClose={closeSnackbar}>
            <Alert severity={deleteResultMessage.includes("not") ? "error" : "success"} onClose={closeSnackbar} variant="filled" >
                {deleteResultMessage}
            </Alert>
        </Snackbar>
        <AdmInfoModal
            open={popupInfo.open && (selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1')}
            onClose={closePopup}
            pid={popupInfo.pid}
            scenarioId={popupInfo.scenarioId}
            dataTextResults={dataTextResults}
            dataSurveyResults={dataSurveyResults}
            KDMA_MAP={KDMA_MAP}
            formatLoading={formatLoading}
        />
    </>);
}