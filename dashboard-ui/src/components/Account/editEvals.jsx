import gql from "graphql-tag";
import React from "react";
import { useMutation, useQuery } from "react-apollo";
import { Button, Card, Modal, Form } from "react-bootstrap";
import { IconButton, Switch } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import store from "../../store/store";
import { setEvals as setEvalsInStore } from "../../store/slices/configSlice";

const GET_EVAL_DATA = gql`
    query GetAllEvalData {
        getAllEvalData
    }
`;

const UPDATE_EVAL_DATA = gql`
    mutation updateEvalData($caller: JSON!, $dataToUpdate: JSON!) {
        updateEvalData(caller: $caller, dataToUpdate: $dataToUpdate) 
    }
`;

const ADD_NEW_EVAL = gql`
    mutation addNewEval($caller: JSON!, $newEval: JSON!) {
        addNewEval(caller: $caller, newEval: $newEval)
    }
`;

const DELETE_EVAL = gql`
    mutation deleteEval($caller: JSON!, $evalId: String!) {
        deleteEval(caller: $caller, evalId: $evalId)
    }
`;


const pagePaths = [
    '/', '/text-based-results', '/humanSimParticipant', '/humanProbeData',
    '/human-results', '/results', '/adm-results', '/adm-probe-responses',
    '/rq1', '/rq2', '/rq3', '/exploratory-analysis'
];

