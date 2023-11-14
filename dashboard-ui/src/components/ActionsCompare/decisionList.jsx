import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import * as utility from './utility'
import Decision from './decision';
import { Casualty } from './casualtySlider';

const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($scenarioID: ID, $admName: ID){
        getTestByADMandScenario(scenarioID: $scenarioID, admName: $admName)
    }`;
class DecisionList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      jsonFileContent: null,
      isLoading: true,
      decisions: null,
      scenario: "",
      decisionMaker: null
    };
  }

  humanImageToDecisionMapping(decisions) {
    let result = []
    for (let decision of decisions) {
      const pathToImg = process.env.PUBLIC_URL + `/newExample/${decision.casualty}.json`;
      fetch(pathToImg)
        .then((response) => response.text())
        .then((imgData) => {
          const image = JSON.parse(imgData)
          decision.imgURL = image.bytes
          result.push(decision)
        })
        .catch((error) => console.error('Fetch error:', error));
    }
    return result
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
      this.setState({ decisions: null, decisionMaker: this.props.decisionMaker })
      this.fetchData(this.props.decisionMaker);
    }
    if (this.props.selectedScenario != prevProps.selectedScenario) {
      this.setState({ scenario: this.props.selectedScenario })
    }
  }

  fetchData() {
    if (this.props.decisionMaker && this.props.isHuman) {

      const jsonFilePath = process.env.PUBLIC_URL + `/newExample/newJsonExample.json`;

      // grab json file
      fetch(jsonFilePath)
        .then((response) => response.text())
        .then((jsonData) => {
          const data = JSON.parse(jsonData)
          this.setState({ jsonFileContent: data, decisions: data.actionList, isLoading: false });
        })
        .catch((error) => {
          console.error('Error fetching json file:', error);
        });
    }
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
                <Accordion.Header>{decision.actionType}</Accordion.Header>
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
