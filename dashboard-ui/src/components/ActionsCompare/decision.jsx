import React from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
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
            // only makes sense to say if successful or not if it is a treatment. dont show imgBytes
            if (key === "imgBytes" || (key === 'succesfulTreatement' && decision.actionType !== 'Treatment')) {
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
                        <ListGroup.Item>Casualty: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Tag: {utility.formattedActionType(decision.parameters["Tag"])}</ListGroup.Item>
                    </div>
                )
            case "Check All Vitals":
                return (
                    <div>
                        <ListGroup.Item>Casualty: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Pulse Reading: {this.admPulseMapping(parseInt(decision.response["hrpmin"]))}</ListGroup.Item>
                    </div>
                )
            case "Apply Treatment":
                return (
                    <div>
                        <ListGroup.Item>Casualty: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                        <ListGroup.Item>Treatment: {utility.formattedActionType(decision.parameters["Parameters"]["treatment"])}</ListGroup.Item>
                        <ListGroup.Item>Location: {utility.formattedActionType(decision.parameters["Parameters"]["location"])}</ListGroup.Item>
                    </div>
                )
            case "Move to EVAC":
                return (
                    <div>
                        <ListGroup.Item>Casualty: {utility.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
                    </div>
                )
            default:
                return (
                    <div>
                        <ListGroup.Item>Unrecoginzed action type</ListGroup.Item>
                    </div>
                )
        }
    }

    render = () => {
        const decision = this.props.decision

        return (
            <div className="row">
                <div className="col">
                    <ListGroup variant="flush">
                        {this.props.isHuman ? (
                            this.renderDecisionHuman(decision)
                        ) : (
                            this.renderDecisionADM(decision)
                        )}
                    </ListGroup>
                </div>
                {(this.props.decision.imgBytes && this.props.isHuman) && (
                    <div className="col">
                        <img
                            src={`data:image/jpeg;base64,${decision.imgBytes}`}
                            alt="casualty"
                            className="img-fluid"
                        />
                    </div>
                )}
                {this.props.decision.imgURL && !this.props.isHuman && (
                    <div className="col">
                        <img
                            src={decision.imgURL}
                            alt="casualty"
                            className="img-fluid"
                        />
                    </div>
                )
                }
            </div>
        );
    }

}

export default Decision;