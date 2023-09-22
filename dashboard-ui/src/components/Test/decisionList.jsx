import React from 'react';
import Accordion from 'react-bootstrap/Accordion';

class DecisionList extends React.Component {
    renderDecision = () => {
        return (
            <p>hello world</p>
        )
    }

    render = () => {
        const decisions = this.props.decisions;
        console.log(decisions);
        
        const visibleDecisionsCount = 4;
        const decisionHeight = 50; 

        // total height of accordion maxes out at count * height of each 
        const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;

        return (
            <div>
                <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
                    {decisions.map((decision, index) => (
                        <Accordion.Item key={index} eventKey={index}>
                            <Accordion.Header>{decision.decision}</Accordion.Header>
                            <Accordion.Body>
                                {/* Render the content of each decision here */}
                                {this.renderDecision()}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        );
    }
}

export default DecisionList;
