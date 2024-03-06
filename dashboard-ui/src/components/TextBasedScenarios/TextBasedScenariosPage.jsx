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
            uploadData: false
        };

        this.surveyData = {}
        this.uploadButtonRef = React.createRef();
    }

    uploadResults = (survey) => {
        this.surveyData.response = survey.valuesHash
        this.surveyData.scenario = survey.title
        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    onSurveyComplete = (survey) => {
        this.uploadResults(survey)
    }

    loadSurveyConfig = (config) => {
        const survey = new Model(config);
        survey.applyTheme(surveyTheme);
        survey.onComplete.add(this.onSurveyComplete);
        this.setState({ currentConfig: survey });
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
                        <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px' }}>
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
                                    // uploads data then sets 
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