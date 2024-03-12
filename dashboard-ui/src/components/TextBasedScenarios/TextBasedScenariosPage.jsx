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
import surveyTheme from './surveyTheme.json';
import { Button } from 'react-bootstrap'
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { AdeptVitals } from './adeptTemplate'
import { STVitals } from './stTemplate'

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: JSON) {
        uploadScenarioResults(results: $results)
    }`

class TextBasedScenariosPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            currentConfig: null,
            uploadData: false,
            startTime: null,
        };

        this.surveyData = {};
        this.survey = null;
        this.pageStartTimes = {};
        this.uploadButtonRef = React.createRef();
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

                pageQuestions.forEach(questionName => {
                    let questionValue;
                    questionValue = survey.valuesHash[questionName];
                    this.surveyData[pageName].questions[questionName] = {
                        response: questionValue
                    };
                });
            }
        }

        this.surveyData.timeComplete = new Date().toString();
        this.surveyData.startTime = this.state.startTime
        this.surveyData.scenarioTitle = this.survey.title

        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    onSurveyComplete = (survey) => {
        this.uploadResults(survey);
    }

    loadSurveyConfig = (config) => {
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

    exitSurveyConfirmation = () => {
        const isConfirmed = window.confirm('Are you sure you want to exit the scenario?');
        if (isConfirmed) {
            this.setState({ currentConfig: null });
        }
    }

    renderScenarioButtons() {
        const scenarios = [
            { label: "Adept Urban", config: adeptUrbanConfig },
            { label: "Adept Submarine", config: adeptSubConfig },
            { label: "Adept Desert", config: adeptDesertConfig },
            { label: "Adept Jungle", config: adeptJungleConfig },
            { label: "SoarTech Urban", config: stUrbanConfig },
            { label: "SoarTech Submarine", config: stSubConfig },
            { label: "SoarTech Desert", config: stDesertConfig },
            { label: "SoarTech Jungle", config: stJungleConfig }
        ];

        return scenarios.map((scenario, index) => (
            <Button variant="outline-light" style={{ backgroundColor: "#b15e2f" }} className="my-1 mx-2" key={scenario.label} onClick={() => this.loadSurveyConfig(scenario.config)}>
                {scenario.label}
            </Button>
        ));
    }

    render() {
        const adeptScenarios = this.renderScenarioButtons().filter(button => button.props.children.includes('Adept'));
        const soarTechScenarios = this.renderScenarioButtons().filter(button => button.props.children.includes('SoarTech'));

        return (
            <>
                {!this.state.currentConfig && (
                    <div style={{ textAlign: 'center' }}>
                        <h1>Choose a Scenario</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {adeptScenarios}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {soarTechScenarios}
                            </div>
                        </div>
                    </div>
                )}
                {this.state.currentConfig && (
                    <>
                        <div style={{ position: 'absolute', top: '70px', right: '10px', padding: '10px' }}>
                            <Button variant="outline-light" style={{ backgroundColor: "#b15e2f" }} onClick={this.exitSurveyConfirmation}>
                                Exit Scenario
                            </Button>
                        </div>
                        <Survey model={this.state.currentConfig} />
                    </>
                )}
                {this.state.uploadData && (
                    <Mutation mutation={UPLOAD_SCENARIO_RESULTS}>
                        {(uploadSurveyResults, { data }) => (
                            <div>
                                <button ref={this.uploadButtonRef} onClick={(e) => {
                                    e.preventDefault();
                                    uploadSurveyResults({
                                        variables: { results: this.surveyData }
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