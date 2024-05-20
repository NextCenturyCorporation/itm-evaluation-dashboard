import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Button, Modal } from "react-bootstrap";
import Dynamic from "./dynamic";
import { Accordion } from "react-bootstrap";
import surveyConfig2x from './surveyConfig2x.json';
import './template.css'


const CUSTOM_TYPE = "omnibusComparison";

export class OmnibusComparisonModel extends Question {
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
        },
    ],
    function () {
        return new OmnibusComparisonModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new OmnibusComparisonModel(name);
});


export class OmnibusComparison extends SurveyQuestionElementBase {

    constructor(props) {
        super(props);

        this.state = {
            dmDetails: [],
            showModal: false,
            userActions: [],
            omnibusDetails: []
        }

        this.dm = ' '
        this.config = surveyConfig2x
        this.updateActionLogs = this.updateActionLogs.bind(this)
    }

    get question() {
        return this.questionBase;
    }

    get decisionMakers() {
        return this.question.decisionMakers;
    }

    componentDidMount() {
        let decisionMakers = this.decisionMakers;
        // in case of duplicates somehow
        decisionMakers = [...new Set(decisionMakers)];
        let relevantPages = this.config.pages.filter(page => decisionMakers.includes(page.name));
        let dmDetails = relevantPages.map(page => page.elements[0]);
        //extra cleansing of any potential duplicates
        dmDetails = Array.from(new Set(dmDetails.map(detail => JSON.stringify(detail)))).map(str => JSON.parse(str));
        this.setState({ dmDetails });
    }

    handleShowModal = (content) => {
        this.dm = content
        this.getOmnibusDetails(content.decisionMakers)
        const newLog = { dmName: this.dm.dmName, actionName: "Opened DM Review Modal", timestamp: new Date().toISOString() };
        this.updateActionLogs(newLog)
        this.setState({ showModal: true });
    };

    getOmnibusDetails(decisionMakers) {
        // in case of duplicates somehow
        decisionMakers = [...new Set(decisionMakers)];
        let relevantPages = this.config.pages.filter(page => decisionMakers.includes(page.name));
        let omnibusDetails = relevantPages.map(page => page.elements[0]);
        //extra cleansing of any potential duplicates
        omnibusDetails = Array.from(new Set(omnibusDetails.map(detail => JSON.stringify(detail)))).map(str => JSON.parse(str));

        this.setState({ omnibusDetails });
    }

    handleCloseModal = () => {
        const newLog = { dmName: this.dm.dmName, actionName: "Closed DM Review Modal", timestamp: new Date().toISOString() };
        this.updateActionLogs(newLog)
        this.setState({ showModal: false });
    };

    updateActionLogs = (newAction) => {
        this.setState(prevState => ({
            userActions: [...prevState.userActions, newAction]
        }), () => {
            this.question.value = this.state.userActions
        })
    }

    getScenarioHeader(title) {
        const scenarios = ['Desert', 'Jungle', 'Submarine', 'Urban'];
        const foundScenario = scenarios.find(scenario => title.includes(scenario));
        return foundScenario;
    }

    renderElement() {
        console.log(this.state)
        return (
            <>
                {this.state.dmDetails &&
                    <>
                        {this.state.dmDetails.map((dm, index) => (
                            <Button key={dm.name} className="mx-3" variant="outline-light" style={{ backgroundColor: "#b15e2f" }} onClick={() => this.handleShowModal(dm)}>
                                {dm.dmName}
                            </Button>
                        ))}
                        <Modal show={this.state.showModal} onHide={this.handleCloseModal} size="xl">
                            <Modal.Header closeButton>
                                <Modal.Title>{this.dm.name}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>

                                <Accordion alwaysOpen defaultActiveKey={['0', '1', '2', '3']}>
                                    {this.state.omnibusDetails.map((dm, index) => (
                                        <Accordion.Item eventKey={index.toString()} key={dm.name}>
                                            <Accordion.Header>{this.getScenarioHeader(dm.title)} Scenario</Accordion.Header>
                                            <Accordion.Body>
                                                <Dynamic
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
                                </Accordion>

                            </Modal.Body>
                        </Modal>
                    </>
                }
            </>
        )
    }
}
