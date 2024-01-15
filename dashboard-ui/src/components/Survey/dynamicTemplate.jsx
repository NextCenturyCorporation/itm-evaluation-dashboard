import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase, ReactQuestionFactory } from "survey-react-ui";
import { Accordion, Card, Row, Col, Button, ListGroup, Modal } from "react-bootstrap";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
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
        props.question.patients.forEach(patient => {
            initialVisibility[patient.name] = true; // Set each patient's visibility to true
        });
        this.state = {
            visiblePatients: initialVisibility,
            userActions: [],
            showImageModal: false,
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
            showModal: !prevState.showModal,
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

    toggleAccordionItem = (actionIndex) => {
        this.logUserAction("toggleAccordion", `Action Index: ${actionIndex}`);
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

    // Support the read-only and design modes
    get style() {
        return this.question.getPropertyValue("readOnly") ||
            this.question.isDesignMode ? { pointerEvents: "none" } : undefined;
    }

    renderElement() {
        console.log(this.state.userActions)
        const cardContainerStyle = {
            maxHeight: '500px',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap'
        };

        const patientCardStyle = {
            display: 'inline-block',
            minWidth: '33%',
            maxWidth: '33%',
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

        // button for each patient
        const patientButtons = this.patients.map((patient, index) => (
            <Button
                key={index}
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
                    <Card key={index} style={patientCardStyle}>
                        <Card.Header>
                            <div>{patient.name} - <Card.Text>{patient.description}</Card.Text></div>
                        </Card.Header>
                        <Row className="g-0">
                            <Col md={8} className="pe-md-2 position-relative">
                                <img src={`data:image/jpeg;base64,${patient.imgUrl}`} alt={patient.name} style={{ width: '100%', height: 'auto' }} />
                                <ZoomInIcon style={magnifyingGlassStyle} className="magnifying-glass-icon" onClick={() => this.toggleImageModal(patient.imgUrl, patient.name, patient.description)} /> 
                            </Col>
                            <Col md={4} className="pe-md-2 my-1">
                                <strong>Vitals:</strong>
                                <ListGroup className="vitals-list-group">
                                    {patient.vitals?.map((vital, vitalIndex) => (
                                        <ListGroup.Item key={vitalIndex}>
                                            {vital.name}: {vital.value}
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
                <Row>
                    <Col md={2}>
                        <Card className="mb-3">
                            <Card.Header>Situation</Card.Header>
                            <Card.Body>
                                {this.situation.map((detail, index) => (
                                    <Card.Text key={index}>{detail}</Card.Text>
                                ))}
                            </Card.Body>
                        </Card>
                        <Card>
                            <Card.Header>Supplies / Resources</Card.Header>
                            <Card.Body>
                                {this.supplies.map((supplies, index) => (
                                    <Card.Text key={index}>
                                        {supplies.quantity ? supplies.quantity : ""} {supplies.type}
                                    </Card.Text>
                                ))}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={10}>
                        <Card className="mb-3">
                            <Card.Header>Decision: Who should be evacuated?</Card.Header>
                            <Card.Body>
                                <Card.Subtitle className="mb-2"><strong>{this.dmName}</strong></Card.Subtitle>
                                <Accordion>
                                    {this.actions.map((action, index) => (
                                        <Accordion.Item key={index} eventKey={index} onClick={() => this.toggleAccordionItem(action.action)}>
                                            <Accordion.Header>{action.action}</Accordion.Header>
                                            <Accordion.Body><strong>Explanation:</strong> {action.explanation}</Accordion.Body>
                                        </Accordion.Item>
                                    ))}
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
                <Modal show={this.state.showModal} onHide={() => this.toggleImageModal("", this.state.activeTitle, "")}>
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

// Register `DynamicTemplace` as a class that renders `dynamic-template` questions 
ReactQuestionFactory.Instance.registerQuestion(CUSTOM_TYPE, (props) => {
    return React.createElement(DynamicTemplate, props);
});