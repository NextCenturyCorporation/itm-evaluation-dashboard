import React from 'react';
import { Accordion } from 'react-bootstrap';
import { getCasualtyArray } from './htmlUtility';
import { renderPatientInfo } from './casualtySlider';
class ScenarioDetails extends React.Component {    

    render = () => {
        const casualties = this.props.casualtyList
        const numPatients = casualties.length
        const description = this.props.description

        return (
            <Accordion>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Scenario Details: {this.props.scenarioID}</Accordion.Header>
                    <Accordion.Body>
                        <p><strong>Scenario Description:</strong></p>
                        <p>{description}</p>
                        <p><strong>Number of Patients:</strong> {numPatients}</p>
                        {/*<p><strong>Evac Spots:</strong> ? spot(s)</p>*/}
                        <p><strong>Patients: </strong></p>
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
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        )
    }

}

export default ScenarioDetails