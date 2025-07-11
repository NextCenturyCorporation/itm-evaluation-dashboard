import React, { Component, useEffect, useRef } from "react";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui"
import surveyTheme from './surveyTheme.json';
import { DynamicTemplatePhase2 } from "./dynamicTemplatePhase2";
import { DynamicTemplate } from "./dynamicTemplate";
import { Omnibus } from "./omnibusTemplate";
import { Comparison } from "./comparison";
import { OmnibusComparison } from "./omnibusComparison";
import { AdeptComparison } from "./adeptComparison";
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { useQuery, useMutation } from 'react-apollo'
import { generateComparisonPagev4_5, getKitwareAdms, getOrderedAdeptTargets, getParallaxAdms, getUID, shuffle, survey3_0_groups, surveyVersion_x_0, orderLog13, getTextScenariosForParticipant, createScenarioBlock, createAFMFBlock } from './surveyUtils';
import Bowser from "bowser";
import { useSelector } from "react-redux";
import { Spinner } from 'react-bootstrap';
import { admOrderMapping, getDelEnvMapping, getEnvMappingToText, getKitwareBaselineMapping, getTadBaselineMapping } from "./delegationMappings";
import { useHistory } from 'react-router-dom';
import { isDefined } from "../AggregateResults/DataFunctions";
import { ComparisonPhase2 } from "./comparisonPhase2";
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


