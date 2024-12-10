import React from 'react';
import queryString from 'query-string';
import ResultsPage from '../Results/results';
import HomePage from '../Home/home';
import ScenarioPage from '../ScenarioPage/scenarioPage';
import { SurveyPageWrapper } from '../Survey/survey';
import { TextBasedScenariosPageWrapper } from '../TextBasedScenarios/TextBasedScenariosPage';
import { ReviewTextBasedPage } from '../ReviewTextBased/ReviewTextBased';
import { ReviewDelegationPage } from '../ReviewDelegation/ReviewDelegation';
import TextBasedResultsPage from '../TextBasedResults/TextBasedResultsPage';
import { Router, Switch, Route, Link } from 'react-router-dom';
import LoginApp from '../Account/login';
import ResetPassPage from '../Account/resetPassword';
import MyAccountPage from '../Account/myAccount';
import AdminPage from '../Account/adminPage';
import AggregateResults from '../AggregateResults/aggregateResults';
import { accountsClient, accountsGraphQL } from '../../services/accountsService';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { createBrowserHistory } from 'history';
import ADMChartPage from '../AdmCharts/admChartPage';
import { ADMProbeResponses } from '../AdmCharts/admProbeResponses';
import gql from "graphql-tag";
import { Query, Mutation } from '@apollo/react-components';
import { setupConfigWithImages, setupTextBasedConfig, setSurveyVersion, setParticipantLogInStore } from './setupUtils';

// CSS and Image Stuff 
import '../../css/app.css';
import 'rc-slider/assets/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'jquery/dist/jquery.min.js';
import 'material-design-icons/iconfont/material-icons.css';
import 'react-dropdown/style.css';
import 'react-dual-listbox/lib/react-dual-listbox.css';

import brandImage from '../../img/itm-logo.png';
import userImage from '../../img/account_icon.png';
import { SurveyResults } from '../SurveyResults/surveyResults';
import HumanResults from '../HumanResults/humanResults';
import { RQ1 } from '../DRE-Research/RQ1';
import { RQ2 } from '../DRE-Research/RQ2';
import { RQ3 } from '../DRE-Research/RQ3';
import { ExploratoryAnalysis } from '../DRE-Research/ExploratoryAnalysis';
import store from '../../store/store';
import { isDefined } from '../AggregateResults/DataFunctions';
import { PidLookup } from '../Account/pidLookup';
import StartOnline from '../OnlineOnly/OnlineOnly';
import { ParticipantProgressTable } from '../Account/participantProgress';



const history = createBrowserHistory();

const GET_SURVEY_VERSION = gql`
  query GetSurveyVersion {
    getCurrentSurveyVersion
  }
`;

const GET_PARTICIPANT_LOG = gql`
  query GetParticipantLog {
    getParticipantLog
  }`;


const GET_CONFIGS = gql`
  query GetConfigs($includeImageUrls: Boolean!) {
    getAllSurveyConfigs
    getAllImageUrls @include(if: $includeImageUrls)
    getAllTextBasedConfigs
    getAllTextBasedImages
  }`;

const UPDATE_PARTICIPANT_LOG = gql`
    mutation updateParticipantLog($pid: String!, $updates: JSON!) {
        updateParticipantLog(pid: $pid, updates: $updates) 
    }`;

const ADD_PARTICIPANT = gql`
    mutation addNewParticipantToLog($participantData: JSON!, $lowPid: Int!, $highPid: Int!) {
        addNewParticipantToLog(participantData: $participantData, lowPid: $lowPid, highPid: $highPid) 
    }`;

const SURVEY_SETS = [
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 }
]

const LOW_PID = 202411300;
const HIGH_PID = 202411499;

function Home({ newState }) {
    if (newState.currentUser == null) {
        history.push('/login');
    } else {
        return <HomePage currentUser={newState.currentUser} />;
    }
}

function Results() {
    return <ResultsPage />;
}

function Scenarios() {
    return <ScenarioPage />;
}

function Survey(currentUser) {
    return <SurveyPageWrapper currentUser={currentUser?.currentUser} />
}

function TextBased() {
    return <TextBasedScenariosPageWrapper />;
}

function TextBasedResults() {
    return <TextBasedResultsPage />;
}

function AdmResults() {
    return <ADMChartPage />
}

