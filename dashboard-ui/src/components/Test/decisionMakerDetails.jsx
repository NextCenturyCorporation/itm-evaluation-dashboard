import React from "react";
import DecisionList from "./decisionList";
import DecisionMakerDash from "./decisionMakerDash";
import { Tabs, Tab, Dropdown, Row, Col } from 'react-bootstrap';

class DecisionMakerDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dropdownLabel: "Choose Decision Maker",
            decisionMaker: "",
            isHuman: true
        };
    }

    handleDecisionMakerSelect = (dropdownLabel) => {
        // Check if the selected choice contains the word "Human"
        const isHuman = dropdownLabel.toLowerCase().includes("human");
        let decisionMakerChoice = ""
        if (isHuman) {
            decisionMakerChoice = dropdownLabel === "Human 1" ? "human1" : "human2"
        } else {
            decisionMakerChoice = dropdownLabel
        }
        this.setState({
            dropdownLabel: dropdownLabel,
            decisionMaker: decisionMakerChoice,
            isHuman: isHuman
        });
    };

    render = () => {
        return (
            <>
                <Row>
                    <Col>
                        <Tabs className="pt-1 px-1">
                            <Tab eventKey="0" title="Action List" className="p-4">
                                <DecisionList title={this.state.dropdownLabel} decisionMaker={this.state.decisionMaker} isHuman={this.state.isHuman} />
                            </Tab>
                            <Tab eventKey="1" title="General Scenario Stats" className="p-4">
                                <DecisionMakerDash title={this.state.dropdownLabel} decisionMaker={this.state.decisionMaker} isHuman={this.state.isHuman}/>
                            </Tab>
                        </Tabs>
                        <Dropdown className="px-2 pb-2">
                            <Dropdown.Toggle variant="primary" id="dropdown-basic">
                                {this.state.dropdownLabel}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => this.handleDecisionMakerSelect("Human 1")}>Human 1</Dropdown.Item>
                                <Dropdown.Item onClick={() => this.handleDecisionMakerSelect("Human 2")}>Human 2</Dropdown.Item>
                                <Dropdown.Item onClick={() => this.handleDecisionMakerSelect("Kitware")}>Kitware</Dropdown.Item>
                                <Dropdown.Item onClick={() => this.handleDecisionMakerSelect("Paralax")}>Paralax</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>
            </>
        )
    }
}

export default DecisionMakerDetails;
