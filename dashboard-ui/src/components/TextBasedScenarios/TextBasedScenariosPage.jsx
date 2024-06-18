import React, { Component } from 'react';
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core'
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

const scenarioNameToID = {
    "Adept Submarine": "MetricsEval.MD6-Submarine",
    "Adept Desert": "MetricsEval.MD5-Desert",
    "Adept Urban": "MetricsEval.MD1-Urban",
    "Adept Jungle": "MetricsEval.MD4-Jungle",
    "SoarTech Urban": "urban-1",
    "SoarTech Submarine": "submarine-1",
    "SoarTech Desert": "desert-1",
    "SoarTech Jungle": "jungle-1"
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
            scenarios: []
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
        const scenarioOrderArray = JSON.parse(scenarioOrderString);

        this.setState({
            scenarios: scenarioOrderArray,
            participantID: survey.data["Participant ID"],
            vrEnvCompleted: survey.data["vrEnvironmentsCompleted"]
        })

        const selectedScenarios = []
        for (const scenario of scenarioOrderArray) {
            if (scenario.includes("Adept")) {
                // make deep copies of json files to be sure the originals are not unintentionally tampered with
                selectedScenarios.push(JSON.parse(JSON.stringify(scenarioMappings[scenario])))
            }
        }

        let title = ""
        if (scenarioOrderArray.includes("SoarTech Desert")) {
            title = "Desert/Urban Text Scenarios"
        } else if (scenarioOrderArray.includes("SoarTech Jungle")) {
            title = "Jungle/Submarine Text Scenarios"
        }
        this.loadSurveyConfig(selectedScenarios, title !== "" ? title : "")
    }


    uploadResults = (survey) => {
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
                let index = 0;
                pageQuestions.forEach(questionName => {
                    const questionValue = survey.valuesHash[questionName];
                    this.surveyData[pageName].questions[questionName] = {
                        response: questionValue,
                        probe: survey.getPageByName(pageName).jsonObj.elements[index++].probe
                    };
                });
            }
        }

        this.surveyData.timeComplete = new Date().toString();
        this.surveyData.startTime = this.state.startTime
        this.surveyData.scenarioTitle = this.survey.title

        for (const pageName in this.surveyData) {
            const pageData = this.surveyData[pageName];

            for (const scenario of this.state.scenarios) {
                const scenarioIndex = this.state.scenarios.indexOf(scenario)
                if (pageName.includes(scenario) || Object.values(pageData).some(value => value?.toString().includes(scenario))) {
                    this.surveyDataByScenario[scenarioIndex] = this.surveyDataByScenario[scenarioIndex] || {};
                    this.surveyDataByScenario[scenarioIndex][pageName] = pageData;
                }
            }
        }

        let temp = 0
        console.log(this.surveyDataByScenario)
        for (const scenario of this.surveyDataByScenario) {
            if (scenario) {
                scenario.participantID = this.state.participantID
                scenario.vrEnvCompleted = this.state.vrEnvCompleted
                scenario.title = this.state.scenarios[temp++]
            }
        }

        // TODO ITM-467. For each of the scenarios, run through textbased scnearios and get alignment scores

        for (const scenario of this.surveyDataByScenario) {
            if (scenario) {
                this.getAlignmentScore(scenario)
            }
        }

        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
        this.shouldBlockNavigation = false
    }

    getAlignmentScore = (scenario) => {
        if (scenario.title.includes('SoarTech')) {
            this.getSoarTechAlignment(scenario)
        } else if (scenario.title.includes('Adept')) {
            this.getAdeptAlignment(scenario)
        }
    }

    submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
        for (const [fieldName, fieldValue] of Object.entries(scenario)) {
            if (typeof fieldValue !== 'object' || !fieldValue.questions) { continue }
            for (const [questionName, question] of Object.entries(fieldValue.questions)) {
                if (typeof question !== 'object') { continue }
                if (question.response && !questionName.includes("Follow Up") && question.probe && question.choice) {
                    const responseUrl = `${urlBase}/api/v1/response`
                    const responsePayload = {
                        reponse: {
                            choice: question.choice,
                            justification: "justification",
                            probe_id: question.probe,
                            scenario_id: scenarioID,
                        },
                        session_id: sessionID
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

    getAdeptAlignment = async (scenario) => {
        const adeptUrl = process.env.REACT_APP_ADEPT_URL
        const highTarget = "ADEPT-metrics_eval-alignment-target-eval-HIGH"
        const lowTarget = "ADEPT-metrics_eval-alignment-target-eval-LOW"
        const session = await axios.post(`${adeptUrl}/api/v1/new_session`)
        console.log(session)
        if (session.status == 200) {
            const sessionId = session.data
            const responses = await this.submitResponses(scenario, scenarioNameToID[scenario.title], adeptUrl, sessionId)
            scenario.highAlignmentData = await axios.get(`${adeptUrl}/api/v1/alignment/session?session_id=${sessionId}&target_id=${highTarget}&population=false`)
            scenario.lowAlignmentData = await axios.get(`${adeptUrl}/api/v1/alignment/session?session_id=${sessionId}&target_id=${lowTarget}&population=false`)
            scenario.serverSessionId = sessionId
        }
    }

    getSoarTechAlignment = (scenario) => {
        const url = process.env.REACT_APP_SOARTECH_URL
    }

    onSurveyComplete = (survey) => {
        this.uploadResults(survey);
    }

    loadSurveyConfig = (selectedScenarios, title) => {
        let config = selectedScenarios[0]

        for (const scenario of selectedScenarios.slice(1)) {
            config.pages = (config.pages).concat(scenario.pages)
        }

        config.title = title

        this.survey = new Model(config);
        this.survey.applyTheme(surveyTheme);

        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onComplete.add(this.onSurveyComplete);

        // function for uploading data
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
                                        variables: { results: this.surveyDataByScenario }
                                    });
                                    // uploads data 
                                    this.setState({ uploadData: false });
                                }}></button>
                            </div>
                        )}
                    </Mutation>
                )
                }
            </>
        )
    }
}

export default TextBasedScenariosPage;

ReactQuestionFactory.Instance.registerQuestion("adeptVitals", (props) => {
    return React.createElement(AdeptVitals, props)
})

ReactQuestionFactory.Instance.registerQuestion("stVitals", (props) => {
    return React.createElement(STVitals, props)
})