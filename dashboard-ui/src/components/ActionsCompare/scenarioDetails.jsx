import React from 'react';
import { Accordion, ListGroup } from 'react-bootstrap';
import { nameMappings } from './decisionList';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($scenarioID: ID, $admName: ID){
        getTestByADMandScenario(scenarioID: $scenarioID, admName: $admName)
    }`;
const myQuery = gql`query ExampleQuery {
    getAllHistory
  }`
class ScenarioDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scenarioId: ""
        };
    }

    renderPatientInfo(patient) {
        return (
            <ListGroup variant="flush">
                <ListGroup.Item>Age: {patient.demographics.age}</ListGroup.Item>
                <ListGroup.Item>Sex: {patient.demographics.sex}</ListGroup.Item>
                <ListGroup.Item>Rank: {patient.demographics.rank}</ListGroup.Item>
            </ListGroup>
        )
    }

    componentDidUpdate(prevProps) {
        if (this.props.selectedScenario !== prevProps.selectedScenario) {
            if (this.props.selectedScenario === "Soartech") {
                this.setState({ scenarioId: "soartech-september-demo-scenario-1" })
            } else {
                this.setState({scenarioId: "adept-september-demo-scenario-1"})
            }
        }
    }

    render = () => {
        return (
            <Accordion>
                { (this.props.selectedScenario && this.state.scenarioId) ? (
                <Query query={myQuery}>
                    {
                        ({ loading, error, data }) => {
                            if (loading) return <div>Loading ...</div>
                            if (error) return <div>Error</div>
                            
                            let response = {}
                            let state = {}
                            if (this.state.scenarioId === "soartech-september-demo-scenario-1") {
                                response = data.getAllHistory[0].history[1].response
                                state = response.state
                            } else {
                                state = data.getAllHistory[1].history[1].response
                            }
                            console.log(data, state);
                            
                            return (
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>Scenario Details: {this.state.scenarioId}</Accordion.Header>
                                    {state.casualties && 
                                        <Accordion.Body>
                                            <p><strong>Scenario Description:</strong></p>
                                            <p>{state.unstructured}</p>
                                            <p><strong>Number of Patients:</strong> {state.casualties.length}</p>
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