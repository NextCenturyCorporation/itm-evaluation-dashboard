import React from 'react';
import { Accordion } from 'react-bootstrap';
import { renderPatientInfo } from './casualtySlider';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const scenarioQuery = gql`
query ExampleQuery($scenarioId: ID) {
    getScenario(scenarioId: $scenarioId) {
      state {
        unstructured
        casualties {
          injuries {
            name
            severity
            location
          }
          id
        }
      }
    }
  }
  `
class ScenarioDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scenarioId: "soartech-september-demo-scenario-1"
        };
    }

    render = () => {
        return (
            <Accordion>
                <Query query={scenarioQuery} variables={{ "scenarioID": this.state.scenarioId }}>
                    {
                        ({ loading, error, data }) => {
                            if (loading) return <div>Loading ...</div>
                            if (error) return <div>Error</div>
                            console.log(data)

                            return (
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>Scenario Details: {this.state.scenarioId}</Accordion.Header>
                                    <Accordion.Body>
                                        <p><strong>Scenario Description:</strong></p>
                                        {/*<p>{description}</p>
                                        <p><strong>Number of Patients:</strong> {numPatients}</p>
                                        {/*<p><strong>Evac Spots:</strong> ? spot(s)</p>*/}
                                        {/*<p><strong>Patients: </strong></p>
                                        <Accordion>
                                            {casualties.map((patient, index) => (
                                                <Accordion.Item key={index} eventKey={index}>
                                                    <Accordion.Header>{patient.name}</Accordion.Header>
                                                    <Accordion.Body>
                                                        {renderPatientInfo(patient)}
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                    */}
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