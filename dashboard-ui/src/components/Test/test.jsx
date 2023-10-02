import React from 'react';
import CasualtySlider from './casualtySlider';
import Card from 'react-bootstrap/Card';
import ScenarioDetails from './scenarioDetails';
import DecisionMakerDetails from './decisionMakerDetails';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Test extends React.Component {
    render() {
        return (
            <div>
                <ScenarioDetails />
                <Container fluid>
                    <Row className="my-2">
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
                        {/*
                        <Col>
                            <CasualtySlider tables={tables} decisionMaker={csvFileContent} />
                        </Col>*/}
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Test;
