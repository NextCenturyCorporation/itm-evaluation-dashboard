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
        this.pageStartTimes = {};
        this.surveyData = {};

        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onComplete.add(this.onSurveyComplete);

        this.uploadButtonRef = React.createRef();
    }

    onAfterRenderPage = (sender, options) => {
        const pageName = options.page.name;

        if (Object.keys(this.pageStartTimes).length > 0) {
            this.timerHelper()
        }

        this.pageStartTimes[pageName] = new Date();
    }

    timerHelper() {
        const previousPageName = Object.keys(this.pageStartTimes).pop();
        const endTime = new Date();
        const startTime = this.pageStartTimes[previousPageName];
        const timeSpentInSeconds = (endTime - startTime) / 1000;

        // update time spent for the previous page
        this.surveyData[previousPageName] = {}
        this.surveyData[previousPageName].timeSpentOnPage = timeSpentInSeconds;
        this.surveyData[previousPageName].questions = this.getPageQuestions(previousPageName);
    }

    getPageQuestions = (pageName) => {
        const page = this.survey.getPageByName(pageName);
        if (page) {
            return page.questions.map(question => question.name);
        }
        return [];
    }

    onSurveyComplete = (survey) => {
        // capture time spent on last page
        this.timerHelper()
        // Iterate through each page in the survey
        for (const pageName in this.pageStartTimes) {
            if (this.pageStartTimes.hasOwnProperty(pageName)) {
                // Initialize page data with time tracking
                this.surveyData[pageName] = {
                    timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage,
                    questions: {}
                };

                // Get the questions for the page
                const pageQuestions = this.getPageQuestions(pageName);

                // Iterate through each question and structure it as an object
                pageQuestions.forEach(questionName => {
                    const questionValue = survey.valuesHash[questionName];
                    this.surveyData[pageName].questions[questionName] = {
                        response: questionValue
                    };
                });
            }
        }

        this.surveyData.user = this.props.currentUser;
        this.surveyData.timeComplete = new Date().toString();

        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    render() {
        return (
            <>
                <Survey model={this.survey} />
                {this.state.uploadData && (
                    <Mutation mutation={UPLOAD_SURVEY_RESULTS}>
                        {(uploadSurveyResults, { data }) => (
                            <div>
                                <button ref={this.uploadButtonRef} onClick={(e) => {
                                    e.preventDefault();
                                    uploadSurveyResults({
                                        variables: { results: this.surveyData }
                                    })
                                    this.setState({ uploadData: false })
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
