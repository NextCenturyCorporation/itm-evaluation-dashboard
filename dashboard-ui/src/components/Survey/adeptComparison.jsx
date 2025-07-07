import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Button, Modal, Col, Row, Card, Tab, Tabs } from "react-bootstrap";
import { renderSituation } from "./surveyUtils";
import '../../css/template.css';
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
    [{ name: "decisionMakers", default: [] }],
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
            isSurveyLoaded: false,
            activeTab: 'actions'
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
        this.setState({
            dmDetails,
            isSurveyLoaded: true
        });
    }

    ConfigGetter = () => {
        const reducer = useSelector((state) => state?.configs?.surveyConfigs);
        const currentSurveyVersion = useSelector(state => state?.configs?.currentSurveyVersion);
        React.useEffect(() => {
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

    getActionText = (action) => {
        if (typeof action === 'string') return action;
        return action?.text || '';
    };

    processActionText = (action, index, sceneActions) => {
        const text = this.getActionText(action)
        let processedText = text.replace('Question:', 'The medic was asked:').replace('<HIGHLIGHT>', '');
        
        // Check if the previous action contained 'Question:'
        if (index > 0 && this.getActionText(sceneActions[index - 1])?.includes('Question:')) {
            processedText = 'The medic chose to: ' + processedText;
        }
        
        return processedText;
    };

    getSceneStyle = (action) => {
        const text = this.getActionText(action);
        const isMedicAction = !(text.includes('Update:') || text.includes('Note:') || text.includes('Question:'));
        return {
            "fontWeight": !isMedicAction ? "700" : "500",
            "backgroundColor": text.includes("<HIGHLIGHT>") ? "rgb(251 252 152)" : !isMedicAction ? "#eee" : "#fff",
            "fontSize": text.includes('Question:') ? '20px' : '16px'
        }
    }

    renderSituationTab = () => {
        return (
            <div>
                <Card className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            Situation
                        </div>
                    </Card.Header>
                    <Card.Body className="overflow-auto" style={{ maxHeight: '200px' }}>
                        {renderSituation(this.state.dmDetails[0]?.situation)}
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Body>
                        <Row>
                            <Col md={3} className="d-flex flex-column">
                                <Supplies supplies={this.state.dmDetails[0]?.supplies} />
                            </Col>
                            <Col md={9}>
                                <Row>
                                    {this.patientCards()}
                                </Row>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    renderActionLists = () => {
        return (
            <Row>
                {this.state.dmDetails.map((dm, index) => (
                    <Col key={`actions-${index}`} md={6}>
                        <Card className="h-100">
                            <Card.Header>
                                <h5 className="mb-0">{dm.dmName}'s Actions</h5>
                            </Card.Header>
                            <Card.Body className="overflow-auto" style={{ maxHeight: 'calc(70vh - 200px)' }}>
                                {dm.scenes[0].actions.map((action, actionIndex) => (
                                    <div
                                        key={`action-${actionIndex}`}
                                        className="action-item p-3 mb-2 rounded"
                                        style={this.getSceneStyle(action)}
                                    >
                                        {this.processActionText(action, actionIndex, dm.scenes[0]?.actions)}
                                    </div>
                                ))}
                            </Card.Body>
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
                {this.state.isSurveyLoaded && (
                    <>
                        <Button
                            className="mx-3"
                            variant="outline-light"
                            style={{ backgroundColor: "#b15e2f" }}
                            onClick={this.handleShowModal}
                        >
                            Review Medic Actions
                        </Button>
                        <Modal
                            show={this.state.showModal}
                            onHide={this.handleCloseModal}
                            size="xl"
                            className="action-comparison-modal"
                            dialogClassName="m-0"
                            fullscreen={true}  
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Medic Action Review</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="p-0">
                                <div className="h-100 d-flex flex-column">
                                    <Tabs
                                        activeKey={this.state.activeTab}
                                        onSelect={(k) => this.setState({ activeTab: k })}
                                        className="mb-3 px-4 pt-3"
                                    >
                                        <Tab eventKey="situation" title="Situation & Patients">
                                            <div className="px-4">
                                                {this.renderSituationTab()}
                                            </div>
                                        </Tab>
                                        <Tab eventKey="actions" title="Action Comparison">
                                            <div className="px-4">
                                                {this.renderActionLists()}
                                            </div>
                                        </Tab>
                                    </Tabs>
                                </div>
                            </Modal.Body>
                        </Modal>
                    </>
                )}
            </>
        );
    }
}