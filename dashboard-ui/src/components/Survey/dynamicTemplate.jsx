import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase, ReactQuestionFactory } from "survey-react-ui";
import { Accordion, Card, Row, Col, Button, ListGroup, Modal } from "react-bootstrap";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import SituationModal from "./situationModal";
import './template.css'

const CUSTOM_TYPE = "dynamic-template";

export class DynamicTemplateModel extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    setValueCore(newValue) {
        super.setValueCore(newValue);
    }

    get dmName() {
        return this.getPropertyValue("dmName")
    }

    set dmName(name) {
        this.setPropertyValue("dmName", name)
    }

    get actions() {
        return this.getPropertyValue("actions")
    }

    set actions(actions) {
        this.setPropertyValue("actions", actions)
    }

    get supplies() {
        return this.getPropertyValue("supplies")
    }

    set supplies(supplies) {
        this.setPropertyValue("supplies", supplies)
    }

    get situation() {
        return this.getPropertyValue("situation")
    }

    set situation(situation) {
        this.setPropertyValue("situation", situation)
    }

    get patients() {
        return this.getPropertyValue("patients")
    }

    set patients(patients) {
        this.setPropertyValue("patients", patients)
    }

    get decision() {
        return this.getPropertyValue("decision")
    }

    set decision(decision) {
        this.setPropertyValue("decision", decision)
    }
    get explanation() {
        return this.getPropertyValue("explanation")
    }

    set explanation(explanation) {
        this.setPropertyValue("explanation", explanation)
    }
}

// Add question type metadata for further serialization into JSON
Serializer.addClass(
    CUSTOM_TYPE,
    [
        {
            name: "dmName",
            default: ""
        },
        {
            name: "actions",
            default: []
        },
        {
            name: "supplies",
            default: []
        },
        {
            name: "situation",
            defualt: []
        },
        {
            name: "patients",
            default: []
        },
        {
            name: "decision",
            defualt: ""
        },
        {
            name: "explanation",
            defualt: ""
        }
    ],
    function () {
        return new DynamicTemplateModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new DynamicTemplateModel(name);
});

// A class that renders questions of the new type in the UI
export class DynamicTemplate extends SurveyQuestionElementBase {
    constructor(props) {
        super(props);
        const initialVisibility = {};

        this.state = {
            visiblePatients: [],
            userActions: [],
            showPatientModal: false,
            showSituationModal: true,
            activeImage: null,
            activeTitle: "",
            activeDescription: ""
        };
    }

    logUserAction = (actionType, detail) => {
        const timestamp = new Date().toString();
        const newActions = [...this.state.userActions, { actionType, detail, timestamp }];

        this.setState({ userActions: newActions }, () => {
            this.question.value = newActions;
        });
    }

    toggleImageModal = (imgUrl, title, description) => {
        this.logUserAction("zoomInIconClick", `Image Title: ${title}`);
        this.setState(prevState => ({
            showPatientModal: !prevState.showPatientModal,
            activeImage: imgUrl,
            activeTitle: title,
            activeDescription: description
        }));
    }

    togglePatientVisibility(patientName) {
        this.logUserAction("toggleButton", `Patient: ${patientName}`);
        this.setState(prevState => ({
            visiblePatients: {
                ...prevState.visiblePatients,
                [patientName]: !prevState.visiblePatients[patientName]
            }
        }));
    }

    toggleAccordionItem = () => {
        this.logUserAction("toggleAccordion", `Actions Expanded`);
    }

    get question() {
        return this.questionBase;
    }
    get dmName() {
        return this.question.dmName
    }
    get actions() {
        return this.question.actions
    }
    get supplies() {
        return this.question.supplies
    }
    get situation() {
        return this.question.situation
    }
    get patients() {
        return this.question.patients
    }
    get decision() {
        return this.question.decision
    }
    get explanation() {
        return this.question.explanation
    }

    // Support the read-only and design modes
    get style() {
        return this.question.getPropertyValue("readOnly") ||
            this.question.isDesignMode ? { pointerEvents: "none" } : undefined;
    }

