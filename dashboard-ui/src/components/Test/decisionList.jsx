import React from 'react';
import { ListGroup } from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';

class DecisionList extends React.Component {

    formattedActionType(actionType) {
        return actionType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    renderDecision = (decision) => {
        switch (decision.actionType) {
            case "PULSE_TAKEN":
                return (
                    <div>
                        <p>TimeStamp: {decision.time}</p>
                        <p>Patient: {decision.actionData[1]}</p>
                        <p>Pulse Reading: {decision.actionData[0]}</p>
                    </div>
                );
            case "INJURY_TREATED":
                return (
                    <div>
                        <p>TimeStamp: {decision.time}</p>
                        <p>Patient: {decision.actionData[1]}</p>
                        <p>Injury: {decision.actionData[0]}</p>
                        <p>Treatment: {decision.actionData[2]}</p>
                    </div>
                )
            case "TAG_APPLIED":
                return (
                    <div>
                        <p>TimeStamp: {decision.time}</p>
                        <p>Patient: {decision.actionData[0]}</p>
                        <p>Tag: {decision.actionData[1]}</p>
                    </div>
                )
        }
    }

    render = () => {
        const decisions = this.props.decisions;

        const visibleDecisionsCount = 5;
        const decisionHeight = 50;

        // total height of accordion maxes out at count * height of each 
        const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;

        return (
            <div>
                <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
                    {decisions.map((decision, index) => (
                        <Accordion.Item key={index} eventKey={index}>
                            <Accordion.Header>{this.formattedActionType(decision.actionType)}</Accordion.Header>
                            <Accordion.Body>
                                {/* Render the content of each decision here */}
                                {this.renderDecision(decision)}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        );
    }
}

export default DecisionList;
