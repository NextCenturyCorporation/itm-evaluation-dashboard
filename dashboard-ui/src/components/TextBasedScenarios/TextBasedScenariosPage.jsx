import React, { Component } from 'react';
import { submitResponses as sharedSubmitResponses, getMostLeastAligned, getKdmaProfile, getAdeptUrl as sharedGetAdeptUrl, getSubPop, createAdeptSession } from './adeptUtils';
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui";
import surveyTheme from './surveyTheme.json';
import gql from "graphql-tag";
import { Mutation } from '@apollo/react-components';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Card, Container, Row, Col, Spinner, Button, Modal } from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import { isDefined } from '../AggregateResults/DataFunctions';
import { shuffle } from '../Survey/surveyUtils';
import history from '../App/history';
import { SurveyPageWrapper } from '../Survey/survey';
import { NavigationGuard } from '../Survey/survey';
import { evalNameToNumber, scenarioIdsFromLog } from '../OnlineOnly/config';
import consentPdf from '../OnlineOnly/consent.pdf';
import '../../css/scenario-page.css';
import { Phase2Text } from './phase2Text';
import { useHistory } from 'react-router-dom';
import ScenarioProgress from './scenarioProgress';

const UPLOAD_DEMOGRAPHICS = gql`
  mutation UploadDemographics($surveyId: String, $results: JSON) {
    uploadDemographics(surveyId: $surveyId, results: $results)
  }`;

const GET_SERVER_TIMESTAMP = gql`
  mutation GetServerTimestamp {
    getServerTimestamp
  }
`;

