import React from "react";
import { Container, Row, Col, Card, ListGroup, Badge } from 'react-bootstrap';
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { FaHeartbeat, FaLungs, FaBrain, FaWalking, FaPercent, FaEye } from 'react-icons/fa';

const CUSTOM_TYPE = "medicalScenario";

export class MedicalScenarioModel extends Question {
  getType() {
    return CUSTOM_TYPE;
  }

  get supplies() {
    return this.getPropertyValue("supplies");
  }

  set supplies(supplies) {
    this.setPropertyValue("supplies", supplies);
  }

  get unstructured() {
    return this.getPropertyValue("unstructured");
  }

  set unstructured(unstructured) {
    this.setPropertyValue("unstructured", unstructured);
  }

  get patients() {
    return this.getPropertyValue("patients");
  }

  set patients(patients) {
    this.setPropertyValue("patients", patients);
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
      selectedPatient: null,
    };
  }

  get question() {
    return this.questionBase;
  }

  get supplies() {
    return this.question.supplies;
  }

  get patients() {
    return this.question.patients;
  }

  get unstructured() {
    return this.question.unstructured;
  }

  handlePatientSelection = (patient) => {
    this.setState({ selectedPatient: patient });
    this.question.value = patient;
  };

  renderElement() {
    return (
      <Container fluid className="p-3" style={{ backgroundColor: '#f8f9fa' }}>
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title className="text-center mb-3 h4">Scenario</Card.Title>
                <Card.Text className="text-center lead">{this.unstructured}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <Card.Title className="mb-3">Supplies</Card.Title>
                <ListGroup variant="flush">
                  {this.supplies.map((supply, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center py-2">
                      <span style={{ fontSize: supply.type.length > 15 ? '0.9rem' : '1rem' }}>
                        {supply.type}
                      </span>
                      <Badge bg="primary" pill style={{ fontSize: '0.9rem', marginLeft: '10px' }}>
                        {supply.quantity} {supply.reusable ? "(Reusable)" : ""}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          {this.patients.map((patient, index) => (
            <Col md={4} key={index} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <Card.Title className="h4 mb-3">{patient.name}</Card.Title>
                  <Row className="mb-3">
                    <Col md={7} className="d-flex mb-3 mb-md-0">
                      <div className="bg-primary text-white p-3 text-center d-flex align-items-center justify-content-center w-100 rounded">
                        Picture Placeholder
                      </div>
                    </Col>
                    <Col md={5} className="d-flex flex-column">
                      <Card className="w-100 border-0 flex-grow-1" style={{ backgroundColor: '#e7f1ff' }}>
                        <Card.Body className="p-2 d-flex flex-column justify-content-center">
                          <Card.Title className="h4 mb-2">Vitals</Card.Title>
                          {this.renderVitals(patient, patient.vitals)}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Card className="mb-0 border-0" style={{ backgroundColor: '#fff0f0' }}>
                    <Card.Body className="p-3">
                      <Card.Title className="h4 mb-2">Injuries</Card.Title>
                      {this.renderInjuries(patient.injuries)}
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

  renderVitals(patient, vitals) {
    const vitalIcons = {
      avpu: <FaEye />,
      ambulatory: <FaWalking />,
      breathing: <FaLungs />,
      heart_rate: <FaHeartbeat />,
      spo2: <FaPercent />,
      mental_status: <FaBrain />
    };

    const vitalNames = {
      avpu: "AVPU Scale",
      ambulatory: "Ambulatory Status",
      breathing: "Breathing Rate",
      heart_rate: "Heart Rate",
      spo2: "Blood Oxygen Saturation (SPO2)",
      mental_status: "Mental Status"
    };

    return (
      <div className="d-flex flex-column gap-1 overflow-hidden" style={{ maxHeight: '100%' }}>
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key} className="d-flex align-items-center">
              <div style={{ width: '20px', marginRight: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {vitalIcons[key] || key}
              </div>
            <Badge bg={this.getVitalBadgeColor(key, value)} className="fs-7">{value.toString()}</Badge>
          </div>
        ))}
      </div>
    );
  }


  renderInjuries(injuries) {
    return injuries.map((injury, i) => (
      <div key={i} className="mb-2">
        <strong>{this.capitalizeWords(injury.location)} {injury.name}</strong>
        <br />
        <small>
          Severity: <Badge bg={this.getInjurySeverityColor(injury.severity)}>{injury.severity}</Badge>
          {' '}
          Status: <Badge bg="secondary">{injury.status}</Badge>
        </small>
      </div>
    ));
  }

  capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  getVitalBadgeColor(key, value) {
    // TODO Add logic here
    return "info";
  }

  getInjurySeverityColor(severity) {
    switch (severity.toLowerCase()) {
      case 'extreme': return 'danger';
      case 'major': return 'danger';
      case 'substantial': return 'warning';
      case 'moderate': return 'info';
      case 'minor': return 'info';
      default: return 'secondary';
    }
  }
}
