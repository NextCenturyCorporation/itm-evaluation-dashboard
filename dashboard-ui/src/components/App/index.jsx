import React from 'react';
import queryString from 'query-string';
import ResultsPage from '../Results/results';
import HomePage from '../Home/home';
import ScenarioPage from '../ScenarioPage/scenarioPage';
import {SurveyPage, SurveyPageWrapper} from '../Survey/survey';
import TextBasedScenariosPage from '../TextBasedScenarios/TextBasedScenariosPage';
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
import gql from "graphql-tag";
import { Query } from '@apollo/react-components';
import store from '../../store/store';
import { addConfig } from '../../store/slices/configSlice';

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
import { isDefined } from '../AggregateResults/DataFunctions';

const history = createBrowserHistory();

const GET_SURVEY_CONFIG = gql`
    query GetSurveyConfig {
        getAllSurveyConfigs,
        getAllImageUrls
    }`;

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
    return <TextBasedScenariosPage />;
}

function TextBasedResults() {
    return <TextBasedResultsPage />;
}

function AdmResults() {
    return <ADMChartPage />
}

function Login({ newState, userLoginHandler, updateHandler }) {
    if (newState !== null) {
        if (newState.currentUser !== null) {
            return <Home newState={newState} currentUser={newState.currentUser} />;
        } else {
            return <LoginApp userLoginHandler={userLoginHandler} />;
        }
    } else {
        return <LoginApp userLoginHandler={userLoginHandler} />;
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

export class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = queryString.parse(window.location.search);
        this.state.currentUser = null;

        this.logout = this.logout.bind(this);
        this.userLoginHandler = this.userLoginHandler.bind(this);
    }

    async componentDidMount() {
        //refresh the session to get a new accessToken if expired
        const tokens = await accountsClient.refreshSession();

        if (window.location.href.indexOf("reset-password") > -1) {
            return;
        }

        if (!tokens) {
            history.push('/login');
            return;
        }

        const user = await accountsGraphQL.getUser(
            tokens ? tokens.accessToken : ''
        );

        this.setState({ currentUser: user });
    }

    async logout() {
        await accountsClient.logout();
        history.push('/login');
        this.setState({ currentUser: null });
    }

    userLoginHandler(userObject) {
        this.setState({ currentUser: userObject });
    }

    setupConfigWithImages(data) {
        // Get the survey configs one by one, since they are all needed for the results pages
        // and add the correct image urls back to them
        // then store them properly in localStorage
        for (const config of data.getAllSurveyConfigs) {
            for (const page of config.survey.pages) {
                for (const el of page.elements) {
                    if (Object.keys(el).includes("patients")) {
                        for (const patient of el.patients) {
                            const foundImg = data.getAllImageUrls.find((x) => x._id === patient.imgUrl);
                            if (isDefined(foundImg)) {
                                patient.imgUrl = foundImg.url;
                            }

                        }
                    }
                }
            }
            store.dispatch(addConfig({ id: config._id, data: config }));
        }
    }

    render() {
        const { currentUser } = this.state;
        return (
            <Router history={history}>
                <Query query={GET_SURVEY_CONFIG} fetchPolicy={'no-cache'}>
                    {
                        ({ loading, error, data }) => {
                            if (loading) {
                                return;
                            }
                            if (error) {
                                console.warn("Error getting survey config: ", error);
                                return;
                            }
                            this.setupConfigWithImages(data);


                            return (<div className="itm-app">
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
                                                <NavDropdown.Item as={Link} className="dropdown-item" to="/text-based">
                                                    Complete Text Scenarios
                                                </NavDropdown.Item>
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
                                                            Human Sim Probe Values
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
                                        <Route exact path="/humanSimParticipant">
                                            <AggregateResults type="HumanSimParticipant" />
                                        </Route>
                                        <Route exact path="/scenarios">
                                            <Scenarios />
                                        </Route>
                                        <Route path="/login">
                                            <Login newState={this.state} userLoginHandler={this.userLoginHandler} />
                                        </Route>
                                        <Route path="/reset-password/:token" component={ResetPassPage} />
                                        <Route path="/myaccount">
                                            <MyAccount newState={this.state} userLoginHandler={this.userLoginHandler} />
                                        </Route>
                                        <Route path="/admin">
                                            <Admin newState={this.state} userLoginHandler={this.userLoginHandler} />
                                        </Route>
                                        <Route path="/survey">
                                            <Survey currentUser={this.state.currentUser} />
                                        </Route>
                                        <Route path="/survey-results">
                                            <SurveyResults />
                                        </Route>
                                        <Route path="/text-based">
                                            <TextBased />
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
                                    </Switch>
                                </div>

                                <div className="itm-footer">
                                    <div className="footer-text">This research was developed with funding from the Defense Advanced Research Projects Agency (DARPA). The views, opinions and/or findings expressed are those of the author and should not be interpreted as representing the official views or policies of the Department of Defense or the U.S. Government.</div>
                                    <div className="footer-link"><a href="https://www.darpa.mil/program/in-the-moment" target="_blank" rel="noopener noreferrer">DARPA's In the Moment (ITM) Program Page</a></div>
                                </div>
                            </div>)
                        }
                    }
                </Query>
            </Router>
        );
    }
}