import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import testConfig from "./testConfig.json"
import '../../css/template.css';
import DynamicPhase2 from "./dynamicPhase2";
import { isDefined } from "../AggregateResults/DataFunctions";
const CUSTOM_TYPE = "comparison-phase-2";


export class ComparisonPhase2Model extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    setValueCore(newValue) {
        super.setValueCore(newValue);
    }

    get decisionMakers() {
        return this.getPropertyValue("decisionMakers")
    }

    set decisionMakers(decisionMakers) {
        this.setPropertyValue("decisionMakers", decisionMakers)
    }
}

Serializer.addClass(
    CUSTOM_TYPE,
    [
        {
            name: "decisionMakers",
            default: []
        }
    ],
    function () {
        return new ComparisonPhase2Model("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new ComparisonPhase2Model(name);
});

// A class that renders questions of the new type in the UI
export class ComparisonPhase2 extends SurveyQuestionElementBase {
    constructor(props) {
        super(props);
        this.state = {
            userActions: [],
        };
        this.updateActionLogs = this.updateActionLogs.bind(this);
        // review pages need parent.data, the actual survey needs parent.jsonObj
        this.scenarioIndex = this.question.parent.jsonObj.scenarioIndex;
        if (!isDefined(this.scenarioIndex)) {
            this.scenarioIndex = this.question.parent.data.jsonObj.scenarioIndex;
        }
    }

    updateActionLogs = (newAction) => {
        this.setState( prevState => ({
            userActions: [...prevState.userActions, newAction]
        }), () => {
            this.question.value = this.state.userActions
        })
    }

    get question() {
        return this.questionBase;
    }

    get decisionMakers() {
        return this.question.decisionMakers;
    }

    getDecisionMakerData(dmName) {
        const config = this.question.survey.jsonObj.pages;

        for (const page of config) {
            if (page.elements) {
                for (const element of page.elements) {
                    if (element.type === "dynamic-template-phase-2" && element.dmName === dmName) {
                        return {
                            rows: element.rows,
                            scenarioDescription: element.scenarioDescription,
                            supplies: element.supplies,
                            dmName: element.dmName
                        };
                    }
                }
            }
        }
        return null;
    }

    renderElement() {
        const decisionMakers = this.decisionMakers || [];
        
        // Get shared data from the first decision maker
        const firstDmData = decisionMakers.length > 0 ? this.getDecisionMakerData(decisionMakers[0]) : null;
        const sharedScenarioDescription = firstDmData?.scenarioDescription;
        const sharedSupplies = firstDmData?.supplies;
        
        return (
            <div className="comparison-container">
                {/* Shared header section */}
                {firstDmData && (
                    <div className="shared-scenario-section" style={{ marginBottom: '20px' }}>
                        <div className="instruction-section">
                            <h4 className="instruction-title">
                                Consider a decision maker who chose to treat the highlighted patients first, when given the following choices.
                            </h4>
                            <p className="instruction-subtitle">
                                {sharedScenarioDescription}
                            </p>
                        </div>

                        {/* Render supplies */}
                        {sharedSupplies && sharedSupplies.length > 0 && (
                            <div className="supplies-section">
                                <h5 className="supplies-title">Supplies</h5>
                                <div className="supplies-grid">
                                    {sharedSupplies.map((supply, index) => (
                                        <div key={index} className="supply-item">
                                            <span className="supply-name">{supply.type}</span>
                                            <span className="supply-quantity">Qty: {supply.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Side by side decision makers */}
                <div className="decision-makers-comparison" style={{
                    display: 'flex',
                    gap: '20px',
                    justifyContent: 'space-between'
                }}>
                    {decisionMakers.map((dmName, index) => {
                        const dmData = this.getDecisionMakerData(dmName);
                        
                        if (!dmData) {
                            return (
                                <div key={index} className="decision-maker-section" style={{
                                    flex: '1',
                                    border: '1px solid #ddd',
                                    padding: '15px',
                                    borderRadius: '5px'
                                }}>
                                    <p>Decision maker data not found for: {dmName}</p>
                                </div>
                            );
                        }

                        return (
                            <div key={index} className="decision-maker-section" style={{
                                flex: '1',
                                border: '1px solid #ddd',
                                padding: '15px',
                                borderRadius: '5px'
                            }}>
                                <h3 style={{
                                    margin: '0 0 15px 0',
                                    textAlign: 'center',
                                    color: '#333'
                                }}>
                                    {dmData.dmName}
                                </h3>
                                <DynamicPhase2 
                                    rows={dmData.rows} 
                                    scenarioDescription={null} // Don't repeat the scenario
                                    supplies={null} // Don't repeat the supplies
                                    showHeaderOnly={false} // Pass a prop to hide headers
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }
}