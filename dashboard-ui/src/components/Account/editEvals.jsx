import gql from "graphql-tag";
import React from "react";
import { useMutation, useQuery } from "react-apollo";
import { Button, Card, Modal, Form } from "react-bootstrap";
import { IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';

const GET_EVAL_DATA = gql`
    query GetAllEvalData {
        getAllEvalData
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

export function EditEvals({ caller }) {
    const { data: evalData, refetch: fetchEvalData } = useQuery(GET_EVAL_DATA, { fetchPolicy: 'no-cache' });
    const [evals, setEvals] = React.useState([]);
    const [addNewEval] = useMutation(ADD_NEW_EVAL);
    const [deleteEval] = useMutation(DELETE_EVAL);
    const [showNewEvalForm, setShowNewEvalForm] = React.useState(false);
    const [evalName, setEvalName] = React.useState('');
    const [evalNumber, setEvalNumber] = React.useState('');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
    const [evalToDelete, setEvalToDelete] = React.useState(null);


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

    const getEvalById = (evalId) => {
        return evals.find((x) => x._id == evalId);
    };

    /* DELETE FUNCTIONS */

    const startDeleteProcess = (evalToDeleteData) => {
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
                "programQuestions": true
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
    };

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
                                <th className='action-header' title='only deletes the entry from the evalData collection'>
                                    Delete
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {evals.map((evaluation) => {
                                return (
                                    <tr key={evaluation._id}>
                                        <td className='eval-name'>{evaluation.evalName}</td>
                                        <td>{evaluation.evalNumber}</td>
                                        <td><IconButton title='Delete' onClick={() => startDeleteProcess(evaluation)} children={<DeleteIcon className='delete-eval-btn' />} /></td>
                                    </tr>);
                            })}
                        </tbody>
                    </table>
                </div>
                <Button onClick={() => setShowNewEvalForm(true)}>Add New Eval</Button>
            </Card.Body>
        </Card>

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