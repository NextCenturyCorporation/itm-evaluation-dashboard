import React from 'react';
import Accordion from 'react-bootstrap/Accordion';

class DecisionList extends React.Component {


    render = () => {

        const decisions = this.props.decisions
        return (
            <div>
                <Accordion>
                    {decisions.map((decision, index) => (
                        <Accordion.Item key={index} eventKey={index}>
                            <Accordion.Header>{decision.decision}</Accordion.Header>
                            <Accordion.Body>
                                    <p><strong>Justification:</strong> {decision.justification}</p>
                                    <p><strong>Time Taken:</strong> {decision.timeTaken} seconds</p>
                                    <p><strong>Action Type:</strong> {decision.actionType}</p>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        )
    }
}

export default DecisionList