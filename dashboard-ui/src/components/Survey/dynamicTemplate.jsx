import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import './template.css'
import Dynamic from "./dynamic";
import { isDefined } from "../AggregateResults/DataFunctions";

const CUSTOM_TYPE = "dynamic-template";

export class DynamicTemplateModel extends Question {
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

    get scenes() {
        return this.getPropertyValue("scenes")
    }

    set scenes(scenes) {
        this.setPropertyValue("scenes", scenes)
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
            name: "scenes",
            default: null
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
            defualt: ""
        },
        {
            name: "explanation",
            defualt: ""
        }
    ],
    function () {
        return new DynamicTemplateModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new DynamicTemplateModel(name);
});

// A class that renders questions of the new type in the UI
export class DynamicTemplate extends SurveyQuestionElementBase {
    constructor(props) {
        super(props);
        this.state = {
            userActions: [],
        };
        this.updateActionLogs = this.updateActionLogs.bind(this)
    }

    get question() {
        return this.questionBase;
    }
    get dmName() {
        return this.question.dmName;
    }
    get actions() {
        return this.question.actions;
    }
    get supplies() {
        return this.question.supplies;
    }
    get situation() {
        return this.question.situation;
    }
    get patients() {
        return this.question.patients;
    }
    get decision() {
        return this.question.decision;
    }
    get explanation() {
        return this.question.explanation;
    }
    get scenes() {
        return isDefined(this.question.scenes) ? this.question.scenes : null;
    }

    updateActionLogs = (newAction) => {
        this.setState( prevState => ({
            userActions: [...prevState.userActions, newAction]
        }), () => {
            this.question.value = this.state.userActions
        })
    }

    renderElement() {

        return (
            <Dynamic 
                patients={this.patients} 
                situation={this.situation} 
                supplies={this.supplies} 
                decision={this.decision} 
                dmName={this.dmName}
                actions={this.actions}
                scenes={this.scenes}
                explanation={this.explanation}
                showModal={false}
                updateActionLogs={this.updateActionLogs}
            />
        )
    }
}