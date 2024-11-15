import React, { useEffect } from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Button, Modal, Col, Row, Card, ListGroup } from "react-bootstrap";
import { renderSituation } from "./util";
import Dynamic from "./dynamic";
import './template.css'
import { useSelector } from "react-redux";
import Patient from '../TextBasedScenarios/patient';
import Supplies from '../TextBasedScenarios/supplies';

const CUSTOM_TYPE = "adeptComparison";

export class AdeptComparisonModel extends Question {
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
        return new AdeptComparisonModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new AdeptComparisonModel(name);
});

export class AdeptComparison extends SurveyQuestionElementBase {
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
        decisionMakers = [...new Set(decisionMakers)];
        let relevantPages = config.pages.filter(page => decisionMakers.includes(page.name));
        let dmDetails = relevantPages.map(page => page.elements[0]);
        dmDetails = Array.from(new Set(dmDetails.map(detail => JSON.stringify(detail)))).map(str => JSON.parse(str));
        console.log(dmDetails)
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
        }, [reducer])
        return null;
    }

    handleShowModal = () => {
        const newLog = { actionName: "Opened DM Review Modal", timestamp: new Date().toISOString() };
        this.updateActionLogs(newLog)
        this.setState({ showModal: true });
    };

    handleCloseModal = () => {
        const newLog = { actionName: "Closed DM Review Modal", timestamp: new Date().toISOString() };
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

    patientCards = () => {
        const currentScene = this.state.dmDetails[0].scenes[0];
        return this.state.dmDetails[0].patients
            .filter(patient => currentScene.char_ids.includes(patient.name))
            .map(patient => (
                <Col md={6} key={`card-${patient.name}`}>
                    <div className='patient-card'>
                        <Patient
                            patient={patient}
                            blockedVitals={[]}
                            imageClickDisabled={true}
                        />
                    </div>
                </Col>
            ));
    }

    processActionText = (action, index, sceneActions) => {
        let processedText = action.replace('Question:', 'The medic was asked:');
        
        // Check if the previous action contained 'Question:'
        if (index > 0 && sceneActions[index - 1].includes('Question:') && !sceneActions[index - 1].includes('Why')) {
            processedText = 'The medic chose to: ' + processedText;
        }
        
        return processedText;
    };

    renderActionLists = () => {
        return (
            <Row className="mt-4">
                {this.state.dmDetails.slice(0,2).map((dm, index) => (
                    <Col key={`actions-${index}`} md={12 / this.state.dmDetails.slice(0,2).length}>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">{dm.dmName}'s Actions</h5>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {dm.actions.map((action, actionIndex) => (
                                    <ListGroup.Item key={`action-${actionIndex}`} className="action-item" style={{
                                        "fontWeight": action.includes('Update:') || action.includes('Note:') || action.includes('Question:') ? "700" : "500",
                                        "backgroundColor": action.includes('Update:') || action.includes('Note:') || action.includes('Question:') ? "#eee" : "#fff",
                                        "fontSize": action.includes('Question:') ? '20px' : '16px'
                                    }}>{this.processActionText(action, actionIndex, dm.actions)}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    }

    renderElement() {
        return (
            <>
                <this.ConfigGetter />
                {this.state.isSurveyLoaded && <>
                    <Button className="mx-3" variant="outline-light" style={{ backgroundColor: "#b15e2f" }} onClick={() => this.handleShowModal()}>
                        Review Medic Actions
                    </Button>
                    <Modal show={this.state.showModal} onHide={this.handleCloseModal} size="xl">
                        <Modal.Header closeButton>
                            <Modal.Title>Test</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Card className="mb-3">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        Situation
                                    </div>
                                </Card.Header>
                                <Card.Body className="overflow-auto" style={{ maxHeight: '200px' }}>
                                    {renderSituation(this.state.dmDetails[0].situation)}
                                </Card.Body>
                            </Card>
                            <Card>
                                <Row className="mb-4">
                                    <Col md={3} className="d-flex flex-column">
                                        <Supplies supplies={this.state.dmDetails[0].supplies} />
                                    </Col>
                                    <Col md={9}>
                                        <Row>
                                            {this.patientCards()}
                                        </Row>
                                    </Col>
                                </Row>
                            </Card>
                            {this.renderActionLists()}
                        </Modal.Body>
                    </Modal>
                </>
                }
            </>
        )
    }
}