    handleCloseSituationModal = () => {
        this.setState({ showSituationModal: false });
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 25);
    };

    handleShowSituationModal = () => {
        this.setState({ showSituationModal: true });
    }

    renderElement() {
        const cardContainerStyle = {
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap'
        };

        const patientCardStyle = {
            display: 'inline-block',
            minWidth: '40%',
            maxWidth: '40%',
            marginRight: '0.33%',
        };

        const magnifyingGlassStyle = {
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            padding: '5px',
            cursor: 'pointer',
            transition: 'transform 0.5s ease-in-out'
        };

        const vitalsColStyle = {
            overflowY: 'auto'     // Scrollbar for overflowing content
        };

        const rowStyle = {
            display: 'flex',
            alignItems: 'start',
            overflow: 'hidden'
        };

        // button for each patient
        const patientButtons = this.patients.map((patient, index) => (
            <Button
                key={patient.name}
                variant={this.state.visiblePatients[patient.name] ? "primary" : "secondary"}
                onClick={() => this.togglePatientVisibility(patient.name)}
                className="me-1"
            >
                {patient.name}
                {' '}
                {this.state.visiblePatients[patient.name] && <CheckCircleIcon />}
            </Button>
        ));

        const patientCards = this.patients.map((patient, index) => {
            // render card if toggled to visible
            if (this.state.visiblePatients[patient.name]) {
                return (
                    <Card key={patient.name} style={patientCardStyle}>
                        <Card.Header>
                            <div>{patient.name} - <Card.Text>{patient.description}</Card.Text></div>
                        </Card.Header>
                        <Row className="g-0" style={rowStyle}>
                            <Col md={8} className="pe-md-2">
                                <img src={`data:image/jpeg;base64,${patient.imgUrl}`} alt={patient.name} style={{ width: '100%', height: '100%' }}></img>
                                <ZoomInIcon style={magnifyingGlassStyle} className="magnifying-glass-icon" onClick={() => this.toggleImageModal(patient.imgUrl, patient.name, patient.description)} />
                            </Col>
                            <Col md={4} className="pe-md-2 my-1" style={vitalsColStyle}>
                                <ListGroup className="vitals-list-group">
                                    {patient.vitals?.map((vital, vitalIndex) => (
                                        <ListGroup.Item key={vital.name}>
                                            <strong>{vital.name}:</strong> {vital.value}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Col>
                        </Row>
                    </Card>
                );
            } else {
                return null;
            }
        });

        return (
            <div style={this.style}>
                {this.state.showSituationModal &&
                    <SituationModal
                        show={this.state.showSituationModal}
                        handleClose={this.handleCloseSituationModal}
                        situation={this.situation} />
                }
                <Row>
                    <Col md={2}>
                        <Card className="mb-3">
                            <Card.Header>Situation <ZoomInIcon className="magnifying-glass-icon" onClick={this.handleShowSituationModal} /></Card.Header>
                            <Card.Body>
                                {this.situation.map((detail, index) => (
                                    <Card.Text key={"detail-"+index}>{detail}</Card.Text>
                                ))}
                            </Card.Body>
                        </Card>
                        <Card>
                            <Card.Header>Supplies / Resources</Card.Header>
                            <Card.Body>
                                {this.supplies.map((supplies, index) => (
                                    <Card.Text key={supplies.type}>
                                        {supplies.quantity ? supplies.quantity : ""} {supplies.type}
                                    </Card.Text>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={10}>
                        <Card className="mb-3">
                            <Card.Header>Decision: {this.decision}</Card.Header>
                            <Card.Body>
                                <Accordion>
                                    <Accordion.Item eventKey={0} onClick={() => this.toggleAccordionItem()}>
                                        <Accordion.Header><strong>{`${this.dmName} actions`}</strong></Accordion.Header>
                                        <Accordion.Body>
                                            <ListGroup>
                                                {this.actions.map((action, index) => (
                                                    <ListGroup.Item key={"action-"+index}>{action}</ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                            <div className="my-2"><strong>Explanation:</strong> {this.explanation}</div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            </Card.Body>
                        </Card>
                        <div style={{ marginBottom: '10px' }}>
                            {patientButtons}
                        </div>
                        <div style={cardContainerStyle}>
                            {patientCards}
                        </div>
                    </Col>
                </Row>
                <Modal show={this.state.showPatientModal} onHide={() => this.toggleImageModal("", this.state.activeTitle, "")}>
                    <Modal.Header closeButton>
                        <Modal.Title>{this.state.activeTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.state.activeDescription}
                        <img src={`data:image/jpeg;base64,${this.state.activeImage}`} alt="Enlarged view" style={{ width: '100%' }} />
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}
