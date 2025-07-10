import React, { useState, useEffect, useMemo } from 'react';
import { withRouter } from 'react-router-dom';
import { Query, useQuery, useMutation, useLazyQuery } from 'react-apollo';
import gql from 'graphql-tag';
import DualListBox from 'react-dual-listbox';
import { Button, Modal, Form, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useSelector } from "react-redux";
import '../../css/admin-page.css';
import { setSurveyVersion, setupConfigWithImages, setCurrentUIStyle } from '../App/setupUtils';
import { accountsClient, accountsPassword } from '../../services/accountsService';
import { createBrowserHistory } from 'history';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import { IconButton, Switch } from '@material-ui/core';
import { FaInfoCircle } from 'react-icons/fa'

const history = createBrowserHistory({ forceRefresh: true });

const getUsersQueryName = "getUsers";
const GET_USERS = gql`
    query getUsers($caller: JSON!) {
        getUsers(caller: $caller)
    }
`;

const UPDATE_ADMIN_USER = gql`
    mutation updateAdminUser($caller: JSON!, $username: String!, $isAdmin: Boolean!) {
        updateAdminUser(caller: $caller, username: $username, isAdmin: $isAdmin) 
    }
`;

const UPDATE_EVALUATOR_USER = gql`
    mutation updateEvaluatorUser($caller: JSON!, $username: String!, $isEvaluator: Boolean!) {
        updateEvaluatorUser(caller: $caller, username: $username, isEvaluator: $isEvaluator) 
    }
`;

const UPDATE_EXPERIMENTER_USER = gql`
    mutation updateExperimenterUser($caller: JSON!, $username: String!, $isExperimenter: Boolean!) {
        updateExperimenterUser(caller: $caller, username: $username, isExperimenter: $isExperimenter) 
    }
`;

const UPDATE_ADEPT_USER = gql`
    mutation updateAdeptUser($caller: JSON!, $username: String!, $isAdeptUser: Boolean!) {
        updateAdeptUser(caller: $caller, username: $username, isAdeptUser: $isAdeptUser) 
    }
`;

const UPDATE_USER_APPROVAL = gql`
    mutation updateUserApproval($caller: JSON!, $username: String!, $isApproved: Boolean!, $isRejected: Boolean!, $isAdmin: Boolean!, $isEvaluator: Boolean!, $isExperimenter: Boolean!, $isAdeptUser: Boolean!) {
        updateUserApproval(caller: $caller, username: $username, isApproved: $isApproved, isRejected: $isRejected, isAdmin: $isAdmin, isEvaluator: $isEvaluator, isExperimenter: $isExperimenter, isAdeptUser: $isAdeptUser)
    }
`;

const GET_CURRENT_SURVEY_VERSION = gql`
    query getCurrentSurveyVersion {
        getCurrentSurveyVersion
    }
`;

const GET_CURRENT_UI_STYLE = gql`
    query getCurrentStyle {
        getCurrentStyle
    }
`;

const UPDATE_SURVEY_VERSION = gql`
    mutation updateSurveyVersion($version: String!) {
        updateSurveyVersion(version: $version)
    }
`;

const UPDATE_UI_STYLE = gql`
    mutation updateUIStyle($version: String!) {
        updateUIStyle(version: $version)
    }
`;

