import React, { createRef } from 'react';
import CasualtySlider from './casualtySlider';
import Card from 'react-bootstrap/Card';
import ScenarioDetails from './scenarioDetails';
import DecisionMakerDetails from './decisionMakerDetails';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Test extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            fileContent: null,
        };
        this.columnRef = createRef();
    }

    decisionMakers = [
        {
            id: 1,
            patientsTreated: 3,
            timeTaken: 400,
            decisions: [
                {
                    decision: "Take pulse of casualty A",
                    justification: "Was not clear if casualty A was unconscious or deceased",
                    timeTaken: 10,
                    actionType: "CHECK_PULSE"
                },
                {
                    decision: "Take pulse of casualty A",
                    justification: "Was not clear if casualty A was unconscious or deceased",
                    timeTaken: 10,
                    actionType: "CHECK_PULSE"
                },
                {
                    decision: "Take pulse of casualty A",
                    justification: "Was not clear if casualty A was unconscious or deceased",
                    timeTaken: 10,
                    actionType: "CHECK_PULSE"
                }
            ]
        },
        {
            id: 2,
            patientsTreated: 2,
            timeTaken: 100,
            decisions: [
                {
                    decision: "Take pulse of casualty A",
                    justification: "Was not clear if casualty A was unconscious or deceased",
                    timeTaken: 10,
                    actionType: "CHECK_PULSE"
                },
                {
                    decision: "Take pulse of casualty A",
                    justification: "Was not clear if casualty A was unconscious or deceased",
                    timeTaken: 10,
                    actionType: "CHECK_PULSE"
                },
                {
                    decision: "Take pulse of casualty A",
                    justification: "Was not clear if casualty A was unconscious or deceased",
                    timeTaken: 10,
                    actionType: "CHECK_PULSE"
                }
            ]
        }
    ];

    componentDidMount() {
        // Fetch the content of example.html from the public folder
        fetch(process.env.PUBLIC_URL + '/example.html')
            .then((response) => response.text())
            .then((data) => {
                // Set the file content in the component's state
                this.setState({ fileContent: data });
            })
            .catch((error) => {
                console.error('Error fetching file:', error);
            });
            const columnHeight = this.columnRef.current.clientHeight;
            this.setState({ columnHeight });
    }

    parseDoc() {
        const { fileContent } = this.state;
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileContent, 'text/html')

        return doc
    }

    parseDash(doc) {
        let dashInfo = {}
        const dash = doc.querySelector('.dash')

        if (dash) {
            const divElements = dash.querySelectorAll('div') 

            divElements.forEach(divElement => {
                const label = divElement.querySelector('label') 
                const span = divElement.querySelector('span') 

                
                const labelText = label ? label.textContent : 'Label not found'
                const spanText = span ? span.textContent : 'Span not found'

                dashInfo[labelText] = spanText
            })
        } else {
            console.error('.dash not found in the document');
        }
        return dashInfo
    }

    parseTables(doc) {
        const tableTags = doc.getElementsByTagName('tbody')
        const tableArray = Array.from(tableTags)

        return tableArray
    }

    render() {
        const doc = this.parseDoc()
        const dashInfo = this.parseDash(doc)
        const tables = this.parseTables(doc)
        console.log(this.state.columnHeight)
        return (
            <div>
                <ScenarioDetails />
                <Container fluid>
                    <Row className="my-2">
                        <Col ref={this.columnRef}>
                            <Card className="flex-grow-1">
                                <DecisionMakerDetails decisionMaker={this.decisionMakers[0]} dashInfo={dashInfo} />
                            </Card>
                            <Card className="flex-grow-1">
                                <DecisionMakerDetails decisionMaker={this.decisionMakers[1]} dashInfo={dashInfo} />
                            </Card>
                        </Col>
                        <Col>
                            <CasualtySlider tables={tables} height={this.state.columnHeight}/>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Test;