const GET_SERVER_TIMESTAMP = gql`
  mutation GetServerTimestamp {
    getServerTimestamp
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

const ADD_PARTICIPANT = gql`
    mutation addNewParticipantToLog($participantData: JSON!, $lowPid: Int!, $highPid: Int!) {
        addNewParticipantToLog(participantData: $participantData, lowPid: $lowPid, highPid: $highPid) 
    }`;
class SurveyPage extends Component {

    constructor(props) {
        super(props);
        this.queryParams = new URLSearchParams(window.location.search);
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
            pid: this.queryParams.get('pid') ?? null,
            onlineOnly: (isDefined(this.queryParams.get('adeptQualtrix')) || isDefined(this.queryParams.get('caciProlific'))),
            prolificPid: this.queryParams.get('PROLIFIC_PID'),
            contactId: this.queryParams.get('ContactID'),
            validPid: false,
            lastTimeCalled: 0,
            envsSeen: { "Del-1": "AD-1", "Del-2": "ST-3", "ADMOrder": 1 },
            updatePLog: false,
            initialUploadedCount: 0,
            hasUploaded: false,
            surveyComplete: false
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
        this.redirectLinkRef = React.createRef();
        if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0 || this.state.surveyVersion == 6.0) && this.state.pid != null) {
            this.survey.onCurrentPageChanging.add(this.finishFirstPage);
            if (this.state.surveyVersion == 4.0) this.setSeenScenarios();
            this.survey.data = {
                "Participant ID": this.state.pid
            };
            // search to see if this pid has been used before and fully completed the survey
            const pidExists = this.props.surveyResults.filter((res) => (res.results?.surveyVersion == 4 || res.results?.surveyVersion == 5 || res.results?.surveyVersion == 6) && res.results['Participant ID Page']?.questions['Participant ID']?.response == this.state.pid && isDefined(res.results['Post-Scenario Measures']));
            this.setState({ initialUploadedCount: pidExists.length });
            const completedTextSurvey = this.props.textResults.filter((res) => res['participantID'] == this.state.pid && Object.keys(res).includes('mostLeastAligned'));
            if (this.state.validPid || this.state.onlineOnly) {
                if (pidExists.length > 0 && !this.state.onlineOnly) {
                    this.survey.currentPage = 1;
                    this.survey.pages[1].elements[0].name = "Warning: The Participant ID you entered has already been used. Please go back and ensure you have typed in the PID correctly before continuing.";
                    this.survey.pages[1].elements[0].title = "Warning: The Participant ID you entered has already been used. Please go back and ensure you have typed in the PID correctly before continuing.";
                }
                else if (completedTextSurvey.length == 0 && !this.state.onlineOnly) {
                    this.survey.currentPage = 1;
                    this.survey.pages[1].elements[0].name = "Warning: The Participant ID you entered does not have an entry for the text scenarios. Please go back and ensure you have typed in the PID correctly before continuing, or ensure this participant takes the text portion before completing the delegation survey.";
                    this.survey.pages[1].elements[0].title = "Warning: The Participant ID you entered does not have an entry for the text scenarios. Please go back and ensure you have typed in the PID correctly before continuing, or ensure this participant takes the text portion before completing the delegation survey.";
                }
                else {
                    this.survey.currentPage = this.state.onlineOnly ? 3 : 2;
                    if (this.state.onlineOnly) {
                        this.survey.pages[3].elements[0].html = this.survey.pages[3].elements[0].html.split('<br/><br/>').slice(0, -1).join('<br/><br/>').replace('Welcome to the <strong>Military Triage Delegation Experiment</strong>. Here', 'In the final part of the study,');
                        this.survey.pages[0].visibleIf = 'false';
                        this.survey.pages[2].visibleIf = 'false';
                    }
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
        if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0 || this.state.surveyVersion == 6.0) && this.state.pid != null) {
            this.setState({
                isSurveyLoaded: false
            });
        }
        const { groupedDMs, comparisonPages, removed } = this.prepareSurveyInitialization();
        if ((this.state.surveyVersion != 4.0 && this.state.surveyVersion != 5.0 && this.state.surveyVersion != 6.0)) {
            if (this.state.surveyVersion == 1.3) {
                this.assign_omnibus_1_3(groupedDMs)
            }
            this.applyPageRandomization(groupedDMs, comparisonPages, removed);
            if (this.state.orderLog.length < 1) {
                this.setState({ orderLog: orderLog13(this.surveyConfigClone.pages) })
            }
        } else if (this.state.pid != null) {
            this.setState({
                isSurveyLoaded: true
            });
        }
    }

    assign_omnibus_1_3 = (groupedDMs) => {
        let firstOmnibus = this.surveyConfigClone.pages.find(page => page.name === "Omnibus: Medic-301")
        let secondOmnibus = this.surveyConfigClone.pages.find(page => page.name === "Omnibus: Medic-502")
        groupedDMs.forEach(pairing => {
            if (Math.random() < 0.5) {
                firstOmnibus.elements[0].decisionMakers.push(pairing[0]);
                secondOmnibus.elements[0].decisionMakers.push(pairing[1]);
            } else {
                firstOmnibus.elements[0].decisionMakers.push(pairing[1]);
                secondOmnibus.elements[0].decisionMakers.push(pairing[0]);
            }
        })
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
        else if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0 || this.state.surveyVersion == 6.0) && this.state.pid == null) {
            this.surveyConfigClone.pages = [this.surveyConfigClone.pages[0]];

            return {};
        }
        else if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0)) {
            let scenariosToSee = this.state.envsSeen;
            if (this.state.surveyVersion == 5.0 && this.state.onlineOnly) {
                const matchedLog = this.props.participantLog.getParticipantLog.find(
                    log => log['ParticipantID'] == this.state.pid
                );
                scenariosToSee = isDefined(matchedLog) ? matchedLog : this.state.envsSeen
                this.setState({ envsSeen: scenariosToSee });
            }
            const allPages = this.surveyConfigClone.pages;
            const pages = [...allPages.slice(0, 5)];
            const order = admOrderMapping[scenariosToSee['ADMOrder']];
            // author is TAD or kitware, alignment is the target name, admType is aligned or baseline, scenarioName is SoarTech VOL 1, etc.
            const del1 = scenariosToSee['Del-1'];
            const stScenario = getDelEnvMapping(this.state.surveyVersion)[del1.includes("ST") ? del1 : scenariosToSee['Del-2']];
            const adScenario = getDelEnvMapping(this.state.surveyVersion)[del1.includes("AD") ? del1 : scenariosToSee['Del-2']];
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
                    if ((this.state.onlineOnly || this.state.validPid) && isDefined(adeptMostLeast['Ingroup']) && isDefined(adeptMostLeast['Moral']) && isDefined(admLists['qol']) && isDefined(admLists['vol'])) {
                        adms = getKitwareAdms(this.state.surveyVersion, expectedScenario, adeptMostLeast['Ingroup'], adeptMostLeast['Moral'], admLists['qol']['mostLeastAligned'][0]['response'], admLists['vol']['mostLeastAligned'][0]['response']);
                    } else {
                        adms = getKitwareAdms(this.state.surveyVersion, expectedScenario, null, null, null, null);
                    }
                }
                else {
                    if ((this.state.onlineOnly || this.state.validPid) && isDefined(adeptMostLeast['Ingroup']) && isDefined(adeptMostLeast['Moral']) && isDefined(admLists['qol']) && isDefined(admLists['vol'])) {
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
                } else { console.warn("Missing Baseline ADM for " + expectedScenario + " - " + expectedAuthor + " - " + baselineADMTarget); }
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
                } else { console.warn("Missing Misaligned ADM for " + expectedScenario + " - " + expectedAuthor + " - " + misalignedADMTarget); }
                shuffle(pagesToShuffle);
                pages.push(...pagesToShuffle);
                if (baselineAdm)
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
        else if (this.state.surveyVersion == 1.3 || this.state.surveyVersion == 1.0) {
            let groupedDMs = shuffle([...this.surveyConfigClone.groupedDMs]);
            // remove one scenario at random (we only want three randomly selected scenarios out of the bucket of four)
            let removed = groupedDMs.pop();
            // comparison page name to be removed
            removed.push(`${removed[0]} vs ${removed[1]}`);

            let comparisonPages = { ...this.surveyConfigClone.comparisonPages };
            delete comparisonPages[`${removed[0]}${removed[1]}`];

            return { groupedDMs, removed, comparisonPages };
        }
        else if (this.state.surveyVersion == 6.0) {
            const allPages = this.surveyConfigClone.pages;
            const introPages = [...allPages.slice(0, 4)];

            const textScenarios = getTextScenariosForParticipant(this.state.pid, this.props.participantLog);
            const participantTextResults = this.props.textResults.filter(
                (res) => res['participantID'] == this.state.pid
            );
            console.log("Participant text results:", participantTextResults);

            const allBlocks = [];
            const scenarioTypes = ['AF', 'MF', 'PS', 'SS'];

            for (const scenarioType of scenarioTypes) {
                const block = createScenarioBlock(
                    scenarioType,
                    textScenarios[`${scenarioType}-text-scenario`],
                    allPages,
                    participantTextResults
                );
                if (block) {
                    allBlocks.push(block);
                }
            }

            // mutli attribute
            const afMfBlock = createAFMFBlock(textScenarios, allPages, participantTextResults);
            if (afMfBlock) {
                allBlocks.push(afMfBlock);
            }

            // randomize blocks
            const shuffledBlocks = shuffle(allBlocks);
            const selectedPages = [];

            shuffledBlocks.forEach(block => {
                selectedPages.push(...block.pages);
            });

            const finalPages = [...introPages, ...selectedPages];
            const postScenarioPage = allPages.find(page => page.name === "Post-Scenario Measures");
            if (postScenarioPage) {
                finalPages.push(postScenarioPage);
            }

            this.surveyConfigClone.pages = finalPages;
            console.log(this.surveyConfigClone.pages);

            const pageOrder = finalPages.map(page => page.name);
            this.setState({ orderLog: pageOrder });

            return {};
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

    onAfterRenderPage = async (sender, options) => {
        // setTimeout makes the scroll work consistently
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 25);

        // record start time after first page completed
        if (!sender.isFirstPage && !this.state.firstPageCompleted) {
            const timestamp = await this.props.getServerTimestamp();
            this.setState({
                firstPageCompleted: true,
                startTime: timestamp.data.getServerTimestamp
            });

            if (this.state.surveyVersion == 1.3 && this.props.addParticipant) {
                try {
                    const participantData = {
                        claimed: true
                    }
                    const result = await this.props.addParticipant({
                        variables: {
                            participantData: participantData,
                            lowPid: 202504000,
                            highPid: 202504199
                        }
                    })
                    const generatedPid = result.data.addNewParticipantToLog.generatedPid
                    this.setState({ pid: generatedPid })
                } catch (error) {
                    console.error("Error generating new PID", error)
                }
            }
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


    uploadSurveyData = async (survey, finalUpload) => {
        if (finalUpload && survey.PageCount > 1) {
            this.setState({ surveyComplete: true });
        }
        this.timerHelper()

        const timestamp = await this.props.getServerTimestamp();
        const timeComplete = timestamp.data.getServerTimestamp;

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
                    admChoiceProcess: page?.admStatus ?? page?.admChoiceProcess,
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
        this.surveyData.timeComplete = timeComplete;
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

        if (this.state.surveyVersion == 6.0) {
            this.surveyData['evalName'] = 'June 2025 Collaboration'
            this.surveyData['evalNumber'] = 8
            this.surveyData['pid'] = this.state.pid;
            this.surveyData['orderLog'] = this.state.orderLog;
            if (this.state.pid) {
                this.surveyData['Participant ID Page'] = { 'pageName': 'Participant ID Page', 'questions': { 'Participant ID': { 'response': this.state.pid } } };
            }
        }

        if (this.state.surveyVersion == 1.3) {
            this.surveyData['evalName'] = 'April 2025 Evaluation';
            this.surveyData['evalNumber'] = 8;
            this.surveyData['pid'] = this.state.pid;
            this.surveyData['orderLog'] = this.state.orderLog
        }

        if (this.state.surveyVersion == 4.0) {
            this.surveyData['evalNumber'] = 4;
            this.surveyData['evalName'] = 'Dry Run Evaluation';
            this.surveyData['orderLog'] = this.state.orderLog;
        }
        if (this.state.surveyVersion == 5.0) {
            this.surveyData['evalNumber'] = 6;
            this.surveyData['evalName'] = 'Jan 2025 Eval';
            this.surveyData['orderLog'] = this.state.orderLog;
            this.surveyData['pid'] = this.state.pid;
            if (this.state.pid) {
                this.surveyData['Participant ID Page'] = { 'pageName': 'Participant ID Page', 'questions': { 'Participant ID': { 'response': this.state.pid } } };
            }
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
        if (this.surveyConfigClone.pages.length < 3) {
            if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0 || this.state.surveyVersion == 6.0) && survey.valuesHash['Participant ID'] !== this.state.pid && !this.state.onlineOnly) {
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
                if (this.state.validPid || this.state.onlineOnly) {
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
        if (!this.state.onlineOnly && survey.currentPageNo == 0 && ((new Date() - this.state.lastTimeCalled) / 1000) > 2) {
            this.setState({ lastTimeCalled: new Date() }, () => {
                this.postConfigSetup();
            });
        }
    };

    onValueChanged = (sender, options) => {
        if ((this.state.surveyVersion == 4.0 || this.state.surveyVersion == 5.0 || this.state.surveyVersion == 6.0) && sender.valuesHash['Participant ID'] !== this.state.pid && !this.state.onlineOnly) {
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

    getRedirectUrl = () => {
        if (this.queryParams.get('caciProlific') === 'true') {
            return 'https://app.prolific.com/submissions/complete?cc=C155IMPM';
        }
        return `https://singuser67d7ec86.sjc1.qualtrics.com/jfe/form/SV_0pUd3RTN39qu9qS/?participant_id=${this.state.pid}&PROLIFIC_PID=${this.state.prolificPid}&ContactID=${this.state.contactId}`;
    }

    render() {
        return (
            <>
                <NavigationGuard surveyComplete={this.state.surveyComplete} />
                <this.ConfigGetter />
                {this.state.isSurveyLoaded &&
                    <>
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
                            <Mutation mutation={UPDATE_PARTICIPANT_LOG} onCompleted={() => { this.state.onlineOnly && this.redirectLinkRef?.current?.click() }}>
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
                        {this.surveyComplete && (this.state.updatePLog || this.state.uploadData) && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                                    <Spinner animation="border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </Spinner>
                                    <p style={{ marginTop: '10px' }}>Uploading documents, please wait...</p>
                                </div>
                            </div>
                        )}
                        <a
                            ref={this.redirectLinkRef}
                            hidden
                            href={this.getRedirectUrl()}
                        />
                    </>
                }
            </>
        )
    }
}

