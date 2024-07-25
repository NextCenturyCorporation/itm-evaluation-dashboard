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
        <Row noGutters>
          <Col>
            <Card className="border-0 rounded-0">
              <Card.Body className="p-2">
                <Card.Title className="mb-1">Scenario</Card.Title>
                <Card.Text className="mb-0">{this.unstructured}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row noGutters className="mt-2">
          <Col md={3}>
            <Card className="border-0 rounded-0 h-100" style={{ backgroundColor: '#6c757d' }}>
              <Card.Body className="p-2">
                <Card.Title className="text-white mb-1">Supplies</Card.Title>
                <ListGroup variant="flush">
                  {this.supplies.map((supply, index) => (
                    <ListGroup.Item key={index} className="p-1" style={{ backgroundColor: 'transparent', color: 'white' }}>
                      {supply.type}: {supply.quantity} {supply.reusable ? "(Reusable)" : ""}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col md={9}>
            <Row noGutters>
              {this.patients.map((patient, index) => (
                <Col md={6} key={index} className="pr-md-2 mb-2 mb-md-0">
                  <Card className="border-0 rounded-0 h-100">
                    <Card.Body className="p-2">
                      <Card.Title className="mb-1">{patient.name}</Card.Title>
                      <Card.Text className="mb-1">
                        <strong>Vitals:</strong><br />
                        {Object.entries(patient.vitals).map(([key, value]) => (
                          <span key={key} className="d-block">{key}: {value}</span>
                        ))}
                      </Card.Text>
                      <Card.Text className="mb-0">
                        <strong>Injuries:</strong><br />
                        {patient.injuries.map((injury, i) => (
                          <span key={i} className="d-block">
                            {injury.location} {injury.name} - Severity: {injury.severity}, Status: {injury.status}
                          </span>
                        ))}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    );
  }
}