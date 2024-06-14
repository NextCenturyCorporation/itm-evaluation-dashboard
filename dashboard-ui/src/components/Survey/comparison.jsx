import React, { useEffect } from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Button, Modal } from "react-bootstrap";
import Dynamic from "./dynamic";
import './template.css'
import { useSelector } from "react-redux";

const CUSTOM_TYPE = "comparison";

export class ComparisonModel extends Question {
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
        return new ComparisonModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new ComparisonModel(name);
});


export class Comparison extends SurveyQuestionElementBase {

    constructor(props) {
        super(props);

        this.state = {
            dmDetails: [],
            showModal: false,
            userActions: [],
            surveyConfig: null,
            isSurveyLoaded: false
        }

        this.dm = ' '
        this.updateActionLogs = this.updateActionLogs.bind(this)
    }

    get question() {
        return this.questionBase;
    }

    get decisionMakers() {
        return this.question.decisionMakers;
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
        // TODO: get id based on .env or some other easily-accessible variable
        const reducer = useSelector((state) => state?.configs?.surveyConfigs);
        useEffect(() => {
            if (reducer) {
                this.setState({
                    surveyConfig: reducer['delegation_v2.0']
                }, () => {
                    this.postConfigSetup();
                })

            }
        }, [reducer])
        return null;
    }

    handleShowModal = (content) => {
        this.dm = content
        const newLog = { dmName: this.dm.dmName, actionName: "Opened DM Review Modal", timestamp: new Date().toISOString() };
        this.updateActionLogs(newLog)
        this.setState({ showModal: true });
    };

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

    renderElement() {
        return (
            <>
                <this.ConfigGetter />
                {this.state.isSurveyLoaded && <>
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
                            <Dynamic
                                patients={this.dm.patients}
                                situation={this.dm.situation}
                                supplies={this.dm.supplies}
                                decision={this.dm.decision}
                                dmName={this.dm.dmName}
                                actions={this.dm.actions}
                                explanation={this.dm.explanation}
                                showModal={false}
                                updateActionLogs={this.updateActionLogs}
                            />
                        </Modal.Body>
                    </Modal>
                </>
                }
            </>
        )
    }
}
