import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import '../../css/template.css';
import DynamicPhase2 from "./dynamicPhase2";
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

export class ComparisonPhase2 extends SurveyQuestionElementBase {
    constructor(props) {
        super(props);
        this.state = {
            userActions: [],
        };
        this.updateActionLogs = this.updateActionLogs.bind(this);
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
                            dmName: element.dmName,
                            options: element.options
                        };
                    }
                }
            }
        }
        return null;
    }

    renderElement() {
        const decisionMakers = this.decisionMakers || [];
        
        // get shared data from the first decision-maker
        const firstDmData = decisionMakers.length > 0 ? this.getDecisionMakerData(decisionMakers[0]) : null;
        const sharedScenarioDescription = firstDmData?.scenarioDescription;
        const sharedSupplies = firstDmData?.supplies;
        
        return (
            <div className="comparison-container">
                {firstDmData && (
                    <div className="shared-scenario-section" style={{ marginBottom: '20px' }}>
                        <div className="instruction-section">
                            <h4 className="instruction-title">
                                Consider a decision-maker who chose to treat the highlighted patients first, when given the following choices.
                            </h4>
                            <p className="instruction-subtitle">
                                {sharedScenarioDescription}
                            </p>
                        </div>


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
                                    <p>Decision-maker data not found for: {dmName}</p>
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
                                    options={firstDmData.options}
                                    scenarioDescription={null} 
                                    supplies={null}
                                    showHeaderOnly={false} 
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }
}