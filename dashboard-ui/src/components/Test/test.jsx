import React from 'react';
import CasualtySlider from './casualtySlider';
import Card from 'react-bootstrap/Card';
import ScenarioDetails from './scenarioDetails';
import DecisionMakerDetails from './decisionMakerDetails';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { getCasualtyArray } from './htmlUtility';
const getScenarioNamesQueryName = "getScenarioNames";
const getPerformerADMByScenarioName = "getPerformerADMsForScenario";
const getTestByADMandScenarioName = "getTestByADMandScenario";

const scenario_names_aggregation = gql`
    query getScenarioNames{
        getScenarioNames
    }`;
const performer_adm_by_scenario = gql`
    query getPerformerADMsForScenario($scenarioID: ID){
        getPerformerADMsForScenario(scenarioID: $scenarioID)
    }`;
const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($scenarioID: ID, $admName: ID){
        getTestByADMandScenario(scenarioID: $scenarioID, admName: $admName)
    }`;
class Test extends React.Component {
    render() {
        return (
            <div>
                {/*{(this.state.scenario !== "" && this.state.adm !== "") &&
                    <Query query={test_by_adm_and_scenario} variables={{ "scenarioID": this.state.scenario, "admName": this.state.adm }}>
                        {
                            ({ loading, error, data }) => {
                                if (loading) return <div>Loading ...</div>
                                if (error) return <div>Error</div>
                                console.log(data.getTestByADMandScenario.history)
                                const admHistory = this.filterActions(data.getTestByADMandScenario.history)
                                console.log(admHistory)
                            }
                        return (*/}
                <div>
                    <ScenarioDetails />
                    <Container fluid>
                        <Row className="my-2">
                            <>
                                <Col>
                                    <Card className="flex-grow-1">
                                        <DecisionMakerDetails />
                                    </Card>
                                </Col>
                                <Col>
                                    <Card className="flex-grow-1">
                                        <DecisionMakerDetails />
                                    </Card>
                                </Col>
                            </>
                            {/*
                                            <Col>
                                                <CasualtySlider tables={tables} decisionMaker={csvFileContent} />
                                            </Col>*/}
                        </Row>

                    </Container>

                </div>{/*) }
                            }
                        }
                    </Query>
                } */}
            </div>
        );
    }
}

export default Test;
