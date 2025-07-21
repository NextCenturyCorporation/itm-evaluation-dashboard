import React from 'react';
import { Router, Switch, Route, Redirect } from 'react-router-dom';
import { accountsClient, accountsGraphQL } from '../../services/accountsService';
import { createBrowserHistory } from 'history';
import gql from "graphql-tag";
import { useMutation, useQuery } from '@apollo/react-hooks';
import { setupConfigWithImages, setupTextBasedConfig, setSurveyVersion, setCurrentUIStyle, PH1_SURVEY_SETS } from './setupUtils';
import { isDefined } from '../AggregateResults/DataFunctions';

// Components
import ResultsPage from '../Results/results';
import HomePage from '../Home/home';
import { SurveyPageWrapper } from '../Survey/survey';
import { TextBasedScenariosPageWrapper } from '../TextBasedScenarios/TextBasedScenariosPage';
import { ReviewTextBasedPage } from '../ReviewTextBased/ReviewTextBased';
import { ReviewDelegationPage } from '../ReviewDelegation/ReviewDelegation';
import TextBasedResultsPage from '../TextBasedResults/TextBasedResultsPage';
import LoginApp from '../Account/login';
import ResetPassPage from '../Account/resetPassword';
import MyAccountPage from '../Account/myAccount';
import AdminPage from '../Account/adminPage';
import AggregateResults from '../AggregateResults/aggregateResults';
import ADMChartPage from '../AdmCharts/admChartPage';
import { ADMProbeResponses } from '../AdmCharts/admProbeResponses';
import { SurveyResults } from '../SurveyResults/surveyResults';
import HumanResults from '../HumanResults/humanResults';
import { RQ1 } from '../Research/RQ1';
import { RQ2 } from '../Research/RQ2';
import { RQ3 } from '../Research/RQ3';
import { ExploratoryAnalysis } from '../Research/ExploratoryAnalysis';
import { PidLookup } from '../Account/pidLookup';
import StartOnline from '../OnlineOnly/OnlineOnly';
import { ParticipantProgressTable } from '../Account/participantProgress';
import { WaitingPage } from '../Account/waitingPage';
import { Header } from './Header';

// CSS and Image Stuff 
import '../../css/app.css';
import 'rc-slider/assets/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'material-design-icons/iconfont/material-icons.css';
import 'react-dropdown/style.css';
import 'react-dual-listbox/lib/react-dual-listbox.css';


const history = createBrowserHistory();

const GET_SURVEY_VERSION = gql`
  query GetSurveyVersion {
    getCurrentSurveyVersion
  }
`;

const GET_CURRENT_STYLE = gql`
  query GetCurrentStyle {
    getCurrentStyle
  }
`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const ADD_PARTICIPANT = gql`
    mutation addNewParticipantToLog($participantData: JSON!, $lowPid: Int!, $highPid: Int!) {
        addNewParticipantToLog(participantData: $participantData, lowPid: $lowPid, highPid: $highPid) 
    }`;

const GET_CONFIGS = gql`
  query GetConfigs {
    getAllSurveyConfigs
    getAllTextBasedConfigs
    getAllTextBasedImages
  }`;

const GET_CONFIGS_DEL_MEDIA = gql`
    query GetConfigsWithImages {
        getAllSurveyConfigs
        getAllTextBasedConfigs
        getAllTextBasedImages
        getAllImageUrls
    }`;

const GET_CONFIGS_PHASE_2 = gql`
    query GetConfigsNoImages {
        getAllSurveyConfigs
        getAllTextBasedConfigs
    }
`


const LOW_PID = 202507100;
const HIGH_PID = 202507299;



export function isUserElevated(currentUser) {
    return currentUser?.admin || currentUser?.evaluator || currentUser?.experimenter || currentUser?.adeptUser;
}