function Login({ newState, userLoginHandler, participantLoginHandler, participantTextLogin, testerLogin }) {
    if (testerLogin && (newState.currentUser === null || (!newState.currentUser.admin && !newState.currentUser.experimenter))) {
        history.push('/participantText');
    }
    else if (participantTextLogin) {
        return <LoginApp userLoginHandler={userLoginHandler} isParticipant={participantTextLogin} participantLoginHandler={participantLoginHandler} />;
    }
    if (newState !== null) {
        if (newState.currentUser !== null) {
            return <Home newState={newState} currentUser={newState.currentUser} />;
        } else {
            return <LoginApp userLoginHandler={userLoginHandler} participantLoginHandler={participantLoginHandler} />;
        }
    } else {
        return <LoginApp userLoginHandler={userLoginHandler} participantLoginHandler={participantLoginHandler} />;
    }
}

function MyAccount({ newState, userLoginHandler }) {
    if (newState.currentUser === null) {
        history.push("/login");
    } else {
        return <MyAccountPage currentUser={newState.currentUser} updateUserHandler={userLoginHandler} />
    }
}

function Admin({ newState, userLoginHandler }) {
    if (newState.currentUser === null) {
        history.push("/login");
    } else {
        if (newState.currentUser.admin === true) {
            return <AdminPage currentUser={newState.currentUser} updateUserHandler={userLoginHandler} />
        } else {
            return <Home newState={newState} />;
        }
    }
}

function PidLookupPage({ newState }) {
    if (newState.currentUser === null) {
        history.push("/login");
    } else {
        if (newState.currentUser.experimenter === true || newState.currentUser.admin === true) {
            return <PidLookup />
        } else {
            return <Home newState={newState} />;
        }
    }
}

function ProgressTable({ newState }) {
    if (newState.currentUser === null) {
        history.push("/login");
    } else {
        if (newState.currentUser.experimenter || newState.currentUser.admin || newState.currentUser.evaluator || newState.currentUser.adeptUser) {
            return <ParticipantProgressTable canViewProlific={newState.currentUser.adeptUser || newState.currentUser.admin} />
        } else {
            return <Home newState={newState} />;
        }
    }
}

function ReviewTextBased({ newState, userLoginHandler }) {
    if (newState.currentUser === null) {
        history.push("/login");
    } else {
        if (newState.currentUser.admin === true || newState.currentUser.evaluator) {
            return <ReviewTextBasedPage currentUser={newState.currentUser} updateUserHandler={userLoginHandler} />
        } else {
            return <Home newState={newState} />;
        }
    }
}

function ReviewDelegation({ newState, userLoginHandler }) {
    if (newState.currentUser === null) {
        history.push("/login");
    } else {
        if (newState.currentUser.admin === true || newState.currentUser.evaluator) {
            return <ReviewDelegationPage currentUser={newState.currentUser} updateUserHandler={userLoginHandler} />
        } else {
            return <Home newState={newState} />;
        }
    }
}

