import React from 'react';
import { ListGroup } from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';
import { getCasualtyArray } from './htmlUtility';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

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
class DecisionList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      htmlFileContent: null,
      csvFileContent: null,
      isLoading: true,
      doc: null,
      casualtyArray: null,
      decisions: null,
      scenario: "soartech-september-demo-scenario-1"
    };
  }

  formattedActionType(actionType) {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  tagMappings = {
    "red": "Immediate",
    "gray": "Expectant",
    "green": "Minimal",
    "yellow": "Delayed"
  }

  admCommandMap = {
    "Tag Casualty": "Tag Applied",
    "Apply Treatment": "Injury Treated",
    "Check All Vitals": "Check Vitals"
  }

  humanActionMap = {
    "Pulse Taken": "Check Vitals",
    "Tag Applied": "Tag Applied",
    "Injury Treated": "Injury Treated"
  }

  nameMappings = {
    "MarineC": "Military Mike Jungle Combat_3_2 Root",
    "MarineA": "Military Mike Jungle Burned_0 Root",
    "Intelligence Officer": "Intelligence Officer Burned_Gary_1 Root"
  }

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

  renderDecisionCSV = (decision) => {
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
            <ListGroup.Item>Tag: {this.tagMappings[decision.actionData[1]]}</ListGroup.Item>
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
            <ListGroup.Item>Pateint: {this.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
            <ListGroup.Item>Tag: {this.formattedActionType(decision.parameters["Tag"])}</ListGroup.Item>
          </div>
        )
      case "Check All Vitals":
        return (
          <div>
            <ListGroup.Item>Patient: {this.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
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
            <ListGroup.Item>Patient: {this.nameMappings[decision.parameters["Casualty ID"]]}</ListGroup.Item>
            <ListGroup.Item>Treatment: {this.formattedActionType(decision.parameters["Parameters"]["treatment"])}</ListGroup.Item>
            <ListGroup.Item>Breathing: {this.formattedActionType(decision.parameters["Parameters"]["location"])}</ListGroup.Item>
          </div>
        )
    }
  }

  humanImageToDecisionMapping(decisions, casualties) {
    // map the proper image to a human decision
    if (!casualties || casualties.length === 0) {
      return decisions;
    }

    const casualtyMap = new Map();
    casualties.forEach(casualty => {
      casualtyMap.set(casualty.name, casualty);
    });


    const updatedDecisions = decisions.map(decision => {

      const matchingCasualtyName = decision.actionData.find(name => casualtyMap.has(name));

      if (matchingCasualtyName) {
        const matchingCasualty = casualtyMap.get(matchingCasualtyName);

        return {
          ...decision,
          imgURL: matchingCasualty.imgURL,
        };
      }


      return decision;
    });
    return updatedDecisions;
  }

  admImageToDecisionMapping(decisions) {
    // map the proper image to a adm decision 
    decisions.forEach(decision => {
      switch (decision.parameters["Casualty ID"]) {
        case "Intelligence Officer":
          decision.imgURL = "gary.png";
          break;
        case "MarineC":
          decision.imgURL = "mikeAmp.png";
          break;
        case "MarineA":
          decision.imgURL = "mikeBurn.png";
          break;
      }
    });
    return decisions;
  }

  componentDidUpdate(prevProps) {
    if (this.props.decisionMaker !== prevProps.decisionMaker) {
      this.setState({ decisions: [] })
      this.fetchData(this.props.decisionMaker);
    }
  }

  fetchData() {
    if (this.props.decisionMaker && this.props.isHuman) {


      const csvFilePath = process.env.PUBLIC_URL + `/jungleExampleData/${this.props.decisionMaker}.csv`;
      const htmlFilePath = process.env.PUBLIC_URL + `/jungleExampleData/${this.props.decisionMaker === "human1" ? "jungle1" : "jungle2"}.html`;

      // grab csv file
      fetch(csvFilePath)
        .then((response) => response.text())
        .then((csvData) => {
          const parsedData = this.parseCSV(csvData);
          this.setState({ csvFileContent: parsedData, isLoading: false });
        })
        .catch((error) => {
          console.error('Error fetching CSV file:', error);
        });

      // grab html file
      fetch(htmlFilePath)
        .then((response) => response.text())
        .then((data) => {
          this.setState({ htmlFileContent: data });
          this.parseDoc()
        })
        .catch((error) => {
          console.error('Error fetching file:', error);
        });
    }
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
          "TAG_DISCARDED",
          ""
        ];
        return !excludedActionTypes.includes(row.actionType);
      });
  }



  parseDoc() {
    const { htmlFileContent } = this.state;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlFileContent, 'text/html')

    this.setState({ doc: doc })
    this.parseTables(doc)
  }

  parseTables(doc) {
    const tableTags = doc.getElementsByTagName('tbody')
    let tableArray = Array.from(tableTags)
    tableArray = this.filterOutCasualties(getCasualtyArray(tableArray))

    this.setState({ casualtyArray: tableArray })
    this.parseDecisions()
  }

  parseDecisions() {
    let decisions = this.humanImageToDecisionMapping(this.state.csvFileContent, this.state.casualtyArray);
    decisions = this.filterDecisions(decisions)
    this.setState({ decisions: decisions })
  }

  filterActions(history) {
    const valuesToFilter = ["Start Session", "Start Scenario", "Get Scenario State", "Take Action", "Respond to TA1 Probe"];

    const filteredHistory = history.filter(entry => !valuesToFilter.includes(entry.command));

    return filteredHistory;
  }

  // temporary filtering out bbn scenario and marine that ADM does not interact with
  filterOutCasualties(casualties) {
    // Names to be filtered out
    const filteredNames = [
      "Asian Bob_4 Root",
      "Military Mike Jungle Combat_1_5 Root",
      "Military Mike Jungle Scout_1_3 Root"
    ];

    // Filter the casualties array based on the names
    const filteredCasualties = casualties.filter(casualty => !filteredNames.includes(casualty.name));

    return filteredCasualties;
  }

  filterDecisions(decisions) {
    // filter out decisions that involve bbn scenario 
    const filteredNames = [
      "Asian Bob_4 Root",
      "Military Mike Jungle Combat_1_5 Root",
      "Military Mike Jungle Scout_1_3 Root"
    ];

    const filteredDecisions = decisions.filter((decision) => {
      return !decision.actionData.some((name) =>
        filteredNames.includes(name)
      );
    });

    return filteredDecisions;
  }

  render = () => {
    const { isLoading } = this.state
    const visibleDecisionsCount = 10;
    const decisionHeight = 50;

    // total height of accordion maxes out at count * height of each 
    const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;

    return (
      <div>
        <h3>{this.props.title}</h3>
        {(this.state.decisions && this.props.isHuman && !isLoading) ? (
          <>
            <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
              {this.state.decisions.map((decision, index) => (
                <Accordion.Item key={index} eventKey={index}>
                  <Accordion.Header>{this.humanActionMap[this.formattedActionType(decision.actionType)]}</Accordion.Header>
                  <Accordion.Body>
                    <div className="row">
                      <div className="col">
                        <ListGroup variant="flush">
                          {this.renderDecisionCSV(decision)}
                        </ListGroup>
                      </div>
                      {decision.imgURL && (
                        <div className="col">
                          <img
                            src={decision.imgURL}
                            alt="casualty"
                            className="img-fluid"
                          />
                        </div>
                      )}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </>
        ) : (
          <p></p>
        )
        }
        {(this.state.decisions && !this.props.isHuman) ? (
          <Query query={test_by_adm_and_scenario} variables={{ "scenarioID": this.state.scenario, "admName": (this.props.decisionMaker === "Paralax" ? "TAD" : "ALIGN") }}>
            {
              ({ loading, error, data }) => {
                if (loading) return <div>Loading ...</div>
                if (error) return <div>Error</div>
                const decisions = this.admImageToDecisionMapping(this.filterActions(data.getTestByADMandScenario.history))
                return (
                  <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
                    {decisions.map((decision, index) => (
                      <Accordion.Item key={index} eventKey={index}>
                        <Accordion.Header>{this.admCommandMap[decision.command]}</Accordion.Header>
                        <Accordion.Body>
                          <div className="row">
                            <div className="col">
                              <ListGroup variant="flush">
                                {this.renderDecisionADM(decision)}
                              </ListGroup>
                            </div>
                            {decision.imgURL && (
                              <div className="col">
                                <img
                                  src={decision.imgURL}
                                  alt="casualty"
                                  className="img-fluid"
                                />
                              </div>
                            )}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                );
              }
            }
          </Query>
        ) : (
          <p></p>
        )}
      </div>
    );
  }
}

export const nameMappings = {
  "MarineC": "Military Mike Jungle Combat_3_2 Root",
  "MarineA": "Military Mike Jungle Burned_0 Root",
  "Intelligence Officer": "Intelligence Officer Burned_Gary_1 Root"
}

export default DecisionList;
