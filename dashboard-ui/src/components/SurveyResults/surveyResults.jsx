import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { VisualizationPanel, VisualizerBase } from 'survey-analytics';
import 'survey-analytics/survey.analytics.min.css';
import './surveyResults.css';
import { Model } from 'survey-core';
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { ResultsTable } from './resultsTable';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@mui/material/IconButton';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { useSelector } from 'react-redux';
import { Tabs, Tab } from 'react-bootstrap';
import { isDefined } from '../AggregateResults/DataFunctions';
import { getQuestionAnswerSets, setupVizElement } from './delResultsUtils';


const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const VIZ_PANEL_OPTIONS = {
    allowHideQuestions: false,
    defaultChartType: "bar",
    labelTruncateLength: -1,
    showPercentages: true,
    allowDragDrop: false,
    minWidth: "100%",
    allowSelection: false
}

export function SurveyResults() {
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'network-only' });
    const { data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [scenarioIndices, setScenarioIndices] = React.useState(null);
    const [selectedScenario, setSelectedScenario] = React.useState("");
    const [resultData, setResultData] = React.useState(null);
    const [filterBySurveyVersion, setVersionOption] = React.useState(parseInt(useSelector(state => state?.configs?.currentSurveyVersion)));
    const [versions, setVersions] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState(null)
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    const [generalizePages, setGeneralization] = React.useState(true);
    const surveys = useSelector((state) => state.configs.surveyConfigs);

    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    const generalizeNames = React.useCallback((resCopy) => {
        if ([4, 5].includes(filterBySurveyVersion) && generalizePages) {
            const admAuthor = resCopy.admAuthor.replace('TAD', 'Parallax').replace('kitware', 'Kitware');
            const formattedAlignment = resCopy.admAlignment[0].toUpperCase() + resCopy.admAlignment.slice(1);
            resCopy.v4Name = admAuthor + ' ' + formattedAlignment;
            // swap name for clean, generalized name
            resCopy.origName = resCopy.pageName;
            resCopy.pageName = resCopy.v4Name;
            // update question names for generalizing data
            if (resCopy.questions) {
                for (const q of Object.keys(resCopy.questions)) {
                    if (resCopy.pageType.includes('single')) {
                        // set up single medic page/question labels
                        const newQ = (admAuthor + ' ' + formattedAlignment + ':' + q.slice(9)).replace('::', ':');
                        resCopy.questions[newQ] = resCopy.questions[q];
                    }
                    else {
                        // set up comparison page/question labels
                        const pageADMs = resCopy.origName.split(' vs ');
                        const qADMs = q.split(':')[0].split(' vs ');
                        const newQ = (qADMs[0] === pageADMs[1] ? 'Aligned' : 'Misaligned') + ' vs ' + (qADMs[1] === pageADMs[0] ? 'Baseline' : 'Misaligned') + ':' + q.split(':')[1];
                        if (q.includes('Forced')) {
                            resCopy.questions[newQ] = { 'response': resCopy.questions[q].response === pageADMs[0] ? 'Baseline' : resCopy.questions[q].response === pageADMs[1] ? 'Aligned' : 'Misaligned' };
                        }
                        else {
                            resCopy.questions[newQ] = resCopy.questions[q];
                        }
                    }
                }
            }
        }
        else {
            resCopy.v4Name = undefined;
        }
        return resCopy;
    }, [filterBySurveyVersion, generalizePages]);

    const filterDataAndSetNames = React.useCallback(() => {
        // removes data that is not in the selected scenario and creates generalized names, if necessary
        const separatedData = {};
        for (const result of filteredData) {
            let obj = result.results ?? result;
            // filter out bad data 
            let pid = obj['Participant ID']?.questions['Participant ID']?.response ?? obj['Participant ID Page']?.questions['Participant ID']?.response ?? obj['pid'];
            if (!pid) {
                continue;
            }
            const logData = dataParticipantLog?.getParticipantLog.find(
                log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
            );
            if ((filterBySurveyVersion === 4 || filterBySurveyVersion === 5) && !logData) {
                continue;
            }
            for (const x of Object.keys(obj)) {
                const res = obj[x];
                if (String(res?.scenarioIndex) === String(selectedScenario)) {
                    let resCopy = structuredClone(res);
                    const pageNameIndex = resCopy.pageType + '_' + resCopy.pageName;
                    const generalizedIndex = resCopy.pageType + '_' + resCopy.admAuthor + '_' + resCopy.admAlignment;
                    const indexBy = (![4, 5].includes(filterBySurveyVersion) || !generalizePages) ? pageNameIndex : generalizedIndex;
                    resCopy = generalizeNames(resCopy);
                    if (Object.keys(separatedData).includes(indexBy)) {
                        separatedData[indexBy].push(resCopy);
                    } else {
                        separatedData[indexBy] = [resCopy];
                    }
                }

            }
        }
        setResultData(separatedData);
    }, [filteredData, selectedScenario, filterBySurveyVersion, generalizePages, dataParticipantLog, generalizeNames]);

    const toggleGeneralizability = (event) => {
        setGeneralization(event.target.value === 'Alignment');
    }

    const indexToScenarioName = React.useCallback((index) => {
        if (filterBySurveyVersion === 4 || filterBySurveyVersion === 5) { return index }
        const currentSurvey = Object.values(surveys).find(survey => survey.version === filterBySurveyVersion);
        const matchingPage = currentSurvey?.pages?.find(page => page.scenarioIndex === index);
        return matchingPage?.scenarioName ? matchingPage.scenarioName : `Scenario ${index}`
    }, [surveys, filterBySurveyVersion]);

    const getSurveyVersions = (data) => {
        let detectedVersions = [];
        for (const result of data.getAllSurveyResults) {
            const obj = result.results;
            if (!obj || !obj.surveyVersion) { continue; }

            const majorVersion = String(obj.surveyVersion).charAt(0)
            if (majorVersion && detectedVersions.indexOf(majorVersion) === -1) {
                detectedVersions.push(majorVersion)
            }
        }

        detectedVersions = detectedVersions.map(str => parseInt(str, 10))
        setVersions(detectedVersions);
    };

    const setupDataBySurveyVersion = React.useCallback((data, versionFilter) => {
        // only get data from selected survey version
        const filteredData = data.getAllSurveyResults.filter(result => {
            if (!result.results) { return false; }
            return versionFilter === (Math.floor(result.results.surveyVersion));
        });
        setFilteredData(filteredData);

        let scenarios = {}
        for (const result of filteredData) {
            if (!isDefined(result.results)) {
                continue;
            }
            // get all possible scenarios and name nicely
            for (const x of Object.keys(result.results)) {
                if (result.results[x]?.scenarioIndex) {
                    const scenarioIndex = String(result.results[x].scenarioIndex);
                    const scenarioName = indexToScenarioName(scenarioIndex);
                    scenarios[scenarioIndex] = scenarioName;
                }
            }
        }
        const sortedScenarios = Object.fromEntries(
            Object.entries(scenarios).sort(([, a], [, b]) => a.localeCompare(b))
        );
        setScenarioIndices(sortedScenarios);

        // reset selected scenario when survey version changes
        if (Object.keys(scenarios).length > 0) {
            setSelectedScenario("");
        }

    }, [indexToScenarioName]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    React.useEffect(() => {
        if (!data) { return; }
        getSurveyVersions(data);
    }, [data]);

    React.useEffect(() => {
        if (data && filterBySurveyVersion) {
            setupDataBySurveyVersion(data, filterBySurveyVersion);
        }
    }, [filterBySurveyVersion, data, setupDataBySurveyVersion]);

    React.useEffect(() => {
        if (filteredData) {
            filterDataAndSetNames();
        }
    }, [selectedScenario, filterBySurveyVersion, filteredData, generalizePages, dataParticipantLog, filterDataAndSetNames]);

    React.useEffect(() => {
        // component did mount
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            // component will unmount
            window.removeEventListener('scroll', toggleVisibility);
        }
    }, []);

    return <>
        <div className='survey-results-content'>
            {loading && <p>Loading</p>}
            {error && <p>Error</p>}

            {data?.getAllSurveyResults && dataParticipantLog?.getParticipantLog &&
                <ResultsTable data={data?.getAllSurveyResults} pLog={dataParticipantLog?.getParticipantLog} />
            }

            {showScrollButton && (
                <IconButton onClick={(e) => {
                    e.stopPropagation()
                    scrollToTop()
                }} style={{
                    position: 'fixed',
                    left: '20px',
                    bottom: '20px',
                    borderRadius: '10px',
                    backgroundColor: '#592610',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0px 2px 10px rgba(0,0,0,0.3)'
                }}>
                    Back To Top <ArrowUpwardIcon fontSize='large' />
                </IconButton>
            )}
        </div>
    </>;
}

