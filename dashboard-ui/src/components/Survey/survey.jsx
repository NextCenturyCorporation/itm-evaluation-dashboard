import React from "react";
import 'survey-core/defaultV2.min.css'
import { Model } from 'survey-core'
import { Survey } from "survey-react-ui"
import surveyConfig from './surveyConfig.json';
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';


const UPLOAD_SURVEY_RESULTS = gql`
    mutation UploadSurveyResults($results: JSON) {
        uploadSurveyResults(results: $results)
    }`;

class SurveyPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            uploadData: false
        };

        this.survey = new Model(surveyConfig);
        this.questionStartTimes = {};
        this.surveyData = {};

        this.survey.onAfterRenderQuestion.add(this.onAfterRenderQuestion);
        this.survey.onComplete.add(this.onSurveyComplete);
    }

    onAfterRenderQuestion = (sender, options) => {
        const questionName = options.question.name;

        if (Object.keys(this.questionStartTimes).length > 0) {
            const previousQuestionName = Object.keys(this.questionStartTimes).pop();
            const endTime = new Date();
            const startTime = this.questionStartTimes[previousQuestionName];
            const timeSpentInSeconds = (endTime - startTime) / 1000;

            // update time spent for the previous question
            this.surveyData[previousQuestionName] = {}
            this.surveyData[previousQuestionName].timeSpentOnQuestion = timeSpentInSeconds;
        }

        this.questionStartTimes[questionName] = new Date();
    }

    onSurveyComplete = (survey) => {
        // capture the completion time for the last question
        const lastQuestionName = Object.keys(this.questionStartTimes).pop();
        const endTime = new Date();
        const startTime = this.questionStartTimes[lastQuestionName];
        const timeSpentInSeconds = (endTime - startTime) / 1000;

        // update time spent for the last question
        this.surveyData[lastQuestionName] = {};
        this.surveyData[lastQuestionName].timeSpentOnQuestion = timeSpentInSeconds;

        this.surveyData.user = this.props.currentUser;

        // Iterate through each question in survey.valuesHash
        for (const questionName in survey.valuesHash) {
            if (survey.valuesHash.hasOwnProperty(questionName)) {
                const questionValue = survey.valuesHash[questionName];

                if (this.surveyData.hasOwnProperty(questionName)) {
                    // combine the survey data with the question value
                    this.surveyData[questionName].response = questionValue;
                } else {
                    this.surveyData[questionName] = { response: questionValue };
                }
            }
        }

        let shouldDownload = window.confirm("Would you like to download the survey results?")

        if (shouldDownload) {
            this.surveyData = JSON.stringify(this.surveyData, null, 2);

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(new Blob([this.surveyData], { type: 'application/json' }));
            downloadLink.download = 'survey_results.json';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            this.setState({uploadData: true})
        }
    }

    render() {
        return (
            <>
                <Survey model={this.survey} />
                {this.state.uploadData && (
                    <Mutation mutation={UPLOAD_SURVEY_RESULTS}>
                        {(uploadSurveyResults, { data }) => (
                            <div>
                                <button onClick = {(e) => {
                                    e.preventDefault();
                                    uploadSurveyResults({
                                        variables: { results: JSON.parse(this.surveyData)}
                                    })
                                }}>Upload Results</button>
                            </div>
                            )}
                    </Mutation>
                )
                }
            </>
        )
    }
}

export default SurveyPage;