export function EditEvals({ caller }) {
    const { data: evalData, refetch: fetchEvalData } = useQuery(GET_EVAL_DATA, { fetchPolicy: 'no-cache' });
    const [evals, setEvals] = React.useState([]);
    const [updateEvalData] = useMutation(UPDATE_EVAL_DATA);
    const [addNewEval] = useMutation(ADD_NEW_EVAL);
    const [deleteEval] = useMutation(DELETE_EVAL);
    const [showNewEvalForm, setShowNewEvalForm] = React.useState(false);
    const [showEvalModal, setShowEvalModal] = React.useState(false);
    const [evalName, setEvalName] = React.useState('');
    const [evalNumber, setEvalNumber] = React.useState('');
    const [selectedPages, setSelectedPages] = React.useState([]);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
    const [evalToDelete, setEvalToDelete] = React.useState(null);
    const [modalEval, setModalEval] = React.useState([]);


    React.useEffect(() => {
        if (evalData?.getAllEvalData) {
            updateLocalEvalData(evalData);
        }
    }, [evalData]);

    /* UPDATE FUNCTIONS */

    const updateLocalEvalData = (dataToUseForUpdate) => {
        const tmpEvals = dataToUseForUpdate.getAllEvalData;
        tmpEvals.sort((a, b) => b.evalNumber - a.evalNumber);
        setEvals(tmpEvals);
        setEvalNumber(tmpEvals[0].evalNumber + 1);
    }

    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setSelectedPages(prev => [...prev, value]);
        } else {
            setSelectedPages(prev => prev.filter(p => p !== value));
        }
    };

    const getEvalById = (evalId) => {
        return evals.find((x) => x._id == evalId);
    };

    const updateEvalInStore = (evalId, pageToUpdate, e) => {
        const evalDataInStore = store.getState()?.configs?.evals;
        for (let evalData in evalDataInStore) {
            if (evalData._id == evalId) {
                evalData['pages'][pageToUpdate] = e.target.checked;
                break;
            }
        }
        store.dispatch(setEvalsInStore(evalDataInStore));
    };

    const updateEvalPagePermissions = async (evalId, pageToUpdate, e) => {
        const evalToUpdate = getEvalById(evalId);
        evalToUpdate['pages'][pageToUpdate] = e.target.checked;
        try {
            const res = await updateEvalData({
                variables: {
                    caller,
                    dataToUpdate: evalToUpdate
                }
            });
            if (res.data.updateEvalData.ok) {
                updateEvalInStore(evalId, pageToUpdate, e);
            }
        } catch (error) {
            console.error(`Could not update eval ${evalId}`, error);
        }
    };


    /* DELETE FUNCTIONS */

    const startDeleteProcess = (evalToDeleteData) => {
        setShowEvalModal(false)
        setModalEval([])
        setShowDeleteConfirmation(true);
        setEvalToDelete(evalToDeleteData);
    };

    const cancelDeletion = () => {
        setShowDeleteConfirmation(false);
        setEvalToDelete(null);
    };

    const activateDelete = async () => {
        try {
            const res = await deleteEval({ variables: { caller, evalId: evalToDelete._id } });
            if (res.data.deleteEval.ok) {
                setShowDeleteConfirmation(false);

                if (showEvalModal) {
                    setShowEvalModal(false);
                    setModalEval([]);
                }
                
                const refetchedData = await fetchEvalData();
                updateLocalEvalData(refetchedData.data);
            }
        }
        catch (error) {
            console.error("Could not delete eval", error);
        }
    };

    /* CREATE FUNCTIONS */

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!evalName || !evalNumber || evals.filter((e) => e.evalNumber == evalNumber).length > 0) {
            alert(`Please enter a valid Eval Name and positive Eval Number that has not already been used.`);
            return;
        }

        const newEval = {
            "evalNumber": parseInt(evalNumber),
            "evalName": evalName,
            "pages": {
                "rq1": selectedPages.includes('/rq1'),
                "rq2": selectedPages.includes('/rq2'),
                "rq3": selectedPages.includes('/rq3'),
                "exploratoryAnalysis": selectedPages.includes('/exploratory-analysis'),
                "admProbeResponses": selectedPages.includes('/adm-probe-responses'),
                "admAlignment": selectedPages.includes('/adm-results'),
                "admResults": selectedPages.includes('/results'),
                "humanSimPlayByPlay": selectedPages.includes('/human-results'),
                "humanSimProbes": selectedPages.includes('/humanProbeData'),
                "participantLevelData": selectedPages.includes('/humanSimParticipant'),
                "textResults": selectedPages.includes('/text-based-results'),
                "programQuestions": selectedPages.includes('/')
            }
        }

        try {
            const res = await addNewEval({ variables: { caller, newEval } });
            if (res.data.addNewEval.ok) {
                onCancelCreate();
                const refetchedData = await fetchEvalData();
                updateLocalEvalData(refetchedData.data);
            }
        }
        catch (error) {
            console.error("Could not add new eval", error);
        }

    };

    const onCancelCreate = () => {
        setShowNewEvalForm(false);
        setEvalName('');
        setEvalNumber('');
        setSelectedPages([]);
    };

    /* EVAL MODAL FUNCTIONS */

    const evalModalToggle = (ev) => {
        setShowEvalModal(true)
        setModalEval(ev)
    }

    const onCancelSettings = () => {
        setShowEvalModal(false)
        setModalEval([])
    }



    return <>
        <Card >
            <Card.Header as="h5">Evaluations</Card.Header>
            <Card.Body>
                <div className='edit-eval-container'>
                    <table className='itm-table'>
                        <thead>
                            <tr>
                                <th>
                                    Eval Name
                                </th>
                                <th>
                                    Eval Number
                                </th>
                                <th className='switch-header' title='home page / program questions'>
                                    /
                                </th>
                                <th className='switch-header' title='text scenario results'>
                                    /text-based-results
                                </th>
                                <th className='switch-header' title='participant-level data'>
                                    /humanSimParticipant
                                </th>
                                <th className='switch-header' title='human sim probe values'>
                                    /humanProbeData
                                </th>
                                <th className='switch-header' title='detailed human sim output'>
                                    /human-results
                                </th>
                                <th className='switch-header' title='adm history output'>
                                    /results
                                </th>
                                <th className='switch-header' title='adm charts'>
                                    /adm-results
                                </th>
                                <th className='switch-header' title='adm probe responses'>
                                    /adm-probe-responses
                                </th>
                                <th className='switch-header' title='rq1'>
                                    /rq1
                                </th>
                                <th className='switch-header' title='rq2'>
                                    /rq2
                                </th>
                                <th className='switch-header' title='rq3'>
                                    /rq3
                                </th>
                                <th className='switch-header' title='exploratory analysis'>
                                    /exploratory-analysis
                                </th>
                                <th className='action-header' title='only deletes the entry from the evalData collection'>
                                    Delete
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {evals.map((evaluation) => {
                                return (
                                    <tr key={evaluation._id}>
                                        <td className='eval-name'onClick={() => evalModalToggle(evaluation)}>{evaluation.evalName}</td>
                                        <td>{evaluation.evalNumber}</td>
                                        <td><Switch color='primary' checked={evaluation.pages.programQuestions} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'programQuestions', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.textResults} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'textResults', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.participantLevelData} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'participantLevelData', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.humanSimProbes} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'humanSimProbes', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.humanSimPlayByPlay} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'humanSimPlayByPlay', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.admResults} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'admResults', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.admAlignment} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'admAlignment', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.admProbeResponses} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'admProbeResponses', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.rq1} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'rq1', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.rq2} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'rq2', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.rq3} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'rq3', e)} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.exploratoryAnalysis} onChange={(e) => updateEvalPagePermissions(evaluation._id, 'exploratoryAnalysis', e)} /></td>
                                        <td><IconButton title='Delete' onClick={() => startDeleteProcess(evaluation)} children={<DeleteIcon className='delete-eval-btn' />} /></td>
                                    </tr>);
                            })}
                        </tbody>
                    </table>
                </div>
                <Button onClick={() => setShowNewEvalForm(true)}>Add New Eval</Button>
            </Card.Body>
        </Card>

        <Modal show={showEvalModal} onHide={onCancelSettings} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <strong>{modalEval.evalName}</strong>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                <strong>Eval Number: {modalEval.evalNumber}</strong>

                <div className="table-container">
                    <table className="eval-modal-table">
                        <tbody>
                            <tr>
                                <td className="table-label">
                                    /
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.programQuestions} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'programQuestions', e)} />
                                </td>
                                <td className="table-label">
                                    /text-based-results
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.textResults} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'textResults', e)} />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">
                                    /humanSimParticipant
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.participantLevelData} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'participantLevelData', e)} />
                                </td>
                                <td className="table-label">
                                    /humanProbeData
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.humanSimProbes} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'humanSimProbes', e)} />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">
                                    /human-results
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.humanSimPlayByPlay} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'humanSimPlayByPlay', e)} />
                                </td>
                                <td className="table-label">
                                    /results
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.admResults} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'admResults', e)} />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">
                                    /adm-results
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.admAlignment} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'admAlignment', e)} />
                                </td>
                                <td className="table-label">
                                    /adm-probe-responses
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.admProbeResponses} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'admProbeResponses', e)} />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">
                                    /rq1
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.rq1} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'rq1', e)} />
                                </td>
                                <td className="table-label">
                                    /rq2
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.rq2} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'rq2', e)} />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">
                                    /rq3
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.rq3} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'rq3', e)} />
                                </td>
                                <td className="table-label">
                                    /exploratory-analysis
                                </td>
                                <td className="table-value">
                                    <Switch color='primary' checked={modalEval.pages?.exploratoryAnalysis} onChange={(e) => updateEvalPagePermissions(modalEval._id, 'exploratoryAnalysis', e)} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="text-center mt-4">
                    <IconButton title='Delete' onClick={() => startDeleteProcess(modalEval)} children={<DeleteIcon className='delete-eval-btn' />} />
                </div>
            </Modal.Body>
        </Modal>

        <Modal show={showNewEvalForm} onHide={onCancelCreate} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <strong>Create a New Evaluation</strong>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="evalName">
                        <Form.Label>Eval Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={evalName}
                            onChange={(e) => setEvalName(e.target.value)}
                            placeholder="Enter evaluation name"
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="evalNumber" className="mt-3">
                        <Form.Label>Eval Number</Form.Label>
                        <Form.Control
                            type="number"
                            value={evalNumber}
                            onChange={(e) => setEvalNumber(e.target.value)}
                            placeholder="Enter evaluation number"
                            min={1}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="pages" className="mt-4">
                        <Form.Label>Add Dropdown to Pages:</Form.Label>
                        <div className="checkbox-grid">
                            {pagePaths.map((path, index) => (
                                <Form.Check
                                    key={index}
                                    type="checkbox"
                                    id={`page-${index}`}
                                    label={path}
                                    value={path}
                                    checked={selectedPages.includes(path)}
                                    onChange={handleCheckboxChange}
                                    className="mb-1"
                                />
                            ))}
                        </div>
                    </Form.Group>

                    <div className="text-center mt-4">
                        <Button variant="primary" type="submit">
                            Add
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={onCancelCreate}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showDeleteConfirmation} onHide={cancelDeletion} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <strong>Are You Sure?</strong>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                This will delete {evalToDelete?.evalName} (#{evalToDelete?.evalNumber}) from the evalData collection.
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <button className='downloadBtn' onClick={cancelDeletion}>Cancel</button>
                <button className='downloadBtn' onClick={activateDelete}>Delete Eval</button>
            </Modal.Footer>
        </Modal >
    </>;
}