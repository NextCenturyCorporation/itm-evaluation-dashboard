import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import '../../css/medical-scenario.css';
import store from '../../store/store';


const CUSTOM_TYPE = "phase2Text";

export class Phase2TextModel extends Question {
  getType() {
    return CUSTOM_TYPE;
  }

  get unstructured() {
    return this.getPropertyValue("unstructured");
  }

  set unstructured(unstructured) {
    this.setPropertyValue("unstructured", unstructured);
  }
}

Serializer.addClass(
  CUSTOM_TYPE,
  [
    { name: "unstructured", default: '' }
  ],
  function () {
    return new Phase2TextModel("");
  },
  "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
  return new Phase2TextModel(name);
});

export class Phase2Text extends SurveyQuestionElementBase {
  constructor(props) {
    super(props);
  }

  get question() {
    return this.questionBase;
  }

  get unstructured() {
    return this.question.unstructured;
  }


  renderElement() {

    return (
        <p>{this.unstructured}</p>
    );
  }
}