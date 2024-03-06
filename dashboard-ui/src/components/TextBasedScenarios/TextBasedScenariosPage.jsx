import React, { Component } from 'react';
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core'
import { Survey, ReactQuestionFactory } from "survey-react-ui";
import adeptConfig from './adeptConfig.json';
import stConfig from './stConfig.json'
import surveyTheme from './surveyTheme.json';
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
            uploadData: false
        };

        this.survey = new Model(stConfig);
        this.survey.applyTheme(surveyTheme);
        this.survey.onComplete.add(this.onSurveyComplete);
        this.surveyData = {}
        this.uploadButtonRef = React.createRef();
    }

    uploadResults = (survey) => {
        console.log(survey.valuesHash)
        this.surveyData = survey.valuesHash
        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    onSurveyComplete = (survey) => {
        this.uploadResults(survey)
    }

    render() {
        return (
            <>
                <Survey model={this.survey} />
                {this.state.uploadData && (
                    <Mutation mutation={UPLOAD_SCENARIO_RESULTS}>
                        {(uploadSurveyResults, { data }) => (
                            <div>
                                <button ref={this.uploadButtonRef} onClick={(e) => {
                                    e.preventDefault();
                                    uploadSurveyResults({
                                        variables: { results: this.surveyData }
                                    });
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