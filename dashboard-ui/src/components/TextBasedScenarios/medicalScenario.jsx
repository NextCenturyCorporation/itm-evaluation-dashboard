import React from "react";
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";

const CUSTOM_TYPE = "medicalScenario";

export class MedicalScenarioModel extends Question {
  getType() {
    return CUSTOM_TYPE;
  }

  get supplies() {
    return this.getPropertyValue("supplies")
  }

  set supplies(supplies) {
    this.setPropertyValue("supplies", supplies)
  }

  get unstructured() {
    return this.getPropertyValue("unstructured")
  }

  set unstructured(unstructured) {
    this.setPropertyValue("unstructured", unstructured)
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
    { name: "unstructured", default: '' },
    { name: "supplies", default: [] },
    { name: "patients", default: [] }
  ],
  function () {
    return new MedicalScenarioModel("");
  },
  "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
  return new MedicalScenarioModel(name);
});

export class MedicalScenario extends SurveyQuestionElementBase {
  constructor(props) {
    super(props);
    this.state = {
      selectedPatient: null
    };
  }

  get question() {
    return this.questionBase
  }

  get supplies() {
    return this.question.supplies
  }

  get patients() {
    return this.question.patients
  }

  get unstructured() {
    return this.question.unstructured
  }

  handlePatientSelection = (patient) => {
    this.setState({ selectedPatient: patient });
    this.question.value = patient;
  };

  renderElement() {
    return (
      <Container fluid className="p-0">
        <Row className="mb-3">
          <Col>
            <Card className="border-1">
              <Card.Body className="p-3">
                <Card.Title className="text-center mb-2">Scenario</Card.Title>
                <Card.Text className="text-center">{this.unstructured}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md={3}>
            <Card className="h-100" style={{ backgroundColor: '#f0f0f0' }}>
              <Card.Body>
                <Card.Title>Supplies</Card.Title>
                <ul className="list-unstyled">
                  {this.supplies.map((supply, index) => (
                    <li key={index}>
                      {supply.type}: {supply.quantity} {supply.reusable ? "(Reusable)" : ""}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </Col>
          {this.patients.map((patient, index) => (
            <Col md={4} key={index}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{patient.name}</Card.Title>
                  <Row className="mb-3">
                    <Col md={7} className="d-flex">
                      <div className="bg-primary text-white p-3 text-center d-flex align-items-center justify-content-center w-100">
                        Picture
                      </div>
                    </Col>
                    <Col md={5} className="d-flex">
                      <Card className="w-100" style={{backgroundColor: '#e6e6ff'}}>
                        <Card.Body className="p-2">
                          <Card.Title className="h6 mb-2">Vitals</Card.Title>
                          {Object.entries(patient.vitals).map(([key, value]) => (
                            <small key={key} className="d-block">{key}: {value.toString()}</small>
                          ))}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Card className="mb-0" style={{backgroundColor: '#e6e6ff'}}>
                    <Card.Body className="p-2">
                      <Card.Title className="h6 mb-2">Injuries</Card.Title>
                      {patient.injuries.map((injury, i) => (
                        <p key={i} className="mb-1">
                          <strong>{injury.location} {injury.name}</strong>
                          <br />
                          <small>Severity: {injury.severity}, Status: {injury.status}</small>
                        </p>
                      ))}
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }
}