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


    humanPulseReading(pulse) {
        switch (pulse) {
            case "pulse_fast":
                return "Fast Pulse"
            case "pulse_normal":
                return "Normal Pulse"
            case "pulse_faint":
                return "Faint Pulse"
            default:
                return "unknown"
        }
    }

    renderDecisionHuman = (decision) => {
        switch (decision.actionType) {
            case "PULSE_TAKEN":
                return (
                    <div>
                        <ListGroup.Item>Patient: {decision.actionData[1]}</ListGroup.Item>
                        <ListGroup.Item>Pulse Reading: {this.humanPulseReading(decision.actionData[0])}</ListGroup.Item>
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
                        <ListGroup.Item>Tag: {utility.tagMappings[decision.actionData[1]]}</ListGroup.Item>
                    </div>
                )
            case "MOVE_TO_EVAC":
                return (
                    <div>
                        <ListGroup.Item>Patient: {decision.actionData[0]}</ListGroup.Item>
                    </div>
                )
            default:
                return (<p>unrecognized action</p>)
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
                        {/* omitted data for now, adm gets all vital information not just pulse
                        <ListGroup.Item>Breathing: {this.formattedActionType(decision.response["breathing"])}</ListGroup.Item>
                        <ListGroup.Item>Conscious: {decision.response["conscious"] ? `Yes` : `No`}</ListGroup.Item>
                        */}
                        <ListGroup.Item>Pulse Reading: {this.admPulseMapping(parseInt(decision.response["hrpmin"]))}</ListGroup.Item>
                        {/*<ListGroup.Item>Mental Status: {this.formattedActionType(decision.response["mental_status"])}</ListGroup.Item>*/}
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