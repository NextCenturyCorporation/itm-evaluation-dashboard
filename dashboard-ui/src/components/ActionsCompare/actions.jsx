import React from 'react';
//import CasualtySlider from './casualtySlider';
import { Card, Form } from 'react-bootstrap';
import ScenarioDetails from './scenarioDetails';
import DecisionMakerDetails from './decisionMakerDetails';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const getScenarioNamesQueryName = "getScenarioNames";
const scenario_names_aggregation = gql`
    query getScenarioNames{
        getScenarioNames
    }`;

class Actions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedScenario: '', // Initially set to 'disabled'
        };
    }

    handleScenarioChange = (e) => {
        const selectedScenario = e.target.value;
        this.setState({ selectedScenario })
    }

    render() {
        return (
            <div>
                <ScenarioDetails selectedScenario={this.state.selectedScenario} />
                <Container fluid>
                    <Row className="my-2">
                        <Col>
                            <Card className="flex-grow-1">
                                <DecisionMakerDetails selectedScenario={this.state.selectedScenario} />
                            </Card>
                        </Col>
                        <Col>
                            <Card className="flex-grow-1">
                                <DecisionMakerDetails selectedScenario={this.state.selectedScenario} />
                            </Card>
                        </Col>
                        {/*
                        <Col>
                            <CasualtySlider tables={tables} decisionMaker={csvFileContent} />
                        </Col>*/}
                    </Row>
                    <Form.Select className="px-2" value={this.state.selectedScenario} onChange={this.handleScenarioChange}>
                        <Query query={scenario_names_aggregation}>
                            {
                                ({ loading, error, data }) => {
                                    if (loading) return <div>Loading ...</div> 
                                    if (error) return <div>Error</div>

                                    const scenarioNameOptions = data[getScenarioNamesQueryName];
                                    let scenariosArray = [];
                                    for(const element of scenarioNameOptions) {
                                        scenariosArray.push({
                                            "value": element._id.id, 
                                            "name": element._id.name
                                        });
                                    }
                                    scenariosArray.sort((a, b) => (a.value > b.value) ? 1 : -1);

                                    return (
                                        <>
                                            <option value="" disabled>Select Scenario</option>
                                            {scenariosArray.map((item,key) =>
                                                <option value={item.value} key={"scenario_select_" + key}>{item.value + ": " + item.name}</option>
                                            )}
                                        </>

                                    )
                                }
                            }
                        </Query>
                    </Form.Select>
                </Container>
            </div>
        );
    }
}

export default Actions;
