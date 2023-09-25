import React from 'react';
import { Accordion, ListGroup } from 'react-bootstrap';
class ScenarioDetails extends React.Component {

    getCasualtyArray(tables) {
        let casualties = [];
    
        tables.map((table) => {
            const name = table.firstChild.innerText;
            let salt = table.lastChild.childNodes[1].firstChild.innerText;
    
            // extract the relevant part of the salt value
            salt = salt.replace("salt", "").trim();
            
            const patient = {
                "name": name,
                "salt":  salt
            };
    
            casualties.push(patient);
        });
    
        return casualties;
    }
    
    
    render = () => {

        const scenario = this.props.tables
        const numPatients = scenario.length
        const casualties = this.getCasualtyArray(scenario)

        return (
            <Accordion>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Scenario Details: Jungle Triage</Accordion.Header>
                    <Accordion.Body>
                        <p><strong>Number of Patients:</strong> {numPatients}</p>
                        <p><strong>Evac Spots:</strong> ? spot(s)</p>
                        <p><strong>Patients: </strong></p>
                        <Accordion>
                            {casualties.map((patient, index) => (
                                <Accordion.Item key={index} eventKey={index}>
                                    <Accordion.Header>{patient.name}</Accordion.Header>
                                    <Accordion.Body>
                                        <ListGroup variant="flush">
                                            <ListGroup.Item><strong>SALT:</strong> {patient.salt}</ListGroup.Item>
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