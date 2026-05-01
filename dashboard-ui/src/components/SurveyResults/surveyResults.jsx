import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import 'survey-analytics/survey.analytics.min.css';
import '../../css/surveyResults.css';
import { ResultsTable } from './resultsTable';
import IconButton from '@mui/material/IconButton';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { useSelector } from 'react-redux';
import { isDefined } from '../AggregateResults/DataFunctions';


const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_DEMO_DATA = gql`
    query GetDemographicsByEval($evalNumber: Float!) {
        getDemographicsByEval(evalNumber: $evalNumber)
    }`;


export function SurveyResults() {
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'network-only' });
    const { data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { data: dataDemo } = useQuery(GET_DEMO_DATA, { variables: { evalNumber: 16 } });
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
                <ResultsTable data={data?.getAllSurveyResults} pLog={dataParticipantLog?.getParticipantLog} demographicsData={dataDemo?.getDemographicsByEval} />
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

