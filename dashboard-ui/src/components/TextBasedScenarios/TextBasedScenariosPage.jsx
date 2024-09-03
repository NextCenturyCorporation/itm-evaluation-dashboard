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
import { Card, Container, Row, Col, ListGroup } from 'react-bootstrap';

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`

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
    const { loading, error, data } = useQuery(GET_PARTICIPANT_LOG);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error</p>;

    return <TextBasedScenariosPage
        {...props}
        textBasedConfigs={textBasedConfigs}
        participantLogs={data}
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
    }

    introSurveyComplete = (survey) => {
        const enteredParticipantID = survey.data["Participant ID"];

        // match entered participant id to log to determine scenario order
        const matchedLog = this.props.participantLogs.getParticipantLog.find(
            log => log['ParticipantID'] == enteredParticipantID
        );

        let scenarios = [];

        if (matchedLog) {
            const text1 = matchedLog['Text-1'];
            const text2 = matchedLog['Text-2'];

            const validOptions = Object.keys(dreMappings);
            if (!validOptions.includes(text1) || !validOptions.includes(text2)) {
                console.error("Invalid Text-1 or Text-2 value in matched log");
            } else {
                const text1Scenarios = this.scenariosFromLog(text1);
                const text2Scenarios = this.scenariosFromLog(text2);


                scenarios = [...text1Scenarios, ...text2Scenarios];
            }
        } else {
            console.warn("No matching participant log found for ID:", enteredParticipantID);
            const userChoice = window.confirm(
                "No matching participant ID was found. Would you like to continue anyway?\n\n" +
                "Click 'OK' to continue with the current ID.\n" +
                "Click 'Cancel' to re-enter the participant ID."
            );

            if (!userChoice) {
                // just reload intro survey
                this.introSurvey = new Model(introConfig);
                this.introSurvey.onComplete.add(this.introSurveyComplete);
                this.introSurvey.applyTheme(surveyTheme);
                this.setState({ currentConfig: null }); // Force re-render
                return;
            }
        }

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
            this.loadSurveyConfig([currentScenario], currentScenario.title);
        } else {
            console.log("All scenarios completed");
            // TODO: IMPLEMENT THE END SCREEN FOR MODERATOR
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
            console.warn("No matched participant log found to retrieve Sim-1 and Sim-2");
            this.setState({ allScenariosCompleted: true });
        }
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPress);
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
    
        for (const pageName in this.pageStartTimes) {
            if (this.pageStartTimes.hasOwnProperty(pageName)) {
                const page = survey.getPageByName(pageName)?.jsonObj;
                scenarioData[pageName] = {
                    timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage,
                    pageName: page?.name,
                    questions: {}
                };
    
                const pageQuestions = this.getPageQuestions(pageName);
                pageQuestions.forEach((questionName, index) => {
                    const questionValue = survey.valuesHash[questionName];
                    const element = survey.getPageByName(pageName)?.jsonObj?.elements[index];
                    scenarioData[pageName].questions[questionName] = {
                        response: questionValue,
                        probe: element?.probe_id || '',
                        question_mapping: element?.question_mapping || {}
                    };
                });
            }
        }
    
        const sanitizedData = this.sanitizeKeys(scenarioData);
    
        this.setState({ uploadData: true, sanitizedData }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            } else {
                console.log("Upload button ref is null");
            }
        });
        this.shouldBlockNavigation = false;
    }

    getAlignmentScore = async (scenario) => {
        if (scenario.scenario_id.includes('DryRun')) {
            await this.calcScore(scenario, 'adept')
        } else {
            await this.calcScore(scenario, 'soartech')
        }
    }

    submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
        for (const [fieldName, fieldValue] of Object.entries(scenario)) {
            if (typeof fieldValue !== 'object' || !fieldValue.questions) { continue }
            for (const [questionName, question] of Object.entries(fieldValue.questions)) {
                if (typeof question !== 'object') { continue }
                if (question.response && !questionName.includes("Follow Up")) {
                    const mapping = question.question_mapping[question.response]
                    const responseUrl = `${urlBase}/api/v1/response`
                    const responsePayload = {
                        "response": {
                            "choice": mapping['choice'],
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

    calcScore = async (scenario, alignmentType) => {
        let url, highTarget, lowTarget, sessionEndpoint, alignmentEndpoint;

        if (alignmentType === 'adept') {
            url = process.env.REACT_APP_ADEPT_URL;
            highTarget = "ADEPT-metrics_eval-alignment-target-eval-HIGH";
            lowTarget = "ADEPT-metrics_eval-alignment-target-eval-LOW";
            sessionEndpoint = '/api/v1/new_session';
            alignmentEndpoint = '/api/v1/alignment/session';
        } else if (alignmentType === 'soartech') {
            url = process.env.REACT_APP_SOARTECH_URL;
            highTarget = "79f47f55-qol-high";
            lowTarget = "15d7b3ed-qol-low";
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

                const getAlignmentData = async (targetId) => {
                    const response = await axios.get(`${url}${alignmentEndpoint}`, {
                        params: {
                            session_id: sessionId,
                            target_id: targetId,
                            ...(alignmentType === 'adept' ? { population: false } : {})
                        }
                    });
                    return response.data;
                };

                scenario.highAlignmentData = await getAlignmentData(highTarget);
                scenario.lowAlignmentData = await getAlignmentData(lowTarget);
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

        this.survey = new Model(config);
        this.survey.applyTheme(surveyTheme);
        this.survey.focusOnFirstError = false;
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onComplete.add(this.onSurveyComplete);

        this.setState({ currentConfig: this.survey });
    };

    onAfterRenderPage = (sender, options) => {
        if (!sender.isFirstPage && !this.state.firstPageCompleted) {
            this.setState({
                firstPageCompleted: true,
                startTime: new Date().toString()
            });
        }

        const pageName = options.page.name;

        if (Object.keys(this.pageStartTimes).length > 0) {
            this.timerHelper();
        }

        this.pageStartTimes[pageName] = new Date();
    }

    timerHelper = () => {
        const previousPageName = Object.keys(this.pageStartTimes).pop();
        const endTime = new Date();
        const startTime = this.pageStartTimes[previousPageName];
        const timeSpentInSeconds = (endTime - startTime) / 1000;

        // update time spent for the previous page
        this.surveyData[previousPageName] = {};
        this.surveyData[previousPageName].timeSpentOnPage = timeSpentInSeconds;
        this.surveyData[previousPageName].questions = this.getPageQuestions(previousPageName);
    }

    getPageQuestions = (pageName) => {
        // returns every question on the page
        const page = this.survey.getPageByName(pageName);
        return page ? page.questions.map(question => question.name) : [];
    };

    render() {
        return (
            <>
                <style>
                    {`
                    .main-content {
                        zoom: 0.8;
                        -moz-transform: scale(0.8);
                        -moz-transform-origin: 0 0;
                        }
                    `}
                </style>
                {!this.state.currentConfig && (
                    <Survey model={this.introSurvey} />
                )}
                {this.state.currentConfig && !this.state.allScenariosCompleted &&(
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
                    <Mutation mutation={UPLOAD_SCENARIO_RESULTS}>
                        {(uploadSurveyResults, { data }) => (
                            <div>
                                <button ref={this.uploadButtonRef} onClick={(e) => {
                                    e.preventDefault();
                                    uploadSurveyResults({
                                        variables: { results: this.state.sanitizedData }
                                    })
                                }}></button>
                            </div>
                        )}
                    </Mutation>
                )}
                {this.state.allScenariosCompleted && (
                    <ScenarioCompletionScreen
                        sim1={this.state.sim1}
                        sim2={this.state.sim2}
                    />
                )}
            </>
        )
    }
}

export default TextBasedScenariosPage;

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

const ScenarioCompletionScreen = ({ sim1, sim2 }) => {
    const allScenarios = [...(sim1 || []), ...(sim2 || [])];
    const customColor = "#b15e2f";

    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="border-0 shadow">
              <Card.Body className="text-center p-5">
                <h1 className="display-4 mb-4">Thank you for completing the scenarios</h1>
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  };