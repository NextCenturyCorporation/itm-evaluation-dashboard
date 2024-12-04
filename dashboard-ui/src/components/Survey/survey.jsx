import React, { Component, useEffect } from "react";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui"
import surveyTheme from './surveyTheme.json';
import { StaticTemplate } from "./staticTemplate";
import { DynamicTemplate } from "./dynamicTemplate";
import { Omnibus } from "./omnibusTemplate";
import { Comparison } from "./comparison";
import { OmnibusComparison } from "./omnibusComparison";
import { AdeptComparison } from "./adeptComparison";
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { useQuery } from 'react-apollo'
import { generateComparisonPagev4_5, getKitwareAdms, getOrderedAdeptTargets, getParallaxAdms, getUID, shuffle, survey3_0_groups, surveyVersion_x_0 } from './surveyUtils';
import Bowser from "bowser";
import { Prompt } from 'react-router-dom'
import { useSelector } from "react-redux";
import { isDefined } from "../AggregateResults/DataFunctions";
import { admOrderMapping, getDelEnvMapping, getEnvMappingToText, getKitwareBaselineMapping, getTadBaselineMapping } from "./delegationMappings";

const COUNT_HUMAN_GROUP_FIRST = gql`
  query CountHumanGroupFirst {
    countHumanGroupFirst
  }
`;

const COUNT_AI_GROUP_FIRST = gql`
  query CountAIGroupFirst {
    countAIGroupFirst
  }
`;

const UPLOAD_SURVEY_RESULTS = gql`
  mutation UploadSurveyResults( $surveyId: String, $results: JSON) {
    uploadSurveyResults(surveyId: $surveyId, results: $results)
  }`;

const UPDATE_PARTICIPANT_LOG = gql`
    mutation updateParticipantLog($pid: String!, $updates: JSON!) {
        updateParticipantLog(pid: $pid, updates: $updates) 
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }
`
const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;


class SurveyPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            uploadData: false,
            startTime: null,
            firstPageCompleted: false,
            surveyId: null,
            surveyConfig: null,
            surveyVersion: null,
            iPad: false,
            browserInfo: null,
            isSurveyLoaded: false,
            firstGroup: [],
            secondGroup: [],
            orderLog: [],
            pid: null,
            validPid: false,
            lastTimeCalled: 0,
            envsSeen: { "Del-1": "AD-1", "Del-2": "ST-3", "ADMOrder": 1 },
            updatePLog: false,
            initialUploadedCount: 0,
            hasUploaded: false
        };
        this.surveyConfigClone = null;
        this.pageStartTimes = {};

        if (this.state.surveyConfig) {
            this.postConfigSetup();
        }
    }

    setSeenScenarios = () => {
        if (this.survey.getQuestionByName("Text Scenarios Completed")) {
            const text_scenarios = this.state.validPid ? '\t' + getEnvMappingToText(this.state.surveyVersion)[this.state.envsSeen['Text-1']] + '\n\t' + getEnvMappingToText(this.state.surveyVersion)[this.state.envsSeen['Text-2']] : '\tInvalid Participant ID; no text scenario log. \n\tPlease double check the participant ID before continuing, or select "No" and enter an explanation.';
            this.survey.getQuestionByName("Text Scenarios Completed").title = "Please verify that the following Text Scenarios have been completed:\n" + text_scenarios;
        }
        if (this.survey.getQuestionByName("VR Scenarios Completed")) {
            const text_scenarios = this.state.validPid ? '\t' + getEnvMappingToText(this.state.surveyVersion)[this.state.envsSeen['Sim-1']] + '\n\t' + getEnvMappingToText(this.state.surveyVersion)[this.state.envsSeen['Sim-2']] : '\tInvalid Participant ID; no VR scenario log. \n\tPlease double check the participant ID before continuing, or select "No" and enter an explanation.';
            this.survey.getQuestionByName("VR Scenarios Completed").title = "Please verify that the following VR Scenarios have been completed:\n" + text_scenarios;
        }
    }

    postConfigSetup = () => {
        // clone surveyConfig, don't edit directly
        this.surveyConfigClone = structuredClone(this.state.surveyConfig);
        this.initializeSurvey();

        this.survey = new Model(this.surveyConfigClone);
        this.survey.applyTheme(surveyTheme);

        this.surveyData = {};
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onValueChanged.add(this.onValueChanged)
        this.survey.onComplete.add(this.onSurveyComplete);
        this.uploadButtonRef = React.createRef();
        this.uploadButtonRefPLog = React.createRef();
        this.shouldBlockNavigation = true;
        if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0) && this.state.pid != null) {
            this.survey.onCurrentPageChanging.add(this.finishFirstPage);
            if (this.state.surveyVersion == 4.0) this.setSeenScenarios();
            this.survey.data = {
                "Participant ID": this.state.pid
            };
            // search to see if this pid has been used before and fully completed the survey
            const pidExists = this.props.surveyResults.filter((res) => (res.results?.surveyVersion == 4 || res.results?.surveyVersion == 5) && res.results['Participant ID Page']?.questions['Participant ID']?.response == this.state.pid && isDefined(res.results['Post-Scenario Measures']));
            this.setState({ initialUploadedCount: pidExists.length });
            const completedTextSurvey = this.props.textResults.filter((res) => res['participantID'] == this.state.pid && Object.keys(res).includes('mostLeastAligned'));
            if (this.state.validPid) {
                if (pidExists.length > 0) {
                    this.survey.currentPage = 1;
                    this.survey.pages[1].elements[0].name = "Warning: The Participant ID you entered has already been used. Please go back and ensure you have typed in the PID correctly before continuing.";
                    this.survey.pages[1].elements[0].title = "Warning: The Participant ID you entered has already been used. Please go back and ensure you have typed in the PID correctly before continuing.";
                }
                else if (completedTextSurvey.length == 0) {
                    this.survey.currentPage = 1;
                    this.survey.pages[1].elements[0].name = "Warning: The Participant ID you entered does not have an entry for the text scenarios. Please go back and ensure you have typed in the PID correctly before continuing, or ensure this participant takes the text portion before completing the delegation survey.";
                    this.survey.pages[1].elements[0].title = "Warning: The Participant ID you entered does not have an entry for the text scenarios. Please go back and ensure you have typed in the PID correctly before continuing, or ensure this participant takes the text portion before completing the delegation survey.";
                }
                else {
                    this.survey.currentPage = 2;
                    this.survey.pages[1].visibleIf = "false";
                }
            }
            else {
                this.survey.currentPage = 1;
            }
        }
        this.setState({
            isSurveyLoaded: true
        });
    }

    ConfigGetter = () => {
        const reducer = useSelector((state) => state?.configs?.surveyConfigs);
        useEffect(() => {
            if (reducer) {
                this.setState({
                    surveyConfig: reducer['delegation_v' + this.props.surveyVersion]
                }, () => {
                    this.setState({
                        surveyVersion: this.props.surveyVersion
                    }, () => {
                        this.postConfigSetup();
                    })
                })

            }
        }, [reducer])
        return null;
    }

    initializeSurvey = () => {
        if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0) && this.state.pid != null) {
            this.setState({
                isSurveyLoaded: false
            });
        }
        const { groupedDMs, comparisonPages, removed } = this.prepareSurveyInitialization();
        if ((this.state.surveyVersion != 4.0 && this.state.surveyVersion != 5.0)) {
            this.applyPageRandomization(groupedDMs, comparisonPages, removed);
        } else if (this.state.pid != null) {
            this.setState({
                isSurveyLoaded: true
            });
        }
    }

    prepareSurveyInitialization = () => {
        if (this.state.surveyVersion == 2 || this.state.surveyVersion == 0) {
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
        else if (this.state.surveyVersion == 2.1) {
            let groupedDMs = shuffle(this.surveyConfigClone.adeptDMs)
            let comparisonPages = []
            groupedDMs.forEach(group => {
                comparisonPages.push(group[0] + " vs " + group[1])
            })
            let removed = []
            return { groupedDMs, comparisonPages, removed };
        }
        else if (this.state.surveyVersion == 3.0) {
            // data collect starting 7-16
            let pages = this.surveyConfigClone.pages
            let removed = []
            let groupedDMs = []
            let comparisonPages = []
            /* Get the ADMS for urban and sub that are aligned either high or low */
            const dms = pages.reduce((filtered, page) => {
                if (page.scenarioName) {
                    if ((page.scenarioName.includes("Urban") || page.scenarioName.includes("Sub")) &&
                        (page.admType === 'aligned' || page.admType === 'other')) {
                        filtered.push(page);
                    } else {
                        removed.push(page);
                    }
                }
                return filtered;
            }, []);

            // matches adms with their counterparts (high matches to low)
            const dmMap = new Map();
            dms.forEach((dm) => {
                const key = `${dm.admAuthor}-${dm.scenarioName}`;
                if (!dmMap.has(key)) {
                    dmMap.set(key, []);
                }
                dmMap.get(key).push(dm);
            });

            survey3_0_groups.forEach(([author, scenario]) => {
                const key = `${author}-${scenario}`;
                if (dmMap.has(key)) {
                    groupedDMs.push(dmMap.get(key));
                }
            });

            // keep track of relevant comparison pages of selected scenarios
            groupedDMs.forEach(group => {
                comparisonPages.push(group[0].name + " vs " + group[1].name)
            });


            return { groupedDMs, comparisonPages, removed }
        }
        else if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0) && this.state.pid == null) {
            this.surveyConfigClone.pages = [this.surveyConfigClone.pages[0]];

            return {};
        }
        else if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0)) {
            const allPages = this.surveyConfigClone.pages;
            const pages = [...allPages.slice(0, 5)];
            const order = admOrderMapping[this.state.envsSeen['ADMOrder']];
            // author is TAD or kitware, alignment is the target name, admType is aligned or baseline, scenarioName is SoarTech VOL 1, etc.
            const del1 = this.state.envsSeen['Del-1'];
            const stScenario = getDelEnvMapping(this.state.surveyVersion)[del1.includes("ST") ? del1 : this.state.envsSeen['Del-2']];
            const adScenario = getDelEnvMapping(this.state.surveyVersion)[del1.includes("AD") ? del1 : this.state.envsSeen['Del-2']];
            // find most and least aligned adms for every attribute
            const participantResults = this.props.textResults.filter((res) => res['participantID'] == this.state.pid && Object.keys(res).includes('mostLeastAligned'));
            const admLists = {
                "qol": participantResults.findLast((el) => el['scenario_id'].includes('qol')) ?? undefined,
                "vol": participantResults.findLast((el) => el['scenario_id'].includes('vol')) ?? undefined,
                "adept": participantResults.findLast((el) => el['scenario_id'].includes('DryRunEval') || el['scenario_id'].includes('adept')) ?? undefined
            };
            let adeptMostLeast = null;
            if (this.state.surveyVersion == 4.0) {
                adeptMostLeast = getOrderedAdeptTargets(admLists?.adept?.combinedAlignmentData ?? []);
            }
            else {
                adeptMostLeast = { 'Ingroup': admLists?.adept?.mostLeastAligned?.find((x) => x.target == 'Ingroup Bias'), 'Moral': admLists?.adept?.mostLeastAligned?.find((x) => x.target == 'Moral judgement') }
            }
            for (let x of order) {
                const expectedAuthor = (x['TA2'] == 'Kitware' ? 'kitware' : 'TAD');
                const expectedScenario = x['TA1'] == 'ST' ? (x['Attribute'] == 'QOL' ? stScenario[0] : stScenario[1]) : (x['Attribute'] == 'MJ' ? adScenario[0] : adScenario[1]);
                let adms = null;
                if (expectedAuthor == 'kitware') {
                    if (this.state.validPid && isDefined(adeptMostLeast['Ingroup']) && isDefined(adeptMostLeast['Moral']) && isDefined(admLists['qol']) && isDefined(admLists['vol'])) {
                        adms = getKitwareAdms(this.state.surveyVersion, expectedScenario, adeptMostLeast['Ingroup'], adeptMostLeast['Moral'], admLists['qol']['mostLeastAligned'][0]['response'], admLists['vol']['mostLeastAligned'][0]['response']);
                    } else {
                        adms = getKitwareAdms(this.state.surveyVersion, expectedScenario, null, null, null, null);
                    }
                }
                else {
                    if (this.state.validPid && isDefined(adeptMostLeast['Ingroup']) && isDefined(adeptMostLeast['Moral']) && isDefined(admLists['qol']) && isDefined(admLists['vol'])) {
                        adms = getParallaxAdms(this.state.surveyVersion, expectedScenario, adeptMostLeast['Ingroup'], adeptMostLeast['Moral'], admLists['qol']['mostLeastAligned'][0]['response'], admLists['vol']['mostLeastAligned'][0]['response']);
                    } else {
                        adms = getParallaxAdms(this.state.surveyVersion, expectedScenario, null, null, null, null);
                    }
                }

                let alignedADMTarget = adms['aligned'];
                let misalignedADMTarget = adms['misaligned'];
                const baselineADMTarget = x['TA2'] == 'Kitware' ? getKitwareBaselineMapping(this.state.surveyVersion)[expectedScenario] : getTadBaselineMapping(this.state.surveyVersion)[expectedScenario];
                const baselineAdm = allPages.find((x) => x.admAuthor == expectedAuthor && x.scenarioIndex == expectedScenario && x.admType == 'baseline' && x.admAlignment == baselineADMTarget);
                // aligned
                if (expectedScenario.includes('DryRun')) {
                    if (alignedADMTarget && !alignedADMTarget.includes('.')) alignedADMTarget = alignedADMTarget?.slice(0, -1) + '.' + alignedADMTarget?.slice(-1);
                    if (misalignedADMTarget && !misalignedADMTarget.includes('.')) misalignedADMTarget = misalignedADMTarget?.slice(0, -1) + '.' + misalignedADMTarget?.slice(-1);
                }
                const alignedAdm = allPages.find((x) => x.admAuthor == expectedAuthor && x.scenarioIndex == expectedScenario && x.admType == 'aligned' && x.admAlignment == alignedADMTarget);
                // misaligned
                const misalignedAdm = allPages.find((x) => x.admAuthor == expectedAuthor && x.scenarioIndex == expectedScenario && x.admType == 'aligned' && x.admAlignment == misalignedADMTarget);
                const pagesToShuffle = [];
                if (isDefined(baselineAdm)) {
                    baselineAdm['alignment'] = 'baseline';
                    baselineAdm['target'] = baselineADMTarget;
                    pagesToShuffle.push(baselineAdm);
                } else { console.warn("Missing Baseline ADM"); }
                if (isDefined(alignedAdm)) {
                    alignedAdm['admStatus'] = adms['alignedStatus'];
                    alignedAdm['alignment'] = 'aligned';
                    alignedAdm['target'] = alignedADMTarget;
                    pagesToShuffle.push(alignedAdm);
                } else { 
                    console.warn("Missing Aligned ADM for " + expectedScenario + " - " + expectedAuthor + " - " + alignedADMTarget); 
                }
                if (isDefined(misalignedAdm)) {
                    misalignedAdm['admStatus'] = adms['misalignedStatus'];
                    misalignedAdm['alignment'] = 'misaligned';
                    misalignedAdm['target'] = misalignedADMTarget;
                    pagesToShuffle.push(misalignedAdm);
                } else { console.warn("Missing Misaligned ADM"); }
                shuffle(pagesToShuffle);
                pages.push(...pagesToShuffle);
                pages.push(generateComparisonPagev4_5(baselineAdm, alignedAdm, misalignedAdm));
            }
            pages.push(allPages.slice(-1)[0]);
            this.surveyConfigClone.pages = pages;
            const pageOrder = [];
            for (let x of pages) {
                pageOrder.push(x.name);
            }
            this.setState({ orderLog: pageOrder });

            return {};
        }
        else if (this.state.surveyVersion == 1){
            let groupedDMs = shuffle([...this.surveyConfigClone.groupedDMs]);
            // remove one scenario at random (we only want three randomly selected scenarios out of the bucket of four)
            let removed = groupedDMs.pop();
            // comparison page name to be removed
            removed.push(`${removed[0]} vs ${removed[1]}`);

            let comparisonPages = { ...this.surveyConfigClone.comparisonPages };
            delete comparisonPages[`${removed[0]}${removed[1]}`];

            return { groupedDMs, removed, comparisonPages };
        }
    }

    applyPageRandomization = (groupedDMs, comparisonPages, removedPages) => {
        /*
            Randomizes the order of the survey while keeping the groupings of scenarios and their
            respective comparison pages intact. i.e 'Medic-33', 'Medic-44' then 'Medic-33 vs Medic-44'
        */
        const postScenarioPage = this.surveyConfigClone.pages.find(page => page.name === "Post-Scenario Measures");
        let omnibusPages = this.surveyConfigClone.pages.filter(page => page.name.includes("Omnibus"));
        if (this.state.surveyVersion === 3.0) {
            omnibusPages = []
            // grabs introduction pages
            const introPages = this.surveyConfigClone.pages.slice(0, 3)
            const delegationPages = []
            groupedDMs.forEach(pair => {
                const comparisonPageName = pair[0].name + ' vs ' + pair[1].name
                // random order for the pair
                pair = shuffle(pair)
                delegationPages.push(pair[0])
                delegationPages.push(pair[1])
                delegationPages.push(this.surveyConfigClone.pages.find(page => page.name === comparisonPageName))
            })

            // insert agent pages
            const agentPages = this.surveyConfigClone.agentPages
            // if there are more entries in mongo with ai group presenting first, set human group first and vice versa
            if (this.props.countHumanGroupFirst <= this.props.countAIGroupFirst) {
                delegationPages.unshift(agentPages[0])
                delegationPages.splice(13, 0, agentPages[1])
            } else {
                delegationPages.unshift(agentPages[1])
                delegationPages.splice(13, 0, agentPages[0])
            }

            let firstGroup = [];
            let secondGroup = [];

            // keep track of which group each page is apart of (human or ai)
            delegationPages.forEach((page, index) => {
                if (index < 13) {
                    firstGroup.push(page.name);
                } else {
                    secondGroup.push(page.name);
                }
            });

            this.setState({
                firstGroup: firstGroup,
                secondGroup: secondGroup
            });

            this.surveyConfigClone.pages = [...introPages, ...delegationPages, postScenarioPage]

            const orderLog = []
            this.orderLogHelper(firstGroup, orderLog, 0)
            this.orderLogHelper(secondGroup, orderLog, 12)
            this.setState({ orderLog: orderLog })

            return;
        }
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

        // for data collect 7-11-24 survey version 2.1
        // randomly insert 'treat as ai DM' OR 'treat as human DM'
        if (this.state.surveyVersion == 2.1) {
            const shuffledInstructionPages = shuffle(this.surveyConfigClone.instructionPages)
            const firstGroup = [shuffledInstructionPages[0]]
            const secondGroup = [shuffledInstructionPages[1]]

            for (let i = 0; i < 6; i++) {
                firstGroup.push(shuffledGroupedPages[i].name)
            }

            for (let i = 6; i < 12; i++) {
                secondGroup.push(shuffledGroupedPages[i].name)
            }
            this.setState({
                firstGroup: firstGroup,
                secondGroup: secondGroup
            })

            shuffledGroupedPages.unshift(shuffledInstructionPages[0])
            shuffledGroupedPages.splice(7, 0, shuffledInstructionPages[1]);
        }
        this.surveyConfigClone.pages = [...ungroupedPages, ...shuffledGroupedPages, ...omnibusPages, postScenarioPage];
    }

    orderLogHelper = (group, orderLog, offset) => {
        const groupType = group[0] == 'Treat as Human' ? 'H' : 'AI'
        let lastPage = {}
        group.forEach((pageName, index) => {
            if (index == 0) { return } // skip the agent page
            const page = this.surveyConfigClone.pages.find(p => p.name === pageName);
            if (page.pageType == 'singleMedic') {
                // mark last page so comparison pages can read info from it 
                lastPage = page
                orderLog.push(`${index + offset}-${page.admAuthor}-${page.scenarioName.replace(/\s+/g, '-')}-${groupType}-${page.admAlignment}`);
            } else {
                orderLog.push(`${index + offset}-${lastPage.admAuthor}-${lastPage.scenarioName.replace(/\s+/g, '-')}-${groupType}-DEL`)
            }
        });
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
        if (pageName == 'VR Page') {
            // made it past warnings and pid page, so log pid as claimed
            if (this.state.validPid) {
                this.setState({ updatePLog: true }, () => {
                    if (this.uploadButtonRefPLog.current) {
                        this.uploadButtonRefPLog.current.click();
                    }
                });
            }
        }

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


    uploadSurveyData = (survey, finalUpload) => {
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
                    admTarget: page?.target,
                    admName: page?.admName,
                    admAuthor: page?.admAuthor,
                    admAlignment: page?.alignment,
                    admChoiceProcess: page?.admStatus,
                    questions: {}
                };

                //comparison page
                if (page?.name?.includes('vs')) {
                    this.surveyData[pageName]['baselineName'] = page?.baselineName
                    this.surveyData[pageName]['baselineTarget'] = page?.baselineTarget
                    this.surveyData[pageName]['alignedTarget'] = page?.alignedTarget
                    this.surveyData[pageName]['misalignedTarget'] = page?.misalignedTarget
                    this.surveyData[pageName]['admAuthor'] = page?.admAuthor
                }

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
        this.surveyData.startTime = this.state.startTime;
        this.surveyData.surveyVersion = surveyVersion_x_0(this.state.surveyVersion);
        this.surveyData.browserInfo = this.state.browserInfo;

        // 7-16 data collect. Log info about order, agent, and DM 
        if (this.state.surveyVersion == 3.0 || this.state.surveyVersion == 2.1) {
            this.surveyData['firstGroup'] = this.state.firstGroup;
            this.surveyData['secondGroup'] = this.state.secondGroup;
            this.surveyData['orderLog'] = this.state.orderLog;
            // only record human or ai group first if the survey is fully complete
            if (finalUpload) {
                const humanGroupFirst = this.state.firstGroup.includes('Treat as Human');
                this.surveyData['humanGroupFirst'] = humanGroupFirst;
                this.surveyData['aiGroupFirst'] = !humanGroupFirst;
            }
        }

        if (this.state.surveyVersion == 4.0) {
            this.surveyData['evalNumber'] = 4;
            this.surveyData['evalName'] = 'Dry Run Evaluation';
            this.surveyData['orderLog'] = this.state.orderLog;
        }
        if (this.state.surveyVersion == 5.0) {
            this.surveyData['evalNumber'] = 5;
            this.surveyData['evalName'] = 'Phase 1 Evaluation';
            this.surveyData['orderLog'] = this.state.orderLog;
        }

        // upload the results to mongoDB
        this.setState({ uploadData: true }, () => {
            if (this.uploadButtonRef.current) {
                this.uploadButtonRef.current.click();
            }
        });
    }

    onSurveyComplete = (survey) => {
        // final upload
        this.uploadSurveyData(survey, true);
        this.shouldBlockNavigation = false;
        if (this.surveyConfigClone.pages.length < 3) {
            if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0) && survey.valuesHash['Participant ID'] !== this.state.pid) {
                this.setState({ pid: survey.valuesHash['Participant ID'] }, () => {
                    const matchedLog = this.props.participantLog.getParticipantLog.find(
                        log => log['ParticipantID'] == this.state.pid
                    );
                    this.setState({ validPid: isDefined(matchedLog), envsSeen: isDefined(matchedLog) ? matchedLog : this.state.envsSeen }, () => {
                        if (this.state.surveyVersion == 4.0) this.setSeenScenarios();
                    });
                });
            }
            this.postConfigSetup();
        }
        else {
            this.setState({ hasUploaded: true }, () => {
                if (this.state.validPid) {
                    this.setState({ updatePLog: true }, () => {
                        if (this.uploadButtonRefPLog.current) {
                            this.uploadButtonRefPLog.current.click();
                        }
                    });
                }
            });
        }
    }

    finishFirstPage = (survey) => {
        if (survey.currentPageNo == 0 && ((new Date() - this.state.lastTimeCalled) / 1000) > 2) {
            this.setState({ lastTimeCalled: new Date() }, () => {
                this.postConfigSetup();
            });
        }
    };

    onValueChanged = (sender, options) => {
        if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0) && sender.valuesHash['Participant ID'] !== this.state.pid) {
            this.setState({ pid: sender.valuesHash['Participant ID'] }, () => {
                const matchedLog = this.props.participantLog.getParticipantLog.find(
                    log => log['ParticipantID'] == this.state.pid
                );
                if (this.survey.getPageByName("PID Warning"))
                    this.survey.getPageByName("PID Warning").visible = !isDefined(matchedLog);
                this.setState({ validPid: isDefined(matchedLog), envsSeen: isDefined(matchedLog) ? matchedLog : this.state.envsSeen });
            });
        }
        // ensures partial data will be saved if someone needs to step away from the survey
        if (!this.state.surveyId) {
            this.setState({ surveyId: getUID() }, () => {
                this.uploadSurveyData(sender, false);
            })
        } else {
            this.uploadSurveyData(sender, false);
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
                <this.ConfigGetter />
                {this.state.isSurveyLoaded &&
                    <>
                        {this.shouldBlockNavigation && (
                            <Prompt
                                when={this.shouldBlockNavigation}
                                message='Please finish the survey before leaving the page. By hitting "OK", you will be leaving the survey before completion and will be required to start the survey over from the beginning.'
                            />
                        )}
                        <Survey model={this.survey} />
                        {this.state.uploadData && (
                            <Mutation mutation={UPLOAD_SURVEY_RESULTS}>
                                {(uploadSurveyResults, { data }) => (
                                    <div>
                                    <button ref={this.uploadButtonRef} hidden onClick={(e) => {
                                            e.preventDefault();
                                            uploadSurveyResults({
                                                variables: { surveyId: this.state.surveyId, results: this.surveyData }
                                            });
                                            this.setState({ uploadData: false });
                                        }}></button>
                                    </div>
                                )}
                            </Mutation>
                    )}
                    {this.state.updatePLog && (
                        <Mutation mutation={UPDATE_PARTICIPANT_LOG}>
                            {(updateParticipantLog) => (
                                <div>
                                    <button ref={this.uploadButtonRefPLog} hidden onClick={(e) => {
                                        e.preventDefault();
                                        updateParticipantLog({
                                            variables: { pid: this.state.pid, updates: { claimed: true, surveyEntryCount: this.state.initialUploadedCount + (this.state.hasUploaded ? 1 : 0) } }
                                        });
                                        this.setState({ updatePLog: false });
                                    }}></button>
                                </div>
                            )}
                        </Mutation>
                    )}
                        <div style={{
                            position: 'fixed',
                            bottom: '1rem',
                            right: '1rem',
                            backgroundColor: '#592610',
                            color: 'white',
                            padding: '0.5em 0.7em',
                            borderRadius: '0.25rem',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                            Survey v{this.state.surveyVersion}
                        </div>
                </>
                }
            </>
        )
    }
}

