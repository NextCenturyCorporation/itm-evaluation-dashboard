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

    commandMap = {
        "Tag Casualty" : "Tag Applied",
        "Apply Treatment" : "Injury Treated",
        "Check All Vitals" : "Check All Vitals"
    }

    nameMappings = {
        "MarineC" : "Military Mike Jungle Combat_3_2 Root",
        "MarineA" : "Military Mike Jungle Burned_0 Root",
        "Intelligence Officer" : "Intelligence Officer Burned_Gary_1 Root"
    }

    renderDecisionCSV = (decision) => {
        switch (decision.actionType) {
            case "PULSE_TAKEN":
                return (
                    <div>
                        <ListGroup.Item>Patient: {decision.actionData[1]}</ListGroup.Item>
                        <ListGroup.Item>Pulse Reading: {decision.actionData[0]}</ListGroup.Item>
                    </div>
                );
            case "INJURY_TREATED":
                return (
                    <div>
                        <ListGroup.Item>Patient: {decision.actionData[1]}</ListGroup.Item>
                        <ListGroup.Item>Injury: {decision.actionData[0]}</ListGroup.Item>
                        <ListGroup.Item>Treatment: {decision.actionData[2]}</ListGroup.Item>
                    </div>
                )
            case "TAG_APPLIED":
                return (
                    <div>
                        <ListGroup.Item>Patient: {decision.actionData[0]}</ListGroup.Item>
                        <ListGroup.Item>Tag: {this.tagMappings[decision.actionData[1]]}</ListGroup.Item>
                    </div>
                )
        }
    }

    renderDecisionADM = (decision) => {
        switch(decision.command) {
            case "Tag Casualty":
                return (
                    <div>
                        <ListGroup.Item>Pateint: {this.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Tag: {this.formattedActionType(decision.parameters["Tag"])}</ListGroup.Item>
                    </div>
                )
            case "Check All Vitals":
                return (
                    <div>
                        <ListGroup.Item>Patient: {this.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Breathing: {this.formattedActionType(decision.response["breathing"])}</ListGroup.Item>
                        <ListGroup.Item>Conscious: {decision.response["conscious"] ? `Yes` : `No`}</ListGroup.Item>
                        <ListGroup.Item>HRPMin: {decision.response["hrpmin"]}</ListGroup.Item>
                        <ListGroup.Item>Mental Status: {this.formattedActionType(decision.response["mental_status"])}</ListGroup.Item>
                    </div>
                )
            case "Apply Treatment":
                return (
                    <div>
                        <ListGroup.Item>Patient: {this.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Treatment: {this.formattedActionType(decision.parameters["Parameters"]["treatment"])}</ListGroup.Item>
                        <ListGroup.Item>Breathing: {this.formattedActionType(decision.parameters["Parameters"]["location"])}</ListGroup.Item>
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
        const visibleDecisionsCount = 10;
        const decisionHeight = 50;

        // total height of accordion maxes out at count * height of each 
        const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;
        let decisions = this.props.decisions

        if (this.props.isHuman){
            decisions = this.imageToDecisionMapping(decisions, this.props.casualties);
        } 
        

        return (
            <div>
              <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
                {decisions.map((decision, index) => (
                  <Accordion.Item key={index} eventKey={index}>
                    {this.props.isHuman ? (
                    <>
                    <Accordion.Header>{this.formattedActionType(decision.actionType)}</Accordion.Header>
                    <Accordion.Body>
                      <div className="row">
                        <div className="col">
                          <ListGroup variant="flush">
                            {this.renderDecisionCSV(decision)}
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
                    </>
                    ) :
                    <>
                    <Accordion.Header>{this.commandMap[decision.command]}</Accordion.Header>
                    <Accordion.Body>
                      <div className="row">
                        <div className="col">
                          <ListGroup variant="flush">
                            {this.renderDecisionADM(decision)}
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
                    </>
                    }
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          );
    }
}

export default DecisionList;
