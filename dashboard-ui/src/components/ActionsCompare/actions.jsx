import React from 'react';
import { Card } from 'react-bootstrap';
import ScenarioDetails from './scenarioDetails';
import DecisionMakerDetails from './decisionMakerDetails';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

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

    handleScenarioChange(target) {
        this.setState({ selectedScenario: target })
    }

    render() {
        return (
            <div className="layout">
                <div className="layout-board">
                    <div className="nav-section-compare">
                        <div className="nav-header">
                            <span className="nav-header-text">Scenario</span>
                        </div>
                        <div className="nav-menu">
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
                                            <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                                {scenariosArray.map((item,key) =>
                                                    <ListItem className="nav-list-item" id={"scenario_" + key} key={"scenario_" + key}
                                                        button
                                                        selected={this.state.selectedScenario === item.value}
                                                        onClick={() => this.handleScenarioChange(item.value)}>
                                                        <ListItemText primary={item.value + ": " + item.name}/>
                                                    </ListItem>
                                                )}
                                            </List>
                                        )
                                    }
                                }
                            </Query>
                        </div>

                    </div>
                    <div className="test-overview-area">
                        {(this.state.selectedScenario !== "") &&
                        <>
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
                                </Row>
                            </Container>
                        </>
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default Actions;