export class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = queryString.parse(window.location.search);
        this.state.currentUser = null;
        this.state.allUsers = null;
        this.state.participantLog = null;
        this.state.updatePLog = false;
        this.state.pLogUpdate = null;
        this.state.pid = null;
        this.state.newParticipantData = null;
        this.state.loadPLog = false;

        this.logout = this.logout.bind(this);
        this.userLoginHandler = this.userLoginHandler.bind(this);
        this.participantLoginHandler = this.participantLoginHandler.bind(this);
        this.uploadButtonRef = React.createRef();
        this.addPButtonRef = React.createRef();
    }

    async componentDidMount() {
        //refresh the session to get a new accessToken if expired
        const tokens = await accountsClient.refreshSession();

        if (window.location.href.indexOf("reset-password") > -1 || window.location.href.indexOf("/participantText") > -1 || window.location.href.indexOf('/remote-text-survey?') > -1) {
            return;
        }

        if (!tokens) {
            history.push('/login');
            return;
        }

        const user = await accountsGraphQL.getUser(
            tokens ? tokens.accessToken : ''
        );
        this.setState({ currentUser: user, loadPLog: true });
    }

    async logout() {
        await accountsClient.logout();
        history.push('/login');
        this.setState({ currentUser: null });
    }

    userLoginHandler(userObject) {
        this.setState({ currentUser: userObject });
    }

    participantLoginHandler(hashedEmail, isTester) {
        // get fresh participant log from database to minimize race conditions
        setParticipantLogInStore(null);
        const sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        this.setState({ loadPLog: true }, async () => {
            while (!isDefined(store.getState().participants.participantLog)) {
                await sleep(200);
            }
            this.setState({ loadPLog: false });
            const pLog = store.getState().participants.participantLog;
            const foundParticipant = pLog.find((x) => x.hashedEmail == hashedEmail);
            if (foundParticipant) {
                const pid = foundParticipant['ParticipantID'];
                this.setState({ pid: pid }, () => {
                    history.push("/text-based?pid=" + this.state.pid);
                });
            }
            else {
                // create a user account and get a pid for this user using pre-populated entries in the participant log
                const nextAvailablePid = pLog.find((x) => !x.claimed && x.ParticipantID >= LOW_PID && x.ParticipantID <= HIGH_PID)?.['ParticipantID'];
                if (isDefined(nextAvailablePid)) {
                    this.setState({ updatePLog: true, pLogUpdate: { updates: { hashedEmail: hashedEmail, claimed: true }, pid: nextAvailablePid } }, () => {
                        if (this.uploadButtonRef.current) {
                            this.uploadButtonRef.current.click();
                        }
                        this.setState({ pid: nextAvailablePid }, () => {
                            history.push("/text-based?pid=" + this.state.pid);
                        });
                    });
                }
                else {
                    // generate a new pid by incrementing highest found
                    const newPid = Math.max(...pLog.filter((x) =>
                        !["202409113A", "202409113B"].includes(x['ParticipantID']) &&
                        x.ParticipantID >= LOW_PID && x.ParticipantID <= HIGH_PID
                    ).map((x) => Number(x['ParticipantID']))) + 1;
                    const setNum = newPid % 24;
                    const participantData = {
                        ...SURVEY_SETS[setNum], "ParticipantID": newPid, "Type": isTester ? "Test" : "emailParticipant",
                        "claimed": true, "simEntryCount": 0, "surveyEntryCount": 0, "textEntryCount": 0, "hashedEmail": hashedEmail
                    };
                    this.setState({ updatePLog: true, newParticipantData: participantData }, () => {
                        if (this.addPButtonRef.current) {
                            this.addPButtonRef.current.click();
                        }
                    });
                }
            }
        });
    }


    render() {
        const { currentUser } = this.state;
        return (
            <Router history={history}>
                {this.state.loadPLog && <Query query={GET_PARTICIPANT_LOG} fetchPolicy={'no-cache'}>
                    {({ loading: participantLoading, error: participantError, data: participantData }) => {
                        if (participantLoading) return <div>Loading...</div>;
                        if (participantError) return <div>Error fetching participant log</div>;
                        setParticipantLogInStore(participantData.getParticipantLog);
                    }}
                </Query>}
                <Query query={GET_SURVEY_VERSION}>
                    {({ loading: versionLoading, error: versionError, data: versionData }) => {
                        if (versionLoading) return <div>Loading...</div>;
                        if (versionError) return <div>Error fetching survey version data</div>;

                        const surveyVersion = versionData.getCurrentSurveyVersion;
                        const includeImageUrls = surveyVersion < 4;

                        return (
                            <Query
                                query={GET_CONFIGS}
                                variables={{ includeImageUrls }}
                                fetchPolicy={'cache-first'}
                            >
                                {({ loading, error, data }) => {
                                    if (loading) return <div>Loading configs...</div>;
                                    if (error) {
                                        console.error("Error fetching configs: ", error.message);
                                        return <div>Error fetching configs</div>;
                                    }

                                    // Setup configs
                                    setupConfigWithImages(data);
                                    setupTextBasedConfig(data);
                                    setSurveyVersion(surveyVersion);

                                    return (
                                        <div className="itm-app">
                                            {this.state.updatePLog && (
                                                <>
                                                    <Mutation mutation={UPDATE_PARTICIPANT_LOG}>
                                                        {(updateParticipantLog) => (
                                                            <div>
                                                                <button ref={this.uploadButtonRef} hidden onClick={(e) => {
                                                                    e.preventDefault();
                                                                    updateParticipantLog({
                                                                        variables: { pid: this.state.pLogUpdate.pid.toString(), updates: this.state.pLogUpdate.updates }
                                                                    });
                                                                    this.setState({ updatePLog: false });
                                                                }}></button>
                                                            </div>
                                                        )}
                                                    </Mutation>
                                                    <Mutation mutation={ADD_PARTICIPANT} onCompleted={(data) => {
                                                        if (data?.addNewParticipantToLog == -1) {
                                                            alert("This email address is taken. Please enter a different email.");
                                                        }
                                                        else {
                                                            const finalPid = data?.addNewParticipantToLog?.ops?.[0]?.ParticipantID;

                                                            this.setState({ pid: finalPid }, () => {
                                                                history.push("/text-based?pid=" + finalPid);
                                                            });
                                                        }
                                                    }}>
                                                        {(addNewParticipantToLog) => (
                                                            <div>
                                                                <button ref={this.addPButtonRef} hidden onClick={(e) => {
                                                                    e.preventDefault();
                                                                    addNewParticipantToLog({
                                                                        variables: { participantData: this.state.newParticipantData, lowPid: LOW_PID, highPid: HIGH_PID }
                                                                    });
                                                                    this.setState({ updatePLog: false });
                                                                }}></button>
                                                            </div>
                                                        )}
                                                    </Mutation>
                                                </>
                                            )}
                                            {currentUser &&
                                                <nav className="navbar navbar-expand-lg navbar-light bg-light itm-navbar">
                                                    <a className="navbar-brand" href="/">
                                                        <img className="nav-brand-itm" src={brandImage} alt="" />ITM
                                                    </a>
                                                    <ul className="navbar-nav custom-nav">
                                                        <li className="nav-item">
                                                            <Link className="nav-link" to="/">Home</Link>
                                                        </li>
                                                        <NavDropdown title="Data Collection">
                                                            <NavDropdown.Item as={Link} className="dropdown-item" to="/survey">
                                                                Take Delegation Survey
                                                            </NavDropdown.Item>
                                                            <NavDropdown.Item as={Link} className="dropdown-item" to="/text-based" disabled>
                                                                Complete Text Scenarios
                                                            </NavDropdown.Item>
                                                            {(this.state.currentUser.admin === true || this.state.currentUser.evaluator) && (
                                                                <NavDropdown.Item as={Link} className="dropdown-item" to="/review-text-based">
                                                                    Review Text Scenarios
                                                                </NavDropdown.Item>
                                                            )}
                                                            {(this.state.currentUser.admin === true || this.state.currentUser.evaluator) && (
                                                                <NavDropdown.Item as={Link} className="dropdown-item" to="/review-delegation">
                                                                    Review Delegation Survey
                                                                </NavDropdown.Item>
                                                            )}
                                                        </NavDropdown>
                                                        {(this.state.currentUser.admin === true || this.state.currentUser.evaluator === true) && (
                                                            <>
                                                                <NavDropdown title="Human Evaluation Segments">
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/survey-results">
                                                                        Delegation Survey Results
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/text-based-results">
                                                                        Text Scenario Results
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/humanSimParticipant">
                                                                        Human Participant Data: Within-Subjects Analysis
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/humanProbeData">
                                                                        Human Sim Probe Data
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/human-results">
                                                                        Play by Play: Humans in Sim
                                                                    </NavDropdown.Item>
                                                                </NavDropdown>
                                                                <NavDropdown title="ADM Evaluation Segments">
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/results">
                                                                        ADM Data
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/adm-results">
                                                                        ADM Alignment Results
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className='dropdown-item' to="/adm-probe-responses">
                                                                        ADM Probe Responses
                                                                    </NavDropdown.Item>
                                                                </NavDropdown>
                                                                <NavDropdown title="Data Analysis">
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/dre-results/rq1">
                                                                        RQ1
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/dre-results/rq2">
                                                                        RQ2
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/dre-results/rq3">
                                                                        RQ3
                                                                    </NavDropdown.Item>
                                                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/dre-results/exploratory-analysis">
                                                                        Exploratory Analysis
                                                                    </NavDropdown.Item>
                                                                </NavDropdown>
                                                            </>
                                                        )}
                                                    </ul>
                                                    <ul className="navbar-nav ml-auto">
                                                        <li className="login-user">
                                                            <div className="login-user-content">
                                                                <img className="nav-login-icon" src={userImage} alt="" />
                                                                <NavDropdown
                                                                    title={currentUser.emails[0].address}
                                                                    id="basic-nav-dropdown"
                                                                    show={this.state.menuIsOpened}
                                                                    onToggle={this.handleToggle}
                                                                >
                                                                    <Link className="dropdown-item" to="/myaccount" onClick={this.handleToggle}>
                                                                        My Account
                                                                    </Link>
                                                                    {this.state.currentUser.admin === true && (
                                                                        <Link className="dropdown-item" to="/admin" onClick={this.handleToggle}>
                                                                            Administrator
                                                                        </Link>
                                                                    )}
                                                                    {(this.state.currentUser.experimenter === true || this.state.currentUser.admin === true || this.state.currentUser.evaluator === true) && (
                                                                        <Link className="dropdown-item" to="/participant-progress-table" onClick={this.handleToggle}>
                                                                            Progress Table
                                                                        </Link>
                                                                    )}
                                                                    {(this.state.currentUser.experimenter === true || this.state.currentUser.admin === true) && (
                                                                        <Link className="dropdown-item" to="/pid-lookup" onClick={this.handleToggle}>
                                                                            PID Lookup
                                                                        </Link>
                                                                    )}
                                                                    {(this.state.currentUser.experimenter === true || this.state.currentUser.admin === true) && (
                                                                        <Link className="dropdown-item" to="/participantTextTester" onClick={this.handleToggle}>
                                                                            Test Text Scenario
                                                                        </Link>
                                                                    )}
                                                                    <Link className="dropdown-item" to={{}} onClick={this.logout}>
                                                                        Logout
                                                                    </Link>
                                                                </NavDropdown>
                                                            </div>
                                                        </li>
                                                    </ul>
                                                </nav>
                                            }
                                            <div className="main-content">
                                                <Switch>
                                                    <Route exact path="/">
                                                        <Home newState={this.state} />
                                                    </Route>
                                                    <Route exact path="/results">
                                                        <Results />
                                                    </Route>
                                                    <Route exact path="/adm-results">
                                                        <AdmResults />
                                                    </Route>
                                                    <Route exact path='/adm-probe-responses'>
                                                        <ADMProbeResponses/>
                                                    </Route>
                                                    <Route exact path="/humanSimParticipant">
                                                        <AggregateResults type="HumanSimParticipant" />
                                                    </Route>
                                                    <Route exact path="/scenarios">
                                                        <Scenarios />
                                                    </Route>
                                                    <Route path="/login">
                                                        <Login newState={this.state} userLoginHandler={this.userLoginHandler} participantLoginHandler={this.participantLoginHandler} testerLogin={false} />
                                                    </Route>
                                                    <Route path="/participantText">
                                                        <Login newState={this.state} userLoginHandler={this.userLoginHandler} participantLoginHandler={this.participantLoginHandler} participantTextLogin={true} testerLogin={false} />
                                                    </Route>
                                                    <Route path="/participantTextTester">
                                                        <Login newState={this.state} userLoginHandler={this.userLoginHandler} participantLoginHandler={this.participantLoginHandler} participantTextLogin={true} testerLogin={true} />
                                                    </Route>
                                                    <Route path="/reset-password/:token" component={ResetPassPage} />
                                                    <Route path="/myaccount">
                                                        <MyAccount newState={this.state} userLoginHandler={this.userLoginHandler} />
                                                    </Route>
                                                    <Route path="/admin">
                                                        <Admin newState={this.state} userLoginHandler={this.userLoginHandler} />
                                                    </Route>
                                                    <Route path="/participant-progress-table">
                                                        <ProgressTable newState={this.state} />
                                                    </Route>
                                                    <Route path="/pid-lookup">
                                                        <PidLookupPage newState={this.state} />
                                                    </Route>
                                                    <Route path="/survey">
                                                        <Survey currentUser={this.state.currentUser} />
                                                    </Route>
                                                    <Route path="/survey-results">
                                                        <SurveyResults />
                                                    </Route>
                                                    <Route path="/review-text-based">
                                                        <ReviewTextBased newState={this.state} userLoginHandler={this.userLoginHandler} />
                                                    </Route>
                                                    <Route path="/review-delegation">
                                                        <ReviewDelegation newState={this.state} userLoginHandler={this.userLoginHandler} />
                                                    </Route>
                                                    <Route path="/text-based">
                                                        <TextBased />
                                                    </Route>
                                                    <Route path="/remote-text-survey">
                                                        <StartOnline />
                                                    </Route>
                                                    <Route path="/text-based-results">
                                                        <TextBasedResults />
                                                    </Route>
                                                    <Route path="/humanProbeData">
                                                        <AggregateResults type="HumanProbeData" />
                                                    </Route>
                                                    <Route path="/human-results">
                                                        <HumanResults />
                                                    </Route>
                                                    <Route path="/dre-results/rq1">
                                                        <RQ1 />
                                                    </Route>
                                                    <Route path="/dre-results/rq2">
                                                        <RQ2 />
                                                    </Route>
                                                    <Route path="/dre-results/rq3">
                                                        <RQ3 />
                                                    </Route>
                                                    <Route path="/dre-results/exploratory-analysis">
                                                        <ExploratoryAnalysis />
                                                    </Route>
                                                </Switch>
                                            </div>

                                            <div className="itm-footer">
                                                <div className="footer-text">This research was developed with funding from the Defense Advanced Research Projects Agency (DARPA). The views, opinions and/or findings expressed are those of the author and should not be interpreted as representing the official views or policies of the Department of Defense or the U.S. Government.</div>
                                                <div className="footer-link"><a href="https://www.darpa.mil/program/in-the-moment" target="_blank" rel="noopener noreferrer">DARPA's In the Moment (ITM) Program Page</a></div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </Query>
                        );
                    }}
                </Query>
            </Router>
        );
    }
}