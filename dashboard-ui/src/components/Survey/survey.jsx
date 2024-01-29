import React, { Component } from "react";
import 'survey-core/defaultV2.min.css'
import { Model } from 'survey-core'
import { Survey } from "survey-react-ui"
import surveyConfig from './surveyConfig.json';
import surveyTheme from './surveyTheme.json';
import { StaticTemplate } from "./staticTemplate";
import { DynamicTemplate } from "./dynamicTemplate";
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { getUID, shuffle } from './util'

const UPLOAD_SURVEY_RESULTS = gql`
  mutation UploadSurveyResults( $surveyId: String, $results: JSON) {
    uploadSurveyResults(surveyId: $surveyId, results: $results)
  }`;

class SurveyPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            uploadData: false,
            startTime: null,
            firstPageCompleted: false,
            surveyId: null,
            surveyVersion: surveyConfig.version
        };

        this.initializeSurvey();
        this.survey = new Model(surveyConfig);
        this.survey.applyTheme(surveyTheme)
        this.pageStartTimes = {};
        this.surveyData = {};
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onValueChanged.add(this.onValueChanged)
        this.survey.onComplete.add(this.onSurveyComplete);
        this.uploadButtonRef = React.createRef();
    }

    configureSurveyPages = (groupedDMs, comparisonPages, templateAssignment) => {
        // set pages to dynamic or static
        Object.entries(templateAssignment).forEach(([pageName, templateType]) => {
            const page = surveyConfig.pages.find(page => page.name === pageName);
            if (page) {
                page.elements[0].type = `${templateType}-template`;
            }
        });

        //randomization scheme
        const postScenarioPage = surveyConfig.pages.find(page => page.name === "Post-Scenario Measures");
        //filter out last page of survey to insert later
        surveyConfig.pages = surveyConfig.pages.filter(page => page.name !== "Post-Scenario Measures");

        const groupedPages = [];
        const ungroupedPages = [];
        surveyConfig.pages.forEach(page => {
            let isComparisonPage = Object.values(comparisonPages).includes(page.name);
            let isGroupedPage = false;

            if (!isComparisonPage) {
                groupedDMs.forEach(group => {
                    if (group.some(dm => page.name.includes(dm))) {
                        isGroupedPage = true;
                    }
                });

                if (isGroupedPage) {
                    groupedPages.push(page);
                } else {
                    ungroupedPages.push(page);
                }
            }
        });

        const shuffledGroupedPages = [];
        groupedDMs.forEach(group => {
            let groupPages = [];
            group.forEach(dm => {
                groupPages.push(...groupedPages.filter(page => page.name.includes(dm)));
            });

            const comparisonPageName = comparisonPages[group.join('')];
            const comparisonPage = surveyConfig.pages.find(page => page.name === comparisonPageName);
            if (comparisonPage) {
                groupPages.push(comparisonPage);
            }

            shuffledGroupedPages.push(...groupPages);
        });

        surveyConfig.pages = [...ungroupedPages, ...shuffledGroupedPages, postScenarioPage];
    }

    initializeSurvey = () => {
        let groupedDMs = [
            ['Medic-77', 'Medic-88'],
            ['Medic-99', 'Medic-101'],
            ['Medic-33', 'Medic-44'],
            ['Medic-55', 'Medic-66']
        ];

        groupedDMs = shuffle(groupedDMs)

        let templateAssignment = {};
        groupedDMs.forEach((group, index) => {
            templateAssignment[group[0]] = index % 2 === 0 ? 'static' : 'dynamic';
            templateAssignment[group[1]] = index % 2 === 0 ? 'static' : 'dynamic';
        });

        groupedDMs = shuffle(groupedDMs)

        const comparisonPages = {
            'Medic-77Medic-88': 'Medic-77 vs Medic-88',
            'Medic-99Medic-101': 'Medic-99 vs Medic-101',
            'Medic-33Medic-44': 'Medic-33 vs Medic-44',
            'Medic-55Medic-66': 'Medic-55 vs Medic-66'
        };

        this.configureSurveyPages(groupedDMs, comparisonPages, templateAssignment);
    }


    onAfterRenderPage = (sender, options) => {
        // setTimeout makes the scroll work consistently
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 25);

        // record start time after first page completed
        if (!sender.isFirstPage && !this.state.firstPageCompleted) {
            this.setState({
                firstPageCompleted: true,
                startTime: new Date().toString()
            });
        }

        const pageName = options.page.name;

        if (Object.keys(this.pageStartTimes).length > 0) {
            this.timerHelper()
        }

        this.pageStartTimes[pageName] = new Date();
    }

    timerHelper = () => {
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
        // returns every question on the page
        const page = this.survey.getPageByName(pageName);
        return page ? page.questions.map(question => question.name) : [];
    };
    

    uploadSurveyData = (survey) => {
        this.timerHelper()
        // iterate through each page in the survey
        for (const pageName in this.pageStartTimes) {
            if (this.pageStartTimes.hasOwnProperty(pageName)) {
                const page = this.survey.getPageByName(pageName)?.jsonObj;
                this.surveyData[pageName] = {
                    timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage,
                    scenarioIndex: page?.scenarioIndex,
                    pageType: page?.pageType,
                    pageName: page?.name,
                    questions: {}
                };

                const pageQuestions = this.getPageQuestions(pageName);

                pageQuestions.forEach(questionName => {
                    const questionValue = survey.valuesHash[questionName];
                    this.surveyData[pageName].questions[questionName] = {
                        response: questionValue
                    };
                });
            }
        }

        // attach user data to results
        this.surveyData.user = this.props.currentUser;
        this.surveyData.timeComplete = new Date().toString();
        this.surveyData.startTime = this.state.startTime
        this.surveyData.surveyVersion = this.state.surveyVersion

        // upload the results to mongoDB
        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    onSurveyComplete = (survey) => {
        // final upload
        this.uploadSurveyData(survey)
    }

    onValueChanged = (sender, options) => {
        // ensures partial data will be saved if someone needs to step away from the survey
        if (!this.state.surveyId) {
            this.setState({ surveyId: getUID() }, () => {
                this.uploadSurveyData(sender)
            })
        } else {
            this.uploadSurveyData(sender)
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
                                <button ref={this.uploadButtonRef} onClick={(e) => {
                                    e.preventDefault();
                                    uploadSurveyResults({
                                        variables: { surveyId: this.state.surveyId, results: this.surveyData }
                                    })
                                    this.setState({ uploadData: false })
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

export default SurveyPage;
