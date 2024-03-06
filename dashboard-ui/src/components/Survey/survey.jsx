import React, { Component } from "react";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui"
import surveyConfig from './surveyConfig.json';
import surveyTheme from './surveyTheme.json';
import { StaticTemplate } from "./staticTemplate";
import { DynamicTemplate } from "./dynamicTemplate";
import { Omnibus } from "./omnibusTemplate";
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { getUID, shuffle } from './util';
import Bowser from "bowser";

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
            surveyVersion: surveyConfig.version,
            iPad: false,
            browserInfo: null
        };

        // clone surveyConfig, don't edit directly
        this.surveyConfigClone = JSON.parse(JSON.stringify(surveyConfig));
        this.initializeSurvey();

        this.survey = new Model(this.surveyConfigClone);
        this.survey.applyTheme(surveyTheme);

        this.pageStartTimes = {};
        this.surveyData = {};
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onValueChanged.add(this.onValueChanged)
        this.survey.onComplete.add(this.onSurveyComplete);
        this.uploadButtonRef = React.createRef();
    }

    initializeSurvey = () => {
        this.assignOmnibus(this.surveyConfigClone.soarTechDMs, this.surveyConfigClone.adeptDMs)
        const { groupedDMs, comparisonPages, removed } = this.prepareSurveyInitialization();
        this.applyPageRandomization(groupedDMs, comparisonPages, removed);
    }

    prepareSurveyInitialization = () => {
        // randomize order of soarTech scenarios and adept scenarios
        let soarTech = shuffle(this.surveyConfigClone.soarTechDMs);
        let adept = shuffle(this.surveyConfigClone.adeptDMs)

        // select two scenarios from each
        let groupedDMs = shuffle((soarTech.slice(0, 2)).concat(adept.slice(0, 2)))
        let removed = (soarTech.slice(2)).concat(adept.slice(2))

        // keep track of pages to ignore in surveyConfig
        let removedComparisonPages = []
        removed.forEach(group => {
            removedComparisonPages.push(group[0] + " vs " + group[1])
        })
        removed = removed.flat().concat(removedComparisonPages)

        // keep track of relevant comparison pages of selected scenarios
        let comparisonPages = []
        groupedDMs.forEach(group => {
            comparisonPages.push(group[0] + " vs " + group[1])
        })

        return { groupedDMs, comparisonPages, removed };
    }

    assignOmnibus = (soarTechDMs, adeptDMs) => {
        /*
        * Medics A and C should have High attribute DMs from soartech and adept, respectively. 
        * Medics B and D are the low sttribute DMs
        */

        let medicA = this.surveyConfigClone.pages.find(page => page.name === "Omnibus: Medic-A")
        let medicB = this.surveyConfigClone.pages.find(page => page.name === "Omnibus: Medic-B")
        let medicC = this.surveyConfigClone.pages.find(page => page.name === "Omnibus: Medic-C")
        let medicD = this.surveyConfigClone.pages.find(page => page.name === "Omnibus: Medic-D")

        soarTechDMs.forEach(pairing => {
            if (medicA.elements[0].decisionMakers.length < 4 && medicB.elements[0].decisionMakers.length < 4) {
                medicA.elements[0].decisionMakers.push(pairing[0]);
                medicB.elements[0].decisionMakers.push(pairing[1]);
            }
        })

        adeptDMs.forEach(pairing => {
            if (medicC.elements[0].decisionMakers.length < 4 && medicD.elements[0].decisionMakers.length < 4) {
                medicC.elements[0].decisionMakers.push(pairing[0]);
                medicD.elements[0].decisionMakers.push(pairing[1]);
            }
        }
        )
    }

    applyPageRandomization = (groupedDMs, comparisonPages, removedPages) => {
        /*
            Randomizes the order of the survey while keeping the groupings of scenarios and their
            respective comparison pages intact. i.e 'Medic-33', 'Medic-44' then 'Medic-33 vs Medic-44'
        */
        const postScenarioPage = this.surveyConfigClone.pages.find(page => page.name === "Post-Scenario Measures");
        const omnibusPages = this.surveyConfigClone.pages.filter(page => page.name.includes("Omnibus"));
        //filter out pages to be added after randomized portion
        this.surveyConfigClone.pages = this.surveyConfigClone.pages.filter(page => page.name !== "Post-Scenario Measures");
        this.surveyConfigClone.pages = this.surveyConfigClone.pages.filter(page => !page.name.includes("Omnibus"));

        const groupedPages = [];
        const ungroupedPages = [];
        this.surveyConfigClone.pages.forEach(page => {
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
                } else if (!removedPages.includes(page.name)) {
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

            const comparisonPage = this.surveyConfigClone.pages.find(page => page.name === group.join(' vs '));
            if (comparisonPage) {
                groupPages.push(comparisonPage);
            }

            shuffledGroupedPages.push(...groupPages);
        });


        this.surveyConfigClone.pages = [...ungroupedPages, ...shuffledGroupedPages, ...omnibusPages, postScenarioPage];
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
                    let questionValue;
                    if (survey.valuesHash[questionName + "-Comment"]) {
                        // edge case for "Other" response
                        questionValue = survey.valuesHash[questionName + "-Comment"]
                    } else {
                        questionValue = survey.valuesHash[questionName];
                    }
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
        this.surveyData.browserInfo = this.state.browserInfo

        // upload the results to mongoDB
        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    onSurveyComplete = (survey) => {
        // final upload
        this.uploadSurveyData(survey);
    }

    onValueChanged = (sender, options) => {
        // ensures partial data will be saved if someone needs to step away from the survey
        if (!this.state.surveyId) {
            this.setState({ surveyId: getUID() }, () => {
                this.uploadSurveyData(sender);
            })
        } else {
            this.uploadSurveyData(sender);
        }
    }

    componentDidMount() {
        this.detectUserInfo();
    }

    detectUserInfo = () => {
        const isiPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
        if (isiPad) {
            this.setState({ iPad: true });
        }

        const browserInfo = Bowser.parse(window.navigator.userAgent);
        this.setState({ browserInfo });
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

export default SurveyPage;

ReactQuestionFactory.Instance.registerQuestion("static-template", (props) => {
    return React.createElement(StaticTemplate, props);
});

ReactQuestionFactory.Instance.registerQuestion("dynamic-template", (props) => {
    return React.createElement(DynamicTemplate, props);
});

ReactQuestionFactory.Instance.registerQuestion("omnibus", (props) => {
    return React.createElement(Omnibus, props)
})