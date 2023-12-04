import React from "react";
import 'survey-core/defaultV2.min.css'
import { Model } from 'survey-core'
import { Survey } from "survey-react-ui"
import surveyConfig from './surveyConfig.json';

class SurveyPage extends React.Component {

    onSurveyComplete = (survey) => {
        // Get survey data in JSON format
        const surveyData = survey.data;

        // Convert survey data to JSON string
        const jsonString = JSON.stringify(surveyData, null, 2);

        // Create a Blob with the JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a link element
        const downloadLink = document.createElement('a');

        // Set the href attribute of the link to the Blob
        downloadLink.href = URL.createObjectURL(blob);

        // Set the download attribute with the desired file name
        downloadLink.download = 'survey_results.json';

        // Append the link to the document
        document.body.appendChild(downloadLink);

        // Trigger a click on the link to start the download
        downloadLink.click();

        // Remove the link from the document
        document.body.removeChild(downloadLink);
    }

    render() {
        const survey = new Model(surveyConfig)
        return (
            <Survey model={survey} onComplete={this.onSurveyComplete} />
        )
    }
}

export default SurveyPage;
