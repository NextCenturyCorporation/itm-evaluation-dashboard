import React from 'react';
import { isUserElevated } from '.';
import brandImage from '../../img/itm-logo.png';
import userImage from '../../img/account_icon.png';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Link } from 'react-router-dom';

export function Header({ currentUser, logout }) {
    return (<nav className="navbar navbar-expand-lg navbar-light bg-light itm-navbar">
        <a className="navbar-brand" href="/">
            <img className="nav-brand-itm" src={brandImage} alt="" />ITM
        </a>
        <ul className="navbar-nav custom-nav">
            <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
            </li>
            {(isUserElevated(currentUser) &&
                <NavDropdown title="Data Collection">
                    <NavDropdown.Item as={Link} className="dropdown-item" to="/survey">
                        Take Delegation Survey
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} className="dropdown-item" to="/text-based" disabled>
                        Complete Text Scenarios
                    </NavDropdown.Item>
                    {(currentUser.admin === true || currentUser.evaluator) && (
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/review-text-based">
                            Review Text Scenarios
                        </NavDropdown.Item>
                    )}
                    {(currentUser.admin === true || currentUser.evaluator) && (
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/review-delegation">
                            Review Delegation Survey
                        </NavDropdown.Item>
                    )}
                </NavDropdown>
            )}
            {isUserElevated(currentUser) && (
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
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/rq1">
                            RQ1
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/rq2">
                            RQ2
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/rq3">
                            RQ3
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/exploratory-analysis">
                            Exploratory Analysis
                        </NavDropdown.Item>
                    </NavDropdown>
                </>
            )}
        </ul>
        <ul className="navbar-nav ml-auto">
            <li className="login-user">
                <UserMenu currentUser={currentUser} logout={logout} />
            </li>
        </ul>
    </nav>);
}

function UserMenu({ currentUser, logout }) {
    const [menuIsOpened, setMenuIsOpened] = React.useState(false);
    const handleToggle = () => {
        setMenuIsOpened(!menuIsOpened);
    };
    return (
        <div className="login-user-content">
            <img className="nav-login-icon" src={userImage} alt="" />
            <NavDropdown
                title={currentUser.emails[0].address}
                id="basic-nav-dropdown"
                show={menuIsOpened}
                onToggle={handleToggle}
            >
                <Link className="dropdown-item" to="/myaccount" onClick={handleToggle}>
                    My Account
                </Link>
                {currentUser.admin === true && (
                    <Link className="dropdown-item" to="/admin" onClick={handleToggle}>
                        Administrator
                    </Link>
                )}
                {isUserElevated(currentUser) && (
                    <Link className="dropdown-item" to="/participant-progress-table" onClick={handleToggle}>
                        Progress Table
                    </Link>
                )}
                {(currentUser.experimenter === true || currentUser.admin === true) && (
                    <Link className="dropdown-item" to="/pid-lookup" onClick={handleToggle}>
                        PID Lookup
                    </Link>
                )}
                {(currentUser.experimenter === true || currentUser.admin === true) && (
                    <Link className="dropdown-item" to="/participantTextTester" onClick={handleToggle}>
                        Test Text Scenario
                    </Link>
                )}
                <Link className="dropdown-item" to={{}} onClick={logout}>
                    Logout
                </Link>
            </NavDropdown>
        </div>);
}