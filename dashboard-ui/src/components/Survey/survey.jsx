import React, { Component } from "react";
import 'survey-core/defaultV2.min.css'
import { Model } from 'survey-core'
import { Survey } from "survey-react-ui"
import surveyConfig from './surveyConfig.json';
import surveyTheme from './surveyTheme.json';
import ActionModal from "./actionModal";
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { StaticTemplate } from "./staticTemplate";
import { DynamicTemplate } from "./dynamicTemplate";
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
            showModal: false,
            modalTitle: "",
            modalHTML: "",
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
        this.survey.onAfterRenderQuestion.add(this.onAfterRenderQuestion);
        this.survey.onValueChanged.add(this.onValueChanged)
        this.survey.onComplete.add(this.onSurveyComplete);
        this.uploadButtonRef = React.createRef();
    }

    configureSurveyPages = (groupedDMs, comparisonPages, templateAssignment) => {
        // set pages to dynamic or static
        Object.entries(templateAssignment).forEach(([key, value]) => {
            const matchingPage = surveyConfig.pages.find(page => page.name === key);
            if (matchingPage) {
                matchingPage.elements[0].type = value + "-template";
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

    createButtons = (fName, sName, options, sender) => {
        let questionElement = options.htmlElement;

        // Create a container for buttons
        let buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";

        // Create the first button
        let button1 = document.createElement("button");
        button1.textContent = "DM " + fName;
        button1.style.marginRight = "10px"; // Add some margin to separate the buttons
        let fHTML = this.matchButtonToActions(fName, sender)
        button1.onclick = () => this.setState({ modalHTML: fHTML, modalTitle: "DM " + fName, showModal: true });

        // Create the second button
        let button2 = document.createElement("button");
        button2.textContent = "DM " + sName;
        const sHTML = this.matchButtonToActions(sName, sender)
        button2.onclick = () => this.setState({ modalHTML: sHTML, modalTitle: "DM " + sName, showModal: true });

        // Append buttons to the container
        buttonContainer.appendChild(button1);
        buttonContainer.appendChild(button2);

        // Append the container to the question element
        questionElement.appendChild(buttonContainer);
    }

    matchButtonToActions = (name, sender) => {
        const targetPageName = "DM " + name + " Actions"
        const targetQuestion = sender.getQuestionByName(targetPageName)
        return targetQuestion.html
    }


    handleCloseModal = () => {
        this.setState({ showModal: false });
    };

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
        // return all of the questions on a page
        const page = this.survey.getPageByName(pageName);
        if (page) {
            return page.questions.map(question => question.name);
        }
        return [];
    }

    uploadSurveyData = (survey) => {
        this.timerHelper()
        // iterate through each page in the survey
        for (const pageName in this.pageStartTimes) {
            if (this.pageStartTimes.hasOwnProperty(pageName)) {
                this.surveyData[pageName] = {
                    timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage,
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
                {this.state.showModal && (
                    <ActionModal
                        show={this.state.showModal}
                        title={this.state.modalTitle}
                        body={this.state.modalHTML}
                        handleClose={this.handleCloseModal}
                    />
                )}
            </>
        )
    }
}

export default SurveyPage;
