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

const GET_ALL_HUMAN_RUNS = gql`
    query GetAllHumanRuns {
      getAllHumanRuns
      getAllImages
    }`;

class DecisionList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      scenario: "",
      decisionMaker: null
    };
  }

  humanImageToDecisionMapping(decisions, images) {
    // match the images to the corresponding decisions 
    decisions.forEach((decision) => {
      const matchingImage = images.find((image) => image.name === decision.casualty);

      if (matchingImage) {
        decision.imgBytes = matchingImage.bytes;
      } else {
        console.log("Error finding matching image for decision " + decision.actionType)
      }
    });

    return decisions
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
        default:
          console.error("Error: No image in place for casualty id " + decision.parameters["Casualty ID"]);
      }
    });
    return decisions;
  }

  componentDidUpdate(prevProps) {
    if (this.props.decisionMaker !== prevProps.decisionMaker) {
      this.setState({ decisionMaker: this.props.decisionMaker })
    }
    if (this.props.selectedScenario !== prevProps.selectedScenario) {
      this.setState({ scenario: this.props.selectedScenario })
    }
  }

  filterDecisionsSoarTech(decisions) {
    // filter out decisions that involve bbn scenario 
    const relevantCasualties = [
      "Marine with Leg Amputation",
      "Intelligence Officer",
      "Marine Burned with Neck Puncture"
    ];

    const filteredDecisions = decisions.filter((decision) =>
      relevantCasualties.includes(decision.casualty)
    );

    return filteredDecisions;
  }

  filterDecisionsBBN(decisions) {
    // limit human data to the bbn scenario 
    const relevantCasualties = [
      "Marine with Internal Bleeding",
      "Local Civilian with Internal Bleeding"
    ]

    const filteredDecisions = decisions.filter((decision) =>
      relevantCasualties.includes(decision.casualty)
    );
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
    const visibleDecisionsCount = 12;
    const decisionHeight = 50;

    // total height of accordion maxes out at count * height of each
    const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;

    return (
      <div>
        <h3>{this.props.title}</h3>
        {this.state.decisionMaker && this.props.isHuman && (
          <Query query={GET_ALL_HUMAN_RUNS}>
            {({ loading, error, data }) => {
              if (loading) return <div>loading</div>;
              if (error) return <div>Error: {error.message}</div>;

              const humanRun = data.getAllHumanRuns[0];
              const images = data.getAllImages;
              const decisions = this.humanImageToDecisionMapping(humanRun.actionList, images)

              return (
                <Accordion style={{ height: accordionHeight, overflowY: 'scroll' }}>
                  {decisions.map((decision, index) => (
                    <Accordion.Item key={index} eventKey={index}>
                      <Accordion.Header>{decision.actionType === "Pulse" ? "Check Vitals" : decision.actionType}</Accordion.Header>
                      <Accordion.Body>
                        <Decision isHuman={true} decision={decision}></Decision>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )
            }}
          </Query>
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
