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
import { Button, Form } from 'react-bootstrap'
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { AdeptVitals } from './adeptTemplate'
import { STVitals } from './stTemplate'

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`

class TextBasedScenariosPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            currentConfig: null,
            uploadData: false,
            participantID: "",
            vrEnvCompleted: [],
            moderatorOrder: "",
            startTime: null,
            scenarios: []
        };

        this.surveyData = {};
        this.surveyDataByScenario = [];
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

        for (const scenario of this.surveyDataByScenario) {
            scenario.participantID = this.state.participantID
            scenario.vrEnvCompleted = this.state.vrEnvCompleted
        }

        console.log(this.surveyDataByScenario)

        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
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

    handleSubmit = (event) => {
        event.preventDefault()
        event.persist()

        let selectedScenarios = []
        let title = ""
        switch (this.state.moderatorOrder) {
            case "1":
                selectedScenarios = [stJungleConfig, adeptJungleConfig, adeptSubConfig, stSubConfig]
                title = "ST Jungle, AD Jungle; AD Submarine, ST Submarine"
                this.setState({ scenarios: ["SoarTech Jungle", "Adept Jungle", "Adept Submarine", "SoarTech Submarine"] })
                break;
            case "2":
                selectedScenarios = [adeptSubConfig, stSubConfig, stJungleConfig, adeptJungleConfig]
                this.setState({ scenarios: ["Adept Submarine", "SoarTech Submarine", "SoarTech Jungle", "Adept Jungle"] })
                title = "AD Submarine, ST Submarine;  ST Jungle, AD Jungle"
                break;
            case "3":
                selectedScenarios = [stDesertConfig, adeptDesertConfig, adeptUrbanConfig, stUrbanConfig]
                this.setState({ scenarios: ["SoarTech Desert", "Adept Desert", "Adept Urban", "SoarTech Urban"] })
                title = "ST Desert, AD Desert; AD Urban, ST Urban"
                break;
            case "4":
                selectedScenarios = [adeptUrbanConfig, stUrbanConfig, stDesertConfig, adeptDesertConfig]
                this.setState({ scenarios: ["Adept Urban", "SoarTech Urban", "SoarTech Desert", "Adept Desert"] })
                title = "AD Urban, ST Urban; ST Desert, AD Desert"
                break;
            default:
                console.log("invalid moderator order")
        }

        this.loadSurveyConfig(selectedScenarios, title)
    }

    onFormChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;

        this.setState({ [name]: value });
    };

    onFormMultiChange = (e) => {
        const options = e.target.options;
        let value = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                value.push(options[i].value);
            }
        }
        this.setState({ vrEnvCompleted: value })
    }

    render() {
        return (
            <>
                {!this.state.currentConfig && (
                    <Form onSubmit={this.handleSubmit} type="button" style={{ margin: '25px auto 0', maxWidth: '40%' }}>
                        <Form.Group className="mb-3" controlId="participantID">
                            <Form.Label>Enter Participant ID:</Form.Label>
                            <Form.Control type="text" name="participantID" placeholder="Participant ID" required onChange={this.onFormChange}></Form.Control>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="vrEnvironments">
                            <Form.Label>Select VR environments you have ALREADY completed (Leave blank if none)</Form.Label>
                            <Form.Control as="select" name="vrEnvCompleted" multiple onChange={this.onFormMultiChange} defaultValue={[]}>
                                <option value="sub">Submarine</option>
                                <option value="jungle">Jungle</option>
                                <option value="urban">Urban</option>
                                <option value="desert">Desert</option>
                            </Form.Control>
                            <Form.Text className="text-muted">
                                Use command/control click
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="moderatorOrder">
                            <Form.Label>Moderator enter order from participant log:</Form.Label>
                            <Form.Control as="select" name="moderatorOrder" defaultValue="" required onChange={this.onFormChange}>
                                <option value="" disabled></option>
                                <option value={1}>1 – ST Jungle, AD Jungle; AD Submarine, ST Submarine</option>
                                <option value={2}>2 – AD Submarine, ST Submarine;  ST Jungle, AD Jungle </option>
                                <option value={3}>3 – ST Desert, AD Desert; AD Urban, ST Urban</option>
                                <option value={4}>4 – AD Urban, ST Urban; ST Desert, AD Desert</option>
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-light" style={{ backgroundColor: "#b15e2f" }} type="submit">
                            Continue
                        </Button>
                    </Form>
                )}
                {this.state.currentConfig && (
                    <Survey model={this.survey} />
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