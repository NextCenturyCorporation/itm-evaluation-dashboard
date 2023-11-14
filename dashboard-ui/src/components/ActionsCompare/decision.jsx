import React from 'react';
import { ListGroup } from 'react-bootstrap';
import * as utility from './utility'
class Decision extends React.Component {

    admPulseMapping(hrpmin) {
        if (hrpmin > 0 && hrpmin <= 50) {
            return "Faint Pulse";
        } else if (hrpmin > 50 && hrpmin <= 100) {
            return "Normal Pulse";
        } else if (hrpmin > 100) {
            return "Fast Pulse";
        } else {
            return "No Pulse";
        }
    }

    renderDecisionHuman = (decision) => {
        const renderedItems = [];
    
        const formatKey = (key) => {
            // Convert camelCase to readable format (e.g., "actionType" to "Action Type")
            return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
        }
    
        for (const [key, value] of Object.entries(decision)) {
            // only makes sense to say if successful or not if it is a treatment
            if (key === 'succesfulTreatement' && decision.actionType !== 'Treatment') {
                continue; 
            }
            
            let displayValue = value;

            // successful treatment 
            if (typeof value === 'boolean') {
                displayValue = value ? 'Yes' : 'No';
            }
    
            if (value !== "" && !(Array.isArray(value) && value.length === 0)) {
                const formattedKey = formatKey(key);
                renderedItems.push(<ListGroup.Item key={key}>{formattedKey}: {displayValue}</ListGroup.Item>);
            }
        }
    
        if (renderedItems.length > 0) {
            return <div>{renderedItems}</div>;
        } else {
            // no information to show
            return <p></p>;
        }
    }

    renderDecisionADM = (decision) => {
        switch (decision.command) {
            case "Tag Casualty":
                return (
                    <div>
                        <ListGroup.Item>Patient: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Tag: {utility.formattedActionType(decision.parameters["Tag"])}</ListGroup.Item>
                    </div>
                )
            case "Check All Vitals":
                return (
                    <div>
                        <ListGroup.Item>Patient: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Pulse Reading: {this.admPulseMapping(parseInt(decision.response["hrpmin"]))}</ListGroup.Item>
                    </div>
                )
            case "Apply Treatment":
                return (
                    <div>
                        <ListGroup.Item>Patient: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Treatment: {utility.formattedActionType(decision.parameters["Parameters"]["treatment"])}</ListGroup.Item>
                        <ListGroup.Item>Location: {utility.formattedActionType(decision.parameters["Parameters"]["location"])}</ListGroup.Item>
                    </div>
                )
            case "Move to EVAC":
                return (
                    <div>
                        <ListGroup.Item>Patient: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                    </div>
                )
        }
    }

    render = () => {
        return (
            <div className="row">
                <div className="col">
                    <ListGroup variant="flush">
                        {this.props.isHuman ? (
                            this.renderDecisionHuman(this.props.decision)
                        ) : (
                            this.renderDecisionADM(this.props.decision)
                        )}
                    </ListGroup>
                </div>
                {this.props.decision.imgURL && (
                    <div className="col">
                        <img
                            src={this.props.decision.imgURL}
                            alt="casualty"
                            className="img-fluid"
                        />
                    </div>
                )}
            </div>
        );
    }

}

export default Decision;