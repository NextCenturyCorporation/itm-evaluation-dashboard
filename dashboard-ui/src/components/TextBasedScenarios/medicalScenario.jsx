import React from "react";
import { Container, Row, Col, Card, Modal } from 'react-bootstrap';
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { FaBell, FaInfoCircle, } from 'react-icons/fa';
import Supplies from './supplies';
import SuppliesPhase1 from './suppliesPhase1';
import Patient from './patient';
import PatientPhase1 from './patientPhase1';
import MoreDetailsModal from "./moreDetailsModal";
import '../../css/medical-scenario.css';
import store from '../../store/store';


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

  get mission() {
    return this.getPropertyValue("mission");
  }

  set mission(mission) {
    this.setPropertyValue("mission", mission);
  }

  get blockedVitals() {
    return this.getPropertyValue("blockedVitals");
  }

  set blockedVitals(blockedVitals) {
    this.setPropertyValue("blockedVitals", blockedVitals);
  }

  get transitionInfo() {
    return this.getPropertyValue("transitionInfo");
  }

  set transitionInfo(transitionInfo) {
    this.setPropertyValue("transitionInfo", transitionInfo);
  }
}

Serializer.addClass(
  CUSTOM_TYPE,
  [
    { name: "unstructured", default: '' },
    { name: "supplies", default: [] },
    { name: "patients", default: [] },
    { name: "events", default: [] },
    { name: 'mission', default: null },
    { name: 'blockedVitals', default: [] },
    { name: 'transitionInfo', default: null }
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
      showSituationModal: false,
      showTransitionModal: false,
      currentStyle: store.getState()?.configs?.currentStyle
    };

    this.unsubscribe = store.subscribe(() => {
      const newStyle = store.getState()?.configs?.currentStyle;
      if (newStyle !== this.state.currentStyle) {
        this.setState({ currentStyle: newStyle });
      }
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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

  get mission() {
    return this.question.mission;
  }

  get blockedVitals() {
    return this.question.blockedVitals;
  }

  get transitionInfo() {
    return this.question.transitionInfo;
  }

  handleImageClick = (patient) => {
    this.setState({ showModal: true, selectedImage: patient.imgUrl, selectedPatient: patient });
  };

  handleCloseModal = () => {
    this.setState({ showModal: false, selectedImage: null });
  };

  handleSituationClick = () => {
    this.setState({ showSituationModal: true });
  };

  handleCloseSituationModal = () => {
    this.setState({ showSituationModal: false });
  };

  componentDidMount() {
    if (this.transitionInfo && this.transitionEdgeCase()) {
      this.setState({ showTransitionModal: true });
    }
    this.overideBlockedVitals();
    this.springerUptonEdgeCase();
  }

  handleCloseTransitionModal = () => {
    this.setState({ showTransitionModal: false });
  };

  transitionEdgeCase = () => {
    const survey = this.question.survey
    if (!survey) {
      // should never happen
      return
    }

    if (survey.title !== "DryRunEval-MJ2-eval" && survey.title !== "phase1-adept-eval-MJ2") {
      return true
    }

    const probe = survey.getValue('probe Probe 4-B.1-B.1')
    return probe && probe === 'Do some treatment on US military member.'
  }

  overideBlockedVitals = () => {
    const survey = this.question.survey;
    const currentPage = survey?.currentPage?.name;
    const probe = survey.getValue('probe Probe 2');

    if (!['Probe 2B-1', 'Probe 2A-1'].includes(currentPage) || !probe?.includes("Assess")) {
      return;
    }

    const lowerResponse = probe.toLowerCase();
    this.question.blockedVitals = this.question.blockedVitals.filter(
      blockedID => !lowerResponse.includes(blockedID.toLowerCase())
    );

    // trick to re render by updating state (with nothing)
    this.setState({});
  }

  springerUptonEdgeCase() {
    const relevantProbes = [
      'template Probe 2-A.1',
      'template Probe 2-A.1-A.1',
      'template Probe 2-A.1-B.1',
      'template Probe 2-A.1-B.1-A.1',
      'template Probe 2-B.1',
      'template Probe 2-B.1-A.1',
      'template Probe 2-B.1-B.1',
      'template Probe 2-B.1-B.1-A.1',
      'template Probe 3'
    ];

    if (!relevantProbes.includes(this.question.jsonObj.name)) {
      return;
    }

    const baseVitals = {
      'avpu': 'ALERT',
      'ambulatory': true,
      'mental_status': 'UPSET',
      'spo2': 'NORMAL'
    };

    const normalVitals = { ...baseVitals, 'breathing': 'NORMAL', 'heart_rate': 'NORMAL' };
    const fastVitals = { ...baseVitals, 'breathing': 'FAST', 'heart_rate': 'FAST' };

    const springerIndex = this.patients.findIndex(patient => patient.name === 'Springer');
    const uptonIndex = this.patients.findIndex(patient => patient.name === 'Upton');
    const isSpringerFirst = this.question.survey.valuesHash['probe Scene 1'] === 'Assess Springer first.';

    // create new array of patients as work around for immutable error
    const updatedPatients = [...this.patients];

    if (springerIndex !== -1) {
      updatedPatients[springerIndex] = {
        ...updatedPatients[springerIndex],
        vitals: isSpringerFirst ? normalVitals : fastVitals
      };
    }

    if (uptonIndex !== -1) {
      updatedPatients[uptonIndex] = {
        ...updatedPatients[uptonIndex],
        vitals: isSpringerFirst ? fastVitals : normalVitals
      };
    }

    this.question.patients = updatedPatients;

    // force re-render
    this.setState({});
  }

  // edge case for first scene of mj5 to hide patient images
  shouldHidePatientImages = () => {
    const hiddenImageTemplates = [
      'template Scene 0',
      'template Probe 1-B.1',
      'template Probe 1-A.1'
    ];


    return hiddenImageTemplates.includes(this.question.jsonObj.name);
  }

  renderElement() {
    const isPhase1Style = this.state.currentStyle === 'phase1';

    const PatientComponent = isPhase1Style ? PatientPhase1 : Patient;
    const SuppliesComponent = isPhase1Style ? SuppliesPhase1 : Supplies;

    return (
      <Container fluid className="p-3" style={{ backgroundColor: '#f8f9fa' }}>
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 position-relative">
                {(this.mission?.roe && this.mission?.roe !== "") &&
                  <div
                    className="position-absolute d-flex align-items-center scenario-info-icon"
                    style={{
                      top: '10px',
                      left: '10px',
                      cursor: 'pointer',
                    }}
                    onClick={this.handleSituationClick}
                  >
                    <FaInfoCircle size={28} color="#17a2b8" />
                    <span className="ms-2 small text-muted">Click For More Info</span>
                  </div>
                }
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
          <Col md={12}>
            <SuppliesComponent supplies={this.supplies} />
          </Col>
        </Row>
        <Row>
          {this.patients.map((patient, index) => (
            <Col md={6} key={index} className="mb-4">
              <PatientComponent
                patient={patient}
                onImageClick={this.handleImageClick}
                blockedVitals={this.blockedVitals}
                hideImages={this.shouldHidePatientImages()}
                question={this.question.jsonObj}
              />
            </Col>
          ))}
        </Row>
        <Modal show={this.state.showModal} onHide={this.handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{this.state.selectedPatient?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.selectedPatient?.demographics.age && (
              <p className="mb-2 text-muted">
                {this.state.selectedPatient.demographics.age} years old,
                {this.state.selectedPatient.demographics.sex === 'F' ? 'Female' : 'Male'}
              </p>
            )}
            <p className="mb-3">{this.state.selectedPatient?.unstructured}</p>
            {this.state.selectedImage && (
              <div style={{
                height: '70vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={`data:image/png;base64,${this.state.selectedImage}`}
                  alt="Patient"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}
          </Modal.Body>
        </Modal>

        <MoreDetailsModal
          show={this.state.showSituationModal}
          onHide={this.handleCloseSituationModal}
          mission={this.mission}
        />
        <Modal
          show={this.state.showTransitionModal}
          onHide={this.handleCloseTransitionModal}
          size="lg"
          centered
          className="transition-info-modal"
        >
          <Modal.Header closeButton className="border-0 bg-primary text-white">
            <Modal.Title>
              <FaInfoCircle className="me-2" />
              Transition Information
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {this.transitionInfo && (
              <div className="transition-info-content">
                <p className="mb-4">{this.transitionInfo.unstructured}</p>
                {this.transitionInfo.events && this.transitionInfo.events.length > 0 && (
                  <div className="mb-4">
                    {this.transitionInfo.events.map((event, index) => (
                      <div key={index} className="d-flex align-items-center mb-3">
                        <FaBell className="me-3 text-primary" />
                        <p className="mb-0">{event.unstructured}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mb-0">
                  <strong>You chose to:</strong> {this.transitionInfo.action}
                </p>
              </div>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    );
  }
}