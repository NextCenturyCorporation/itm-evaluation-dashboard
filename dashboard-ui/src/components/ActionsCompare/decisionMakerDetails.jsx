import React from "react";
import DecisionList from "./decisionList";
import { Tabs, Tab, Dropdown, Row, Col } from 'react-bootstrap';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const getPerformerADMByScenarioName = "getPerformerADMsForScenario";
const performer_adm_by_scenario = gql`
    query getPerformerADMsForScenario($scenarioID: ID){
        getPerformerADMsForScenario(scenarioID: $scenarioID)
    }`;

class DecisionMakerDetails extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dropdownLabel: "Choose Decision Maker",
            decisionMaker: "",
            isHuman: false
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

    componentDidUpdate(prevProps) {
        if (this.props.selectedScenario !== prevProps.selectedScenario) {
            this.setState({dropdownLabel: "Choose Decision Maker", decisionMaker: "", isHuman: false})
        }
    }

    formatADMString(peformerADMString) {
        if(peformerADMString.indexOf("ALIGN") > -1 ) {
            return ("Kitware: " + peformerADMString);
        } else if (peformerADMString.indexOf("TAD") > -1){
            return ("Parallax: " + peformerADMString);
        } else {
            return peformerADMString;
        }
    }

    render = () => {
        return (
                <Row>
                    <Col>
                        <Tabs className="pt-1 px-1">
                            <Tab eventKey="0" title="Action List" className="p-4">
                                <DecisionList title={this.state.dropdownLabel} decisionMaker={this.state.decisionMaker} isHuman={this.state.isHuman} selectedScenario={this.props.selectedScenario}/>
                            </Tab>
                            {/* commenting out the scenario stats until I am parse the adm data to match the same format
                            <Tab eventKey="1" title="General Scenario Stats" className="p-4">
                                <DecisionMakerDash title={this.state.dropdownLabel} decisionMaker={this.state.decisionMaker} isHuman={this.state.isHuman} selectedScenario={this.props.selectedScenario}/>
                            </Tab>*/}
                        </Tabs>
                        <Dropdown className="px-2 pb-2">
                            <Dropdown.Toggle variant="primary" id="dropdown-basic" disabled={!this.props.selectedScenario}>
                                {this.state.dropdownLabel}
                            </Dropdown.Toggle>
                            <Query query={performer_adm_by_scenario} variables={{"scenarioID": this.props.selectedScenario}}>
                                {
                                    ({ loading, error, data }) => {
                                        if (loading) return <div>Loading ...</div> 
                                        if (error) return <div>Error</div>

                                        const performerADMOptions = data[getPerformerADMByScenarioName];
                                        let performerADMArray = [];
                                        for(let i=0; i < performerADMOptions.length; i++) {
                                            performerADMArray.push({
                                                "value": performerADMOptions[i],
                                                "name": performerADMOptions[i]
                                            });
                                        }
                                        performerADMArray.sort((a, b) => (a.value > b.value) ? 1 : -1);

                                        return (
                                            <Dropdown.Menu>
                                                <Dropdown.Item onClick={() => this.handleDecisionMakerSelect("Human 1")}>Human 1</Dropdown.Item>
                                                <Dropdown.Item onClick={() => this.handleDecisionMakerSelect("Human 2")}>Human 2</Dropdown.Item>
                                                {performerADMArray.map((item,key) =>
                                                    <Dropdown.Item key={"performeradm_" + key} onClick={() => this.handleDecisionMakerSelect(item.value)}>{this.formatADMString(item.value)}</Dropdown.Item>
                                                )}
                                            </Dropdown.Menu>
                                        )
                                    }
                                }
                            </Query>
                        </Dropdown>
                    </Col>
                </Row>
        )
    }
}

export default DecisionMakerDetails;
