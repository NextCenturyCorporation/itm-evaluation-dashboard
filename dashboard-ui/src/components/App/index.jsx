import React from 'react';
import queryString from 'query-string';
import ResultsPage from '../Results/results';
import HomePage from '../Home/home';
import ScenarioPage from '../ScenarioPage/scenarioPage';
import SurveyPage from '../Survey/survey';
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

const history = createBrowserHistory();

function Home({ newState }) {
    if (newState.currentUser == null) {
        history.push('/login');
    }
    return <HomePage />;
}

function Results() {
    return <ResultsPage />;
}

function Scenarios() {
    return <ScenarioPage />;
}

function Survey(currentUser) {
    return <SurveyPage currentUser={currentUser?.currentUser} />
}

function TextBased() {
    return <TextBasedScenariosPage />;
}

function TextBasedResults() {
    return <TextBasedResultsPage />;
}

function AdmResults() {
    return <ADMChartPage/>
}


function Login({ newState, userLoginHandler, updateHandler }) {
    if (newState.currentUser !== null) {
        return <Home newState={newState} />;
    } else {
        return <LoginApp userLoginHandler={userLoginHandler} />;
    }
}

function MyAccount({ newState, userLoginHandler }) {
    if (newState.currentUser == null) {
        history.push("/login");
    }

    return <MyAccountPage currentUser={newState.currentUser} updateUserHandler={userLoginHandler} />
}

function Admin({ newState, userLoginHandler }) {
    if (newState.currentUser == null) {
        history.push("/login");
    }

    // Do not let users who aren't admins somehow go to the admin page
    if (newState.currentUser !== null && newState.currentUser.admin === true) {
        return <AdminPage currentUser={newState.currentUser} updateUserHandler={userLoginHandler} />
    } else {
        return <Home newState={newState} />;
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

    render() {
        const { currentUser } = this.state;
        return (
            <Router history={history}>
                <div className="itm-app">
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
                                <NavDropdown title="Human Evaluation Segments">
                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/survey-results">
                                        Delegation Survey Results
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/text-based-results">
                                        Text Scenario Results
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/humanSimParticipant">
                                        Human Sim Participant Data
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} className="dropdown-item" to="/humanProbeData">
                                        Human Sim Probe Values
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
                            
                        </Switch>
                    </div>

                    <div className="itm-footer">
                        <div className="footer-text">This research was developed with funding from the Defense Advanced Research Projects Agency (DARPA). The views, opinions and/or findings expressed are those of the author and should not be interpreted as representing the official views or policies of the Department of Defense or the U.S. Government.</div>
                        <div className="footer-link"><a href="https://www.darpa.mil/program/in-the-moment" target="_blank" rel="noopener noreferrer">DARPA's In the Moment (ITM) Program Page</a></div>
                    </div>
                </div>
            </Router>
        );
    }
}