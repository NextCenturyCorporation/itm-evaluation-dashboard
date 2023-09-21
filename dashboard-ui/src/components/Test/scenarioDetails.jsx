import React from 'react';
import { Accordion, ListGroup } from 'react-bootstrap';
class ScenarioDetails extends React.Component {

    getScenarioDetails() {
        return {
            name: "Jungle Triage",
            patients: [
                {
                    name: "bob",
                    injuries: ["right arm shrapnel", "ear bleed"],
                    properTag: ["Delayed"]
                },
                {
                    name: "bill",
                    injuries: ["right arm shrapnel", "ear bleed"],
                    properTag: ["Delayed"]
                }
            ],
            numPatients: 2,
            evacSpots: 1
        }
    }

    render = () => {

        const scenario = this.getScenarioDetails()

        return (
            <Accordion>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Scenario Details: {scenario.name}</Accordion.Header>
                    <Accordion.Body>
                        <p><strong>Number of Patients:</strong> {scenario.numPatients}</p>
                        <p><strong>Evac Spots:</strong> {scenario.evacSpots} spot(s)</p>
                        <p><strong>Patients: </strong></p>
                        <Accordion>
                            {scenario.patients.map((patient, index) => (
                                <Accordion.Item key={index} eventKey={index}>
                                    <Accordion.Header>{patient.name}</Accordion.Header>
                                    <Accordion.Body>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item><strong>Injuries:</strong> {patient.injuries.join(', ')}</ListGroup.Item>
                                            <ListGroup.Item><strong>Proper Tag:</strong> {patient.properTag}</ListGroup.Item>
                                        </ListGroup>
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        )
    }

}

export default ScenarioDetails