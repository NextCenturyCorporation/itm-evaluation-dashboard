import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase, ReactQuestionFactory } from "survey-react-ui";
import { Card, Row, Col } from "react-bootstrap";
import './template.css'
const CUSTOM_TYPE = "static-template";

export class StaticTemplateModel extends Question {
  getType() {
    return CUSTOM_TYPE;
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
    return new StaticTemplateModel("");
  },
  "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
  return new StaticTemplateModel(name);
});

// A class that renders questions of the new type in the UI
export class StaticTemplate extends SurveyQuestionElementBase {

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
    const cardStyle = { maxHeight: '400px', overflowY: 'scroll' };
    return (
      <div style={this.style}>
        <Row>
          <Col md={6}>
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
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header>Decision: Who should be evacuated?</Card.Header>
              <Card.Body>
                <Card.Subtitle className="mb-2"><strong>{this.dmName}</strong></Card.Subtitle>
                {this.actions.map((action, index) => (
                  <div key={index}>
                    <Card.Text>{action.action}</Card.Text>
                    <Card.Text>{action.explanation}</Card.Text>
                  </div>
                ))}
              </Card.Body>
            </Card>
            <div style={cardStyle}>
            {this.patients.map((patient, index) => (
              <Card key={index}>
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

// Register `StaticTemplate` as a class that renders `static-template` questions 
ReactQuestionFactory.Instance.registerQuestion(CUSTOM_TYPE, (props) => {
  return React.createElement(StaticTemplate, props);
});