export const SurveyPageWrapper = (props) => {
    const { loading: loadingHumanGroupFirst, error: errorHumanGroupFirst, data: dataHumanGroupFirst } = useQuery(COUNT_HUMAN_GROUP_FIRST);
    const { loading: loadingAIGroupFirst, error: errorAIGroupFirst, data: dataAIGroupFirst } = useQuery(COUNT_AI_GROUP_FIRST);
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const currentSurveyVersion = useSelector(state => state?.configs?.currentSurveyVersion);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const [getServerTimestamp] = useMutation(GET_SERVER_TIMESTAMP)
    const [addParticipant] = useMutation(ADD_PARTICIPANT);

    if (loadingHumanGroupFirst || loadingAIGroupFirst || loadingParticipantLog || loadingTextResults || loadingSurveyResults) return <p>Loading...</p>;
    if (errorHumanGroupFirst || errorAIGroupFirst || errorParticipantLog || errorTextResults || errorSurveyResults) return <p>Error :</p>;

    return (
        <SurveyPage
            countHumanGroupFirst={dataHumanGroupFirst.countHumanGroupFirst}
            countAIGroupFirst={dataAIGroupFirst.countAIGroupFirst}
            participantLog={dataParticipantLog}
            currentUser={props.currentUser}
            textResults={dataTextResults?.getAllScenarioResults}
            surveyResults={dataSurveyResults.getAllSurveyResults}
            surveyVersion={currentSurveyVersion}
            getServerTimestamp={getServerTimestamp}
            addParticipant={addParticipant}
        />)
};

