import React from "react";
import { ListGroup, Card, Row, Col } from "react-bootstrap";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";


const CUSTOM_TYPE = "adeptVitals";

export class AdeptVitalsModel extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    get supplies() {
        return this.getPropertyValue("supplies");
    }

    set supplies(supplies) {
        this.setPropertyValue("supplies", supplies);
    }

    get patients() {
        return this.getPropertyValue("patients")
    }

    set patients(patients) {
        this.setPropertyValue("patients", patients)
    }
}

Serializer.addClass(
    CUSTOM_TYPE,
    [
        {
            name: "supplies",
            default: []
        },
        {
            name: "patients",
            default: []
        }
    ],
    function () {
        return new AdeptVitalsModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new AdeptVitalsModel(name);
});


export class AdeptVitals extends SurveyQuestionElementBase {

    get question() {
        return this.questionBase;
    }

    get supplies() {
        return this.question.supplies;
    }

    get patients() {
        return this.question.patients
    }

    renderElement() {
        const textStyle = { fontSize: '0.8rem' }
        return (
            <Row>
                <Col xs={3} className="mx-0">
                    <Card className="p-2">
                        <Card.Title>Supplies</Card.Title>
                        <ListGroup style={textStyle}>
                            {this.supplies.map(equipment => (
                                <ListGroup.Item key={equipment.type}>
                                    {equipment.type}, Quantity: {equipment.quantity}{equipment.reusable ? ", Reusable" : ""}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card>
                </Col>
                <Col xs={9} className="mx-0">
                    <Row gutter={0}>
                        {this.patients.map(patient => (
                            <Col key={patient.name} xs={6} className="px-1">
                                <Card className="p-2 mb-2">
                                    <Card.Title>{patient.name}</Card.Title>
                                    <Row>
                                        <Col xs={6} className="px-2">
                                            <h6>Injuries</h6>
                                            <ListGroup style={textStyle}>
                                                {patient.injuries.map(injury => (
                                                    <ListGroup.Item key={`${injury.location} ${injury.name}`}>
                                                        {injury.location} {injury.name}
                                                        <br/>
                                                        Severity: {injury.severity}
                                                        <br/>
                                                        Status: {injury.status}
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </Col>
                                        {/* Vitals */}
                                        <Col xs={6} className="px-2">
                                            <h6>Vitals</h6>
                                            <ListGroup style={textStyle}>
                                                {patient.vitals.map(vital => (
                                                    <ListGroup.Item key={vital.type}>
                                                        {vital.type}: {vital.value.toString()}
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>
        );
    }    
}