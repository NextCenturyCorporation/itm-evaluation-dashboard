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

    tagMappings = {
        "red": "Immediate",
        "gray": "Expectant",
        "green": "Minimal",
        "yellow": "Delayed"
    }

    renderDecision = (decision) => {
        switch (decision.actionType) {
            case "PULSE_TAKEN":
                return (
                    <div>
                        <ListGroup.Item>TimeStamp: {decision.time}</ListGroup.Item>
                        <ListGroup.Item>Patient: {decision.actionData[1]}</ListGroup.Item>
                        <ListGroup.Item>Pulse Reading: {decision.actionData[0]}</ListGroup.Item>
                    </div>
                );
            case "INJURY_TREATED":
                return (
                    <div>
                        <ListGroup.Item>TimeStamp: {decision.time}</ListGroup.Item>
                        <ListGroup.Item>Patient: {decision.actionData[1]}</ListGroup.Item>
                        <ListGroup.Item>Injury: {decision.actionData[0]}</ListGroup.Item>
                        <ListGroup.Item>Treatment: {decision.actionData[2]}</ListGroup.Item>
                    </div>
                )
            case "TAG_APPLIED":
                return (
                    <div>
                        <ListGroup.Item>TimeStamp: {decision.time}</ListGroup.Item>
                        <ListGroup.Item>Patient: {decision.actionData[0]}</ListGroup.Item>
                        <ListGroup.Item>Tag: {this.tagMappings[decision.actionData[1]]}</ListGroup.Item>
                    </div>
                )
        }
    }

    imageToDecisionMapping(decisions, casualties) {
        
        if (!casualties || casualties.length === 0) {
            return decisions; 
        }
        
        const casualtyMap = new Map();
        casualties.forEach(casualty => {
            casualtyMap.set(casualty.name, casualty);
        });
    
        
        const updatedDecisions = decisions.map(decision => {
            
            const matchingCasualtyName = decision.actionData.find(name => casualtyMap.has(name));
    
            if (matchingCasualtyName) {
                const matchingCasualty = casualtyMap.get(matchingCasualtyName);
               
                return {
                    ...decision,
                    imgURL: matchingCasualty.imgURL,
                };
            }
    
            
            return decision;
        });
        return updatedDecisions;
    }
    
    

    render = () => {
        const decisions = this.imageToDecisionMapping(this.props.decisions, this.props.casualties);
        
        const visibleDecisionsCount = 10;
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
                      <div className="row">
                        <div className="col">
                          <ListGroup variant="flush">
                            {this.renderDecision(decision)}
                          </ListGroup>
                        </div>
                        {decision.imgURL && (
                          <div className="col">
                            <img
                              src={decision.imgURL}
                              alt="casualty"
                              className="img-fluid"
                            />
                          </div>
                        )}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          );
          
    }
}

export default DecisionList;
