import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import * as utility from './utility'
import Decision from './decision';

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
      scenario: "",
      decisionMaker: null
    };
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
      const updatedActionData = decision.actionData.map(name => {
        if (name === "Asian Bob_4 Root") {
          return "Civilian Bob_4 Root";
        }
        return name;
      });

      if (matchingCasualtyName) {
        const matchingCasualty = casualtyMap.get(matchingCasualtyName);
        return {
          ...decision,
          imgURL: matchingCasualty.imgURL,
          actionData: updatedActionData
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
        case "Mike":
          decision.imgURL = "mikeEvac.png"
          break;
        case "Civilian":
          decision.imgURL = "civilianBob.png"
          break;
      }
    });
    return decisions;
  }

  componentDidUpdate(prevProps) {
    if (this.props.decisionMaker !== prevProps.decisionMaker) {
      this.setState({ decisions: [] })
      this.setState({ decisionMaker: this.props.decisionMaker })
      this.fetchData(this.props.decisionMaker);
    }
    if (this.props.selectedScenario != prevProps.selectedScenario) {
      this.setState({ scenario: this.props.selectedScenario })
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
          let parsedData = this.parseCSV(csvData);

          if (this.props.decisionMaker === "human1") {
            parsedData.push({ actionType: "MOVE_TO_EVAC", actionData: ["Asian Bob_4 Root"] })
          } else {
            parsedData.push({ actionType: "MOVE_TO_EVAC", actionData: ["Military Mike Jungle Scout_1_3 Root"] })
          }

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
    if (this.props.selectedScenario === "st-september-2023-mvp2") {
      // have to filter out different actions from simulator based on scenario
      tableArray = this.filterOutCasualtiesForSoarTech(utility.getCasualtyArray(tableArray))
    } else if (this.props.selectedScenario === "adept-september-demo-scenario-1") {
      tableArray = this.filterOutCasualtiesForBBN(utility.getCasualtyArray(tableArray))
    }

    this.setState({ casualtyArray: tableArray })
    this.parseDecisions()
  }

  parseDecisions() {
    let decisions = this.humanImageToDecisionMapping(this.state.csvFileContent, this.state.casualtyArray);
    if (this.props.selectedScenario === "st-september-2023-mvp2") {
      decisions = this.filterDecisionsSoarTech(decisions)
    } else if (this.props.selectedScenario === "adept-september-demo-scenario-1") {
      decisions = this.filterDecisionsBBN(decisions)
    }
    this.setState({ decisions: decisions })
  }

  // temporary filtering out bbn scenario and marine that ADM does not interact with
  filterOutCasualtiesForSoarTech(casualties) {
    // Names to be filtered out
    const filteredNames = [
      "Civilian Bob_4 Root",
      "Military Mike Jungle Combat_1_5 Root",
      "Military Mike Jungle Scout_1_3 Root"
    ];

    // Filter the casualties array based on the names
    const filteredCasualties = casualties.filter(casualty => !filteredNames.includes(casualty.name));

    return filteredCasualties;
  }

  filterOutCasualtiesForBBN(casualties) {
    // Names to be kept
    const filteredNames = [
      "Asian Bob_4 Root",
      "Military Mike Jungle Scout_1_3 Root"
    ];

    // Filter the casualties array based on the names
    const filteredCasualties = casualties.filter(casualty => filteredNames.includes(casualty.name));

    return filteredCasualties;
  }


  filterDecisionsSoarTech(decisions) {
    // filter out decisions that involve bbn scenario 
    const filteredNames = [
      "Civilian Bob_4 Root",
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

  filterDecisionsBBN(decisions) {
    // filter out decisions that involve bbn scenario 
    const filteredNames = [
      "Civilian Bob_4 Root",
      "Military Mike Jungle Scout_1_3 Root"
    ];

    const filteredDecisions = decisions.filter((decision) => {
      return decision.actionData.some((name) =>
        filteredNames.includes(name)
      );
    });

    return filteredDecisions;
  }

  filterDecisionsADM(history) {
    const valuesToFilter =
      ["Start Session", "Start Scenario", "Get Scenario State", "Take Action",
        "Respond to TA1 Probe", "Request SITREP", "TA1 Alignment Target Session ID", "TA1 Alignment Target Data",
        "TA1 Probe Response Alignment", "TA1 Session Alignment"];

    const filteredHistory = history.filter(entry => !valuesToFilter.includes(entry.command));

    return filteredHistory;
  }

  render = () => {
    const { isLoading } = this.state;
    const visibleDecisionsCount = 10;
    const decisionHeight = 50;

    // total height of accordion maxes out at count * height of each
    const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;

    return (
      <div>
        <h3>{this.props.title}</h3>
        {this.state.decisions && this.props.decisionMaker && this.props.isHuman && !isLoading && (
          <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
            {this.state.decisions.map((decision, index) => (
              <Accordion.Item key={index} eventKey={index}>
                <Accordion.Header>{utility.humanActionMap[utility.formattedActionType(decision.actionType)]}</Accordion.Header>
                <Accordion.Body>
                  <Decision isHuman={true} decision={decision}></Decision>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        {this.props.selectedScenario && this.props.decisionMaker && this.state.decisionMaker && !this.props.isHuman && (
          <Query query={test_by_adm_and_scenario} variables={{ "scenarioID": this.props.selectedScenario, "admName": this.props.decisionMaker }}>
            {({ loading, error, data }) => {
              if (loading) return <div>Loading ...</div>;
              if (error) return <div>Error</div>;
              let decisions = []
              decisions = this.admImageToDecisionMapping(this.filterDecisionsADM(data.getTestByADMandScenario.history))
              return (
                <div>
                  {decisions && (
                    <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
                      {decisions.map((decision, index) => (
                        <Accordion.Item key={index} eventKey={index}>
                          <Accordion.Header>{utility.admCommandMap[decision.command]}</Accordion.Header>
                          <Accordion.Body>
                            <Decision isHuman={false} decision={decision}></Decision>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  )}
                </div>
              );
            }}
          </Query>
        )}
      </div>
    );
  };

}

export default DecisionList;
