import React from "react";
import 'survey-core/defaultV2.min.css'
import { Model } from 'survey-core'
import { Survey } from "survey-react-ui"
import surveyConfig from './surveyConfig.json';

class SurveyPage extends React.Component {

    constructor(props) {
        super(props);

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

            // Update time spent for the previous question
            this.surveyData[previousQuestionName] = {}
            this.surveyData[previousQuestionName].timeSpentOnQuestion = timeSpentInSeconds;
        }

        this.questionStartTimes[questionName] = new Date();
    }

    onSurveyComplete = (survey) => {
        // Capture the completion time for the last question
        const lastQuestionName = Object.keys(this.questionStartTimes).pop();
        const endTime = new Date();
        const startTime = this.questionStartTimes[lastQuestionName];
        const timeSpentInSeconds = (endTime - startTime) / 1000;

        // Update time spent for the last question
        this.surveyData[lastQuestionName] = {};
        this.surveyData[lastQuestionName].timeSpentOnQuestion = timeSpentInSeconds;

        console.log(survey.valuesHash);
        const surveyData = this.surveyData;
        surveyData.user = this.props.currentUser;

        // Iterate through each question in survey.valuesHash
        for (const questionName in survey.valuesHash) {
            if (survey.valuesHash.hasOwnProperty(questionName)) {
                const questionValue = survey.valuesHash[questionName];

                // Check if there is time data for this question in this.surveyData
                if (surveyData.hasOwnProperty(questionName)) {
                    // Combine the survey data with the question value
                    surveyData[questionName].response = questionValue;
                } else {
                    // If there is no time data, create a new entry with the question value
                    surveyData[questionName] = { response: questionValue };
                }
            }
        }

        let shouldDownload = window.confirm("Would you like to download the survey results?")

        if (shouldDownload) {
            const jsonString = JSON.stringify(surveyData, null, 2);

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
            downloadLink.download = 'survey_results.json';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    }

    render() {
        return (
            <Survey model={this.survey} />
        )
    }
}

export default SurveyPage;