export const NavigationGuard = ({ surveyComplete }) => {
    const history = useHistory();
    const isHandlingNavigation = useRef(false);
    const initialUrl = useRef(window.location.href);
    const pendingNavigation = useRef(null);

    useEffect(() => {
        if (surveyComplete) return;

        const confirmationMessage = 'Please finish the survey before leaving the page. If you leave now, you will need to start the survey over from the beginning.';

        const handleNavigation = (location) => {
            if (surveyComplete) {
                return true;
            }

            if (isHandlingNavigation.current) {
                return false;
            }

            isHandlingNavigation.current = true;
            pendingNavigation.current = location;

            try {
                const shouldNavigate = window.confirm(confirmationMessage);

                if (shouldNavigate) {
                    // Unblock future navigations
                    isHandlingNavigation.current = false;

                    // Execute the navigation
                    setTimeout(() => {
                        if (location.pathname === window.location.pathname) {
                            // If trying to go back to the same path (like with back button)
                            window.history.back();
                        } else {
                            history.push(location.pathname);
                        }
                    }, 0);
                } else {
                    window.history.replaceState(null, '', initialUrl.current);
                }

                isHandlingNavigation.current = false;
                return false;
            } finally {
                isHandlingNavigation.current = false;
            }
        };

        const handleBeforeUnload = (e) => {
            if (!surveyComplete) {
                e.preventDefault();
                e.returnValue = confirmationMessage;
                return confirmationMessage;
            }
        };

        // Handle tab/browser close
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Block navigation and handle confirmation
        const unblock = history.block(handleNavigation);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            unblock();
            pendingNavigation.current = null;
        };
    }, [history, surveyComplete]);

    return null;
};

export default SurveyPage;

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

ReactQuestionFactory.Instance.registerQuestion("dynamic-template-phase-2", (props) => {
    return React.createElement(DynamicTemplatePhase2, props)
})

ReactQuestionFactory.Instance.registerQuestion("comparison-phase-2", (props) => {
    return React.createElement(ComparisonPhase2, props)
})