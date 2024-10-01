import React, { useState, useEffect, useMemo } from 'react';
import { withRouter } from 'react-router-dom';
import { Query, useQuery, useMutation, useLazyQuery } from 'react-apollo';
import gql from 'graphql-tag';
import DualListBox from 'react-dual-listbox';
import { Button, Modal, Form, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from "react-redux";
import '../../css/admin-page.css';
import { setupConfigWithImages, setupTextBasedConfig } from '../App/configSetup';

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
    mutation updateAdminUser($username: String!, $isAdmin: Boolean!) {
        updateAdminUser(username: $username, isAdmin: $isAdmin) 
    }
`;

const UPDATE_EVALUATOR_USER = gql`
    mutation updateEvaluatorUser($username: String!, $isEvaluator: Boolean!) {
        updateEvaluatorUser(username: $username, isEvaluator: $isEvaluator) 
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

function AdminInputBox({ options, selectedOptions }) {
    const [selected, setSelected] = useState(selectedOptions.sort());
    const [updateAdminUserCall] = useMutation(UPDATE_ADMIN_USER);

    const setAdmin = (newSelect) => {
        for (let i = 0; i < newSelect.length; i++) {
            if (!selected.includes(newSelect[i])) {
                updateAdminUserCall({
                    variables: {
                        username: newSelect[i],
                        isAdmin: true
                    }
                });
            }
        }
        for (let i = 0; i < selected.length; i++) {
            if (!newSelect.includes(selected[i])) {
                updateAdminUserCall({
                    variables: {
                        username: selected[i],
                        isAdmin: false
                    }
                });
            }
        }
        setSelected(newSelect);
    }

    options.sort((a, b) => (a.value > b.value) ? 1 : -1);

    return (
        <DualListBox
            options={options}
            selected={selected}
            onChange={setAdmin}
            showHeaderLabels={true}
            lang={{
                availableHeader: "All Users",
                selectedHeader: "Admins"
            }} />
    );
}

function EvaluatorInputBox({ options, selectedOptions }) {
    const [selected, setSelected] = useState(selectedOptions.sort());
    const [updateEvaluatorUserCall] = useMutation(UPDATE_EVALUATOR_USER);

    const setEvaluator = (newSelect) => {
        for (let i = 0; i < newSelect.length; i++) {
            if (!selected.includes(newSelect[i])) {
                updateEvaluatorUserCall({
                    variables: {
                        username: newSelect[i],
                        isEvaluator: true
                    }
                });
            }
        }
        for (let i = 0; i < selected.length; i++) {
            if (!newSelect.includes(selected[i])) {
                updateEvaluatorUserCall({
                    variables: {
                        username: selected[i],
                        isEvaluator: false
                    }
                });
            }
        }
        setSelected(newSelect);
    }

    options.sort((a, b) => (a.value > b.value) ? 1 : -1);

    return (
        <DualListBox
            options={options}
            selected={selected}
            onChange={setEvaluator}
            showHeaderLabels={true}
            lang={{
                availableHeader: "All Users",
                selectedHeader: "Evaluators"
            }} />
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
    const [surveyVersion, setSurveyVersion] = useState('');
    const [pendingSurveyVersion, setPendingSurveyVersion] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const surveyConfigs = useSelector(state => state.configs.surveyConfigs);
    const [surveyVersions, setSurveyVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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
            console.log("GetConfigs completed:", data);
            try {
                await setupConfigWithImages(data);
                console.log(data.getAllSurveyConfigs)
            } finally {
                setIsLoading(false);
            }
        }
    });

    useEffect(() => {
        if (surveyVersionData && surveyVersionData.getCurrentSurveyVersion) {
            setSurveyVersion(surveyVersionData.getCurrentSurveyVersion);
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
                setSurveyVersion(pendingSurveyVersion);
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

            <Row className="mb-4">
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

                    let options = [];
                    let selectedOptions = [];
                    let evaluatorOptions = [];
                    let evaluatorSelectedOptions = [];

                    const users = data[getUsersQueryName]
                    for (let i = 0; i < users.length; i++) {
                        options.push({ value: users[i].username, label: users[i].username + " (" + (users[i].emails !== undefined ? users[i].emails[0].address : "") + ")" });
                        evaluatorOptions.push({ value: users[i].username, label: users[i].username + " (" + (users[i].emails !== undefined ? users[i].emails[0].address : "") + ")" });

                        if (users[i].admin) {
                            selectedOptions.push(users[i].username)
                        }

                        if (users[i].evaluator) {
                            evaluatorSelectedOptions.push(users[i].username)
                        }
                    }

                    return (
                        <>
                            <Row className="mb-4">
                                <Col>
                                    <Card>
                                        <Card.Header as="h5">Administrator</Card.Header>
                                        <Card.Body>
                                            <Card.Text>
                                                Manage administrator settings.
                                            </Card.Text>
                                            <h6>Modify Current Admins</h6>
                                            <AdminInputBox options={options} selectedOptions={selectedOptions} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col>
                                    <Card>
                                        <Card.Header as="h5">Evaluators</Card.Header>
                                        <Card.Body>
                                            <Card.Text>
                                                Manage evaluator settings.
                                            </Card.Text>
                                            <h6>Modify Current Evaluators</h6>
                                            <EvaluatorInputBox options={evaluatorOptions} selectedOptions={evaluatorSelectedOptions} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
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
        </Container>
    );
}

export default withRouter(AdminPage);