import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import '../../css/phase2Text.css';

const CUSTOM_TYPE = "phase2Text";

export class Phase2TextModel extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    get common_unstructured() {
        return this.getPropertyValue("common_unstructured");
    }

    set common_unstructured(common_unstructured) {
        this.setPropertyValue("common_unstructured", common_unstructured);
    }

    get probe_unstructured() {
        return this.getPropertyValue("probe_unstructured");
    }

    set probe_unstructured(probe_unstructured) {
        this.setPropertyValue("probe_unstructured", probe_unstructured);
    }
}

Serializer.addClass(
    CUSTOM_TYPE,
    [
        { name: "common_unstructured", default: '' },
        { name: "probe_unstructured", default: ''}
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

    /* Default constructor is left in case any future modifications are required
    constructor(props) {
        super(props);
    }
    */

    get question() {
        return this.questionBase;
    }

    get common_unstructured() {
        return this.question.common_unstructured;
    }

    get probe_unstructured() {
        return this.question.probe_unstructured;
    }

    renderElement() {
        // If both texts are present, show the differentiated layout
        if (this.probe_unstructured && this.probe_unstructured.trim()) {
            return (
                <div className="phase2-text-container">
                    <div className="phase2-common-section">
                        <div className="phase2-section-header">
                            <span className="phase2-section-label">Background</span>
                        </div>
                        <p className="phase2-common-text">{this.common_unstructured}</p>
                    </div>
                    <div className="phase2-probe-section">
                        <div className="phase2-section-header">
                            <span className="phase2-section-label">Scenario Details</span>
                        </div>
                        <p className="phase2-probe-text">{this.probe_unstructured}</p>
                    </div>
                </div>
            );
        }
        
        // Fallback to simple layout if only common text is present
        return (
            <div className="phase2-text-container">
                <p className="phase2-text-content">{this.common_unstructured}</p>
            </div>
        );
    }
}