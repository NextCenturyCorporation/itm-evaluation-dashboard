import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase, ReactQuestionFactory } from "survey-react-ui";
import { Card, Row, Col, ListGroup} from "react-bootstrap";
import SituationModal from "./situationModal";
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import './template.css'
const CUSTOM_TYPE = "static-template";

export class StaticTemplateModel extends Question {
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
      default: ""
    },
    {
      name: "explanation",
      default: ""
    }
  ],
  function () {
    return new StaticTemplateModel("");
  },
  "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
  return new StaticTemplateModel(name);
});

// A class that renders questions of the new type in the UI
export class StaticTemplate extends SurveyQuestionElementBase {

  constructor(props) {
    super(props)
    this.question.value = ""
    this.state = { showModal: true }
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

  handleCloseModal = () => {
    this.setState({ showModal: false });
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 25);
  };

  handleShowModal = () => {
    this.setState({ showModal: true});
  }

  renderElement() {
    const cardStyle = { maxHeight: '400px', overflowY: 'scroll' };
    return (
      <div style={this.style}>
        {this.state.showModal &&
          <SituationModal
            show={this.state.showModal}
            handleClose={this.handleCloseModal}
            situation={this.situation} />
        }
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header>Situation <ZoomInIcon className="magnifying-glass-icon" onClick={this.handleShowModal}/></Card.Header>
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
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header>Decision: {this.decision}</Card.Header>
              <Card.Body>
                <Card.Subtitle className="mb-2"><strong>{this.dmName}</strong></Card.Subtitle>
                <ListGroup>
                  {this.actions.map((action, index) => (
                    <ListGroup.Item key={"action-"+index}>{action}</ListGroup.Item>
                  ))}
                </ListGroup>
                <Card.Text className="my-2"><strong>Explanation: </strong>{this.explanation}</Card.Text>
              </Card.Body>
            </Card>
            <div style={cardStyle}>
              {this.patients.map((patient, index) => (
                <Card key={patient.name}>
                  <Card.Header>
                    <Row>
                      <Col xs={6} md={4} style={{ borderRight: '1px solid #dee2e6' }}>
                        <div>{patient.name}</div>
                      </Col>
                      <Col xs={6} md={8}>
                        <div>Description</div>
                      </Col>
                    </Row>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col xs={6} md={4} style={{ borderRight: '1px solid #dee2e6', paddingRight: '1.25rem' }}>
                        <img src={`data:image/jpeg;base64,${patient.imgUrl}`} alt="Patient A" style={{ width: '100%', height: 'auto' }} />
                      </Col>
                      <Col xs={6} md={8} style={{ paddingLeft: '1.25rem' }}>
                        <Card.Text>
                          {patient.description}
                        </Card.Text>
                        <strong>Vitals</strong>
                        <ListGroup>
                          {patient.vitals?.map((vital, vitalIndex) => (
                            <ListGroup.Item key={vitalIndex}>
                              {vital.name}: {vital.value}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Col>
        </Row>
      </div>);
  }
}