export function App() {
    const [currentUser, setCurrentUser] = React.useState(null);
    const { refetch: fetchParticipantLog } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const { data: versionData, loading: versionLoading, error: versionError } = useQuery(GET_SURVEY_VERSION, { fetchPolicy: 'no-cache' });
    const { data: styleData, loading: styleLoading, error: styleError } = useQuery(GET_CURRENT_STYLE, { fetchPolicy: 'no-cache' });
    const [isStyleDataLoaded, setIsStyleDataLoaded] = React.useState(false);
    const [addParticipant] = useMutation(ADD_PARTICIPANT);
    const [isSetup, setIsSetup] = React.useState(false);
    const [isVersionDataLoaded, setIsVersionDataLoaded] = React.useState(false);
    const [isConfigDataLoaded, setIsConfigDataLoaded] = React.useState(false);
    const [configQuery, setConfigQuery] = React.useState(GET_CONFIGS)
    const [sendConfigQuery, setSendConfigQuery] = React.useState(false);

    React.useEffect(() => {
        if (versionData?.getCurrentSurveyVersion) {
            setSurveyVersion(versionData.getCurrentSurveyVersion);
            setIsVersionDataLoaded(true);
            if (parseFloat(versionData.getCurrentSurveyVersion) <= 3.0) {
                setConfigQuery(GET_CONFIGS_DEL_MEDIA);
            } else if (parseFloat(versionData.getCurrentSurveyVersion) >= 6.0) {
                setConfigQuery(GET_CONFIGS_PHASE_2)
            }
            else {
                setConfigQuery(GET_CONFIGS);
            }
            setSendConfigQuery(true);
        }
    }, [versionData]);

    const { data: configData, loading: configLoading, error: configError } =
        useQuery(configQuery, {
            skip: !sendConfigQuery, // dont exec query till we know what survey version 
            fetchPolicy: 'cache-first'
        });

    React.useEffect(() => {
        if (configData) {
            setupConfigWithImages(configData);
            setupTextBasedConfig(configData);
            setIsConfigDataLoaded(true);
        }
    }, [configData]);

    React.useEffect(() => {
        if (isDefined(styleData)) {
            setCurrentUIStyle(styleData.getCurrentStyle);
            setIsStyleDataLoaded(true);
        }
    }, [styleData]);

    const setup = async () => {
        // refresh the session to get a new accessToken if expired
        const tokens = await accountsClient.refreshSession();
        const noTokenNeeded = ['reset-password', '/participantText', '/remote-text-survey?'];

        if (noTokenNeeded.some(substring => window.location.href.toLowerCase().includes(substring.toLowerCase()) && !window.location.href.toLowerCase().includes('/participanttexttester'))) {
            setIsSetup(true);
            return;
        }

        if (!tokens) {
            setIsSetup(true);
            history.push('/login');
            return;
        }

        const user = await accountsGraphQL.getUser(
            tokens ? tokens.accessToken : ''
        );
        setCurrentUser(user);
        setIsSetup(true);
    };

    React.useEffect(() => {
        // runs when the app renders; 
        setup();
    }, []);

    const logout = async () => {
        await accountsClient.logout();
        history.push('/login');
        setCurrentUser(null);
    };

    const userLoginHandler = (userObject) => {
        setCurrentUser(userObject);
    };

    const Home = () => {
        if (currentUser == null) {
            return <Redirect push to="/login" />;
        } else if (!currentUser.approved) {
            return <Redirect push to="/awaitingApproval" />;
        } else {
            return <HomePage currentUser={currentUser} />;
        }
    };

    const WaitingPageWrapper = ({ rejected, currentUser }) => {
        if (!currentUser) {
            return <Redirect push to="/login" />;
        }
        if (!rejected && currentUser?.approved) {
            return <Redirect push to="/" />;
        }
        else {
            return <WaitingPage rejected={rejected} />
        }
    };

    const Login = ({ participantTextLogin, testerLogin }) => {
        if (currentUser && !currentUser?.approved) {
            logout();
            return <LoginApp userLoginHandler={userLoginHandler} participantLoginHandler={participantLoginHandler} />;
        }
        if (testerLogin && (currentUser === null || (!currentUser.admin && !currentUser.experimenter))) {
            return <Redirect push to="/participantText" />;
        }
        else if (participantTextLogin) {
            return <LoginApp userLoginHandler={userLoginHandler} isParticipant={participantTextLogin}
                participantLoginHandler={participantLoginHandler} />;
        }
        if (currentUser !== null) {
            return <Redirect push to="/" />;
        } else {
            return <LoginApp userLoginHandler={userLoginHandler} participantLoginHandler={participantLoginHandler} />;
        }
    }

    const participantLoginHandler = async (hashedEmail, isTester) => {
        const dbPLog = await fetchParticipantLog();

        const foundParticipant = dbPLog.data.getParticipantLog.find((x) => x.hashedEmail == hashedEmail);

        if (foundParticipant) {
            const pid = foundParticipant['ParticipantID'];
            history.push("/text-based?pid=" + pid);
            return;
        } else {
            let newPid = Math.max(...dbPLog.data.getParticipantLog.filter((x) =>
                !["202409113A", "202409113B"].includes(x['ParticipantID']) &&
                x.ParticipantID >= LOW_PID && x.ParticipantID <= HIGH_PID
            ).map((x) => Number(x['ParticipantID'])), LOW_PID - 1) + 1;

            const scenarioSet = Math.floor(Math.random() * 3) + 1;

            const participantData = {
                "ParticipantID": newPid,
                "Type": isTester ? "Test" : "emailParticipant",
                "claimed": true,
                "simEntryCount": 0,
                "surveyEntryCount": 0,
                "textEntryCount": 0,
                "hashedEmail": hashedEmail,
                
                "AF-text-scenario": scenarioSet,
                "MF-text-scenario": scenarioSet,
                "PS-text-scenario": scenarioSet,
                "SS-text-scenario": scenarioSet
            };

            const addRes = await addParticipant({
                variables: { participantData, lowPid: LOW_PID, highPid: HIGH_PID }
            });

            if (addRes?.data?.addNewParticipantToLog == -1) {
                alert("This email address is taken. Please enter a different email.");
                return;
            }

            newPid = addRes?.data?.addNewParticipantToLog?.ops?.[0]?.ParticipantID;
            history.push("/text-based?pid=" + newPid);
            return;
        }
    };

    const MyAccount = () => {
        if (currentUser === null) {
            return <Redirect push to="/login" />;
        } else if (!currentUser.approved) {
            return <Redirect push to="/awaitingApproval" />;
        } else {
            return <MyAccountPage currentUser={currentUser} updateUserHandler={userLoginHandler} />
        }
    };

    const Admin = () => {
        if (currentUser === null) {
            return <Redirect push to="/login" />;
        } else {
            if (currentUser.admin === true) {
                return <AdminPage currentUser={currentUser} updateUserHandler={userLoginHandler} />
            } else {
                return <Redirect push to="/" />;
            }
        }
    };

    const ProgressTable = () => {
        if (currentUser === null) {
            return <Redirect push to="/login" />;
        } else {
            if (isUserElevated(currentUser)) {
                return <ParticipantProgressTable canViewProlific={currentUser.adeptUser || currentUser.admin} />
            } else {
                return <Redirect push to="/" />;
            }
        }
    };

    const PidLookupPage = () => {
        if (currentUser === null) {
            return <Redirect push to="/login" />;
        } else {
            if (currentUser.experimenter === true || currentUser.admin === true) {
                return <PidLookup />
            } else {
                return <Redirect push to="/" />;
            }
        }
    };

    const Survey = () => {
        if (isUserElevated(currentUser)) {
            return <SurveyPageWrapper currentUser={currentUser} />;
        }
        else {
            return <HomePage currentUser={currentUser} />;
        }
    };


    const ReviewTextBased = () => {
        if (currentUser === null) {
            return <Redirect push to="/login" />;
        } else {
            if (currentUser.admin === true || currentUser.evaluator) {
                return <ReviewTextBasedPage currentUser={currentUser} updateUserHandler={userLoginHandler} />
            } else {
                return <Home />;
            }
        }
    };

    const ReviewDelegation = () => {
        if (currentUser === null) {
            return <Redirect push to="/login" />;
        } else {
            if (currentUser.admin === true || currentUser.evaluator) {
                return <ReviewDelegationPage currentUser={currentUser} updateUserHandler={userLoginHandler} />
            } else {
                return <Home />;
            }
        }
    };
    if (versionLoading || configLoading) {
        return <div>Loading...</div>;
    }
    if (versionError) {
        return <div>Error fetching survey version data</div>;
    }
    if (configError) {
        return <div>Error fetching survey configs</div>;
    }

    return (
        <Router history={history}>
            {isSetup && isVersionDataLoaded && isConfigDataLoaded && isStyleDataLoaded && <div className="itm-app">
                {currentUser?.approved &&
                    <Header currentUser={currentUser} logout={logout} />
                }
                <div className="main-content">
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route exact path="/awaitingApproval">
                            <WaitingPageWrapper currentUser={currentUser} rejected={currentUser?.rejected} />
                        </Route>
                        <Route path="/login">
                            <Login testerLogin={false} />
                        </Route>
                        <Route exact path="/participantText">
                            <Login participantTextLogin={true} testerLogin={false} />
                        </Route>
                        <Route path="/reset-password/:token" component={ResetPassPage} />
                        <Route path="/remote-text-survey" component={StartOnline} />
                        <Route path="/text-based" component={TextBasedScenariosPageWrapper} />
                        <Route path="/myaccount" component={MyAccount} />
                        {isUserElevated(currentUser) && <Route exact path="/results" component={ResultsPage} />}
                        {isUserElevated(currentUser) && <Route exact path="/adm-results" component={ADMChartPage} />}
                        {isUserElevated(currentUser) && <Route exact path="/adm-probe-responses" component={ADMProbeResponses} />}
                        {isUserElevated(currentUser) && <Route exact path="/humanSimParticipant">
                            <AggregateResults type="HumanSimParticipant" />
                        </Route>}
                        {(currentUser?.admin || currentUser?.experimenter) && <Route path="/participantTextTester">
                            <Login participantTextLogin={true} testerLogin={true} />
                        </Route>}
                        {isUserElevated(currentUser) && <Route path="/admin" component={Admin} />}
                        {isUserElevated(currentUser) && <Route path="/participant-progress-table" component={ProgressTable} />}
                        {isUserElevated(currentUser) && <Route path="/pid-lookup" component={PidLookupPage} />}
                        {isUserElevated(currentUser) && <Route path="/survey" component={Survey} />}
                        {isUserElevated(currentUser) && <Route path="/survey-results" component={SurveyResults} />}
                        {isUserElevated(currentUser) && <Route path="/review-text-based" component={ReviewTextBased} />}
                        {isUserElevated(currentUser) && <Route path="/review-delegation" component={ReviewDelegation} />}
                        {isUserElevated(currentUser) && <Route path="/text-based-results" component={TextBasedResultsPage} />}
                        {isUserElevated(currentUser) && <Route path="/humanProbeData">
                            <AggregateResults type="HumanProbeData" />
                        </Route>}

                        {isUserElevated(currentUser) && <Route exact path="/human-results" component={HumanResults} />}
                        {isUserElevated(currentUser) && <Route exact path="/research-results/rq1" component={RQ1} />}
                        {isUserElevated(currentUser) && <Route exact path="/research-results/rq2" component={RQ2} />}
                        {isUserElevated(currentUser) && <Route exact path="/research-results/rq3" component={RQ3} />}
                        {isUserElevated(currentUser) && <Route exact path="/research-results/exploratory-analysis" component={ExploratoryAnalysis} />}
                        {/*
}
                        {/* Redirection logic: If user is not logged in, send to /login. 
                            If user is not approved, send to /awaitingApproval.
                            Otherwise, send to homepage */}
                        {currentUser ?
                            (currentUser?.approved ?
                                <Route path="*" render={() => <Redirect to="/" />} />
                                : <Route path="*" render={() => <Redirect to="/awaitingApproval" />} />)
                            : <Route path="*" render={() => <Redirect to="/login" />} />
                        }

                    </Switch>
                </div>

                <div className="itm-footer">
                    <div className="footer-text">This research was developed with funding from the Defense Advanced Research Projects Agency (DARPA). The views, opinions and/or findings expressed are those of the author and should not be interpreted as representing the official views or policies of the Department of Defense or the U.S. Government.</div>
                    <div className="footer-link"><a href="https://www.darpa.mil/program/in-the-moment" target="_blank" rel="noopener noreferrer">DARPA's In the Moment (ITM) Program Page</a></div>
                </div>
            </div>}
        </Router>
    );
}