import React from 'react';
import { accountsPassword } from '../../services/accountsService';
import { withRouter } from 'react-router-dom';
import $ from 'jquery';
import brandImage from '../../img/itm-logo.png';
import { Tabs, Tab, Toast } from 'react-bootstrap';
import './login.css';
import bcrypt from 'bcryptjs';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

class LoginApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userName: "",
            password: "",
            error: null,
            createUserName: "",
            createPassword: "",
            createEmail: "",
            textEmail: "",
            forgotEmail: "",
            loginFailed: false,
            createAccountFailed: false,
            pidCreationFailed: false,
            viewHiddenEmail: false,
            confirmTextEmail: "",
            viewHiddenConfirmEmail: false,
            emailsMatch: true
        };
        this.login = this.login.bind(this);
        this.createAccount = this.createAccount.bind(this);
    };

    setupPID = async (e) => {
        e.preventDefault();  // Prevent the default form submission
        const { textEmail, confirmTextEmail } = this.state;

        // removing leading and trailing white space 
        const trimmedEmail = textEmail.trim().toLowerCase();
        const trimmedConfirmEmail = confirmTextEmail.trim().toLowerCase();

        if (!textEmail || !confirmTextEmail) {
            $("#text-entry-feedback").addClass("feedback-display").text("All fields are required.");
            return; // Stop the function if any field is empty
        }

        if (trimmedEmail !== trimmedConfirmEmail) {
            this.setState({ emailsMatch: false });
            return;
        }

        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // email regex
        if (!re.test(trimmedEmail)) {
            $("#text-entry-feedback").addClass("feedback-display").text("Please ensure that you enter a valid email address.");
            return;
        }
        const hashedEmail = bcrypt.hashSync(trimmedEmail, "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

        $("#text-entry-feedback").removeClass("feedback-display");
        try {
            this.props.participantLoginHandler(hashedEmail, this.props.history.location.pathname == '/participantTextTester');
        } catch (err) {
            $("#text-entry-feedback").addClass("feedback-display");
            this.setState({ error: err.message, pidCreationFailed: true });
        }
    };

    createAccount = async (e) => {
        e.preventDefault();  // Prevent the default form submission
        const { createEmail, createUserName, createPassword } = this.state;

        // removing leading and trailing white space 
        const trimmedEmail = createEmail.trim()
        const trimmedUserName = createUserName.trim()

        if (!createEmail || !createUserName || !createPassword) {
            $("#create-account-feedback").addClass("feedback-display").text("All fields are required.");
            return; // Stop the function if any field is empty
        }

        $("#create-account-feedback").removeClass("feedback-display");
        try {
            let results = await accountsPassword.createUser({
                username: trimmedUserName,
                password: createPassword,
                email: trimmedEmail
            });

            results = await accountsPassword.login({
                password: createPassword,
                user: {
                    email: trimmedEmail,
                }
            });

            this.props.history.push('/');
            this.props.userLoginHandler(results.user);
        } catch (err) {
            $("#create-account-feedback").addClass("feedback-display");
            this.setState({ error: err.message, createAccountFailed: true });
        }
    };

    login = async () => {
        $("#sign-in-feedback").removeClass("feedback-display");
        try {
            let results;
            if (this.state.userName.indexOf('@') > -1) {
                results = await accountsPassword.login({
                    password: this.state.password,
                    user: {
                        email: this.state.userName,
                    }
                });
            } else {
                results = await accountsPassword.login({
                    password: this.state.password,
                    user: {
                        username: this.state.userName,
                    }
                });
            }

            this.props.history.push('/');
            this.props.userLoginHandler(results.user);
        } catch (err) {
            $("#sign-in-feedback").addClass("feedback-display");
            this.setState({ error: err.message, loginFailed: true });
        }
    };

    resetPassword = async () => {
        try {
            await accountsPassword.requestPasswordReset(this.state.forgotEmail);

            $("#send-forgot-email-pane").addClass("display-none");
            $("#success-forgot-email-pane").removeClass("display-none");
        } catch (err) {
            $("#reset-password-feedback").addClass("feedback-display");
            this.setState({ error: err.message });
        }
    };

    onChangeUserName = ({ target }) => {
        this.setState({ userName: target.value });
    };

    onChangePassword = ({ target }) => {
        this.setState({ password: target.value });
    };

    onChangeCreateUserName = ({ target }) => {
        this.setState({ createUserName: target.value });
    };

    onChangeCreateEmail = ({ target }) => {
        this.setState({ createEmail: target.value });
    };

    onChangeCreatePassword = ({ target }) => {
        this.setState({ createPassword: target.value });
    };

    onChangeForgotEmail = ({ target }) => {
        this.setState({ forgotEmail: target.value });
    };

    onChangeTextEmail = ({ target }) => {
        this.setState({
            textEmail: target.value,
            emailsMatch: target.value.trim().toLowerCase() === this.state.confirmTextEmail.trim().toLowerCase()
        });
    };

    onChangeConfirmTextEmail = ({ target }) => {
        this.setState({
            confirmTextEmail: target.value,
            emailsMatch: target.value.trim().toLowerCase() === this.state.textEmail.trim().toLowerCase()
        });
    };

    showSignIn = (evt) => {
        $("#sign-in-pane").removeClass("display-none");
        $("#forgot-password-pane").addClass("display-none");
    };

    forgotPasswordLink = (evt) => {
        $("#sign-in-pane").addClass("display-none");
        $("#forgot-password-pane").removeClass("display-none");
    };

    toggleVisibility = () => {
        this.setState({ viewHiddenEmail: !this.state.viewHiddenEmail });
    }

    toggleConfirmVisibility = () => {
        this.setState({ viewHiddenConfirmEmail: !this.state.viewHiddenConfirmEmail });
    };

    loginErrorMappings = {
        "GraphQL error: Unrecognized options for login request": "Please enter your username and password.",
        "GraphQL error: Invalid credentials": "Login failed. Please check your credentials."
    }

    createAccountErrorMappings = {
        "GraphQL error: Unrecognized options for login request": "Email, username, and password are required.",
        "GraphQL error: Username or Email is required": "Email, username, and password are required.",
        "GraphQL error: Invalid credentials": "Email or username already in use."
    }

    render() {
        return (
            <div className='full-page'>
                <div className="login-header-logo">
                    <div className="d-flex justify-content-center">
                        <img src={brandImage} alt="" />
                    </div>
                    <h1 className="d-flex justify-content-center login-header-text">ITM Dashboard</h1>
                </div>
                <div className="row justify-content-center align-items-center h-100 center-container">
                    <div className="login-container">
                        <Tabs className='p-1' defaultActiveKey={this.props.isParticipant ? 2 : 1}>
                            {this.props.history.location.pathname != '/participantTextTester' && this.props.history.location.pathname != '/participantText' &&
                                <Tab eventKey={0} title="Create Account">
                                    <div>
                                        <div className="sign-in-instructions">
                                            <h4 className="sign-in-header">Create Account</h4>
                                            <p className='subtext'>Create an account to view results.</p>
                                        </div>
                                        <form onSubmit={this.createAccount}>
                                            <div className="form-group">
                                                <div className="input-login-header">Email Address</div>
                                                <input className="form-control form-control-lg" required placeholder="Email" type="text" id="createEmail" value={this.state.createEmail} onChange={this.onChangeCreateEmail} />
                                            </div>
                                            <div className="form-group">
                                                <div className="input-login-header">Username</div>
                                                <input className="form-control form-control-lg" required placeholder="Username" type="text" id="createUserName" value={this.state.createUserName} onChange={this.onChangeCreateUserName} />
                                            </div>
                                            <div className="form-group">
                                                <div className="input-login-header">Password</div>
                                                <input className="form-control form-control-lg" required placeholder="Password" type="password" id="createPassword" value={this.state.createPassword} onChange={this.onChangeCreatePassword} />
                                            </div>
                                            {this.state.createAccountFailed && (
                                                <Toast bg='danger' className='mt-1' autohide={false} onClose={() => this.setState({ createAccountFailed: false })}>
                                                    <Toast.Header>
                                                        <strong className="me-auto">Error creating account</strong>
                                                    </Toast.Header>
                                                    <Toast.Body className='text-white'>{this.createAccountErrorMappings[this.state.error] ?? this.state.error}</Toast.Body>
                                                </Toast>
                                            )}
                                            <div className="form-group">
                                                <button className="action-btn sd-btn sd-navigation__next-btn" type="submit">Create Account</button>
                                            </div>
                                            <div className="invalid-feedback" id="create-account-feedback">
                                                {this.state.error}
                                            </div>
                                        </form>
                                    </div>
                                </Tab>
                            }
                            {this.props.history.location.pathname != '/participantTextTester' && this.props.history.location.pathname != '/participantText' &&
                                <Tab eventKey={1} title="Sign In">
                                    <div >
                                        <div id="sign-in-pane">
                                            <div className="sign-in-instructions">
                                                <h4 className="sign-in-header">Sign in</h4>
                                                <p className='subtext'>Sign in using your username or email address.</p>
                                            </div>
                                            <form>
                                                <div className="form-group">
                                                    <div className="input-login-header">Email Address or Username</div>
                                                    <input className="form-control form-control-lg" placeholder="Email / Username" type="text" id="userName" value={this.state.userName} onChange={this.onChangeUserName} />
                                                </div>
                                                <div className="form-group">
                                                    <div className='multi-header'>
                                                        <div className="input-login-header">Password</div>
                                                        <a className="" id="forgot-pass-tab" href="#forgot" onClick={this.forgotPasswordLink}>Forgot Password?</a>
                                                    </div>
                                                    <input className="form-control form-control-lg" placeholder="Password" type="password" id="password" value={this.state.password} onChange={this.onChangePassword} />
                                                </div>
                                                <div className="form-group">
                                                    {this.state.loginFailed && (
                                                        <Toast bg='danger' className='mt-1' autohide={false} onClose={() => this.setState({ loginFailed: false })}>
                                                            <Toast.Header>
                                                                <strong className="me-auto">Error logging in</strong>
                                                            </Toast.Header>
                                                            <Toast.Body className='text-white'>{this.loginErrorMappings[this.state.error] ?? this.state.error}</Toast.Body>
                                                        </Toast>
                                                    )}
                                                </div>
                                                <div className="form-group">
                                                    <button className="action-btn sd-btn sd-navigation__next-btn" onClick={this.login} type="button">Sign In</button>
                                                </div>
                                                <div className="invalid-feedback" id="sign-in-feedback">
                                                    {this.state.error}
                                                </div>
                                            </form>
                                        </div>
                                        <div id="forgot-password-pane" className="display-none">
                                            <div id="send-forgot-email-pane">
                                                <div className="sign-in-instructions">
                                                    <h4 className="sign-in-header">Forgot Password</h4>
                                                    <p className='subtext'>Enter your email address to reset password.</p>
                                                </div>
                                                <form>
                                                    <div className="form-group">
                                                        <div className="input-login-header">Email Address</div>
                                                        <input className="form-control form-control-lg" placeholder="Email" type="text" id="forgotEmail" value={this.state.forgotEmail} onChange={this.onChangeForgotEmail} />
                                                    </div>
                                                    <div className="form-group">
                                                        <button className="action-btn sd-btn sd-navigation__next-btn" onClick={this.resetPassword} type="button">Send Reset Email</button>
                                                    </div>
                                                    <div className="invalid-feedback" id="reset-password-feedback">
                                                        {this.state.error}
                                                    </div>
                                                </form>
                                            </div>
                                            <div id="success-forgot-email-pane" className="display-none">
                                                <div className="sign-in-instructions">
                                                    <h4 className="sign-in-header">Email sent!</h4>
                                                    <p className='subtext'>Check your email for a link to reset your password.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            }
                            <Tab eventKey={2} title="Text Scenario Login">
                                <div >
                                    <div id="sign-in-pane">
                                        <div className="sign-in-instructions">
                                            <h4 className="sign-in-header">Start Text Scenario</h4>
                                            <p className='justified-subtext'>To start the text scenario portion of the experiment, enter your email address. You will be asked
                                                for this email address at the study location, so please remember what you use. <br /> <i>Your email will never be stored in connection to your responses. The experimenters will not have access to your email, only to a number randomly assigned to you.</i>
                                            </p>
                                        </div>
                                        <form onSubmit={this.setupPID}>
                                            <div className="form-group">
                                                <div className="input-login-header">Email Address</div>
                                                <div className="input-with-btn">
                                                    <input className="form-control form-control-lg" required placeholder="Email" type={this.state.viewHiddenEmail ? "text" : "password"} id="emailOnly" value={this.state.textEmail} onChange={this.onChangeTextEmail} />
                                                    <button className="blank-btn" type='button' onClick={this.toggleVisibility}>{this.state.viewHiddenEmail ? <VisibilityIcon /> : <VisibilityOffIcon />}</button>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <div className="input-login-header">Confirm Email Address</div>
                                                <div className="input-with-btn">
                                                    <input
                                                        className="form-control form-control-lg"
                                                        required
                                                        placeholder="Confirm Email"
                                                        type={this.state.viewHiddenConfirmEmail ? "text" : "password"}
                                                        id="confirmEmailOnly"
                                                        value={this.state.confirmTextEmail}
                                                        onChange={this.onChangeConfirmTextEmail}
                                                    />
                                                    <button
                                                        className="blank-btn"
                                                        type='button'
                                                        onClick={this.toggleConfirmVisibility}
                                                    >
                                                        {this.state.viewHiddenConfirmEmail ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                {this.state.loginFailed && (
                                                    <Toast bg='danger' className='mt-1' autohide={false} onClose={() => this.setState({ loginFailed: false })}>
                                                        <Toast.Header>
                                                            <strong className="me-auto">Error Creating User</strong>
                                                        </Toast.Header>
                                                        <Toast.Body className='text-white'>{this.loginErrorMappings[this.state.error] ?? this.state.error}</Toast.Body>
                                                    </Toast>
                                                )}
                                                {!this.state.emailsMatch && this.state.confirmTextEmail && (
                                                    <Toast bg='warning' className='mt-1' autohide={false} onClose={() => this.setState({ emailsMatch: true })}>
                                                        <Toast.Header>
                                                            <strong className="me-auto">Email Mismatch</strong>
                                                        </Toast.Header>
                                                        <Toast.Body>Email addresses do not match</Toast.Body>
                                                    </Toast>
                                                )}
                                            </div>

                                            <div className="form-group">
                                                <button className="action-btn sd-btn sd-navigation__next-btn" type="submit">Start</button>
                                            </div>
                                            <div className="invalid-feedback" id="text-entry-feedback">
                                                {this.state.error}
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </Tab>
                        </Tabs>
                    </div>
                </div>

            </div>
        );
    }
}

export default withRouter(LoginApp);