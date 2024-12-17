import React, { useState, useEffect, useMemo } from 'react';
import { withRouter } from 'react-router-dom';
import { Query, useQuery, useMutation, useLazyQuery } from 'react-apollo';
import gql from 'graphql-tag';
import DualListBox from 'react-dual-listbox';
import { Button, Modal, Form, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useSelector } from "react-redux";
import '../../css/admin-page.css';
import { setSurveyVersion, setupConfigWithImages } from '../App/setupUtils';
import { accountsPassword } from '../../services/accountsService';

const getUsersQueryName = "getUsers";
const GET_USERS = gql`
    query getUsers {
        getUsers
    }
`;

const GET_EVAL_IDS = gql`
    query getEvalIds {
        getEvalIds
    }
`;

const UPDATE_EVAL_IDS_BYPAGE = gql`
    mutation updateEvalIdsByPage($evalNumber: Int!, $field: String!, $value: Boolean!) {
        updateEvalIdsByPage(evalNumber: $evalNumber, field: $field, value: $value) 
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

const GET_CURRENT_SURVEY_VERSION = gql`
    query getCurrentSurveyVersion {
        getCurrentSurveyVersion
    }
`;

const UPDATE_SURVEY_VERSION = gql`
    mutation updateSurveyVersion($version: String!) {
        updateSurveyVersion(version: $version)
    }
`;

function InputBox({ options, selectedOptions, mutation, param, header, caller, errorCallback }) {
    const [selected, setSelected] = useState(selectedOptions.sort());
    const [updateUserCall] = useMutation(mutation);
    const updateUser = (newSelect) => {
        const usersToAdd = newSelect.filter(user => !selected.includes(user));
        const usersToRemove = selected.filter(user => !newSelect.includes(user));
        [...usersToAdd, ...usersToRemove].forEach(username =>
            updateUserCall({
                variables: {
                    username,
                    [param]: usersToAdd.includes(username) ? true : false,
                    caller
                }
            }).catch((e) => {
                errorCallback(e);
                return;
            })
        );

        setSelected(newSelect);
    }
    options.sort((a, b) => (a.value > b.value) ? 1 : -1);

    return (
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

    );
}

function EvaluationIDSTable({ data }) {
    const [selectedEvals, setSelectedEvals] = useState([]);
    const [updateEvalIds] = useMutation(UPDATE_EVAL_IDS_BYPAGE);

    const updateShowMainPage = (newChecked) => {
        const checkedId = parseInt(newChecked.target.value);

        updateEvalIds({
            variables: {
                evalNumber: parseInt(newChecked.target.value),
                field: "showMainPage",
                value: newChecked.target.checked
            }
        });

        if (newChecked.target.checked) {
            setSelectedEvals([...selectedEvals, checkedId])
        } else {
            setSelectedEvals(selectedEvals.filter(id => id !== checkedId))
        }
    }

    return (
        <table className="table">
            <thead>
                <tr>
                    <th>Evaluation</th>
                    <th>Main Page</th>
                </tr>
            </thead>
            <tbody>
                {
                    data.map((ids, index) => (
                        <tr key={index}>
                            <td>
                                <label htmlFor={`evalIds-checkbox-${index}`}>{ids.evalName}</label>
                            </td>
                            <td>
                                <input
                                    type="checkbox"
                                    id={`evalIds-showMainPage-${index}`}
                                    name={ids.evalName}
                                    value={ids.evalNumber}
                                    checked={selectedEvals.includes(ids.evalNumber) || ids.showMainPage}
                                    onChange={updateShowMainPage}
                                />
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    )
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

function AdminPage({ currentUser }) {
    const [surveyVersion, setLocalSurveyVersion] = useState('');
    const [pendingSurveyVersion, setPendingSurveyVersion] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const surveyConfigs = useSelector(state => state.configs.surveyConfigs);
    const [surveyVersions, setSurveyVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmedAdmin, setConfirmedAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [sessionId, setSessionId] = useState(null);

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


    const [getConfigs, { loading: configsLoading, error: configsError, data: configsData }] = useLazyQuery(GET_CONFIGS, {
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
                .filter(version => version != surveyVersion);
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

    const notAdmin = (error) => {
        console.error(error);
        setConfirmedAdmin(false);
        setPassword('');
        setPasswordError("Something went wrong! Please confirm your admin status.");
    };

    if (surveyVersionLoading) return <div className="loading">Loading survey version...</div>;
    if (surveyVersionError) return <div className="error">Error loading survey version: {surveyVersionError.message}</div>;

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
                    {passwordError != '' && <p className='error-message'>{passwordError}</p>}
                    <Button type='submit'>Submit</Button>
                </form>
            </Card>}

            {confirmedAdmin && <><Row className="mb-4">
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
            </Row>

                <ConfirmationDialog
                    show={showConfirmation}
                    onConfirm={confirmSurveyVersionChange}
                    onCancel={cancelSurveyVersionChange}
                    message={`Are you sure you want to change to Survey Version ${pendingSurveyVersion}? This action may affect ongoing surveys.`}
                />

                <Query query={GET_USERS} fetchPolicy={'no-cache'}>
                    {({ loading, error, data }) => {
                        if (loading) return <div className="loading">Loading ...</div>;
                        if (error) return <div className="error">Error: {error.message}</div>;

                        const nonSelected = { 'admin': [], 'evaluators': [], 'experimenters': [], 'adept': [] };

                        let adminSelectedOptions = [];
                        let evaluatorSelectedOptions = [];
                        let experimenterSelectedOptions = [];
                        let adeptSelectedOptions = [];

                        const users = data[getUsersQueryName]
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

                <Query query={GET_EVAL_IDS} fetchPolicy={'no-cache'}>
                    {({ loading, error, data }) => {
                        if (loading) return <div className="loading">Loading ...</div>;
                        if (error) return <div className="error">Error: {error.message}</div>;

                        return (
                            <Row>
                                <Col>
                                    <Card>
                                        <Card.Header as="h5">Visible Evaluation Options By Page</Card.Header>
                                        <Card.Body>
                                            <Card.Text>
                                                Control values populated in the Evaluation Dropdown list
                                            </Card.Text>
                                            <h6>Modify Visible Evaluation Options</h6>
                                            <EvaluationIDSTable data={data["getEvalIds"]} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        );
                    }}
                </Query>
            </>}
        </Container>
    );
}

export default withRouter(AdminPage);