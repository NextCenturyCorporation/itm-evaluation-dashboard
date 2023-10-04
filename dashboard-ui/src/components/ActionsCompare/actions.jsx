import React from 'react';
//import CasualtySlider from './casualtySlider';
import { Card, Form } from 'react-bootstrap';
import ScenarioDetails from './scenarioDetails';
import DecisionMakerDetails from './decisionMakerDetails';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

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
                        <option value="" disabled>Select Scenario</option>
                        <option value="Soartech">Soartech</option>
                        <option value="BBN">BBN</option>
                    </Form.Select>
                </Container>
            </div>
        );
    }
}

export default Actions;