const UPLOAD_SCENARIO_RESULTS = gql`
    mutation uploadScenarioResults($results: [JSON]) {
        uploadScenarioResults(results: $results)
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const UPDATE_PARTICIPANT_LOG = gql`
    mutation updateParticipantLog($pid: String!, $updates: JSON!) {
        updateParticipantLog(pid: $pid, updates: $updates) 
    }`;


export function TextBasedScenariosPageWrapper(props) {
    const currentTextEval = useSelector(state => state.configs.currentTextEval)
    const showDemographics = useSelector(state => state.configs.showDemographics)
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const { loading: participantLogLoading, error: participantLogError, data: participantLogData } = useQuery(GET_PARTICIPANT_LOG,
        { fetchPolicy: 'no-cache' });

    // server side time stamps
    const [getServerTimestamp] = useMutation(GET_SERVER_TIMESTAMP);

    if (participantLogLoading) return <p>Loading...</p>;
    if (participantLogError) return <p>Error</p>;

    return <TextBasedScenariosPage
        {...props}
        textBasedConfigs={textBasedConfigs}
        currentTextEval={currentTextEval}
        participantLogs={participantLogData}
        getServerTimestamp={getServerTimestamp}
        showDemographics={showDemographics}
    />;
}

class TextBasedScenariosPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentConfig: null,
            uploadData: false,
            participantID: "",
            startTime: null,
            scenarios: [],
            currentScenarioIndex: 0,
            sanitizedData: null,
            matchedParticipantLog: null,
            allScenariosCompleted: false,
            sim1: null,
            sim2: null,
            isUploadButtonEnabled: false,
            adeptSessionsCompleted: 0,
            combinedSessionId: '',
            adeptScenarios: [],
            uploadedScenarios: 0,
            startSurvey: true,
            updatePLog: false,
            startCount: 0,
            onlineOnly: false,
            skipText: false,
            showDemographics: props.showDemographics,
            demographicsConfig: null,
            demographicsCompleted: false,
            demographicsUploadData: null,
            isDemographicsUploadEnabled: false,
            demographicsStartTime: null,
            adeptGroupState: {},
            showConsentForm: false,
            consentGiven: false,
            eval16CombinedSessionId: null,
            eval16Scenarios: [],
            eval16Groups: {
                'AF-PS': [],
                'MF-PS': [],
            },
            eval16SubPopResult: null,
        };

        this.surveyData = {};
        this.survey = null;
        this.pageStartTimes = {};
        this.uploadButtonRef = React.createRef();
        this.uploadButtonRefDemographics = React.createRef();
        this.uploadButtonRefPLog = React.createRef();
        this.shouldBlockNavigation = true;
    }

    handleConsentResponse = (agree) => {
        if (!agree) {
            // Redirect based on entry point
            if (this.state.onlineOnly) {
                const queryParams = new URLSearchParams(window.location.search);
                const caciProlific = queryParams.get('caciProlific');
                if (caciProlific === 'true') {
                    window.location.href = 'https://app.prolific.com/submissions/complete?cc=C155IMPM';
                } else {
                    history.push('/participantText');
                }
            } else {
                history.push('/login');
            }
        } else {
            this.setState({
                showConsentForm: false,
                consentGiven: true
            });
        }
    };

    getAdeptUrl = () => {
        return sharedGetAdeptUrl(evalNameToNumber[this.props.currentTextEval]);
    }

    startScenarios = () => {
        const { participantID } = this.state;

        // Match entered participant id to log to determine scenario order
        let matchedLog = this.props.participantLogs.getParticipantLog.find(
            log => String(log['ParticipantID']) === participantID
        );

        if (matchedLog) {
            this.setState({ updatePLog: true, startCount: matchedLog['textEntryCount'] }, () => {
                if (this.uploadButtonRefPLog.current) {
                    this.uploadButtonRefPLog.current.click();
                }
            });
        }

        if (!matchedLog) {
            // If no match found, create default scenario set
            const scenarioSet = Math.floor(Math.random() * 2) + 1;
            matchedLog = {
                'AF-text-scenario': scenarioSet,
                'MF-text-scenario': scenarioSet,
                'PS-text-scenario': scenarioSet,
                'SS-text-scenario': scenarioSet
            };
        }

        const scenarios = this.scenariosFromLog(matchedLog);

        this.setState({
            scenarios,
            matchedParticipantLog: matchedLog,
            currentScenarioIndex: 0,
            startSurvey: true
        }, () => {
            if (this.state.scenarios.length > 0) {
                this.loadNextScenario();
            }
        });
    };

    loadDemographicsSurvey = () => {
        const demographicsConfig = Object.values(this.props.textBasedConfigs).find(
            config => config.name === 'Post-Scenario Measures Phase 2'
        );

        if (demographicsConfig) {
            const configCopy = JSON.parse(JSON.stringify(demographicsConfig));
            configCopy.showTitle = false;

            if (this.state.onlineOnly && configCopy.pages?.elements) {
                configCopy.pages.elements = configCopy.pages.elements.filter(el =>
                    !el.name?.toLowerCase().includes('virtual reality')
                );
            }
        
            const surveyModel = new Model(configCopy);
            surveyModel.applyTheme(surveyTheme);
            surveyModel.onComplete.add(this.demographicsSurveyComplete);

            this.props.getServerTimestamp().then(startTime => {
                this.setState({
                    demographicsStartTime: startTime.data.getServerTimestamp
                });
            });

            this.setState({
                demographicsConfig: surveyModel,
                showDemographicsSurvey: true
            });
        }
    };

    demographicsSurveyComplete = async (survey) => {
        const endStamp = await this.props.getServerTimestamp();

        let results = {}
        results['Post-Scenario Measures'] = survey.data
        results.evalNumber = evalNameToNumber[this.props.currentTextEval]
        results.evalName = (this.props.currentTextEval).replace(/Phase 2\s*/g, '')
        results.timeComplete = endStamp.data.getServerTimestamp
        results.startTime = this.state.demographicsStartTime
        results.pid = this.state.participantID

        const sanitizedData = this.sanitizeKeys(results);

        this.setState({
            demographicsUploadData: sanitizedData,
            isDemographicsUploadEnabled: true
        }, () => {
            if (this.uploadButtonRefDemographics.current) {
                this.uploadButtonRefDemographics.current.click();
            }
        });
    };

    scenariosFromLog = (participantLog) => {
        const scenarioIds = scenarioIdsFromLog(participantLog, this.props.currentTextEval)
        const configMap = {};
        Object.values(this.props.textBasedConfigs).forEach(config => {
            if (config.scenario_id) {
                configMap[config.scenario_id] = config;
            }
        });

        // Preserve the order from scenarioIds by mapping in sequence
        const scenarios = scenarioIds
            .map(id => configMap[id])
            .filter(config => config !== undefined);

        return scenarios;
    }

    loadNextScenario = async () => {
        const { scenarios, currentScenarioIndex } = this.state;
        if (currentScenarioIndex < scenarios.length) {
            const currentScenario = scenarios[currentScenarioIndex];
            this.loadSurveyConfig([currentScenario], currentScenario.title);

            this.props.getServerTimestamp().then(newStartTime => {
                this.setState({ startTime: newStartTime.data.getServerTimestamp });
            });
        } else {
            this.handleAllScenariosCompleted();
        }
    }

    handleAllScenariosCompleted = () => {
        const { matchedParticipantLog } = this.state;
        if (matchedParticipantLog) {
            this.setState({
                allScenariosCompleted: true,
            });
        } else {
            this.setState({ allScenariosCompleted: true });
        }

        if (this.state.showDemographics) {
            this.loadDemographicsSurvey();
        }
    }

    componentDidMount() {
        const queryParams = new URLSearchParams(window.location.search);
        const pid = queryParams.get('pid');
        const adeptQualtrix = queryParams.get('adeptQualtrix');
        const caciProlific = queryParams.get('caciProlific');
        const startSurvey = queryParams.get('startSurvey');

        if (isDefined(pid)) {
            this.setState({
                participantID: pid,
                showConsentForm: true
            });

            if (isDefined(adeptQualtrix) || isDefined(caciProlific)) {
                if (startSurvey === 'true') {
                    this.setState({ onlineOnly: true, skipText: true });
                } else {
                    this.setState({ onlineOnly: true, startSurvey: false });
                }
            } else {
                this.setState({ startSurvey: false });
            }
        } else {
            history.push('/');
        }
    }

    sanitizeKeys = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(this.sanitizeKeys);
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((acc, key) => {
                const newKey = key.replace(/\./g, '');
                acc[newKey] = this.sanitizeKeys(obj[key]);
                return acc;
            }, {});
        }
        return obj;
    };

    uploadResults = async (survey) => {
        this.timerHelper();

        const currentScenario = this.state.scenarios[this.state.currentScenarioIndex];
        const endStamp = await this.props.getServerTimestamp();
        let scenarioData = {
            scenario_id: currentScenario.scenario_id,
            author: currentScenario.author,
            participantID: this.state.participantID,
            title: currentScenario.title,
            timeComplete: endStamp.data.getServerTimestamp,
            startTime: this.state.startTime
        };

        const currentPages = survey.pages;

        currentPages.forEach(page => {
            const pageName = page.name;
            scenarioData[pageName] = {
                timeSpentOnPage: this.surveyData[pageName]?.timeSpentOnPage || 0,
                pageName: page.name,
                questions: {}
            };

            page.questions.forEach(question => {
                const questionName = question.name;
                const questionValue = survey.data[questionName];
                scenarioData[pageName].questions[questionName] = {
                    response: questionValue,
                    question_mapping: question.jsonObj['question_mapping'] || {}
                };
            });
        });

        scenarioData.scenarioOrder = this.state.scenarios.map(scenario => scenario.scenario_id)
        scenarioData.evalNumber = evalNameToNumber[this.props.currentTextEval]
        scenarioData.evalName = (this.props.currentTextEval).replace(/Phase 2\s*/g, '')
        await this.getAlignmentScore(scenarioData)
        const sanitizedData = this.sanitizeKeys(scenarioData);

        this.setState({
            uploadData: true,
            sanitizedData,
            isUploadButtonEnabled: true
        });

        this.surveyData = {};
        this.pageStartTimes = {};
        this.shouldBlockNavigation = false;
    }

    getAlignmentScore = async (scenario) => {
        const evalNum = evalNameToNumber[this.props.currentTextEval];
        const isAdept = scenario.author === 'ADEPT' || adeptList.some(term => scenario.scenario_id.includes(term));

        if (!isAdept) {
            console.error("Unknown scenario: ADEPT not recognized as the author")
            return;
        }

        const evalProcessors = {
            17: async () => {
                // doing the AF-SS group inline since it doesn't fit into my generic logic
                const id = scenario.scenario_id;
                if (!id.includes('trinary') && (id.includes('AF') || id.includes('SS'))) {
                    const url = this.getAdeptUrl();
                    const current = this.state.adeptGroupState['AF-SS-multi'] || { scenarios: [], sessionId: null };
                    const sessionId = current.sessionId || await createAdeptSession(url);
                    await this.submitResponses(scenario, id, url, sessionId);
                    const updated = [...current.scenarios, scenario];
                    await new Promise(resolve => this.setState(prevState => ({
                        adeptGroupState: { ...prevState.adeptGroupState, 'AF-SS-multi': { scenarios: updated, sessionId } }
                    }), resolve));
                    if (updated.length === 2) {
                        const mla = await this.mostLeastAligned(sessionId, url, updated[0], true, false, true);
                        const kdmas = await this.attachKdmaValue(sessionId, url);
                        for (const s of updated) {
                            s['AF-SS_sessionId'] = sessionId;
                            s['AF-SS_mostLeastAligned'] = mla;
                            s['AF-SS_kdmas'] = kdmas;
                        }
                    }
                }
                await this.processGroupedAdeptScenario(scenario, {
                    getGroupKey: (id) => id.includes('trinary') ? 'trinary' : 'regular',
                    getGroupSize: (key) => key === 'trinary' ? 2 : 4,
                });
            },
            16: () => this.processEval16Scenario(scenario),
            15: () => this.processGroupedAdeptScenario(scenario, {
                getGroupKey: (id) => (id.includes('PS') || id.includes('AF')) ? 'PS-AF' : 'MF-SS',
                getGroupSize: () => 2,
                needsIndividualScoring: (id) => id.includes('MF'),
            }),
            13: () => this.processGroupedAdeptScenario(scenario, {
                getGroupKey: (id) => { const m = id.match(/-(AF|MF|PS|SS)\d+-/); return m ? m[1] : null; },
                getGroupSize: () => 3,
                needsIndividualScoring: () => true,
            }),
        };

        // Eval 10 PS-AF gets isolated session
        if (evalNum === 10 && scenario.scenario_id.includes('PS-AF')) {
            return this.processIsolatedAdeptScenario(scenario);
        }

        if (evalProcessors[evalNum]) {
            return evalProcessors[evalNum]();
        }

        // Default combined session path
        await this.processDefaultAdeptScenario(scenario, evalNum);
    }

    processDefaultAdeptScenario = async (scenario, evalNum) => {
        if (this.state.adeptSessionsCompleted === 0) {
            await this.beginRunningSession(scenario);
        } else {
            await this.continueRunningSession(scenario);
        }

        const updatedAdeptScenarios = [...this.state.adeptScenarios, scenario];
        const completedCount = this.state.adeptSessionsCompleted + 1;

        // Sept/UK: 3, otherwise: 4
        const expectedScenarios = [10, 12].includes(evalNum) ? 3 : 4;

        this.setState({
            adeptSessionsCompleted: completedCount,
            adeptScenarios: updatedAdeptScenarios
        }, async () => {
            if (completedCount === expectedScenarios) {
                await this.uploadAdeptScenarios(updatedAdeptScenarios);
            }
        });
    }

    processIsolatedAdeptScenario = async (scenario) => {
        const sessionEndpoint = '/api/v1/new_session';
        const url = this.getAdeptUrl();
        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === 200) {
                const sessionId = session.data;

                await this.submitResponses(scenario, scenario.scenario_id, url, sessionId);
                const mostLeastAligned = await this.mostLeastAligned(sessionId, url, scenario);

                scenario.combinedSessionId = sessionId;
                scenario.mostLeastAligned = mostLeastAligned;
                scenario.kdmas = await this.attachKdmaValue(sessionId, url);
                // can upload without waiting for the others
                await this.uploadSingleScenario(scenario);
            }
        } catch (e) {
            console.error('Error creating isolated session:', e);
        }
    }

    // refactored a lot of similar logic into generic group session id handling
    processGroupedAdeptScenario = async (scenario, { getGroupKey, getGroupSize, needsIndividualScoring }) => {
        const url = this.getAdeptUrl();
        const scenarioId = scenario.scenario_id;
        const groupKey = getGroupKey(scenarioId);

        if (!groupKey) {
            console.error('Could not determine group for scenario:', scenarioId);
            return;
        }

        if (needsIndividualScoring?.(scenarioId)) {
            try {
                const indSessionId = await createAdeptSession(url);
                await this.submitResponses(scenario, scenarioId, url, indSessionId);
                scenario.individualSessionId = indSessionId;
                scenario.individualMostLeastAligned = await this.mostLeastAligned(indSessionId, url, scenario);
                scenario.individualKdmas = await this.attachKdmaValue(indSessionId, url);
            } catch (e) {
                console.error(`Error in individual scoring for ${scenarioId}:`, e);
                scenario.individualSessionId = null;
                scenario.individualMostLeastAligned = null;
                scenario.individualKdmas = null;
                scenario.individualScoringError = e.message;
            }
        }

        const currentGroup = this.state.adeptGroupState[groupKey] || { scenarios: [], sessionId: null };
        let sessionId = currentGroup.sessionId;

        if (!sessionId) {
            sessionId = await createAdeptSession(url);
        }

        await this.submitResponses(scenario, scenarioId, url, sessionId);

        const updatedScenarios = [...currentGroup.scenarios, scenario];
        await new Promise(resolve => this.setState(prevState => ({
            adeptGroupState: {
                ...prevState.adeptGroupState,
                [groupKey]: { scenarios: updatedScenarios, sessionId }
            }
        }), resolve));

        if (updatedScenarios.length === getGroupSize(groupKey)) {
            try {
                const combinedMostLeastAligned = await this.mostLeastAligned(sessionId, url, updatedScenarios[0], true);
                const combinedKdmas = await this.attachKdmaValue(sessionId, url);

                for (const s of updatedScenarios) {
                    s.combinedSessionId = sessionId;
                    s.combinedMostLeastAligned = combinedMostLeastAligned;
                    s.combinedKdmas = combinedKdmas;
                    await this.uploadSingleScenario(s);
                }
            } catch (e) {
                console.error(`Error in ${groupKey} group completion:`, e);
                for (const s of updatedScenarios) {
                    s.combinedSessionId = sessionId;
                    s.combinedMostLeastAligned = null;
                    s.combinedKdmas = null;
                    s.combinedScoringError = e.message;
                    await this.uploadSingleScenario(s);
                }
            }
        }
    }

    processEval16Scenario = async (scenario) => {
        const url = this.getAdeptUrl();
        const scenarioId = scenario.scenario_id;

        // subpop - create combined session, get subpop result, upload immediately
        if (scenarioId === 'April2026-subpopulation') {
            try {
                const combinedSessionId = await createAdeptSession(url);
                this.setState({ eval16CombinedSessionId: combinedSessionId });

                await this.submitResponses(scenario, scenarioId, url, combinedSessionId);

                const subPopResult = await getSubPop(combinedSessionId, url);
                this.setState({ eval16SubPopResult: subPopResult });

                scenario.combinedSessionId = combinedSessionId;
                scenario.subPopResult = subPopResult;
                await this.uploadSingleScenario(scenario);
            } catch (e) {
                console.error('Error processing eval 16 subpopulation:', e);
            }
            return;
        }

        //submit to combined session
        const combinedSessionId = this.state.eval16CombinedSessionId;
        await this.submitResponses(scenario, scenarioId, url, combinedSessionId);

        const updatedScenarios = [...this.state.eval16Scenarios, scenario];
        this.setState({ eval16Scenarios: updatedScenarios });

        // Add to pair groups, PS belongs to both
        const groupKeys = [];
        if (scenarioId.includes('AF') || scenarioId.includes('PS')) groupKeys.push('AF-PS');
        if (scenarioId.includes('MF') || scenarioId.includes('PS')) groupKeys.push('MF-PS');

        for (const groupKey of groupKeys) {
            const updatedGroup = [...this.state.eval16Groups[groupKey], scenario];
            this.setState(prevState => ({
                eval16Groups: { ...prevState.eval16Groups, [groupKey]: updatedGroup }
            }));

            if (updatedGroup.length === 2) {
                await this.processEval16GroupCompletion(groupKey, updatedGroup);
            }
        }

        // All 4 regular scenarios complete: score combined session and upload
        if (updatedScenarios.length === 4) {
            // enable subpop passed for combined session
            const subPopValue = this.state.eval16SubPopResult;
            const combinedMostLeastAligned = await this.mostLeastAligned(combinedSessionId, url, null, false, subPopValue);
            const combinedKdmas = await this.attachKdmaValue(combinedSessionId, url, subPopValue);

            for (const s of updatedScenarios) {
                s.combinedSessionId = combinedSessionId;
                s.combinedMostLeastAligned = combinedMostLeastAligned;
                s.combinedKdmas = combinedKdmas;
                await this.uploadSingleScenario(s);
            }
        }
    }

    processEval16GroupCompletion = async (groupKey, groupScenarios) => {
        const url = this.getAdeptUrl();

        try {
            const groupSessionId = await createAdeptSession(url);

            for (const scenario of groupScenarios) {
                await this.submitResponses(scenario, scenario.scenario_id, url, groupSessionId);
            }

            const groupMostLeastAligned = await this.mostLeastAligned(groupSessionId, url, groupScenarios[0], true);
            const groupKdmas = await this.attachKdmaValue(groupSessionId, url);

            for (const scenario of groupScenarios) {
                scenario[`${groupKey}_sessionId`] = groupSessionId;
                scenario[`${groupKey}_mostLeastAligned`] = groupMostLeastAligned;
                scenario[`${groupKey}_kdmas`] = groupKdmas;
            }
        } catch (e) {
            console.error(`Error in eval 16 ${groupKey} group completion:`, e);
            for (const scenario of groupScenarios) {
                scenario[`${groupKey}_sessionId`] = null;
                scenario[`${groupKey}_mostLeastAligned`] = null;
                scenario[`${groupKey}_kdmas`] = null;
                scenario[`${groupKey}_error`] = e.message;
            }
        }
    }

    uploadSingleScenario = async (scenario) => {
        const sanitizedData = this.sanitizeKeys(scenario);

        return new Promise(resolve => {
            this.setState({
                uploadData: true,
                sanitizedData,
                isUploadButtonEnabled: true,
            }, () => {
                if (this.uploadButtonRef.current) {
                    this.uploadButtonRef.current.click();
                }
                resolve();
            });
        });
    }

    beginRunningSession = async (scenario) => {
        const url = this.getAdeptUrl();
        const sessionEndpoint = '/api/v1/new_session';

        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            if (session.status === 200) {
                this.setState({ combinedSessionId: session.data }, async () => {
                    await this.submitResponses(scenario, scenario.scenario_id, url, this.state.combinedSessionId)
                })
            }
        } catch (e) {
            console.error(e)
        }
    }

    continueRunningSession = async (scenario) => {
        const url = this.getAdeptUrl();
        await this.submitResponses(scenario, scenario.scenario_id, url, this.state.combinedSessionId)
    }

    uploadAdeptScenarios = async (scenarios) => {
        const url = this.getAdeptUrl();

        const combinedMostLeastAligned = await this.mostLeastAligned(this.state.combinedSessionId, url, null)

        for (let scenario of scenarios) {
            scenario.combinedSessionId = this.state.combinedSessionId
            scenario.mostLeastAligned = combinedMostLeastAligned
            scenario.kdmas = await this.attachKdmaValue(this.state.combinedSessionId, url)
            const sanitizedData = this.sanitizeKeys(scenario)
            await new Promise(resolve => {
                this.setState({
                    uploadData: true,
                    sanitizedData,
                    isUploadButtonEnabled: true,
                }, () => {
                    if (this.uploadButtonRef.current) {
                        this.uploadButtonRef.current.click();
                    }
                    resolve();
                });
            });
        }
    }

    attachKdmaValue = async (sessionId, url, enable_subpop = false) => {
        return getKdmaProfile(sessionId, url, enable_subpop);
    }

    mostLeastAligned = async (sessionId, url, scenario, skipKdmaFilter = false, enableSubpop = false, allowMultiattributeTargets = false) => {
        const evalNumber = evalNameToNumber[this.props.currentTextEval];
        return getMostLeastAligned(sessionId, url, scenario, evalNumber, skipKdmaFilter, enableSubpop, allowMultiattributeTargets);
    }

    submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
        return sharedSubmitResponses(scenario, scenarioID, urlBase, sessionID);
    }

    onSurveyComplete = (survey) => {
        // start uploading results for this scenario 
        this.uploadResults(survey);
        // move to the next scenario 
        this.setState(prevState => ({
            currentScenarioIndex: prevState.currentScenarioIndex + 1
        }), () => {
            this.loadNextScenario();
        });
    }

    loadSurveyConfig = (scenarioConfigs, title) => {
        let config = {
            ...scenarioConfigs[0],
            pages: [...scenarioConfigs[0].pages]
        };

        const evalNum = evalNameToNumber[this.props.currentTextEval];
        if (evalNum !== 12) {
            config.pages = shuffle([...config.pages])
        }

        config.title = title;
        config.showTitle = false;
        this.survey = new Model(config);
        this.survey.applyTheme(surveyTheme);
        // override default 'complete' button so participants don't get confused
        if (this.state.currentScenarioIndex < this.state.scenarios.length - 1) {
            this.survey.css = {
                navigation: {
                    complete: "sv-btn sv-footer__next-btn"
                }
            };
            this.survey.completeText = "Next";
        }
        this.survey.focusOnFirstError = false;
        this.survey.onAfterRenderPage.add(this.onAfterRenderPage);
        this.survey.onComplete.add(this.onSurveyComplete);
        this.shouldBlockNavigation = true
        this.setState({ currentConfig: this.survey });
    };

    onAfterRenderPage = (sender, options) => {
        const pageName = options.page.name;
        const currentTime = new Date();

        if (this.survey.currentPageNo > 0) {
            const previousPageName = this.survey.pages[this.survey.currentPageNo - 1].name;
            const startTime = this.pageStartTimes[previousPageName];
            if (startTime) {
                const timeSpentInSeconds = (currentTime - startTime) / 1000;
                this.surveyData[previousPageName] = this.surveyData[previousPageName] || {};
                this.surveyData[previousPageName].timeSpentOnPage = timeSpentInSeconds;
            }
        }

        this.pageStartTimes[pageName] = currentTime;
    }

    timerHelper = () => {
        const currentPageName = this.survey.currentPage.name;
        const startTime = this.pageStartTimes[currentPageName];
        if (startTime) {
            const endTime = new Date();
            const timeSpentInSeconds = (endTime - startTime) / 1000;

            // update time spent for the current page
            this.surveyData[currentPageName] = this.surveyData[currentPageName] || {};
            this.surveyData[currentPageName].timeSpentOnPage = timeSpentInSeconds;
        }
    }

    render() {
        const ConsentForm = ({ show, onAgree, onDisagree }) => (
            <Modal show={show} backdrop="static" keyboard={false} size="lg" centered>
                <Modal.Header>
                    <Modal.Title>Consent Form</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ height: '70vh', padding: 0 }}>
                    <iframe
                        src={consentPdf}
                        title="Consent Form PDF"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onDisagree}>I Do Not Agree</Button>
                    <Button variant="primary" onClick={onAgree}>I Agree</Button>
                </Modal.Footer>
            </Modal>
        );
        return (
            <>
                {this.state.showConsentForm && !this.state.consentGiven && (
                    <ConsentForm
                        show={this.state.showConsentForm}
                        onAgree={() => this.handleConsentResponse(true)}
                        onDisagree={() => this.handleConsentResponse(false)}
                    />
                )}
                {this.state.consentGiven && (
                    <>
                        {this.state.currentConfig && !this.state.allScenariosCompleted && this.state.startSurvey && (
                            <ScenarioProgress
                                current={this.state.currentScenarioIndex + 1}
                                total={this.state.scenarios.length}
                            />
                        )}
                        <NavigationGuard surveyComplete={this.state.allScenariosCompleted && (!this.state.showDemographics || this.state.demographicsCompleted)} />
                        {!this.state.skipText && !this.state.startSurvey && (
                            <div className="text-instructions">
                                <h2>Instructions</h2>
                                <p><b>Welcome to the ITM Text Scenario experiment. Thank you for your participation.</b>
                                    <br />
                                    During this portion of the experiment, you will be presented with several medical triage scenarios. You will be given action options from which to choose. Please consider
                                    how you would act if you were placed in this scenario.
                                </p>
                                <h4>Guidelines:</h4>
                                <ul>
                                    <li>Please complete the experiment in one sitting.</li>
                                    <li>Choose the option that best matches how you would triage the scenario.</li>
                                    <li>Read all details to clearly understand each question before responding.</li>
                                    <li>Do not close the browser until you reach the "Thank You" page at the end.</li>
                                    <li>The upload page may take a few minutes to complete. Please be patient while the spinner is spinning and do not exit the page.</li>
                                </ul>
                                <p className='center-text'>Press "Start" to begin.</p>
                                <button onClick={() => this.startScenarios()}>Start</button>
                            </div>
                        )

                        }
                        {!this.state.skipText && this.state.currentConfig && !this.state.allScenariosCompleted && this.state.startSurvey && (
                            <>
                                <Survey model={this.survey} />
                            </>
                        )}
                        {!this.state.skipText && this.state.demographicsUploadData && (
                            <Mutation
                                mutation={UPLOAD_DEMOGRAPHICS}
                                onCompleted={() => {
                                    this.setState({
                                        demographicsCompleted: true,
                                        demographicsUploadData: null
                                    });
                                }}
                            >
                                {(uploadSurveyResults, { data }) => (
                                    <div style={{ display: 'none' }}>
                                        <button ref={this.uploadButtonRefDemographics} disabled={!this.state.isDemographicsUploadEnabled} onClick={(e) => {
                                            e.preventDefault();
                                            if (this.state.isDemographicsUploadEnabled) {
                                                uploadSurveyResults({
                                                    variables: {
                                                        surveyId: this.state.participantID,
                                                        results: this.state.demographicsUploadData
                                                    }
                                                });
                                            }
                                        }}></button>
                                    </div>
                                )}
                            </Mutation>
                        )}
                        {!this.state.skipText && this.state.uploadData && (
                            <Mutation
                                mutation={UPLOAD_SCENARIO_RESULTS}
                                onCompleted={() => {
                                    this.setState(prevState => ({
                                        uploadedScenarios: prevState.uploadedScenarios + 1,
                                    }), () => {
                                        this.setState({ updatePLog: true }, () => {
                                            if (this.uploadButtonRefPLog.current) {
                                                this.uploadButtonRefPLog.current.click();
                                            }
                                        });
                                    });
                                }}
                            >
                                {(uploadSurveyResults, { data }) => (
                                    <div style={{ display: 'none' }}>
                                        <button ref={this.uploadButtonRef} disabled={!this.state.isUploadButtonEnabled} onClick={(e) => {
                                            e.preventDefault();
                                            if (this.state.isUploadButtonEnabled) {
                                                uploadSurveyResults({
                                                    variables: { results: this.state.sanitizedData }
                                                })
                                            }
                                        }}></button>
                                    </div>
                                )}
                            </Mutation>
                        )}
                        {!this.state.skipText && this.state.updatePLog && (
                            <Mutation mutation={UPDATE_PARTICIPANT_LOG}>
                                {(updateParticipantLog) => (
                                    <div>
                                        <button ref={this.uploadButtonRefPLog} hidden onClick={(e) => {
                                            e.preventDefault();
                                            updateParticipantLog({
                                                variables: { pid: this.state.participantID, updates: { claimed: true, textEntryCount: this.state.startCount + this.state.uploadedScenarios } }
                                            });
                                            this.setState({ updatePLog: false });
                                        }}></button>
                                    </div>
                                )}
                            </Mutation>
                        )}
                        {!this.state.skipText && this.state.allScenariosCompleted && (this.state.uploadedScenarios < this.state.scenarios.length) && (!this.state.showDemographics || this.state.demographicsCompleted) && (
                            <LoadingSpinner
                                message={this.state.onlineOnly
                                    ? "Please do not close your browser or press any keys. The second part of the experiment will load momentarily"
                                    : "Uploading documents, please wait..."}
                                fullScreen={true}
                            />
                        )}
                        {!this.state.skipText && this.state.allScenariosCompleted && this.state.showDemographics && !this.state.demographicsCompleted && this.state.showDemographicsSurvey && (
                            <Survey model={this.state.demographicsConfig} />
                        )}
                        {(this.state.skipText || (this.state.allScenariosCompleted && this.state.uploadedScenarios === this.state.scenarios.length && (!this.state.showDemographics || this.state.demographicsCompleted))) && (
                            <ScenarioCompletionScreen
                                toDelegation={this.state.onlineOnly}
                                participantID={this.state.participantID}
                                evalNumber={evalNameToNumber[this.props.currentTextEval]}
                            />
                        )}
                    </>
                )}
            </>
        )
    }
}

export default withRouter(TextBasedScenariosPage);

const ScenarioCompletionScreen = ({ moderatorExists, toDelegation, participantID, evalNumber }) => {
    const customColor = "#b15e2f";

    const history = useHistory();

    const handleReturnToLogin = () => {
        history.push('/login');
    };

    React.useEffect(() => {
        if (toDelegation && evalNumber === 13) {
            const queryParams = new URLSearchParams(window.location.search);
            const caciProlific = queryParams.get('caciProlific');

            if (caciProlific === 'true') {
                const returnURL = 'https://app.prolific.com/submissions/complete?cc=C155IMPM';
                window.location.href = returnURL;
            }
        }
    }, [toDelegation, evalNumber]);

    return (
        <>
            {toDelegation && evalNumber !== 13 ?
                <SurveyPageWrapper />
                : toDelegation && evalNumber === 13 ?
                    <LoadingSpinner
                        message="Redirecting you back to Prolific..."
                        fullScreen={false}
                    />
                    :
                    <Container className="mt-5">
                        <Row className="justify-content-center">
                            <Col md={10} lg={8}>
                                <Card className="border-0 shadow">
                                    <Card.Body className="text-center p-5">
                                        <h1 className="display-4 mb-4">Thank you for completing the scenarios</h1>
                                        <h3 className="display-4 mb-4">Your Participant ID is {participantID?.slice(-3)}</h3>
                                        <p className="mb-4">You may now close the browser</p>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleReturnToLogin}
                                            style={{ backgroundColor: customColor, borderColor: customColor }}
                                        >
                                            Return to Login
                                        </Button>

                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>}
        </>
    );
};

const LoadingSpinner = ({ message, fullScreen = true }) => {
    const spinnerContent = (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
            <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
            </Spinner>
            <p style={{ marginTop: '10px' }}>{message}</p>
        </div>
    );

    if (!fullScreen) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>{spinnerContent}</div>;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            {spinnerContent}
        </div>
    );
};


ReactQuestionFactory.Instance.registerQuestion("phase2Text", (props) => {
    return React.createElement(Phase2Text, props)
})

// used to stop premature uploads/duplicate uploads
const adeptList = ['adept', '2025', '2026', 'DryRun'];