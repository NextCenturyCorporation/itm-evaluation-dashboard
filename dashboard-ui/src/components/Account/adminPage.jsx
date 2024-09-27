import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { Query, useQuery, useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import DualListBox from 'react-dual-listbox';
import { Button, Modal, Form } from 'react-bootstrap';
import '../../css/admin-page.css';
import { useSelector } from "react-redux";

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
        console.log(selectedEvals);
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

    const { loading: surveyVersionLoading, error: surveyVersionError, data: surveyVersionData } = useQuery(GET_CURRENT_SURVEY_VERSION);
    const [updateSurveyVersion] = useMutation(UPDATE_SURVEY_VERSION);
    console.log(surveyVersionData)

    useEffect(() => {
        if (surveyVersionData && surveyVersionData.getCurrentSurveyVersion) {
            setSurveyVersion(surveyVersionData.getCurrentSurveyVersion);
        }
    }, [surveyVersionData]);

    useEffect(() => {
        if (surveyConfigs) {
            const versions = Object.values(surveyConfigs).map(config => config.version);
            const uniqueVersions = [...new Set(versions)].sort((a, b) => a - b);
            setSurveyVersions(uniqueVersions);
            console.log("Survey Versions:", uniqueVersions);
        }
    }, [surveyConfigs]);

    const handleSurveyVersionChange = (event) => {
        const newVersion = event.target.value;
        setPendingSurveyVersion(newVersion);
        setShowConfirmation(true);
    };

    const confirmSurveyVersionChange = async () => {
        try {
          const { data } = await updateSurveyVersion({ 
            variables: { version: pendingSurveyVersion }
          });
          if (data && data.updateSurveyVersion) {
            setSurveyVersion(data.updateSurveyVersion);
            setShowConfirmation(false);
          } else {
            throw new Error("Failed to update survey version");
          }
        } catch (error) {
          console.error("Error updating survey version:", error);
          // Show error message to the user
          alert("Failed to update survey version. Please try again.");
        }
      };

    const cancelSurveyVersionChange = () => {
        setPendingSurveyVersion(null);
        setShowConfirmation(false);
    };

    if (surveyVersionLoading) return <div className="loading">Loading survey version...</div>;
    if (surveyVersionError) return <div className="error">Error loading survey version: {surveyVersionError.message}</div>;

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <h3>Survey Versions</h3>
                <p>Current Survey Version: {surveyVersion || 'Not set'}</p>
                <Form.Select 
                    value={surveyVersion}
                    onChange={handleSurveyVersionChange}
                >
                    <option value="">Select survey version</option>
                    {surveyVersions.map((version) => (
                        <option key={version} value={version}>
                            Version {version}
                        </option>
                    ))}
                </Form.Select>
            </div>

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
                            <div className="admin-container">
                                <h3>Administrator</h3>
                                <div className="admin-description">
                                    Manage administrator settings.
                                </div>
                                <div className="modify-admins-header">
                                    <h5>Modify Current Admins</h5>
                                </div>
                                <AdminInputBox options={options} selectedOptions={selectedOptions} />
                            </div>

                            <div className="admin-container">
                                <h3>Evaluators</h3>
                                <div className="admin-description">
                                    Manage evaluator settings.
                                </div>
                                <div className="modify-admins-header">
                                    <h5>Modify Current Evaluators</h5>
                                </div>
                                <EvaluatorInputBox options={evaluatorOptions} selectedOptions={evaluatorSelectedOptions} />
                            </div>
                        </>
                    );
                }}
            </Query>

            <Query query={GET_EVAL_IDS} fetchPolicy={'no-cache'}>
                {({ loading, error, data }) => {
                    if (loading) return <div className="loading">Loading ...</div>;
                    if (error) return <div className="error">Error: {error.message}</div>;

                    return (
                        <div className="admin-container">
                            <h3>Visible Evaluation Options By Page</h3>
                            <div className="admin-description">
                                Control values populated in the Evaluation Dropdown list
                            </div>
                            <div className="modify-admins-header">
                                <h5>Modify Visible Evaluation Options</h5>
                            </div>
                            <EvaluationIDSTable data={data["getEvalIds"]} />
                        </div>
                    );
                }}
            </Query>
        </div>
    );
}

export default withRouter(AdminPage);