import React from 'react';
import { Accordion, ListGroup } from 'react-bootstrap';
import { nameMappings } from './decisionList';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const getScenarioQuery = gql`
    query getScenario($scenarioId: ID) {
        getScenario(scenarioId: $scenarioId) 
    }`;
class ScenarioDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scenarioId: this.props.selectedScenario
        };
    }

    renderPatientInfo(patient) {
        return (
            <div className="row">
                <div className="col-md-6">
                    <h3>Demographic Information</h3>
                    <ListGroup variant="flush">
                        <ListGroup.Item>Age: {patient.demographics.age}</ListGroup.Item>
                        <ListGroup.Item>Sex: {patient.demographics.sex}</ListGroup.Item>
                        <ListGroup.Item>Rank: {patient.demographics.rank}</ListGroup.Item>
                    </ListGroup>
                </div>
                <div className="col-md-6">
                    <h3>Injuries</h3>
                    <ListGroup variant="flush">
                        {patient.injuries.map((injury, index) => (
                            <ListGroup.Item key={index}>
                                <strong>Name:</strong> {injury.name}<br />
                                <strong>Location:</strong> {injury.location}<br />
                                <strong>Severity:</strong> {injury.severity}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
        );
    }
    
    

    componentDidUpdate(prevProps) {
        if (this.props.selectedScenario !== prevProps.selectedScenario) {
            this.setState({ scenarioId: this.props.selectedScenario })
        }
    }

    render = () => {
        return (
            <Accordion defaultActiveKey="0">
                {(this.props.selectedScenario && this.state.scenarioId) ? (
                    <Query query={getScenarioQuery} variables={{ "scenarioId": this.props.selectedScenario }}>
                        {
                            ({ loading, error, data }) => {
                                if (loading) return <div>Loading ...</div>
                                if (error) return <div>Error</div>

                                const state = data.getScenario.state
                                const scenario = data.getScenario
                                
                                return (
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header>Scenario Details: {scenario.id}: {scenario.name}</Accordion.Header>
                                        {state.casualties &&
                                            <Accordion.Body>
                                                <p><strong>Scenario Description:</strong></p>
                                                <p>{state.unstructured}</p>
                                                <p><strong>Number of Patients:</strong> {state.casualties.length}</p>
                                                <p><strong>Patients: </strong></p>
                                                <Accordion>
                                                    {state.casualties.map((patient, index) => (
                                                        <Accordion.Item key={index} eventKey={index}>
                                                            <Accordion.Header>{nameMappings[patient.id] || patient.id}</Accordion.Header>
                                                            <Accordion.Body>
                                                                {this.renderPatientInfo(patient)}
                                                            </Accordion.Body>
                                                        </Accordion.Item>
                                                    ))}
                                                </Accordion>
                                            </Accordion.Body>
                                        }
                                    </Accordion.Item>
                                )
                            }
                        }
                    </Query>
                ) : (
                    <Accordion.Header>Scenario Details: {this.state.scenarioId}</Accordion.Header>
                )
                }
            </Accordion>
        )
    }

}

export default ScenarioDetails