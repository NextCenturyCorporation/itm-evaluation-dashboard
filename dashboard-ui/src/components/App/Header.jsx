import React from 'react';
import { hasAccess } from '.';
import brandImage from '../../img/itm-logo.png';
import userImage from '../../img/account_icon.png';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Link } from 'react-router-dom';

export function Header({ currentUser, logout }) {
    return (<nav className="navbar navbar-expand-lg navbar-light bg-light itm-navbar">
        <Link className="navbar-brand" to="/">
            <img className="nav-brand-itm" src={brandImage} alt="" />ITM
        </Link>
        <ul className="navbar-nav custom-nav">
            <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
            </li>
            {(hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User']) &&
                <NavDropdown title="Data Collection">
                    <NavDropdown.Item as={Link} className="dropdown-item" to="/survey">
                        Take Delegation Survey
                    </NavDropdown.Item>
                    {(hasAccess(currentUser, ['evaluator', 'admin'])) && (
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/review-text-based">
                            Review Text Scenarios
                        </NavDropdown.Item>
                    )}
                    {(hasAccess(currentUser, ['evaluator', 'admin'])) && (
                        <NavDropdown.Item as={Link} className="dropdown-item" to="/review-delegation">
                            Review Delegation Survey
                        </NavDropdown.Item>
                    )}
                </NavDropdown>
            )}
            
            {(hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User'])) && (
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
                </>
            )}

            {(hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User', 'externalSimResearcher'])) && (
                <>
                <NavDropdown title="Data Analysis">
                        {hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User']) && (
                            <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/rq1">
                            RQ1
                            </NavDropdown.Item>
                        )}
                        {hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User']) && (
                            <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/rq2">
                            RQ2
                            </NavDropdown.Item>
                        )}
                        {hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User']) && (
                            <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/rq3">
                            RQ3
                            </NavDropdown.Item>
                        )}
                        {(hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User', 'externalSimResearcher'])) && (
                            <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/open-world">
                            Open World
                            </NavDropdown.Item>
                        )}
                        {hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User']) && (
                            <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/open-world-adms">
                            Open World ADMs
                            </NavDropdown.Item>
                        )}
                        {(hasAccess(currentUser, ['admin', 'ta3User', 'externalSimResearcher'])) && (
                            <NavDropdown.Item as={Link} className="dropdown-item" to="/research-results/tccc">
                                        TCCC
                                    </NavDropdown.Item>
                            )}
                    </NavDropdown>
                </>
            )
        }
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
                {hasAccess(currentUser, ['admin']) && (
                    <Link className="dropdown-item" to="/admin" onClick={handleToggle}>
                        Administrator
                    </Link>
                )}
                {hasAccess(currentUser, ['admin', 'evaluator', 'experimenter', 'adeptUser', 'ta3User']) && (
                    <Link className="dropdown-item" to="/participant-progress-table" onClick={handleToggle}>
                        Progress Table
                    </Link>
                )}
                {(hasAccess(currentUser, ['experimenter', 'admin'])) && (
                    <Link className="dropdown-item" to="/pid-lookup" onClick={handleToggle}>
                        PID Lookup
                    </Link>
                )}
                {(hasAccess(currentUser, ['experimenter', 'admin'])) && (
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