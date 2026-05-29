import React, { Component, useEffect, useRef } from "react";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui"
import surveyTheme from './surveyTheme.json';
import { DynamicTemplatePhase2 } from "./dynamicTemplatePhase2";
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import { useQuery, useMutation } from 'react-apollo'
import { getUID, shuffle, surveyVersion_x_0, getTextScenariosForParticipant, createScenarioBlock, createAFMFBlock, createScenarioBlockv8, createScenarioBlockUK, createScenarioBlockv10, createScenarioBlockv11, createScenarioBlockv12} from './surveyUtils';
import Bowser from "bowser";
import { useSelector } from "react-redux";
import { Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { isDefined } from "../AggregateResults/DataFunctions";
import { ComparisonPhase2 } from "./comparisonPhase2";

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
const GET_EVAL_DATA = gql`
    query GetEvalData($evalNumber: Float) {
        getAllScenarioResultsByEval(evalNumber: $evalNumber)
        getAllSurveyResultsByEval(evalNumber: $evalNumber)
    }`;

export const SURVEY_VERSION_DATA = {
    "12.0": {evalName: 'June 2026 Evaluation', evalNumber: 17},
    "11.0": { evalName: 'April 2026 Evaluation', evalNumber: 16 },
    "10.0": { evalName: 'February 2026 Evaluation', evalNumber: 15 },
    "9.0": { evalName: 'Eval 12 UK Phase 1', evalNumber: 12 },
    "8.0": { evalName: 'September 2025 Collaboration', evalNumber: 10 },
    "7.0": { evalName: 'July 2025 Collaboration', evalNumber: 9 },
    "6.0": { evalName: 'June 2025 Collaboration', evalNumber: 8 }
};
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
            browserInfo: null,
            isSurveyLoaded: false,
            orderLog: [],
            pid: this.queryParams.get('pid') ?? null,
            onlineOnly: (isDefined(this.queryParams.get('adeptQualtrix')) || isDefined(this.queryParams.get('caciProlific'))),
            prolificPid: this.queryParams.get('PROLIFIC_PID'),
            contactId: this.queryParams.get('ContactID'),
            validPid: false,
            lastTimeCalled: 0,
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

    inSurveyVersionData = () => {
        return Object.keys(SURVEY_VERSION_DATA).includes(this.state.surveyVersion);
    }

    postConfigSetup = () => {
        this.surveyConfigClone = structuredClone(this.state.surveyConfig);
        if (this.inSurveyVersionData() && this.state.pid != null) {
            this.setState({ isSurveyLoaded: false });
        }
        this.prepareSurveyInitialization();

        this.survey = new Model(this.surveyConfigClone);
        this.survey.applyTheme(surveyTheme);

        this.surveyData = {};
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onValueChanged.add(this.onValueChanged)
        this.survey.onComplete.add(this.onSurveyComplete);
        this.uploadButtonRef = React.createRef();
        this.uploadButtonRefPLog = React.createRef();
        this.redirectLinkRef = React.createRef();

        if (this.inSurveyVersionData() && this.state.pid != null) {
            this.survey.onCurrentPageChanging.add(this.finishFirstPage);
            this.survey.data = {
                "Participant ID": this.state.pid
            };
            // search to see if this pid has been used before and fully completed the survey
            const pidExists = this.props.surveyResults.filter((res) =>
                res.results['Participant ID Page']?.questions['Participant ID']?.response === this.state.pid &&
                (res.results.surveyVersion >= 10 || isDefined(res.results['Post-Scenario Measures']))
            );
            this.setState({ initialUploadedCount: pidExists.length });
            const completedTextSurvey = this.props.textResults.filter((res) => String(res['participantID']) === this.state.pid && (Object.keys(res).includes('mostLeastAligned') || Object.keys(res).includes('combinedMostLeastAligned')));
            if (this.state.validPid || this.state.onlineOnly) {
                if (pidExists.length > 0 && !this.state.onlineOnly) {
                    this.survey.currentPage = 1;
                    this.survey.pages[1].elements[0].name = "Warning: The Participant ID you entered has already been used. Please go back and ensure you have typed in the PID correctly before continuing.";
                    this.survey.pages[1].elements[0].title = "Warning: The Participant ID you entered has already been used. Please go back and ensure you have typed in the PID correctly before continuing.";
                }
                else if (completedTextSurvey.length === 0 && !this.state.onlineOnly) {
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

    prepareSurveyInitialization = () => {
        if (this.inSurveyVersionData() && this.state.pid == null) {
            this.surveyConfigClone.pages = [this.surveyConfigClone.pages[0]];
            return;
        }

        const allPages = this.surveyConfigClone.pages;
        const introPages = [...allPages.slice(0, 4)];
        const participantTextResults = this.props.textResults.filter(
            (res) => String(res['participantID']) === this.state.pid
        );
        const postScenarioPage = allPages.find(page => page.name === "Post-Scenario Measures");

        const finalize = (blocks, getPages = block => block.pages) => {
            const finalPages = [...introPages, ...blocks.flatMap(getPages)];
            if (postScenarioPage) finalPages.push(postScenarioPage);
            this.surveyConfigClone.pages = finalPages;
            this.setState({ orderLog: finalPages.map(page => page.name) });
        };

        const version = this.state.surveyVersion;

        if (version === "6.0" || version === "7.0") {
            const textScenarios = getTextScenariosForParticipant(this.state.pid, this.props.participantLog);
            const allBlocks = ['AF', 'MF', 'PS', 'SS']
                .map(type => createScenarioBlock(type, textScenarios[`${type}-text-scenario`], allPages, participantTextResults, SURVEY_VERSION_DATA[version].evalNumber))
                .filter(Boolean);
            const afMfBlock = createAFMFBlock(textScenarios, allPages, participantTextResults);
            if (afMfBlock) allBlocks.push(afMfBlock);
            finalize(shuffle(allBlocks));
        } else if (version === "8.0") {
            const matchedLog = this.props.participantLog.getParticipantLog.find(
                log => String(log['ParticipantID']) === this.state.pid
            );
            const allBlocks = ['AF', 'PS', 'PS-AF', 'combined']
                .map(type => createScenarioBlockv8(type, matchedLog, allPages))
                .filter(Boolean);
            finalize(shuffle(allBlocks), block => block);
        } else if (version === "9.0") {
            const allBlocks = ['MJ', 'IO', 'VOL']
                .map(type => createScenarioBlockUK(type, allPages, participantTextResults))
                .filter(Boolean);
            finalize(shuffle(allBlocks), block => block);
        } else if (version === "10.0") {
            const twoDBlock = (type) => {
                const models = shuffle(['mistral', 'llama']);
                return [{ type, model: models[0], scenario: 1 }, { type, model: models[1], scenario: 2 }];
            };
            const allBlocks = [...twoDBlock('AF-PS'), ...twoDBlock('MF-SS'), { type: 'MF3', model: 'mistral' }]
                .map(({ type, model, scenario }) => createScenarioBlockv10(type, model, allPages, participantTextResults, scenario))
                .filter(Boolean);
            finalize(shuffle(allBlocks));
        } else if (version === "11.0") {
            const isEven = parseInt(this.state.pid, 10) % 2 === 0;
            const getVersion = (type) => type.startsWith('MF') === isEven ? 'A' : 'B';
            const allBlocks = ['AF-PS', 'MF-PS', 'MF', 'AF']
                .map(type => createScenarioBlockv11(type, allPages, participantTextResults, getVersion(type), this.state.onlineOnly))
                .filter(Boolean);
            finalize(shuffle(allBlocks));
        } else if (version === "12.0") {
            const blockTypes = shuffle([
                { attr: 'AF', type: 'tri' }, { attr: 'AF', type: 'bi' },
                { attr: 'PS', type: 'tri' }, { attr: 'PS', type: 'bi' },
                { attr: 'AF-SS', type: '2D' },
            ]);
            const allBlocks = blockTypes
                .map(blockType => createScenarioBlockv12(blockType, allPages, participantTextResults))
                .filter(Boolean);
            finalize(allBlocks);
        }
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

        }

        const pageName = options.page.name;
        if (pageName === 'VR Page') {
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
                    subpop: page?.subpop,
                    questions: {}
                };

                //comparison page
                if (page?.name?.includes('vs')) {
                    this.surveyData[pageName]['baselineName'] = page?.baselineName
                    this.surveyData[pageName]['baselineTarget'] = page?.baselineTarget
                    this.surveyData[pageName]['alignedTarget'] = page?.alignedTarget
                    this.surveyData[pageName]['misalignedTarget'] = page?.misalignedTarget
                    this.surveyData[pageName]['admAuthor'] = page?.admAuthor
                    if (page?.alignedSubpop) {
                        this.surveyData[pageName]['alignedSubpop'] = page.alignedSubpop;
                        this.surveyData[pageName]['otherSubpopName'] = page.otherSubpopName;
                        this.surveyData[pageName]['otherSubpopTarget'] = page.otherSubpopTarget;
                        this.surveyData[pageName]['otherSubpop'] = page.otherSubpop;
                        this.surveyData[pageName]['leastAlignedName'] = page.leastAlignedName;
                        this.surveyData[pageName]['leastAlignedTarget'] = page.leastAlignedTarget;
                    }
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

        const versionData = SURVEY_VERSION_DATA[this.state.surveyVersion];

        if (versionData) {
            Object.assign(this.surveyData, {
                evalName: versionData.evalName,
                evalNumber: versionData.evalNumber,
                orderLog: this.state.orderLog
            });

            if (this.state.pid) {
                this.surveyData.pid = this.state.pid;
                this.surveyData['Participant ID Page'] = {
                    pageName: 'Participant ID Page',
                    questions: {
                        'Participant ID': { response: this.state.pid }
                    }
                };
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
            if (this.inSurveyVersionData() && survey.valuesHash['Participant ID'] !== this.state.pid && !this.state.onlineOnly) {
                this.setState({ pid: survey.valuesHash['Participant ID'] }, () => {
                    const matchedLog = this.props.participantLog.getParticipantLog.find(
                        log => String(log['ParticipantID']) === this.state.pid
                    );
                    this.setState({ validPid: isDefined(matchedLog) });
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
        if (!this.state.onlineOnly && survey.currentPageNo === 0 && ((new Date() - this.state.lastTimeCalled) / 1000) > 2) {
            this.setState({ lastTimeCalled: new Date() }, () => {
                this.postConfigSetup();
            });
        }
    };

    onValueChanged = (sender, options) => {
        if (this.inSurveyVersionData() && sender.valuesHash['Participant ID'] !== this.state.pid && !this.state.onlineOnly) {
            this.setState({ pid: sender.valuesHash['Participant ID'] }, () => {
                const matchedLog = this.props.participantLog.getParticipantLog.find(
                    log => String(log['ParticipantID']) === this.state.pid
                );
                if (this.survey.getPageByName("PID Warning"))
                    this.survey.getPageByName("PID Warning").visible = !isDefined(matchedLog);
                this.setState({ validPid: isDefined(matchedLog) });
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
                            aria-label="Survey completion redirect link"
                        />
                    </>
                }
            </>
        )
    }
}

export const SurveyPageWrapper = (props) => {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const currentSurveyVersion = useSelector(state => state?.configs?.currentSurveyVersion);
    const surveyConfigs = useSelector(state => state?.configs?.surveyConfigs)
    const evalNumber = SURVEY_VERSION_DATA[currentSurveyVersion]?.evalNumber;

    const { loading: loadingEvalData, error: errorEvalData, data: dataEvalData } = useQuery(GET_EVAL_DATA, {
        variables: { evalNumber },
        fetchPolicy: 'no-cache',
        skip: !evalNumber
    });
    const [getServerTimestamp] = useMutation(GET_SERVER_TIMESTAMP)

    if (loadingParticipantLog || loadingEvalData || !surveyConfigs) return <p>Loading...</p>;
    if (errorParticipantLog || errorEvalData) return <p>Error :</p>;

    return (
        <SurveyPage
            participantLog={dataParticipantLog}
            currentUser={props.currentUser}
            textResults={dataEvalData?.getAllScenarioResultsByEval ?? []}
            surveyResults={dataEvalData?.getAllSurveyResultsByEval ?? []}
            surveyVersion={currentSurveyVersion}
            getServerTimestamp={getServerTimestamp}
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

ReactQuestionFactory.Instance.registerQuestion("dynamic-template-phase-2", (props) => {
    return React.createElement(DynamicTemplatePhase2, props)
})

ReactQuestionFactory.Instance.registerQuestion("comparison-phase-2", (props) => {
    return React.createElement(ComparisonPhase2, props)
})