function AdminConfirmationModal({ show, onCancel, onConfirm, pendingChanges, options }) {
    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <strong>Confirm Administrator Changes</strong>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                {pendingChanges?.usersToAdd.length > 0 && (
                    <div className="mb-4">
                        <h6 className="mb-3 text-dark">Add administrator privileges to:</h6>
                        <div className="border rounded p-3 bg-light">
                            {pendingChanges.usersToAdd.map(user => {
                                const userOption = options.find(opt => opt.value === user);
                                const email = userOption?.label.match(/\((.*?)\)/)?.[1] || '';
                                return (
                                    <div key={user} className="mb-2">
                                        <strong>{user}</strong> {email && <span className="text-muted">({email})</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {pendingChanges?.usersToRemove.length > 0 && (
                    <div className="mb-4">
                        <h6 className="mb-3 text-dark">Remove administrator privileges from:</h6>
                        <div className="border rounded p-3 bg-light">
                            {pendingChanges.usersToRemove.map(user => {
                                const userOption = options.find(opt => opt.value === user);
                                const email = userOption?.label.match(/\((.*?)\)/)?.[1] || '';
                                return (
                                    <div key={user} className="mb-2">
                                        <strong>{user}</strong> {email && <span className="text-muted">({email})</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="alert alert-info mb-0 py-2 d-flex align-items-center">
                    <FaInfoCircle className="me-2" />
                    Please confirm to modify administrative access.
                </div>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    Confirm Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function InputBox({ options, selectedOptions, mutation, param, header, caller, errorCallback }) {
    const [selected, setSelected] = useState(selectedOptions.sort());
    const [updateUserCall] = useMutation(mutation);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(null);

    const handleConfirm = async () => {
        let errored = false;
        const { usersToAdd, usersToRemove } = pendingChanges;

        for (const username of [...usersToAdd, ...usersToRemove]) {
            try {
                await updateUserCall({
                    variables: {
                        username,
                        [param]: usersToAdd.includes(username) ? true : false,
                        caller
                    }
                });
            } catch (error) {
                errorCallback();
                errored = true;
                break;
            }
        }

        if (!errored) {
            setSelected(pendingChanges.newSelection);
        }

        setShowConfirmation(false);
        setPendingChanges(null);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
        setPendingChanges(null);
    };

    const updateUser = (newSelect) => {
        const usersToAdd = newSelect.filter(user => !selected.includes(user));
        const usersToRemove = selected.filter(user => !newSelect.includes(user));

        // confirm for admin changes
        if (param === 'isAdmin') {
            setPendingChanges({
                usersToAdd,
                usersToRemove,
                newSelection: newSelect
            });
            setShowConfirmation(true);
        } else {
            let errored = false;
            [...usersToAdd, ...usersToRemove].forEach(username =>
                updateUserCall({
                    variables: {
                        username,
                        [param]: usersToAdd.includes(username) ? true : false,
                        caller
                    }
                }).catch(() => {
                    errorCallback();
                    errored = true;
                    return;
                })
            );
            if (!errored) {
                setSelected(newSelect);
            }
        }
    };

    options.sort((a, b) => (a.value > b.value) ? 1 : -1);

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <Card>
                        <Card.Header as="h5">{header}</Card.Header>
                        <Card.Body>
                            <h6>Modify Current {header}</h6>
                            <DualListBox
                                options={options}
                                selected={selected}
                                onChange={updateUser}
                                showHeaderLabels={true}
                                lang={{
                                    availableHeader: "All Users",
                                    selectedHeader: header
                                }} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {param === 'isAdmin' && (
                <AdminConfirmationModal
                    show={showConfirmation}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                    pendingChanges={pendingChanges}
                    options={options}
                />
            )}
        </>
    );
}

function ConfirmationDialog({ show, onConfirm, onCancel, message }) {
    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Action</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function ApprovalTable({ unapproved, updateUnapproved, caller }) {
    const [updateUserCall] = useMutation(UPDATE_USER_APPROVAL);

    const updateUserStatus = (userid, statusType, e) => {
        const user = unapproved.find((x) => x._id === userid);
        if (user) {
            user[statusType] = e.target.checked;
        }
        updateUnapproved([...unapproved].filter((x) => !x.approved && !x.rejected));
    };

    const approveUser = async (userid) => {
        const user = unapproved.find((x) => x._id === userid);
        if (user) {
            user.approved = true;
        }
        updateUnapproved([...unapproved].filter((x) => !x.approved && !x.rejected));
        await updateUserCall({
            variables: {
                caller,
                username: user.username,
                isApproved: true,
                isAdmin: user.admin ?? false,
                isEvaluator: user.evaluator ?? false,
                isExperimenter: user.experimenter ?? false,
                isAdeptUser: user.adeptUser ?? false,
                isRejected: false
            }
        });
    };

    const denyUser = async (userid) => {
        const user = unapproved.find((x) => x._id === userid);
        if (user) {
            user.rejected = true;
        }
        updateUnapproved([...unapproved].filter((x) => !x.approved && !x.rejected));
        await updateUserCall({
            variables: {
                caller,
                username: user.username,
                isApproved: false,
                isAdmin: false,
                isEvaluator: false,
                isExperimenter: false,
                isAdeptUser: false,
                isRejected: true
            }
        });
    };

    return (<Col>
        <Card>
            <Card.Header className='urgent-header' as="h5">Time Sensitive: New User Approvals</Card.Header>
            <Card.Body>
                <table className='itm-table small-table'>
                    <thead>
                        <tr>
                            <th>
                                Email
                            </th>
                            <th>
                                Username
                            </th>
                            <th className='switch-header'>
                                Admin
                            </th>
                            <th className='switch-header'>
                                Evaluator
                            </th>
                            <th className='switch-header'>
                                Experimenter
                            </th>
                            <th className='switch-header'>
                                ADEPT
                            </th>
                            <th className='action-header'>
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {unapproved.map((user) => {
                            return (
                                <tr key={user._id}>
                                    <td>{user.emails[0]?.address}</td>
                                    <td>{user.username}</td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'admin', e)} /></td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'evaluator', e)} /></td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'experimenter', e)} /></td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'adeptUser', e)} /></td>
                                    <td>
                                        <IconButton title='Approve' onClick={() => approveUser(user._id)} children={<CheckCircleIcon className='green-btn' />} />
                                        <IconButton title='Deny' onClick={() => denyUser(user._id)} children={<CancelIcon className='red-btn' />} /></td>
                                </tr>);
                        })}
                    </tbody>
                </table>
            </Card.Body>
        </Card>
    </Col>);
};

function AdminPage({ currentUser, updateUserHandler }) {
    const [surveyVersion, setLocalSurveyVersion] = useState('');
    const [pendingSurveyVersion, setPendingSurveyVersion] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showStyleConfirmation, setShowStyleConfirmation] = useState(false);
    const surveyConfigs = useSelector(state => state.configs.surveyConfigs);
    const [surveyVersions, setSurveyVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmedAdmin, setConfirmedAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [errorCount, setErrorCount] = useState(0);
    const [unapproved, setUnapproved] = useState([]);
    // UI Style state
    const [usePhase1Styling, setUsePhase1Styling] = useState(false);
    const [pendingStyleVersion, setPendingStyleVersion] = useState(null);

    // Query and mutation for UI styling
    const { loading: uiStyleLoading, error: uiStyleError } = useQuery(GET_CURRENT_UI_STYLE, {
        fetchPolicy: 'no-cache',
        onCompleted: (data) => {
            if (data && data.getCurrentStyle) {
                setUsePhase1Styling(data.getCurrentStyle === 'phase1');
            }
        }
    });
    const [updateUIStyle] = useMutation(UPDATE_UI_STYLE);

    const [getUsersQuery, { data: users }] = useLazyQuery(GET_USERS, {
        fetchPolicy: 'no-cache'
    });

    useEffect(() => {
        if (sessionId && currentUser) {
          getUsersQuery({
            variables: { caller: { username: currentUser.username, sessionId } }
          });
        }
      }, [sessionId, currentUser, getUsersQuery]);

    useEffect(() => {
        if (users)
            setUnapproved(users[getUsersQueryName].filter((x) => !x.approved && !x.rejected));
    }, [users]);

    const { loading: surveyVersionLoading, error: surveyVersionError, data: surveyVersionData } = useQuery(GET_CURRENT_SURVEY_VERSION, {
        fetchPolicy: 'no-cache'
    });
    const [updateSurveyVersion] = useMutation(UPDATE_SURVEY_VERSION);

    const GET_CONFIGS = useMemo(() => {
        return gql`
            query GetConfigs {
                getAllSurveyConfigs
                getAllTextBasedConfigs
                getAllTextBasedImages
                ${pendingSurveyVersion !== '4' ? 'getAllImageUrls' : ''}
            }
        `;
    }, [pendingSurveyVersion]);

    const [getConfigs, { loading: configsLoading }] = useLazyQuery(GET_CONFIGS, {
        fetchPolicy: 'no-cache',
        onCompleted: async (data) => {
            try {
                await setupConfigWithImages(data);
            } finally {
                setIsLoading(false);
            }
        }
    });

    useEffect(() => {
        if (surveyVersionData && surveyVersionData.getCurrentSurveyVersion) {
            setLocalSurveyVersion(surveyVersionData.getCurrentSurveyVersion);
        }
    }, [surveyVersionData]);

    useEffect(() => {
        if (surveyConfigs) {
            const versions = Object.values(surveyConfigs).map(config => config.version);
            const uniqueVersions = [...new Set(versions)]
                .sort((a, b) => a - b)
                .filter(version => version !== surveyVersion);
            setSurveyVersions(uniqueVersions);
        }
    }, [surveyConfigs, surveyVersion]);

    const handleSurveyVersionChange = (event) => {
        event.preventDefault();
        const newVersion = event.target.value;
        if (newVersion !== '') {
            setPendingSurveyVersion(newVersion);
            setShowConfirmation(true);
        }
    };

    // Handler for UI style change
    const handleStylingChange = (event) => {
        const newStyle = event.target.value;
        setPendingStyleVersion(newStyle);
        setShowStyleConfirmation(true);
    };

    const confirmStylingChange = async () => {        
        try {
            setIsLoading(true);
            
            const { data } = await updateUIStyle({
                variables: { version: pendingStyleVersion }
            });
            
            if (data && data.updateUIStyle !== undefined) {
                setUsePhase1Styling(pendingStyleVersion === 'phase1');
                
                setCurrentUIStyle(pendingStyleVersion);
                
                setPendingStyleVersion(null);
                setShowStyleConfirmation(false);
            } else {
                throw new Error("Failed to update UI style");
            }
        } catch (error) {
            alert("Failed to update UI style. Error: " + error.message );
        } finally {
            setIsLoading(false);
        }
    };

    const cancelStylingChange = () => {
        setPendingStyleVersion(null);
        setShowStyleConfirmation(false);
    };

    const confirmSurveyVersionChange = async () => {
        try {
            setIsLoading(true);
            const { data } = await updateSurveyVersion({
                variables: { version: pendingSurveyVersion }
            });
            if (data && data.updateSurveyVersion) {
                // local for ui
                setLocalSurveyVersion(pendingSurveyVersion);
                // redux store
                setSurveyVersion(pendingSurveyVersion)
                await getConfigs();
                setShowConfirmation(false);
            } else {
                throw new Error("Failed to update survey version");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update survey version. Please try again.");
        } finally {
            if (!configsLoading) {
                setIsLoading(false);
            }
        }
    };

    const cancelSurveyVersionChange = () => {
        setPendingSurveyVersion(null);
        setShowConfirmation(false);
    };

    const onChangePassword = (event) => {
        setPasswordError('');
        setPassword(event.target.value);
    };

    const verifyIdentity = async (event) => {
        event.preventDefault();
        try {
            let results;
            results = await accountsPassword.login({
                password: password,
                user: {
                    username: currentUser.username,
                }
            });
            setSessionId(results.sessionId);
            setConfirmedAdmin(true);
        } catch (err) {
            setConfirmedAdmin(false);
            setPasswordError(err.message);
        }
    };

    const notAdmin = async () => {
        setConfirmedAdmin(false);
        const errors = errorCount + 1;
        setErrorCount(errors);
        setPassword('');
        setPasswordError("Something went wrong! Please confirm your admin status.");
        if (errors === 2) {
            await accountsClient.logout();
            updateUserHandler(null);
            history.push('/login');
        }
    };

    if (surveyVersionLoading || uiStyleLoading) return <div className="loading">Loading data...</div>;
    if (surveyVersionError) return <div className="error">Error loading survey version: {surveyVersionError.message}</div>;
    if (uiStyleError) return <div className="error">Error loading UI style: {uiStyleError.message}</div>;

    return (
        <Container className="admin-page">
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 9999
                }}>
                    <Spinner animation="border" role="status" variant="light">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                </div>
            )}
            <Row className="mb-4">
                <Col>
                    <h1 className="admin-header">Admin Dashboard</h1>
                </Col>
            </Row>

            {!confirmedAdmin && <Card className="login-modal">
                <h3>Please confirm your identity before continuing.</h3>
                <form onSubmit={verifyIdentity}>
                    <div className="form-group">
                        <div className="input-login-header">Username: {currentUser.username}</div>
                    </div>
                    <div className="form-group">
                        <input placeholder="Enter Password" type="password" id="password" value={password} onChange={onChangePassword} />
                    </div>
                    {passwordError !== '' && <p className='error-message'>{passwordError}</p>}
                    <Button type='submit'>Submit</Button>
                </form>
            </Card>}

            {confirmedAdmin && <><Row className="mb-4">
                {unapproved.length > 0 && <ApprovalTable unapproved={unapproved} updateUnapproved={setUnapproved} caller={{ username: currentUser.username, sessionId }} />}

                <Col md={6}>
                    <Card>
                        <Card.Header as="h5">Survey Version</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Current Survey Version: <strong>{surveyVersion || 'Not set'}</strong>
                            </Card.Text>
                            <Form.Group>
                                <Form.Label>Change Survey Version:</Form.Label>
                                <Form.Select
                                    value=''
                                    onChange={handleSurveyVersionChange}
                                >
                                    <option value="" disabled>Select survey version</option>
                                    {surveyVersions.map((version) => (
                                        <option key={version} value={version}>
                                            Version {version}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card>
                        <Card.Header as="h5">Delegation/Text Scenarios Styling</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Current UI Style: <strong>{usePhase1Styling ? 'Phase 1 Styling' : 'Updated Styling'}</strong>
                            </Card.Text>
                            <Form.Group>
                                <Form.Label>Change UI Style:</Form.Label>
                                <Form.Select
                                    value={usePhase1Styling ? 'phase1' : 'updated'}
                                    onChange={handleStylingChange}
                                >
                                    <option value="updated">Updated Styling</option>
                                    <option value="phase1">Use Phase 1 Styling</option>
                                </Form.Select>
                            </Form.Group>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

                <ConfirmationDialog
                    show={showConfirmation}
                    onConfirm={confirmSurveyVersionChange}
                    onCancel={cancelSurveyVersionChange}
                    message={`Are you sure you want to change to Survey Version ${pendingSurveyVersion}? This action may affect ongoing surveys.`}
                />

                <ConfirmationDialog
                    show={showStyleConfirmation}
                    onConfirm={confirmStylingChange}
                    onCancel={cancelStylingChange}
                    message={`Are you sure you want to change to the ${pendingStyleVersion === 'phase1' ? 'Phase 1' : 'Updated'} UI Style? This will affect the appearance for all users.`}
                />

                <Query
                    query={GET_USERS}
                    variables={{ caller: { username: currentUser.username, sessionId } }}
                    fetchPolicy='no-cache'
                    skip={!sessionId || !currentUser}
                >
                    {({ loading, error, data }) => {
                        if (loading) return <div className="loading">Loading ...</div>;
                        if (error) return <div className="error">Error: {error.message}</div>;

                        const nonSelected = { 'admin': [], 'evaluators': [], 'experimenters': [], 'adept': [] };

                        let adminSelectedOptions = [];
                        let evaluatorSelectedOptions = [];
                        let experimenterSelectedOptions = [];
                        let adeptSelectedOptions = [];

                        const users = data[getUsersQueryName].filter((x) => x.approved);
                        for (let i = 0; i < users.length; i++) {
                            for (let k in nonSelected) {
                                nonSelected[k].push({ value: users[i].username, label: users[i].username + " (" + (users[i].emails !== undefined ? users[i].emails[0].address : "") + ")" });
                            }
                            if (users[i].admin) {
                                adminSelectedOptions.push(users[i].username);
                            }

                            if (users[i].evaluator) {
                                evaluatorSelectedOptions.push(users[i].username);
                            }

                            if (users[i].experimenter) {
                                experimenterSelectedOptions.push(users[i].username);
                            }

                            if (users[i].adeptUser) {
                                adeptSelectedOptions.push(users[i].username);
                            }
                        }

                        return (
                            <>
                                <InputBox options={nonSelected['admin']} selectedOptions={adminSelectedOptions} mutation={UPDATE_ADMIN_USER} param={'isAdmin'} header={'Administrators'} caller={{ username: currentUser.username, sessionId }} errorCallback={notAdmin} />
                                <InputBox options={nonSelected['evaluators']} selectedOptions={evaluatorSelectedOptions} mutation={UPDATE_EVALUATOR_USER} param={'isEvaluator'} header={'Evaluators'} caller={{ username: currentUser.username, sessionId }} errorCallback={notAdmin} />
                                <InputBox options={nonSelected['experimenters']} selectedOptions={experimenterSelectedOptions} mutation={UPDATE_EXPERIMENTER_USER} param={'isExperimenter'} header={'Experimenters'} caller={{ username: currentUser.username, sessionId }} errorCallback={notAdmin} />
                                <InputBox options={nonSelected['adept']} selectedOptions={adeptSelectedOptions} mutation={UPDATE_ADEPT_USER} param={'isAdeptUser'} header={'ADEPT Users'} caller={{ username: currentUser.username, sessionId }} errorCallback={notAdmin} />
                            </>
                        );
                    }}
                </Query>
            </>}
        </Container>
    );
}

export default withRouter(AdminPage);