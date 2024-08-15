import React from "react";
import { Container, Row, Col, Card, ListGroup, Badge, Modal } from 'react-bootstrap';
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { FaHeartbeat, FaLungs, FaBrain, FaPercent, FaEye, FaAmbulance, FaBell } from 'react-icons/fa';
import { BsPersonFillGear } from 'react-icons/bs'
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import '../../css/medical-scenario.css';

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

  get events() {
    return this.getPropertyValue("events");
  }

  set events(events) {
    this.setPropertyValue("events", events);
  }
}

Serializer.addClass(
  CUSTOM_TYPE,
  [
    { name: "unstructured", default: '' },
    { name: "supplies", default: [] },
    { name: "patients", default: [] },
    { name: "events", default: [] }
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
      showModal: false,
      selectedImage: null,
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

  get events() {
    return this.question.events || [];
  }

  handleImageClick = (patient) => {
    this.setState({ showModal: true, selectedImage: patient.imgUrl, selectedPatient: patient });
  };

  handleCloseModal = () => {
    this.setState({ showModal: false, selectedImage: null });
  };

  renderElement() {
    return (
      <Container fluid className="p-3" style={{ backgroundColor: '#f8f9fa' }}>
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title className="text-center mb-3 h4">Scenario</Card.Title>
                <Card.Text className="lead" style={{ textAlign: 'left' }}>{this.unstructured}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {this.events.slice().map((event, index) => (
          <Card key={index} className={`border-0 shadow-sm event-card mb-3 ${index === 0 ? 'new-event' : ''}`}>
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="event-icon-wrapper me-3">
                  <FaBell className="event-icon" />
                </div>
                <div className="flex-grow-1">
                  <Card.Text className="mb-1 event-message">{event.message}</Card.Text>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}

        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <Card.Title className="mb-3">Supplies</Card.Title>
                <ListGroup variant="flush">
                  {this.supplies
                    .filter(supply => supply.quantity > 0)
                    .map((supply, index) => (
                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center py-2">
                        <span style={{ fontSize: '1rem' }}>
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
                <Card.Body style={{ overflow: 'visible' }}>
                  <Card.Title className="h4 mb-1">
                    {patient.name}
                  </Card.Title>
                  {patient.demographics.age && 
                  <Card.Subtitle className="mb-2 text-muted">
                    {patient.demographics.age} years old, {patient.demographics.sex == 'F' ? 'Female' : 'Male'}
                  </Card.Subtitle>
                  } 
                  <Card.Text className="mb-3 small">
                    {patient.unstructured}
                  </Card.Text>
                  <Row className="mb-3">
                    <Col md={7} className="d-flex mb-3 mb-md-0">
                      <div className="bg-primary text-white p-3 text-center d-flex align-items-center justify-content-center w-100 rounded" style={{ position: 'relative', minHeight: '150px', overflow: 'hidden' }}>
                        {patient.imgUrl ? (
                          <img
                            src={`data:image/png;base64,${patient.imgUrl}`}
                            alt={`${patient.id}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                            }}
                          />
                        ) : (
                          "No image available"
                        )}
                        <ZoomInIcon
                          className="magnifying-glass"
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            fontSize: '24px',
                            cursor: 'pointer',
                            zIndex: 1,
                          }}
                          onClick={() => this.handleImageClick(patient)}
                        />
                      </div>
                    </Col>
                    <Col md={5} className="d-flex flex-column">
                      <Card className="w-100 border-0 flex-grow-1 vitals-card" style={{ backgroundColor: '#e7f1ff', overflow: 'visible' }}>
                        <Card.Body className="p-2 d-flex flex-column" style={{ overflow: 'visible' }}>
                          <Card.Title className="h4 mb-2 vitals-title">Vitals</Card.Title>
                          <div className="vitals-container flex-grow-1">
                            {this.renderVitals(patient, patient.vitals)}
                          </div>
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

        <Modal show={this.state.showModal} onHide={this.handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>{this.state.selectedPatient?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.selectedPatient?.unstructured}
            {this.state.selectedImage && (
              <div style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img
                  src={`data:image/png;base64,${this.state.selectedImage}`}
                  alt="Patient"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    );
  }

  renderVitals(patient, vitals) {
    const vitalIcons = {
      avpu: <FaEye />,
      ambulatory: <FaAmbulance />,
      breathing: <FaLungs />,
      heart_rate: <FaHeartbeat />,
      spo2: <FaPercent />,
      mental_status: <FaBrain />,
      conscious: <BsPersonFillGear />
    };

    const vitalNames = {
      avpu: "AVPU Scale",
      ambulatory: "Ambulatory Status",
      breathing: "Breathing Rate",
      heart_rate: "Heart Rate",
      spo2: "Blood Oxygen Saturation (SPO2)",
      mental_status: "Mental Status",
      conscious: "Conscious"
    };

    if (!vitals) {
      return <div>No vitals data available</div>;
    }

    return (
      <div className="d-flex flex-column gap-1">
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key} className="d-flex align-items-center vital-item">
            <span className="vital-icon" style={{ width: '24px', marginRight: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <span className="vital-name">{vitalNames[key]}</span>
              {vitalIcons[key] || key}
            </span>
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
          Severity: <Badge bg={this.getInjurySeverityColor(injury.severity)}>{this.capitalizeWords(injury.severity)}</Badge>
      </div>
    ));
  }

  capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  getVitalBadgeColor(key, value) {
    // TODO: Add logic here
    return "info";
  }

  getInjurySeverityColor(severity) {
    if (!severity) {
      return 'secondary';
    }

    switch (severity.toLowerCase()) {
      case 'extreme': return 'danger';
      case 'major': return 'orange';
      case 'substantial': return 'warning';
      case 'moderate': return 'info';
      case 'minor': return 'success';
      default: return 'secondary';
    }
  }
}