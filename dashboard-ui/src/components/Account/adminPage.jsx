import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import DualListBox from 'react-dual-listbox';
import { useMutation } from 'react-apollo';
import '../../css/admin-page.css';

const getUsersQueryName = "getUsers";
const GET_USERS = gql`
    query getUsers{
        getUsers
    }`;

const GET_EVAL_IDS = gql`
    query getEvalIds{
        getEvalIds
    }`;

const UPDATE_EVAL_IDS_BYPAGE = gql`
    mutation updateEvalIdsByPage($evalNumber: Int!, $field: String!, $value: Boolean!){
        updateEvalIdsByPage(evalNumber: $evalNumber, field: $field, value: $value) 
    }`;

const UPDATE_ADMIN_USER = gql`
    mutation updateAdminUser($username: String!, $isAdmin: Boolean!){
        updateAdminUser(username: $username, isAdmin: $isAdmin) 
    }`;

const UPDATE_EVALUATOR_USER = gql`
    mutation updateEvaluatorUser($username: String!, $isEvaluator: Boolean!){
        updateEvaluatorUser(username: $username, isEvaluator: $isEvaluator) 
    }`;

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
        <table>
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

function AdminPage({ currentUser }) {
    const [surveyVersion, setSurveyVersion] = useState('1');

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <select
                    className="survey-version-select"
                    value={surveyVersion}
                    onChange={(e) => setSurveyVersion(e.target.value)}
                >
                    <option value="1">Survey Version 1</option>
                    <option value="2">Survey Version 2</option>
                    <option value="3">Survey Version 3</option>
                    <option value="4">Survey Version 4</option>
                </select>
            </div>

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