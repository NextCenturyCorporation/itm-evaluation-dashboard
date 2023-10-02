import React from 'react';
import { Accordion, ListGroup } from 'react-bootstrap';
import { nameMappings } from './decisionList';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($scenarioID: ID, $admName: ID){
        getTestByADMandScenario(scenarioID: $scenarioID, admName: $admName)
    }`;
class ScenarioDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scenarioId: "soartech-september-demo-scenario-1"
        };
    }

    renderPatientInfo(patient) {
        return (
            <ListGroup variant="flush">
                {patient.injuries.map((injury, index) => (
                    <ListGroup.Item key={index}>Injury: {injury.name} ({injury.location})</ListGroup.Item>
                ))}

            </ListGroup>
        )
    }

    render = () => {
        return (
            <Accordion>
                <Query query={test_by_adm_and_scenario}>
                    {
                        ({ loading, error, data }) => {
                            if (loading) return <div>Loading ...</div>
                            if (error) return <div>Error</div>
                            const response = data.getTestByADMandScenario.history[1].response
                            const state = response.state

                            return (
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>Scenario Details: {response.id}</Accordion.Header>
                                    <Accordion.Body>
                                        <p><strong>Scenario Description:</strong></p>
                                        <p>{state.unstructured}</p>
                                        <p><strong>Number of Patients:</strong> {state.casualties.length}</p>
                                        {/*<p><strong>Evac Spots:</strong> ? spot(s)</p>*/}
                                        <p><strong>Patients: </strong></p>
                                        <Accordion>
                                            {state.casualties.map((patient, index) => (
                                                <Accordion.Item key={index} eventKey={index}>
                                                    <Accordion.Header>{nameMappings[patient.id]}</Accordion.Header>
                                                    <Accordion.Body>
                                                        {this.renderPatientInfo(patient)}
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                    </Accordion.Body>
                                </Accordion.Item>
                            )
                        }
                    }
                </Query>
            </Accordion>
        )
    }

}

export default ScenarioDetails