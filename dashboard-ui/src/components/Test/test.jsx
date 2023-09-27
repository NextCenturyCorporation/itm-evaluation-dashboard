import React, { createRef } from 'react';
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

    constructor(props) {
        super(props);
        this.state = {
            htmlFileContent: null,
            csvFileContent: null,
            isLoading: true,
            adm: "TAD",
            scenario: "soartech-september-demo-scenario-1"
        };
    }

    componentDidMount() {
        // Define the path to the CSV file
        const csvFilePath = process.env.PUBLIC_URL + '/jungleExampleData/human.csv';

        // grab csv file
        fetch(csvFilePath)
            .then((response) => response.text())
            .then((csvData) => {
                // Parse the CSV data into an array or object as needed
                const parsedData = this.parseCSV(csvData);
                // Set the parsed data in the component's state or use it as needed
                this.setState({ csvFileContent: parsedData, isLoading: false });
            })
            .catch((error) => {
                console.error('Error fetching CSV file:', error);
            });

        // grab html file
        fetch(process.env.PUBLIC_URL + '/jungleExampleData/jungle.html')
            .then((response) => response.text())
            .then((data) => {
                // Set the file content in the component's state
                this.setState({ htmlFileContent: data });
            })
            .catch((error) => {
                console.error('Error fetching file:', error);
            });
    }


    parseCSV(csvData) {
        const dataLines = csvData.split('\n');
        const headers = ["actionType", "ms", "time", "fileID", "v"];

        return dataLines
            .map((line, lineIndex) => {
                const values = line.split(',');
                const rowData = {};

                headers.forEach((header, index) => {
                    rowData[header] = values[index];
                });

                // Condense the remaining columns into an "actionData" array
                rowData.actionData = values.slice(headers.length);

                // Adding a unique identifier as a key
                rowData.key = `row_${lineIndex}`;

                return rowData;
            })
            .filter(row => {
                const excludedActionTypes = [
                    "PLAYER_LOCATION",
                    "VOICE_CAPTURE",
                    "VOICE_COMMAND",
                    "PATIENT_DEMOTED",
                    "SESSION_START",
                    "PATIENT_RECORD",
                    "INJURY_RECORD",
                    "TELEPORT",
                    "PATIENT_ENGAGED",
                    "PLAYER_GAZE",
                    "BAG_ACCESS",
                    "TOOL_HOVER",
                    "TOOL_SELECTED",
                    "TOOL_DISCARDED",
                    "TAG_SELECTED",
                    "BAG_CLOSED",
                    "SESSION_END",
                    "S_A_L_T_WAVED",
                    "S_A_L_T_WALK",
                    "S_A_L_T_WALK_IF_CAN",
                    "S_A_L_T_WAVE_IF_CAN",
                    "TOOL_APPLIED",
                    ""
                ];
                return !excludedActionTypes.includes(row.actionType);
            });
    }



    parseDoc() {
        const { htmlFileContent } = this.state;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlFileContent, 'text/html')

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
        const casualties = getCasualtyArray(tables)
        const { isLoading, csvFileContent } = this.state

        return (
            <div>
                {(this.state.scenario !== "" && this.state.adm !== "") &&
                    <Query query={test_by_adm_and_scenario} variables={{ "scenarioID": this.state.scenario, "admName": this.state.adm }}>
                        {
                            ({ loading, error, data }) => {
                                console.log(data)
                                return(
                                <div>
                                    <ScenarioDetails tables={tables} />
                                    <Container fluid>
                                        <Row className="my-2">
                                            {isLoading ? (
                                                // Render a loading indicator or message
                                                <div>Loading CSV data...</div>
                                            ) : (
                                                <>
                                                <Col>
                                                    <Card className="flex-grow-1">
                                                        <DecisionMakerDetails decisionMaker={csvFileContent} casualties={casualties} dashInfo={dashInfo} id="1" />
                                                    </Card>
                                                </Col>
                                                <Col>
                                                    <Card className="flex-grow-1">
                                                        <DecisionMakerDetails decisionMaker={csvFileContent} dashInfo={dashInfo} id="2" />
                                                    </Card>
                                                </Col>
                                                </>
                                            )}
                                            {/*
                                            <Col>
                                                <CasualtySlider tables={tables} decisionMaker={csvFileContent} />
                                            </Col>*/}
                                        </Row>

                                    </Container>
                                </div>)
                            }
                        }
                    </Query>
                }
            </div>
        );
    }
}

export default Test;
