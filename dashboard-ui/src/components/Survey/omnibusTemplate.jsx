import React, { useEffect } from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Accordion } from "react-bootstrap";
import DynamicPhase1 from "./dynamicPhase1";
import '../../css/template.css';
import { useSelector } from "react-redux";

const CUSTOM_TYPE = "omnibus";

export class OmnibusModel extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    setValueCore(newValue) {
        super.setValueCore(newValue);
    }

    get decisionMakers() {
        return this.getPropertyValue("decisionMakers");
    }

    set decisionMakers(decisionMakers) {
        this.setPropertyValue("decisionMakers", decisionMakers);
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
        return new OmnibusModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new OmnibusModel(name);
});


export class Omnibus extends SurveyQuestionElementBase {

    constructor(props) {
        super(props);

        this.state = {
            dmDetails: [],
            userActions: [],
            surveyConfig: null,
            isSurveyLoaded: false
        }
        this.updateActionLogs = this.updateActionLogs.bind(this)
    }

    get question() {
        return this.questionBase;
    }

    get decisionMakers() {
        return this.question.decisionMakers;
    }

    updateActionLogs = (newAction) => {
        this.setState( prevState => ({
            userActions: [...prevState.userActions, newAction]
        }), () => {
            this.question.value = this.state.userActions
        })
    }

    postConfigSetup = () => {
        let config = this.state.surveyConfig;
        let decisionMakers = this.decisionMakers;
        // in case of duplicates somehow
        decisionMakers = [...new Set(decisionMakers)];
        let relevantPages = config.pages.filter(page => decisionMakers.includes(page.name));
        let dmDetails = relevantPages.map(page => page.elements[0]);
        //extra cleansing of any potential duplicates
        dmDetails = Array.from(new Set(dmDetails.map(detail => JSON.stringify(detail)))).map(str => JSON.parse(str));

        this.setState({ dmDetails });
        this.setState({
            isSurveyLoaded: true
        });
    }

    ConfigGetter = () => {
        const reducer = useSelector((state) => state?.configs?.surveyConfigs);
        const currentSurveyVersion = useSelector(state => state?.configs?.currentSurveyVersion);
        useEffect(() => {
            if (reducer) {
                this.setState({
                    surveyConfig: reducer['delegation_v' + currentSurveyVersion]
                }, () => {
                    this.postConfigSetup();
                })

            }
        }, [reducer, currentSurveyVersion])
        return null;
    }

    getScenarioHeader(title) {
        const scenarios = ['Desert', 'Jungle', 'Submarine', 'Urban'];
        const foundScenario = scenarios.find(scenario => title.includes(scenario));
        return foundScenario;
    }

    renderElement() {
        const { dmDetails } = this.state;
        return (
            <>
                <this.ConfigGetter />
                {this.state.isSurveyLoaded && <Accordion alwaysOpen defaultActiveKey={['0', '1', '2', '3']}>
                    {dmDetails.map((dm, index) => (
                        <Accordion.Item eventKey={index.toString()} key={dm.name} className="my-2">
                            <Accordion.Header>{this.getScenarioHeader(dm.title)} Scenario {index + 1}</Accordion.Header>
                            <Accordion.Body>
                                <DynamicPhase1
                                    actions={dm.actions}
                                    decision={dm.decision}
                                    explanation={dm.explanation}
                                    dmName={dm.name}
                                    patients={dm.patients}
                                    situation={dm.situation}
                                    supplies={dm.supplies}
                                    showModal={false}
                                    updateActionLogs={this.updateActionLogs}
                                />
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>}
            </>
        )
    }
}
