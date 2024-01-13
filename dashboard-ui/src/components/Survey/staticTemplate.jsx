import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase, ReactQuestionFactory } from "survey-react-ui";
import { Accordion, Card, Row, Col } from "react-bootstrap";
import './staticTemplate.css'
const CUSTOM_TYPE = "static-template";

export class StaticTemplateModel extends Question {
  getType() {
    return CUSTOM_TYPE;
  }

  get templateHTML() {
    return this.getPropertyValue("templateHTML")
  }

  set templateHTML(html) {
    this.setPropertyValue("templateHTML", html)
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
}

// Add question type metadata for further serialization into JSON
Serializer.addClass(
  CUSTOM_TYPE,
  [{
    name: "templateHTML",
    default: "<></>",
  },
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
    super(props);

  }
  get question() {
    return this.questionBase;
  }
  get html() {
    return this.question.templateHTML;
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

  // Support the read-only and design modes
  get style() {
    return this.question.getPropertyValue("readOnly") ||
      this.question.isDesignMode ? { pointerEvents: "none" } : undefined;
  }

  renderElement() {
    return (
      <div style={this.style}>
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header>Situation</Card.Header>
              <Card.Body>
                {this.situation.map((detail, _index) => (
                  <Card.Text>{detail}</Card.Text>
                ))}
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>Supplies / Resources</Card.Header>
              <Card.Body>
                {this.supplies.map((supplies, _index) => (
                  <Card.Text>
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
                {this.actions.map((action, _index) => (
                  <>
                    <Card.Text>{action.action}</Card.Text>
                    <Card.Text>{action.explanation}</Card.Text>
                  </>
                ))}
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>Patient A</Card.Header>
              <Card.Body>
                <Card.Text>Leaning against a wall, obvious penetrating abdominal wound with tissue exposed, inability to move or ambulate, voice responsive.</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>);
  }
}

// Register `StaticTemplate` as a class that renders `static-template` questions 
ReactQuestionFactory.Instance.registerQuestion(CUSTOM_TYPE, (props) => {
  return React.createElement(StaticTemplate, props);
});