function SingleGraph({ data, version }) {
    const [survey, setSurvey] = React.useState(null);
    const [vizPanel, setVizPanel] = React.useState(null);
    const [pageName, setPageName] = React.useState('Unknown Set');
    const [surveyResults, setSurveyResults] = React.useState([]);
    const surveys = useSelector((state) => state.configs.surveyConfigs);

    React.useEffect(() => {
        if (survey && surveyResults.length > 0) {
            setVizOptions(survey, surveyResults);
        }
    }, [survey, surveyResults]);

    React.useEffect(() => {
        if (vizPanel) {
            setupVizElement(vizPanel, pageName);
        }
    }, [vizPanel, pageName]);

    const cleanupData = (data, version, surveys) => {
        setPageName(data[0].pageName + ": Survey Results");
        let surveyJson = [];
        // run data through function to shorten/cleanup questions and answers
        if (data[0].v4Name) {
            surveyJson = getQuestionAnswerSets(data[0].origName, surveys['delegation_v' + version.toString().slice(0) + '.0'], data[0].v4Name);
            setPageName((data[0].v4Name + ": Survey Results").replace('vs aligned vs misaligned', 'vs Aligned vs Misaligned'));
        }
        else {
            surveyJson = getQuestionAnswerSets(data[0].pageName, surveys['delegation_v' + version.toString().slice(0) + '.0']);
        }
        // more question shortening for better user experience
        const curResults = data.map(entry => {
            const entryResults = {};
            for (const q of Object.keys(entry.questions)) {
                entryResults[q] = entry.questions[q].response?.includes("to delegate")
                    ? entry.questions[q].response.substr(15)
                    : entry.questions[q].response;
            }
            return entryResults;
        });

        setSurveyResults(curResults);
        setSurvey(new Model(surveyJson));
    }

    React.useEffect(() => {
        if (data.length > 0) {
            cleanupData(data, version, surveys);
        }
    }, [data, version, surveys]);

    const setVizOptions = (survey, surveyResults) => {
        const newVizPanel = new VisualizationPanel(
            survey.getAllQuestions(),
            surveyResults,
            VIZ_PANEL_OPTIONS
        );
        newVizPanel.showToolbar = false;
        VisualizerBase.customColors = ["green", "lightgreen", "lightblue", "orange", "red"];
        setVizPanel(newVizPanel);
    };

    return (
        <div>
            <h3 className="page-name">
                {pageName.split(':')[0].slice(-3) === 'vs '
                    ? pageName.replace(' vs :', ':')
                    : pageName.replace('vs  vs', 'vs')}
            </h3>
            <div id={"viz_" + pageName} />
        </div>
    );
}

function ScenarioGroup({ scenario, scenarioIndices, data, version }) {
    // creates and organizes all the graphs for one scenario
    const [singles, setSingles] = React.useState([]);
    const [comparisons, setComparisons] = React.useState([]);

    React.useEffect(() => {
        if (data) {
            const singleData = [];
            const comparisonData = [];
            for (const k of Object.keys(data)) {
                if (k.includes('singleMedic')) {
                    singleData.push(data[k]);
                }
                else if (k.includes('comparison')) {
                    comparisonData.push(data[k]);
                }
            }
            setSingles([...singleData]);
            setComparisons([...comparisonData]);
        }
    }, [data]);

    return (<div className='scenario-group'>
        <h2 className='scenario-header'>{scenarioIndices[String(scenario)]}</h2>
        <div className='singletons'>
            {singles?.map((singleton) => (
                <div className="graph-container" key={singleton[0].pageName}>
                    <SingleGraph data={singleton} version={version} />
                </div>
            ))}
            {comparisons?.map((comparison) => (
                <div className="graph-container" key={comparison[0].pageName}>
                    <SingleGraph data={comparison} version={version} />
                </div>
            ))}
        </div>
    </div>);
}