export const SurveyPageWrapper = (props) => {
    const { loading: loadingHumanGroupFirst, error: errorHumanGroupFirst, data: dataHumanGroupFirst } = useQuery(COUNT_HUMAN_GROUP_FIRST);
    const { loading: loadingAIGroupFirst, error: errorAIGroupFirst, data: dataAIGroupFirst } = useQuery(COUNT_AI_GROUP_FIRST);
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
      });
    const currentSurveyVersion = useSelector(state => state?.configs?.currentSurveyVersion);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);

    if (loadingHumanGroupFirst || loadingAIGroupFirst || loadingParticipantLog || loadingTextResults || loadingSurveyResults ) return <p>Loading...</p>;
    if (errorHumanGroupFirst || errorAIGroupFirst || errorParticipantLog || errorTextResults || errorSurveyResults ) return <p>Error :</p>;

    return (
        <SurveyPage
            countHumanGroupFirst={dataHumanGroupFirst.countHumanGroupFirst}
            countAIGroupFirst={dataAIGroupFirst.countAIGroupFirst}
            participantLog={dataParticipantLog}
            currentUser={props.currentUser}
            textResults={dataTextResults?.getAllScenarioResults}
            surveyResults={dataSurveyResults.getAllSurveyResults}
            surveyVersion={currentSurveyVersion}
        />)
};

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

ReactQuestionFactory.Instance.registerQuestion("comparison", (props) => {
    return React.createElement(Comparison, props)
})


ReactQuestionFactory.Instance.registerQuestion("adeptComparison", (props) => {
    return React.createElement(AdeptComparison, props)
})

ReactQuestionFactory.Instance.registerQuestion("omnibusComparison", (props) => {
    return React.createElement(OmnibusComparison, props)
})