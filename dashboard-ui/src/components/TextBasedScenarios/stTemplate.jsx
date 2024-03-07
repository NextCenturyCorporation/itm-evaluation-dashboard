import React from "react";
import { ListGroup, Card, Row, Col, ListGroupItem } from "react-bootstrap";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";


const CUSTOM_TYPE = "stVitals";

export class STVitalsModel extends Question {
    getType() {
        return CUSTOM_TYPE;
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
            name: "patients",
            default: []
        }
    ],
    function () {
        return new STVitalsModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new STVitalsModel(name);
});


export class STVitals extends SurveyQuestionElementBase {

    get question() {
        return this.questionBase;
    }

    get patients() {
        return this.question.patients
    }

    renderElement() {
        const textStyle = { fontSize: '0.8rem' }
        return (
            <Row gutter={0}>
            {this.patients.map(patient => (
                <Col key={patient.name} xs={6}>
                <Card>
                    <Card.Header>{patient.name}</Card.Header>
                    <Row gutter={0}>
                    <Col xs={6} >
                        <ListGroup style={textStyle}>
                            <ListGroup.Item>Age: {patient.age}</ListGroup.Item>
                            <ListGroup.Item>Race: {patient.race}</ListGroup.Item>
                            <ListGroup.Item>Gender: {patient.gender}</ListGroup.Item>
                            <ListGroup.Item>Type: {patient.type}</ListGroup.Item>
                            <ListGroup.Item>Injury: {patient.injury}</ListGroup.Item>
                        </ListGroup>
                    </Col>
                    <Col xs={6}>
                        <ListGroup style={textStyle}>
                            {patient.vitals.map(vital => (
                                <ListGroup.Item key={vital.type}>{vital.type}: {vital.value}</ListGroup.Item>
                            ))
                            }
                        </ListGroup>
                    </Col>
                    </Row>
                </Card>
                </Col>
            ))
            }
            </Row>
        );
    }    
}