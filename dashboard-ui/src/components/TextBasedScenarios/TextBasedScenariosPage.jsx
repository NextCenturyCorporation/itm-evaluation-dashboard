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
import { AdeptVitals } from './adeptTemplate'
import { STVitals } from './stTemplate'
import { Prompt } from 'react-router-dom'
import axios from 'axios';
import { MedicalScenario } from './medicalScenario';
import { useSelector } from 'react-redux';

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`

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

// wrapper makes it much easier to grab textbased configs and just pass them to existing class based component
export function TextBasedScenariosPageWrapper(props) {
    // grab configs
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);

    return <TextBasedScenariosPage 
        {...props} 
        textBasedConfigs={textBasedConfigs} 
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
            sanitizedData: null
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
    }

    introSurveyComplete = (survey) => {
        const scenarioOrderString = survey.data.scenarioOrder.replace(/\\/g, "");

        //const scenarioOrderArray = JSON.parse(scenarioOrderString);

        // pull selected scenarios from prop
        /* for multiple being concatenated onto each other. single for now
        const scenarioConfigs = scenarioOrderArray.map(scenarioName => {
            return this.props.textBasedConfigs.find(config => 
                config.name === scenarioName && config.eval === 'dre'
            );
        });
        */
        
        let scenarioConfigs = [Object.values(this.props.textBasedConfigs).find(config =>
            config.name === scenarioOrderString && config.eval === 'dre'
        )];

        this.setState({
            scenarios: [scenarioOrderString],
            participantID: survey.data["Participant ID"],
            vrEnvCompleted: survey.data["vrEnvironmentsCompleted"]
        })

        let title = ""
        this.loadSurveyConfig(scenarioConfigs, title !== "" ? title : "")
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

        for (const pageName in this.pageStartTimes) {
            if (this.pageStartTimes.hasOwnProperty(pageName)) {
                const page = this.survey.getPageByName(pageName)?.jsonObj;
                this.surveyData[pageName] = {
                    timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage,
                    pageName: page?.name,
                    questions: {}
                };

                const pageQuestions = this.getPageQuestions(pageName);
                pageQuestions.forEach((questionName, index) => {
                    const questionValue = survey.valuesHash[questionName];
                    const element = survey.getPageByName(pageName)?.jsonObj?.elements[index];
                    this.surveyData[pageName].questions[questionName] = {
                        response: questionValue,
                        probe: element?.probe_id || '',
                        question_mapping: element?.question_mapping || {}
                    };
                });
            }
        }

        this.surveyData.scenarioTitle = this.survey.title

        for (const pageName in this.surveyData) {
            const pageResponse = this.surveyData[pageName];
            for (const scenario of this.state.scenarios) {
                const scenarioIndex = this.state.scenarios.indexOf(scenario)
                const page = this.survey.getPageByName(pageName)
                if (page && scenario === page['jsonObj']['scenario_name']) {
                    this.surveyDataByScenario[scenarioIndex] = this.surveyDataByScenario[scenarioIndex] || {};
                    this.surveyDataByScenario[scenarioIndex]['scenario_id'] = page['jsonObj']['scenario_id']
                    this.surveyDataByScenario[scenarioIndex][pageName] = pageResponse;
                }
            }
        }

        let temp = 0
        for (const scenario of this.surveyDataByScenario) {
            scenario.participantID = this.state.participantID
            scenario.vrEnvCompleted = this.state.vrEnvCompleted
            scenario.title = this.state.scenarios[temp++]
            scenario.timeComplete = new Date().toString()
            scenario.startTime = this.state.startTime
        }

        const sanitizedData = this.sanitizeKeys(this.surveyDataByScenario);

        // add alignment data for each of the scenarios
        for (const scenario of sanitizedData) {
            await this.getAlignmentScore(scenario)
        }

        this.setState({ uploadData: true, sanitizedData }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
        this.shouldBlockNavigation = false
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
        this.uploadResults(survey);
    }

    loadSurveyConfig = (scenarioConfigs, title) => {
        let config = {
            ...scenarioConfigs[0],
            pages: [...scenarioConfigs[0].pages]
        };

        config.title = title;

        this.survey = new Model(config);
        this.survey.applyTheme(surveyTheme);

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
                        body {
                        zoom: 0.8;
                        -moz-transform: scale(0.8);
                        -moz-transform-origin: 0 0;
                        }
                    `}
                </style>
                {!this.state.currentConfig && (
                    <Survey model={this.introSurvey} />
                )}
                {this.state.currentConfig && (
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
                                    });
                                    this.setState({ uploadData: false });
                                }}></button>
                            </div>
                        )}
                    </Mutation>
                )}
            </>
        )
    }
}

export default TextBasedScenariosPage;

ReactQuestionFactory.Instance.registerQuestion("medicalScenario", (props) => {
    return React.createElement(MedicalScenario, props)
})

ReactQuestionFactory.Instance.registerQuestion("adeptVitals", (props) => {
    return React.createElement(AdeptVitals, props)
})

ReactQuestionFactory.Instance.registerQuestion("stVitals", (props) => {
    return React.createElement(STVitals, props)
})