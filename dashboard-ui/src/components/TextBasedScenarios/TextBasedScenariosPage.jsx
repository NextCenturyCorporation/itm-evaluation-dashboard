import React, { Component } from 'react';
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui";
import adeptJungleConfig from './adeptJungleConfig.json';
import adeptSubConfig from './adeptSubConfig.json';
import adeptDesertConfig from './adeptDesertConfig.json';
import adeptUrbanConfig from './adeptUrbanConfig.json';
import stUrbanConfig from './stUrbanConfig.json'
import stDesertConfig from './stDesertConfig.json'
import stJungleConfig from './stJungleConfig.json'
import stSubConfig from './stSubConfig.json'
import introConfig from './introConfig.json'
import surveyTheme from './surveyTheme.json';
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { Prompt } from 'react-router-dom'
import axios from 'axios';
import { MedicalScenario } from './medicalScenario';
import { useSelector } from 'react-redux';
import { useQuery } from '@apollo/react-hooks';
import { Card, Container, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import alignmentIDs from './alignmentID.json';
import { withRouter } from 'react-router-dom';
import { isDefined } from '../AggregateResults/DataFunctions';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory({ forceRefresh: true });

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`

const GET_ALL_SCENARIO_RESULTS = gql`
    query GetAllScenarioResults {
        getAllScenarioResults
    }
`


const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }
`

export const scenarioMappings = {
    "SoarTech Jungle": stJungleConfig,
    "SoarTech Urban": stUrbanConfig,
    "SoarTech Desert": stDesertConfig,
    "SoarTech Submarine": stSubConfig,
    "Adept Jungle": adeptJungleConfig,
    "Adept Urban": adeptUrbanConfig,
    "Adept Desert": adeptDesertConfig,
    "Adept Submarine": adeptSubConfig
}

export function TextBasedScenariosPageWrapper(props) {
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const { loading: participantLogLoading, error: participantLogError, data: participantLogData } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: scenarioResultsLoading, error: scenarioResultsError, data: scenarioResultsData } = useQuery(GET_ALL_SCENARIO_RESULTS);

    if (participantLogLoading || scenarioResultsLoading) return <p>Loading...</p>;
    if (participantLogError || scenarioResultsError) return <p>Error</p>;

    return <TextBasedScenariosPage
        {...props}
        textBasedConfigs={textBasedConfigs}
        participantLogs={participantLogData}
        scenarioResults={scenarioResultsData.getAllScenarioResults}
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
            startSurvey: true
        };

        this.surveyData = {};
        this.surveyDataByScenario = [];
        this.survey = null;
        this.introSurvey = new Model(introConfig);
        this.introSurvey.onComplete.add(this.introSurveyComplete)
        this.introSurvey.applyTheme(surveyTheme);
        this.pageStartTimes = {};
        this.uploadButtonRef = React.createRef();
        this.shouldBlockNavigation = true
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
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
            log => log['ParticipantID'] == enteredParticipantID
        );

        let scenarios = [];

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
                    matchedLog = { 'Text-1': 'AD-1', 'Text-2': 'ST-2', 'Sim-1': 'AD-2', 'Sim-2': 'ST-3' }
                }
            }
        }

        const text1Scenarios = this.scenariosFromLog(matchedLog['Text-1']);
        const text2Scenarios = this.scenariosFromLog(matchedLog['Text-2']);

        scenarios = [...text1Scenarios, ...text2Scenarios];

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

    scenariosFromLog = (entry) => {
        return dreMappings[entry].flatMap(scenarioId =>
            Object.values(this.props.textBasedConfigs).filter(config =>
                config.scenario_id === scenarioId
            )
        );
    }

    loadNextScenario = () => {
        const { scenarios, currentScenarioIndex } = this.state;
        if (currentScenarioIndex < scenarios.length) {
            const currentScenario = scenarios[currentScenarioIndex];
            const newStartTime = new Date().toString();

            this.setState({ startTime: newStartTime }, () => {
                this.loadSurveyConfig([currentScenario], currentScenario.title);
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
        document.addEventListener('keydown', this.handleKeyPress);
        const queryParams = new URLSearchParams(window.location.search);
        const pid = queryParams.get('pid');
        const classification = queryParams.get('class');
        if (isDefined(pid) && isDefined(classification)) {
            this.introSurvey.data = {
                "Participant ID": pid,
                "Military or Civilian background": classification == 'Civ' ? "Civilian Background" : "Military Background",
                "vrEnvironmentsCompleted": ['none']
            };
            this.setState({ moderated: false, startSurvey: false }, () => {
                this.introSurveyComplete(this.introSurvey);
            });
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    handleKeyPress(event) {
        if (event.key === 'M' || event.key === 'm') {
            if (this.state.allScenariosCompleted) {
                this.resetState();
            }
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
            startSurvey: true
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
        let scenarioData = {
            scenario_id: currentScenario.scenario_id,
            participantID: this.state.participantID,
            vrEnvCompleted: this.state.vrEnvCompleted,
            title: currentScenario.title,
            timeComplete: new Date().toString(),
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
                    probe: question.probe_id || '',
                    question_mapping: question.jsonObj['question_mapping'] || {}
                };
            });
        });

        scenarioData.scenarioOrder = [this.state.matchedParticipantLog['Text-1'], this.state.matchedParticipantLog['Text-2']]
        scenarioData.evalNumber = 4
        scenarioData.evalName = 'Dry Run Evaluation'
        await this.getAlignmentScore(scenarioData)
        const sanitizedData = this.sanitizeKeys(scenarioData);

        const scenarioId = currentScenario.scenario_id;

        this.setState({
            uploadData: true,
            sanitizedData,
            isUploadButtonEnabled: true
        }, () => {
            if (this.uploadButtonRef.current && !scenarioId.includes('DryRun')) {
                this.uploadButtonRef.current.click();
            }
        });

        // Reset data for the next scenario
        this.surveyData = {};
        this.pageStartTimes = {};
        this.shouldBlockNavigation = false;
    }

    getAlignmentScore = async (scenario) => {
        if (scenario.scenario_id.includes('DryRun')) {
            if (this.state.adeptSessionsCompleted === 0) {
                await this.beginRunningSession(scenario)
            } else {
                await this.continueRunningSession(scenario)
            }
            await this.calcScore(scenario, 'adept')

            let updatedAdeptScenarios = [...this.state.adeptScenarios, scenario];

            this.setState(prevState => ({
                adeptSessionsCompleted: prevState.adeptSessionsCompleted + 1,
                adeptScenarios: updatedAdeptScenarios
            }), async () => {
                if (this.state.adeptSessionsCompleted === 3) {
                    await this.uploadAdeptScenarios(updatedAdeptScenarios)
                }
            });

        } else {
            await this.calcScore(scenario, 'soartech')
            const kdma_data = await this.attachKdmaValue(scenario.serverSessionId, process.env.REACT_APP_SOARTECH_URL)
            scenario.kdmas = kdma_data
        }
    }

    beginRunningSession = async (scenario) => {
        const url = process.env.REACT_APP_ADEPT_URL;
        const sessionEndpoint = '/api/v1/new_session';

        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === 200) {
                this.setState({ combinedSessionId: session.data }, async () => {
                    await this.submitResponses(scenario, scenario.scenario_id, url, this.state.combinedSessionId)
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    continueRunningSession = async (scenario) => {
        const url = process.env.REACT_APP_ADEPT_URL;

        await this.submitResponses(scenario, scenario.scenario_id, url, this.state.combinedSessionId)
    }

    uploadAdeptScenarios = async (scenarios) => {
        const url = process.env.REACT_APP_ADEPT_URL;
        const alignmentEndpoint = '/api/v1/alignment/session'

        const alignmentData = await Promise.all(
            alignmentIDs.adeptAlignmentIDs.map(targetId => this.getAlignmentData(targetId, url, alignmentEndpoint, this.state.combinedSessionId, 'adept'))
        );
        const sortedAlignmentData = alignmentData.sort((a, b) => b.score - a.score);
        const combinedMostLeastAligned = await this.mostLeastAligned(this.state.combinedSessionId, 'adept', url, null)

        for (let scenario of scenarios) {
            scenario.combinedAlignmentData = sortedAlignmentData
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
        const response = await axios.get(`${url}${endpoint}${sessionId}`)
        console.log(response)
        return response.data
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
            targets = ['Moral judgement', 'Ingroup Bias']
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
                responses.push({ 'target': target, 'response': response.data })
            }
        } catch (err) {
            console.error(err)
        }
        return responses
    }

    submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
        for (const [fieldName, fieldValue] of Object.entries(scenario)) {
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
                            const response = await axios.post(responseUrl, responsePayload)
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
        let url, sessionEndpoint, alignmentEndpoint;

        if (alignmentType === 'adept') {
            url = process.env.REACT_APP_ADEPT_URL;
            sessionEndpoint = '/api/v1/new_session';
            alignmentEndpoint = '/api/v1/alignment/session';
        } else if (alignmentType === 'soartech') {
            url = process.env.REACT_APP_SOARTECH_URL;
            sessionEndpoint = '/api/v1/new_session?user_id=default_user';
            alignmentEndpoint = '/api/v1/alignment/session';
        } else {
            throw new Error('Invalid alignment type');
        }

        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === (alignmentType === 'adept' ? 200 : 201)) {
                const sessionId = session.data;
                await this.submitResponses(scenario, scenario.scenario_id, url, sessionId);

                if (alignmentType === 'adept') {
                    scenario.alignmentData = await Promise.all(
                        alignmentIDs.adeptAlignmentIDs.map(targetId => this.getAlignmentData(targetId, url, alignmentEndpoint, sessionId, 'adept'))
                    );
                } else if (alignmentType === 'soartech') {
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
                }

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

        config.title = title;
        config.showTitle = false;
        this.survey = new Model(config);
        this.survey.applyTheme(surveyTheme);
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
                {!this.state.currentConfig && (
                    <Survey model={this.introSurvey} />
                )}
                {!this.state.moderated && !this.state.startSurvey && (
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
                {this.state.currentConfig && !this.state.allScenariosCompleted && this.state.startSurvey && (
                    <>
                        <Survey model={this.survey} />
                        {this.shouldBlockNavigation && (
                            <Prompt
                                when={this.shouldBlockNavigation}
                                message='Please finish the survey before leaving the page. By hitting "OK", you will be leaving the scenarios before completion and will be required to start the scenarios over from the beginning.'
                            />
                        )}
                    </>
                )}
                {this.state.uploadData && (
                    <Mutation
                        mutation={UPLOAD_SCENARIO_RESULTS}
                        onCompleted={() => {
                            this.setState(prevState => ({
                                uploadedScenarios: prevState.uploadedScenarios + 1,
                            }));
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
                {this.state.allScenariosCompleted && (this.state.uploadedScenarios != this.state.scenarios.length) && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                            <Spinner animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                            <p style={{ marginTop: '10px' }}>Uploading documents, please wait...</p>
                        </div>
                    </div>
                )}
                {this.state.allScenariosCompleted && this.state.uploadedScenarios === this.state.scenarios.length && (
                    <ScenarioCompletionScreen
                        sim1={this.state.sim1}
                        sim2={this.state.sim2}
                        moderatorExists={this.state.moderated}
                    />
                )}
            </>
        )
    }
}

export default withRouter(TextBasedScenariosPage);

ReactQuestionFactory.Instance.registerQuestion("medicalScenario", (props) => {
    return React.createElement(MedicalScenario, props)
})

const dreMappings = {
    'AD-1': ['DryRunEval-MJ2-eval', 'DryRunEval.MJ1', 'DryRunEval.IO1'],
    'AD-2': ['DryRunEval-MJ4-eval', 'DryRunEval.MJ1', 'DryRunEval.IO1'],
    'AD-3': ['DryRunEval-MJ5-eval', 'DryRunEval.MJ1', 'DryRunEval.IO1'],
    'ST-1': ['qol-dre-1-eval', 'vol-dre-1-eval'],
    'ST-2': ['qol-dre-2-eval', 'vol-dre-2-eval'],
    'ST-3': ['qol-dre-3-eval', 'vol-dre-3-eval'],
}

const simNameMappings = {
    'AD-1': ['Eval_Adept_Urban'],
    'AD-2': ['Eval_Adept_Jungle'],
    'AD-3': ['Eval-Adept_Desert'],
    'ST-1': ['stq1', 'stv1'],
    'ST-2': ['stq2', 'stv2'],
    'ST-3': ['stq3', 'stv3'],
}

const ScenarioCompletionScreen = ({ sim1, sim2, moderatorExists }) => {
    const allScenarios = [...(sim1 || []), ...(sim2 || [])];
    const customColor = "#b15e2f";

    return (
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
        </Container>
    );
};