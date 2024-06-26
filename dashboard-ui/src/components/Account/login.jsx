import React from 'react';
import { accountsPassword } from '../../services/accountsService';
import { withRouter } from 'react-router-dom';
import $, { trim } from 'jquery';
import brandImage from '../../img/logo.png';
import { Tabs, Tab, Toast } from 'react-bootstrap';
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
            createAccountFailed: false
        };

        this.login = this.login.bind(this);
        this.createAccount = this.createAccount.bind(this);
    }

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
                                            <Toast bg='danger' className='mt-1' autohide={false} onClose={()=> this.setState({ createAccountFailed: false })}>
                                                <Toast.Header>
                                                    <strong className="me-auto">Error creating account</strong>
                                                </Toast.Header>
                                                <Toast.Body className='text-white'>{this.createAccountErrorMappings[this.state.error] ?? this.state.error}</Toast.Body>
                                            </Toast>
                                        )}
                                        <div className="form-group">
                                            <button className="btn btn-primary btn-lg btn-block mt-1" type="submit">Create Account</button>
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
                                                     <Toast bg='danger' className='mt-1' autohide={false} onClose={()=> this.setState({ loginFailed: false })}>
                                                        <Toast.Header>
                                                    <strong className="me-auto">Error logging in</strong>
                                                </Toast.Header>
                                                <Toast.Body className='text-white'>{this.loginErrorMappings[this.state.error] ?? this.state.error}</Toast.Body>
                                            </Toast>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <div className="forgot-password">
                                                    <a className="" id="forgot-pass-tab" href="#forgot" onClick={this.forgotPasswordLink}>Forgot Password?</a>
                                                </div>
                                            </div>
                                            <div className="form-group">
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