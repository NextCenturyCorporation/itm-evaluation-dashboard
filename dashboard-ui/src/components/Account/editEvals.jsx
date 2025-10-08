import gql from "graphql-tag";
import React from "react";
import { useQuery } from "react-apollo";
import { Button, Card, Form } from "react-bootstrap";
import { IconButton, Switch } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';

const GET_EVAL_DATA = gql`
    query GetAllEvalData {
        getAllEvalData
    }
`;

export function EditEvals() {
    const { data: evalData } = useQuery(GET_EVAL_DATA, { fetchPolicy: 'no-cache' });
    const [evals, setEvals] = React.useState([]);

    React.useEffect(() => {
        if (evalData?.getAllEvalData) {
            const tmpEvals = evalData.getAllEvalData;
            tmpEvals.reverse();
            setEvals(tmpEvals);
        }
    }, [evalData]);

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
                                        <td>{evaluation.evalName}</td>
                                        <td>{evaluation.evalNumber}</td>
                                        <td><Switch color='primary' checked={evaluation.pages.programQuestions} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.textResults} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.participantLevelData} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.humanSimProbes} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.humanSimPlayByPlay} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.admResults} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.admAlignment} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.admProbeResponses} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.rq1} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.rq2} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.rq3} /></td>
                                        <td><Switch color='primary' checked={evaluation.pages.exploratoryAnalysis} /></td>
                                        <td><IconButton title='Delete' children={<CancelIcon className='red-btn' />} /></td>
                                        {/* <td><Switch onChange={(e) => updateUserStatus(user._id, 'admin', e)} /></td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'evaluator', e)} /></td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'experimenter', e)} /></td>
                                    <td><Switch onChange={(e) => updateUserStatus(user._id, 'adeptUser', e)} /></td>
                                    <td>
                                        <IconButton title='Approve' onClick={() => approveUser(user._id)} children={<CheckCircleIcon className='green-btn' />} />
                                        <IconButton title='Deny' onClick={() => denyUser(user._id)} children={<CancelIcon className='red-btn' />} /></td> */}
                                    </tr>);
                            })}
                        </tbody>
                    </table>
                </div>
                {/* <Form.Group>
                    <Form.Label>Select Evaluation to Edit</Form.Label>
                    <Form.Select
                        value=''
                        onChange={handleSelectedEvalChange}
                    >
                        <option value="" disabled>Select Evaluation</option>
                        {evals.map((evaluation) => (
                            <option key={evaluation.evalNumber} value={evaluation.evalNumber}>
                                {evaluation.evalName} (Eval {evaluation.evalNumber})
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                {selectedEval !== '' && <>


                </>} */}
                <Button>Add New Eval</Button>
            </Card.Body>
        </Card>
    </>;
}