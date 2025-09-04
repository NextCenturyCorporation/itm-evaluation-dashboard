import React, { Component } from 'react';
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui";
import introConfig from './introConfig.json'
import surveyTheme from './surveyTheme.json';
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import axios from 'axios';
import { MedicalScenario } from './medicalScenario';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Card, Container, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import alignmentIDs from './alignmentID.json';
import { withRouter } from 'react-router-dom';
import { isDefined } from '../AggregateResults/DataFunctions';
import { shuffle } from '../Survey/surveyUtils';
import { createBrowserHistory } from 'history';
import { SurveyPageWrapper } from '../Survey/survey';
import { NavigationGuard } from '../Survey/survey';
import { evalNameToNumber, scenarioIdsFromLog } from '../OnlineOnly/config';
import '../../css/scenario-page.css';
import { Phase2Text } from './phase2Text';

const history = createBrowserHistory({ forceRefresh: true });

const GET_SERVER_TIMESTAMP = gql`
  mutation GetServerTimestamp {
    getServerTimestamp
  }
`;

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`;

const GET_ALL_SCENARIO_RESULTS = gql`
    query GetAllScenarioResults {
        getAllScenarioResults
    }`;


const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const UPDATE_PARTICIPANT_LOG = gql`
    mutation updateParticipantLog($pid: String!, $updates: JSON!) {
        updateParticipantLog(pid: $pid, updates: $updates) 
    }`;


export function TextBasedScenariosPageWrapper(props) {
    const currentTextEval = useSelector(state => state.configs.currentTextEval)
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const { loading: participantLogLoading, error: participantLogError, data: participantLogData } = useQuery(GET_PARTICIPANT_LOG,
        { fetchPolicy: 'no-cache' });
    const { loading: scenarioResultsLoading, error: scenarioResultsError, data: scenarioResultsData } = useQuery(GET_ALL_SCENARIO_RESULTS);

    // server side time stamps
    const [getServerTimestamp] = useMutation(GET_SERVER_TIMESTAMP);

    if (participantLogLoading || scenarioResultsLoading) return <p>Loading...</p>;
    if (participantLogError || scenarioResultsError) return <p>Error</p>;

    return <TextBasedScenariosPage
        {...props}
        textBasedConfigs={textBasedConfigs}
        currentTextEval={currentTextEval}
        participantLogs={participantLogData}
        scenarioResults={scenarioResultsData.getAllScenarioResults}
        getServerTimestamp={getServerTimestamp}
    />;
}

class TextBasedScenariosPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentConfig: null,
            uploadData: false,
            participantID: "",
            vrEnvCompleted: [],
            startTime: null,
            scenarios: [],
            currentScenarioIndex: 0,
            sanitizedData: null,
            matchedParticipantLog: null,
            allScenariosCompleted: false,
            sim1: null,
            sim2: null,
            isUploadButtonEnabled: false,
            adeptSessionsCompleted: 0,
            combinedSessionId: '',
            adeptScenarios: [],
            uploadedScenarios: 0,
            moderated: true,
            startSurvey: true,
            updatePLog: false,
            startCount: 0,
            onlineOnly: false,
            skipText: false
        };

        this.surveyData = {};
        this.surveyDataByScenario = [];
        this.survey = null;
        this.introSurvey = new Model(introConfig);
        this.introSurvey.onComplete.add(this.introSurveyComplete)
        this.introSurvey.applyTheme(surveyTheme);
        this.pageStartTimes = {};
        this.uploadButtonRef = React.createRef();
        this.uploadButtonRefPLog = React.createRef();
        this.shouldBlockNavigation = true
    }

    duplicatePid = (pid) => {
        if (!this.props.scenarioResults || !Array.isArray(this.props.scenarioResults)) {
            return false;
        }
        return this.props.scenarioResults.some(result => result.participantID === pid);
    }

    introSurveyComplete = (survey) => {
        const enteredParticipantID = survey.data["Participant ID"];

        // Check for duplicate participant ID
        const isDuplicate = this.duplicatePid(enteredParticipantID);

        // match entered participant id to log to determine scenario order
        let matchedLog = this.props.participantLogs.getParticipantLog.find(
            log => String(log['ParticipantID']) === enteredParticipantID
        );

        let scenarios = [];

        if (matchedLog) {
            this.setState({ updatePLog: true, startCount: matchedLog['textEntryCount'] }, () => {
                if (this.uploadButtonRefPLog.current) {
                    this.uploadButtonRefPLog.current.click();
                }
            });
        }

        if (!matchedLog || isDuplicate) {
            let message = "No matching participant ID was found.";
            if (isDuplicate) {
                message = `This ${this.state.moderated ? "participant ID" : "email"} has already been used.`;
            }
            message += " Would you like to continue anyway?\n\n" +
                `Click 'OK' to continue with the current ${this.state.moderated ? "ID" : "email"}.\n` +
                `Click 'Cancel' to re-enter the ${this.state.moderated ? "participant ID" : "email"}.`;

            const userChoice = window.confirm(message);

            if (!userChoice) {
                // just reload intro survey
                if (this.state.moderated) {
                    this.introSurvey = new Model(introConfig);
                    this.introSurvey.onComplete.add(this.introSurveyComplete);
                    this.introSurvey.applyTheme(surveyTheme);
                    this.setState({ currentConfig: null }); // Force re-render
                }
                else {
                    history.push('/participantText');
                }
                return;
            } else {
                // if you want to go through with a non-matched or duplicate PID, giving default experience
                if (!matchedLog && !isDuplicate) {

                    const scenarioSet = Math.floor(Math.random() * 3) + 1;

                    matchedLog = {
                        'AF-text-scenario': scenarioSet,
                        'MF-text-scenario': scenarioSet,
                        'PS-text-scenario': scenarioSet,
                        'SS-text-scenario': scenarioSet
                    };
                }
            }
        }

        scenarios = this.scenariosFromLog(matchedLog)

        this.setState({
            scenarios,
            participantID: enteredParticipantID,
            vrEnvCompleted: survey.data["vrEnvironmentsCompleted"],
            matchedParticipantLog: matchedLog,
            currentScenarioIndex: 0
        }, () => {
            if (this.state.scenarios.length > 0) {
                this.loadNextScenario();
            }
        });
    }

    scenariosFromLog = (participantLog) => {
        const scenarioIds = scenarioIdsFromLog(participantLog, this.props.currentTextEval)
        const scenarios = Object.values(this.props.textBasedConfigs).filter(config =>
            config.scenario_id && scenarioIds.includes(config.scenario_id)
        );
        return scenarios;
    }

    loadNextScenario = async () => {
        const { scenarios, currentScenarioIndex } = this.state;
        if (currentScenarioIndex < scenarios.length) {
            const currentScenario = scenarios[currentScenarioIndex];
            this.loadSurveyConfig([currentScenario], currentScenario.title);

            this.props.getServerTimestamp().then(newStartTime => {
                this.setState({ startTime: newStartTime.data.getServerTimestamp });
            });
        } else {
            this.handleAllScenariosCompleted();
        }
    }

    handleAllScenariosCompleted = () => {
        const { matchedParticipantLog } = this.state;
        if (matchedParticipantLog) {
            this.setState({
                allScenariosCompleted: true,
                sim1: simNameMappings[matchedParticipantLog['Sim-1']],
                sim2: simNameMappings[matchedParticipantLog['Sim-2']],
            });
        } else {
            this.setState({ allScenariosCompleted: true });
        }
    }

    componentDidMount() {
        const queryParams = new URLSearchParams(window.location.search);
        const pid = queryParams.get('pid');
        const classification = queryParams.get('class');
        const adeptQualtrix = queryParams.get('adeptQualtrix');
        const caciProlific = queryParams.get('caciProlific')
        const startSurvey = queryParams.get('startSurvey');
        if (isDefined(pid)) {
            this.introSurvey.data = {
                "Participant ID": pid,
                "Military or Civilian background": classification === 'Online' ? 'Online' : classification,
                "vrEnvironmentsCompleted": ['none']
            };
            if (isDefined(adeptQualtrix) || isDefined(caciProlific)) {
                if (startSurvey === 'true') {
                    this.setState({ moderated: false, onlineOnly: true, skipText: true });
                }
                else {
                    this.setState({ moderated: false, startSurvey: true, onlineOnly: true }, () => {
                        this.introSurveyComplete(this.introSurvey);
                    });
                }
            }
            else {
                this.setState({ moderated: false, startSurvey: false }, () => {
                    this.introSurveyComplete(this.introSurvey);
                });
            }

        }
        else {
            history.push('/');
        }
    }

    resetState() {
        this.setState({
            currentConfig: null,
            uploadData: false,
            participantID: "",
            vrEnvCompleted: [],
            startTime: null,
            scenarios: [],
            currentScenarioIndex: 0,
            sanitizedData: null,
            matchedParticipantLog: null,
            allScenariosCompleted: false,
            sim1: null,
            sim2: null,
            isUploadButtonEnabled: false,
            adeptSessionsCompleted: 0,
            combinedSessionId: '',
            adeptScenarios: [],
            uploadedScenarios: 0,
            startSurvey: true,
            updatePLog: false
        });

        this.surveyData = {};
        this.surveyDataByScenario = [];
        this.survey = null;
        this.introSurvey = new Model(introConfig);
        this.introSurvey.onComplete.add(this.introSurveyComplete);
        this.introSurvey.applyTheme(surveyTheme);
        this.pageStartTimes = {};
        this.shouldBlockNavigation = true;
    }

    sanitizeKeys = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(this.sanitizeKeys);
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((acc, key) => {
                const newKey = key.replace(/\./g, '');
                acc[newKey] = this.sanitizeKeys(obj[key]);
                return acc;
            }, {});
        }
        return obj;
    };

    uploadResults = async (survey) => {
        this.timerHelper();

        const currentScenario = this.state.scenarios[this.state.currentScenarioIndex];
        const endStamp = await this.props.getServerTimestamp();
        let scenarioData = {
            scenario_id: currentScenario.scenario_id,
            participantID: this.state.participantID,
            vrEnvCompleted: this.state.vrEnvCompleted,
            title: currentScenario.title,
            timeComplete: endStamp.data.getServerTimestamp,
            startTime: this.state.startTime
        };

        const currentPages = survey.pages;

        currentPages.forEach(page => {
            const pageName = page.name;
            scenarioData[pageName] = {
                timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage || 0,
                pageName: page.name,
                questions: {}
            };

            page.questions.forEach(question => {
                const questionName = question.name;
                const questionValue = survey.data[questionName];
                scenarioData[pageName].questions[questionName] = {
                    response: questionValue,
                    question_mapping: question.jsonObj['question_mapping'] || {}
                };
            });
        });

        scenarioData.scenarioOrder = evalNameToNumber[this.props.currentTextEval] >= 8 ?
            this.state.scenarios.map(scenario => scenario.scenario_id) :
            [this.state.matchedParticipantLog['Text-1'], this.state.matchedParticipantLog['Text-2']]
        scenarioData.evalNumber = evalNameToNumber[this.props.currentTextEval]
        scenarioData.evalName = (this.props.currentTextEval).replace(/Phase 2\s*/g, '')
        await this.getAlignmentScore(scenarioData)
        const sanitizedData = this.sanitizeKeys(scenarioData);

        const scenarioId = currentScenario.scenario_id;

        this.setState({
            uploadData: true,
            sanitizedData,
            isUploadButtonEnabled: true
        }, () => {
            if (this.uploadButtonRef.current && !scenarioId.includes('adept') && !scenarioId.includes('2025')) {
                this.uploadButtonRef.current.click();
            }
        });

        // Reset data for the next scenario
        this.surveyData = {};
        this.pageStartTimes = {};
        this.shouldBlockNavigation = false;
    }

    getAlignmentScore = async (scenario) => {
        if (scenario.scenario_id.includes('adept') || scenario.scenario_id.includes('2025')) {
            const isPSAF = scenario.scenario_id.includes('PS-AF');
            const evalNum = evalNameToNumber[this.props.currentTextEval]
            // ps-af needs its own individual session
            const needsIsolatedSession = evalNum === 10 && isPSAF;

            if (needsIsolatedSession) {
                await this.processIsolatedAdeptScenario(scenario);
            } else {
                if (this.state.adeptSessionsCompleted === 0) {
                    await this.beginRunningSession(scenario);
                } else {
                    await this.continueRunningSession(scenario);
                }

                let updatedAdeptScenarios = [...this.state.adeptScenarios, scenario];

                this.setState(prevState => ({
                    adeptSessionsCompleted: prevState.adeptSessionsCompleted + 1,
                    adeptScenarios: updatedAdeptScenarios
                }), async () => {
                    /*
                    Phase 1/Jan/Dre 3 adept scenarios
                    June/July 4
                    September 3 (because PS-AF scored separately)
                    */
                    const expectedScenarios = evalNameToNumber[this.props.currentTextEval] >= 8 ?
                        (evalNum === 10 ? 3 : 4) : 3;

                    if (this.state.adeptSessionsCompleted === expectedScenarios) {
                        await this.uploadAdeptScenarios(updatedAdeptScenarios);
                    }
                });
            }
        } else {
            await this.calcScore(scenario, 'soartech');
            const kdma_data = await this.attachKdmaValue(scenario.serverSessionId, process.env.REACT_APP_SOARTECH_URL);
            scenario.kdmas = kdma_data;
        }
    }

    processIsolatedAdeptScenario = async (scenario) => {
        const sessionEndpoint = '/api/v1/new_session';
        const url = process.env.REACT_APP_ADEPT_URL;
        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === 200) {
                const sessionId = session.data;

                await this.submitResponses(scenario, scenario.scenario_id, url, sessionId);
                const mostLeastAligned = await this.mostLeastAligned(sessionId, 'adept', url, null);

                scenario.combinedSessionId = sessionId;
                scenario.mostLeastAligned = mostLeastAligned;
                scenario.kdmas = await this.attachKdmaValue(sessionId, url);

                // can upload without waiting for the others
                await this.uploadSingleScenario(scenario);
            }
        } catch (e) {
            console.error('Error creating isolated session:', e);
        }
    }

    uploadSingleScenario = async (scenario) => {
        const sanitizedData = this.sanitizeKeys(scenario);

        return new Promise(resolve => {
            this.setState({
                uploadData: true,
                sanitizedData,
                isUploadButtonEnabled: true,
            }, () => {
                if (this.uploadButtonRef.current) {
                    this.uploadButtonRef.current.click();
                }
                resolve();
            });
        });
    }

    beginRunningSession = async (scenario) => {
        const url = process.env.REACT_APP_ADEPT_URL;
        const sessionEndpoint = '/api/v1/new_session';

        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === 200) {
                const scenarioId = evalNameToNumber[this.props.currentTextEval] >= 8 ? scenario.scenario_id : adeptScenarioIdMap[scenario.scenario_id]
                this.setState({ combinedSessionId: session.data }, async () => {
                    await this.submitResponses(scenario, scenarioId, url, this.state.combinedSessionId)
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    continueRunningSession = async (scenario) => {
        const url = process.env.REACT_APP_ADEPT_URL;
        const scenarioId = evalNameToNumber[this.props.currentTextEval] >= 8 ? scenario.scenario_id : adeptScenarioIdMap[scenario.scenario_id]
        await this.submitResponses(scenario, scenarioId, url, this.state.combinedSessionId)
    }

    uploadAdeptScenarios = async (scenarios) => {
        const url = process.env.REACT_APP_ADEPT_URL;

        const combinedMostLeastAligned = await this.mostLeastAligned(this.state.combinedSessionId, 'adept', url, null)

        for (let scenario of scenarios) {
            scenario.combinedSessionId = this.state.combinedSessionId
            scenario.mostLeastAligned = combinedMostLeastAligned
            scenario.kdmas = await this.attachKdmaValue(this.state.combinedSessionId, url)
            const sanitizedData = this.sanitizeKeys(scenario)
            await new Promise(resolve => {
                this.setState({
                    uploadData: true,
                    sanitizedData,
                    isUploadButtonEnabled: true,
                }, () => {
                    if (this.uploadButtonRef.current) {
                        this.uploadButtonRef.current.click();
                    }
                    resolve();
                });
            });
        }
    }

    attachKdmaValue = async (sessionId, url) => {
        const endpoint = '/api/v1/computed_kdma_profile?session_id='
        try {
            const response = await axios.get(`${url}${endpoint}${sessionId}`)
            return response.data
        } catch (e) {
            console.error('Error getting kdmas: ' + e);
            return null;
        }
    }

    mostLeastAligned = async (sessionId, ta1, url, scenario) => {
        let targets = []
        const endpoint = '/api/v1/get_ordered_alignment'
        if (ta1 === 'soartech') {
            if (scenario.scenario_id.includes('qol')) {
                targets = ['QualityOfLife']
            } else {
                targets = ['PerceivedQuantityOfLivesSaved']
            }
        } else {
            targets = evalNameToNumber[this.props.currentTextEval] >= 8 ?
                ['affiliation', 'merit', 'search', 'personal_safety'] :
                ['Moral judgement', 'Ingroup Bias']
        }

        let responses = []
        try {
            for (const target of targets) {
                const response = await axios.get(`${url}${endpoint}`, {
                    params: {
                        session_id: sessionId,
                        kdma_id: target
                    }
                });

                const filteredData = response.data.filter(obj =>
                    !Object.keys(obj).some(key => key.toLowerCase().includes('-group-'))
                );

                responses.push({ 'target': target, 'response': filteredData })
            }
        } catch (err) {
            console.error(err)
        }
        return responses
    }

    submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
        for (const [, fieldValue] of Object.entries(scenario)) {
            if (typeof fieldValue !== 'object' || !fieldValue.questions) { continue }
            for (const [questionName, question] of Object.entries(fieldValue.questions)) {
                if (typeof question !== 'object') { continue }
                if (question.response && !questionName.includes("Follow Up")) {
                    const mapping = question.question_mapping[question.response]
                    const responseUrl = `${urlBase}/api/v1/response`

                    const choices = Array.isArray(mapping['choice']) ? mapping['choice'] : [mapping['choice']]
                    for (const choice of choices) {
                        const responsePayload = {
                            "response": {
                                "choice": choice,
                                "justification": "justification",
                                "probe_id": mapping['probe_id'],
                                "scenario_id": scenarioID,
                            },
                            "session_id": sessionID
                        }
                        try {
                            await axios.post(responseUrl, responsePayload)
                        } catch (err) {
                            console.log(err)
                            continue
                        }
                    }
                }
            }
        }
    }

    getAlignmentData = async (targetId, url, alignmentEndpoint, sessionId, alignmentType) => {
        const response = await axios.get(`${url}${alignmentEndpoint}`, {
            params: {
                session_id: sessionId,
                target_id: targetId,
                ...(alignmentType === 'adept' ? { population: false } : {})
            }
        });

        let result;
        if (typeof response.data === 'string') {
            result = JSON.parse(response.data.replace(/\bNaN\b/g, "null"));
        } else {
            result = response.data;
        }
        return { "target": response.config.params.target_id, "score": result.score }
    };

    calcScore = async (scenario, alignmentType) => {
        // function should now only be called on soartech scenarios because of change to ADEPT server
        if (alignmentType !== 'soartech') {
            console.error('function should only be called on alignment type soartech but was called on ' + alignmentType)
            return
        }

        const url = process.env.REACT_APP_SOARTECH_URL;
        const sessionEndpoint = '/api/v1/new_session?user_id=default_user';
        const alignmentEndpoint = '/api/v1/alignment/session';
        const scenario_id = scenario.scenario_id

        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === 201) {
                const sessionId = session.data;
                await this.submitResponses(scenario, scenario_id, url, sessionId);
                let targetArray;
                if (scenario.scenario_id.includes('qol')) {
                    targetArray = alignmentIDs.stQOL;
                } else if (scenario.scenario_id.includes('vol')) {
                    targetArray = alignmentIDs.stVOL;
                } else {
                    throw new Error('Invalid SoarTech scenario type');
                }

                scenario.alignmentData = await Promise.all(
                    targetArray.map(targetId => this.getAlignmentData(targetId, url, alignmentEndpoint, sessionId, 'soartech'))
                );

                scenario.alignmentData.sort((a, b) => b.score - a.score);
                const mostLeastAligned = await this.mostLeastAligned(sessionId, 'soartech', url, scenario)
                scenario.mostLeastAligned = mostLeastAligned
                scenario.serverSessionId = sessionId;
            }

        } catch (error) {
            console.error(`Error in ${alignmentType} alignment:`, error);
        }
    }

    onSurveyComplete = (survey) => {
        // start uploading results for this scenario 
        this.uploadResults(survey);
        // move to the next scenario 
        this.setState(prevState => ({
            currentScenarioIndex: prevState.currentScenarioIndex + 1
        }), () => {
            this.loadNextScenario();
        });
    }

    loadSurveyConfig = (scenarioConfigs, title) => {
        let config = {
            ...scenarioConfigs[0],
            pages: [...scenarioConfigs[0].pages]
        };

        // randomize probe order for phase 2 (non narrative). Keep order intact for phase 1
        if (evalNameToNumber[this.props.currentTextEval] >= 8) { config.pages = shuffle([...config.pages]) }

        config.title = title;
        config.showTitle = false;
        this.survey = new Model(config);
        this.survey.applyTheme(surveyTheme);
        // override default 'complete' button so participants don't get confused
        if (this.state.currentScenarioIndex < this.state.scenarios.length - 1) {
            this.survey.css = {
                navigation: {
                    complete: "sv-btn sv-footer__next-btn"
                }
            };
            this.survey.completeText = "Next";
        }
        this.survey.focusOnFirstError = false;
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onComplete.add(this.onSurveyComplete);
        this.shouldBlockNavigation = true
        this.setState({ currentConfig: this.survey });
    };

    onAfterRenderPage = (sender, options) => {
        const pageName = options.page.name;
        const currentTime = new Date();

        if (this.survey.currentPageNo > 0) {
            const previousPageName = this.survey.pages[this.survey.currentPageNo - 1].name;
            const startTime = this.pageStartTimes[previousPageName];
            if (startTime) {
                const timeSpentInSeconds = (currentTime - startTime) / 1000;
                this.surveyData[previousPageName] = this.surveyData[previousPageName] || {};
                this.surveyData[previousPageName].timeSpentOnPage = timeSpentInSeconds;
            }
        }

        this.pageStartTimes[pageName] = currentTime;
    }

    timerHelper = () => {
        const currentPageName = this.survey.currentPage.name;
        const startTime = this.pageStartTimes[currentPageName];
        if (startTime) {
            const endTime = new Date();
            const timeSpentInSeconds = (endTime - startTime) / 1000;

            // update time spent for the current page
            this.surveyData[currentPageName] = this.surveyData[currentPageName] || {};
            this.surveyData[currentPageName].timeSpentOnPage = timeSpentInSeconds;
        }
    }

    getPageQuestions = (pageName) => {
        // returns every question on the page
        const page = this.survey.getPageByName(pageName);
        return page ? page.questions.map(question => question.name) : [];
    };

    render() {
        return (
            <>
                <NavigationGuard surveyComplete={this.state.allScenariosCompleted} />
                {!this.state.skipText && !this.state.currentConfig && (
                    <Survey model={this.introSurvey} />
                )}
                {!this.state.skipText && !this.state.moderated && !this.state.startSurvey && (
                    <div className="text-instructions">
                        <h2>Instructions</h2>
                        <p><b>Welcome to the ITM Text Scenario experiment. Thank you for your participation.</b>
                            <br />
                            During this portion of the experiment, you will be presented with several medical triage scenarios. You will be given action options from which to choose. Please consider
                            how you would act if you were placed in this scenario.
                        </p>
                        <h4>Guidelines:</h4>
                        <ul>
                            <li>Please complete the experiment in one sitting.</li>
                            <li>Choose the option that best matches how you would triage the scenario.</li>
                            <li>Read all details to clearly understand each question before responding.</li>
                            <li>Do not close the browser until you reach the "Thank You" page at the end.</li>
                            <li>The upload page may take a few minutes to complete. Please be patient while the spinner is spinning and do not exit the page.</li>
                        </ul>
                        <p className='center-text'>Press "Start" to begin.</p>
                        <button onClick={() => this.setState({ startSurvey: true })}>Start</button>
                    </div>
                )

                }
                {!this.state.skipText && this.state.currentConfig && !this.state.allScenariosCompleted && this.state.startSurvey && (
                    <>
                        <Survey model={this.survey} />
                    </>
                )}
                {!this.state.skipText && this.state.uploadData && (
                    <Mutation
                        mutation={UPLOAD_SCENARIO_RESULTS}
                        onCompleted={() => {
                            this.setState(prevState => ({
                                uploadedScenarios: prevState.uploadedScenarios + 1,
                            }), () => {
                                this.setState({ updatePLog: true }, () => {
                                    if (this.uploadButtonRefPLog.current) {
                                        this.uploadButtonRefPLog.current.click();
                                    }
                                });
                            });
                        }}
                    >
                        {(uploadSurveyResults, { data }) => (
                            <div style={{ display: 'none' }}>
                                <button ref={this.uploadButtonRef} disabled={!this.state.isUploadButtonEnabled} onClick={(e) => {
                                    e.preventDefault();
                                    if (this.state.isUploadButtonEnabled) {
                                        uploadSurveyResults({
                                            variables: { results: this.state.sanitizedData }
                                        })
                                    }
                                }}></button>
                            </div>
                        )}
                    </Mutation>
                )}
                {!this.state.skipText && this.state.updatePLog && (
                    <Mutation mutation={UPDATE_PARTICIPANT_LOG}>
                        {(updateParticipantLog) => (
                            <div>
                                <button ref={this.uploadButtonRefPLog} hidden onClick={(e) => {
                                    e.preventDefault();
                                    updateParticipantLog({
                                        variables: { pid: this.state.participantID, updates: { claimed: true, textEntryCount: this.state.startCount + this.state.uploadedScenarios } }
                                    });
                                    this.setState({ updatePLog: false });
                                }}></button>
                            </div>
                        )}
                    </Mutation>
                )}
                {!this.state.skipText && this.state.allScenariosCompleted && (this.state.uploadedScenarios < this.state.scenarios.length) && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                            <Spinner animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                            <p style={{ marginTop: '10px' }}>{this.state.onlineOnly ? "Please do not close your browser or press any keys. The second part of the experiment will load momentarily" : "Uploading documents, please wait..."}</p>
                        </div>
                    </div>
                )}
                {(this.state.skipText || (this.state.allScenariosCompleted && this.state.uploadedScenarios === this.state.scenarios.length)) && (
                    <ScenarioCompletionScreen
                        sim1={this.state.sim1}
                        sim2={this.state.sim2}
                        moderatorExists={this.state.moderated}
                        toDelegation={this.state.onlineOnly}
                    />
                )}
            </>
        )
    }
}

export default withRouter(TextBasedScenariosPage);

const ScenarioCompletionScreen = ({ sim1, sim2, moderatorExists, toDelegation }) => {
    const allScenarios = [...(sim1 || []), ...(sim2 || [])];
    const customColor = "#b15e2f";

    return (
        <>
            {toDelegation ?
                <SurveyPageWrapper />
                :
                <Container className="mt-5">
                    <Row className="justify-content-center">
                        <Col md={10} lg={8}>
                            <Card className="border-0 shadow">
                                <Card.Body className="text-center p-5">
                                    <h1 className="display-4 mb-4">Thank you for completing the scenarios</h1>
                                    {moderatorExists ?
                                        <>
                                            <p className="lead mb-5">Please ask the session moderator to advance the screen</p>
                                            <Card bg="light" className="p-4">
                                                <Card.Title as="h2" className="mb-4" style={{ color: customColor }}>
                                                    Participant should complete the following scenarios in VR:
                                                </Card.Title>
                                                <Card.Subtitle className="mb-3 text-muted">
                                                    Please complete the scenarios in the order listed below:
                                                </Card.Subtitle>
                                                <ListGroup variant="flush" className="border rounded">
                                                    {allScenarios.map((scenario, index) => (
                                                        <ListGroup.Item
                                                            key={index}
                                                            className="py-3 d-flex align-items-center"
                                                        >
                                                            <span className="mr-3 fs-5 fw-bold" style={{ color: customColor }}>{index + 1}.</span>
                                                            <span className="fs-5">{scenario}</span>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            </Card>
                                            <p className="mt-3 text-muted">Moderator: Press 'M' to start a new session</p>
                                        </> : <p>You may now close the browser</p>
                                    }
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>}
        </>
    );
};

ReactQuestionFactory.Instance.registerQuestion("medicalScenario", (props) => {
    return React.createElement(MedicalScenario, props)
})


ReactQuestionFactory.Instance.registerQuestion("phase2Text", (props) => {
    return React.createElement(Phase2Text, props)
})

export const simNameMappings = {
    'AD-1': ['Eval_Adept_Urban'],
    'AD-2': ['Eval_Adept_Jungle'],
    'AD-3': ['Eval-Adept_Desert'],
    'ST-1': ['stq2_ph1', 'stv2_ph1'],
    'ST-2': ['stq3_ph1', 'stv3_ph1'],
    'ST-3': ['stq4_ph1', 'stv4_ph1'],
}

/* 
    I needed to save these configs separately from the dre configs despite the fact they have the same ids.
    Using this mapping to get id that matches up with ADEPT ta1 server for server calls
*/
const adeptScenarioIdMap = {
    'phase1-adept-eval-MJ2': 'DryRunEval-MJ2-eval',
    'phase1-adept-eval-MJ4': 'DryRunEval-MJ4-eval',
    'phase1-adept-eval-MJ5': 'DryRunEval-MJ5-eval',
    'phase1-adept-train-MJ1': 'DryRunEval.MJ1',
    'phase1-adept-train-IO1': 'DryRunEval.IO1'
}
