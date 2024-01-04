import React from 'react';
import { accountsPassword } from '../../services/accountsService';
import { withRouter } from 'react-router-dom';
import $ from 'jquery';
import brandImage from '../../img/logo.png';
import { Tabs, Tab, FormControl } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { Checkbox, FormControlLabel } from '@material-ui/core';
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
            forgotEmail: "",
            loginFailed: false,
            createAccountFailed: false,
            selectedTeam: "",
            delegator: false
        };

        this.login = this.login.bind(this);
        this.createAccount = this.createAccount.bind(this);
    }

    createAccount = async () => {
        $("#create-account-feedback").removeClass("feedback-display");
        try {
            let results = await accountsPassword.createUser({
                username: this.state.createUserName,
                password: this.state.createPassword,
                email: this.state.createEmail,
                team: this.state.selectedTeam,
                delegator: this.state.delegator
            });

            results = await accountsPassword.login({
                password: this.state.createPassword,
                user: {
                    email: this.state.createEmail,
                }
            });

            this.props.history.push('/');
            this.props.userLoginHandler(results.user);
        } catch (err) {
            $("#create-account-feedback").addClass("feedback-display");
            this.setState({ error: err.message, createAccountFailed: true });
        }
    }




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
    }

    resetPassword = async () => {
        try {
            await accountsPassword.requestPasswordReset(this.state.forgotEmail);

            $("#send-forgot-email-pane").addClass("display-none");
            $("#success-forgot-email-pane").removeClass("display-none");
        } catch (err) {
            $("#reset-password-feedback").addClass("feedback-display");
            this.setState({ error: err.message });
        }
    }

    onChangeUserName = ({ target }) => {
        this.setState({ userName: target.value });
    }

    onChangePassword = ({ target }) => {
        this.setState({ password: target.value });
    }

    onChangeCreateUserName = ({ target }) => {
        this.setState({ createUserName: target.value });
    }

    onChangeCreateEmail = ({ target }) => {
        this.setState({ createEmail: target.value });
    }

    onChangeCreatePassword = ({ target }) => {
        this.setState({ createPassword: target.value });
    }

    onChangeForgotEmail = ({ target }) => {
        this.setState({ forgotEmail: target.value });
    }

    onChangeSelectedTeam = ({ target }) => {
        this.setState({ selectedTeam: target.value });
    }

    onChangeDelegator = ({ target }) => {
        this.setState({ delegator: target.checked })
    }

    showSignIn = (evt) => {
        $("#sign-in-pane").removeClass("display-none");
        $("#forgot-password-pane").addClass("display-none");
    };

    forgotPasswordLink = (evt) => {
        $("#sign-in-pane").addClass("display-none");
        $("#forgot-password-pane").removeClass("display-none");
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
            <div className="container-fluid vertical-height-100">
                <div className="row justify-content-center align-items-center h-100 center-container">
                    <div className="col col-md-4 login-container">
                        <div className="login-header-logo">
                            <div className="d-flex justify-content-center">
                                <img src={brandImage} alt="" />
                            </div>
                            <div className="d-flex justify-content-center login-header-text">Dashboard</div>
                        </div>


                        <Tabs className='p-1' defaultActiveKey={1}>
                            <Tab eventKey={0} title="Create Account">
                                <div>
                                    <div className="sign-in-instructions">
                                        <div className="sign-in-header">Create Account</div>
                                        <div>Create an account to save, share and comment on queries.</div>
                                    </div>
                                    <form>
                                        <div className="form-group">
                                            <div className="input-login-header">Email Address</div>
                                            <input className="form-control form-control-lg" placeholder="Email" type="text" id="createEmail" value={this.state.createEmail} onChange={this.onChangeCreateEmail} />
                                        </div>
                                        <div className="form-group">
                                            <div className="input-login-header">Username</div>
                                            <input className="form-control form-control-lg" placeholder="Username" type="text" id="createUserName" value={this.state.createUserName} onChange={this.onChangeCreateUserName} />
                                        </div>
                                        <div className="form-group">
                                            <div className="input-login-header">Password</div>
                                            <input className="form-control form-control-lg" placeholder="Password" type="password" id="createPassword" value={this.state.createPassword} onChange={this.onChangeCreatePassword} />
                                        </div>
                                        <div className="form-group my-2">
                                            <Form.Select onChange={this.onChangeSelectedTeam}>
                                                <option>Please indicate your team</option>
                                                <option value="parallax">Parallax</option>
                                                <option value="kitware">Kitware</option>
                                                <option value="bbn">BBN</option>
                                                <option value="soartech">SoarTech</option>
                                                <option value="ta3">TA3</option>
                                                <option value="ta4">TA4</option>
                                                <option value="other">Other</option>
                                            </Form.Select>
                                        </div>
                                        <div className="form-group my-2">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        color="primary"
                                                        checked={this.state.delegator}
                                                        onChange={this.onChangeDelegator}
                                                    />
                                                }
                                                label="I am a delegator"
                                            />
                                        </div>
                                        {this.state.createAccountFailed && (
                                            <div className="custom-toast">
                                                <span>{this.createAccountErrorMappings[this.state.error] ?? this.state.error}</span>
                                                <button
                                                    className="close-button"
                                                    onClick={() => {
                                                        this.setState({ createAccountFailed: false })
                                                        console.log(this.state.error.message)
                                                    }}
                                                >
                                                    <strong>x</strong>
                                                </button>
                                            </div>
                                        )}
                                        <div className="form-group my-2">
                                            <button className="btn btn-primary btn-lg btn-block" onClick={this.createAccount} type="button">Create Account</button>
                                        </div>
                                        <div className="invalid-feedback" id="create-account-feedback">
                                            {this.state.error}
                                        </div>
                                    </form>
                                </div>
                            </Tab>
                            <Tab eventKey={1} title="Sign In">
                                <div >
                                    <div id="sign-in-pane">
                                        <div className="sign-in-instructions">
                                            <div className="sign-in-header">Sign in</div>
                                            <div>Sign in using your username or email address.</div>
                                        </div>
                                        <form>
                                            <div className="form-group">
                                                <div className="input-login-header">Email Address or Username</div>
                                                <input className="form-control form-control-lg" placeholder="Email / Username" type="text" id="userName" value={this.state.userName} onChange={this.onChangeUserName} />
                                            </div>
                                            <div className="form-group">
                                                <div className="input-login-header">Password</div>
                                                <input className="form-control form-control-lg" placeholder="Password" type="password" id="password" value={this.state.password} onChange={this.onChangePassword} />
                                            </div>
                                            <div className="form-group">
                                                {this.state.loginFailed && (
                                                    <div className="custom-toast">
                                                        <span>{this.loginErrorMappings[this.state.error] ?? this.state.error}</span>
                                                        <button
                                                            className="close-button"
                                                            onClick={() => this.setState({ loginFailed: false })}
                                                        >
                                                            <strong>x</strong>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <div className="forgot-password">
                                                    <a className="" id="forgot-pass-tab" href="#forgot" onClick={this.forgotPasswordLink}>Forgot Password?</a>
                                                </div>
                                            </div>
                                            <div className="form-group my-2">
                                                <button className="btn btn-primary btn-lg btn-block" onClick={this.login} type="button">Sign In</button>
                                            </div>
                                            <div className="invalid-feedback" id="sign-in-feedback">
                                                {this.state.error}
                                            </div>
                                        </form>
                                    </div>
                                    <div id="forgot-password-pane" className="display-none">
                                        <div id="send-forgot-email-pane">
                                            <div className="sign-in-instructions">
                                                <div className="sign-in-header">Forgot Password</div>
                                                <div>Enter your email address to reset password.</div>
                                            </div>
                                            <form>
                                                <div className="form-group">
                                                    <div className="input-login-header">Email Address</div>
                                                    <input className="form-control form-control-lg" placeholder="Email" type="text" id="forgotEmail" value={this.state.forgotEmail} onChange={this.onChangeForgotEmail} />
                                                </div>
                                                <div className="form-group">
                                                    <button className="btn btn-primary btn-lg btn-block" onClick={this.resetPassword} type="button">Send Reset Email</button>
                                                </div>
                                                <div className="invalid-feedback" id="reset-password-feedback">
                                                    {this.state.error}
                                                </div>
                                            </form>
                                        </div>
                                        <div id="success-forgot-email-pane" className="display-none">
                                            <div className="sign-in-instructions">
                                                <div className="sign-in-header">Email sent!</div>
                                                <div>Check your email for a link to reset your password.</div>
                                            </div>
                                        </div>
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