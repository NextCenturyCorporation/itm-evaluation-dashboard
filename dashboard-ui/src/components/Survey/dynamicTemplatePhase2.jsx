import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import '../../css/template.css';
import DynamicPhase2 from "./dynamicPhase2";
import { isDefined } from "../AggregateResults/DataFunctions";
const CUSTOM_TYPE = "dynamic-template-phase-2";

export class DynamicTemplatePhase2Model extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    setValueCore(newValue) {
        super.setValueCore(newValue);
    }

    get rows() {
        return this.getPropertyValue("rows")
    }

    set rows(rows) {
        this.setPropertyValue("rows", rows)
    }
}

Serializer.addClass(
    CUSTOM_TYPE,
    [
        {
            name: "rows",
            default: []
        
        }
    ],
    function () {
        return new DynamicTemplatePhase2Model("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new DynamicTemplatePhase2Model(name);
});

// A class that renders questions of the new type in the UI
export class DynamicTemplatePhase2 extends SurveyQuestionElementBase {
    constructor(props) {
        super(props);
        this.state = {
            userActions: [],
        };
        this.updateActionLogs = this.updateActionLogs.bind(this);
        // review pages need parent.data, the actual survey needs parent.jsonObj
        this.scenarioIndex = this.question.parent.jsonObj.scenarioIndex;
        if (!isDefined(this.scenarioIndex)) {
            this.scenarioIndex = this.question.parent.data.jsonObj.scenarioIndex;
        }
    }

    updateActionLogs = (newAction) => {
        this.setState( prevState => ({
            userActions: [...prevState.userActions, newAction]
        }), () => {
            this.question.value = this.state.userActions
        })
    }

    get question() {
        return this.questionBase;
    }

    get rows(){
        return this.question.rows;
    }

    renderElement() {
        return (
            <DynamicPhase2 rows={this.rows}/>
        )
    }
}