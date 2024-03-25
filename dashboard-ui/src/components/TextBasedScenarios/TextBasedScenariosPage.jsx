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
import {mapAnswers} from './util.js'

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`

const scenarioMappings = {
    "SoarTech Jungle": stJungleConfig,
    "SoarTech Urban": stUrbanConfig,
    "SoarTech Desert": stDesertConfig,
    "SoarTech Submarine": stSubConfig,
    "Adept Jungle": adeptJungleConfig,
    "Adept Urban": adeptUrbanConfig,
    "Adept Desert": adeptDesertConfig,
    "Adept Submarine": adeptSubConfig
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

        let selectedScenarios = []
        for (const scenario of scenarioOrderArray) {
            // make deep copies of json files to be sure the originals are not unintentionally tampered with
            selectedScenarios.push(JSON.parse(JSON.stringify(scenarioMappings[scenario])))
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
        for (const scenario of this.surveyDataByScenario) {
            scenario.participantID = this.state.participantID
            scenario.vrEnvCompleted = this.state.vrEnvCompleted
            scenario.title = this.state.scenarios[temp++]
            mapAnswers(scenario, scenarioMappings)
        }

        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
        this.shouldBlockNavigation = false
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

    /*mapAnswers = (scenario) => {
        // maps the user's answer to the correct naming convention for ADEPT choice id
        const scenarioConfig = scenarioMappings[scenario.title.replace(' Scenario', '')];
        Object.entries(scenario).forEach(field => {
            if (!field[1].questions) { return; }
            Object.entries(field[1].questions).forEach(question => {
                if (!question[1].probe) { return; }
                const page = scenarioConfig.pages.find((page) => page.name === field[0]);
                const pageQuestion = page.elements.find((element) => element.name === question[0]);
                const indexOfAnswer = pageQuestion.choices.indexOf(question[1].response);
                let choice;
                if (scenario.title.includes("Adept")) {
                    if (indexOfAnswer >= 0) {
                        choice = question[1].probe + '.';
                        choice += String.fromCharCode(65 + indexOfAnswer);
                    } else {
                        console.err("Error mapping user selection to choice ID");
                    }
                } else {
                    choice = "choice-"+indexOfAnswer;
                }
                question[1].choice = choice;
            })
        })
    }*/

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