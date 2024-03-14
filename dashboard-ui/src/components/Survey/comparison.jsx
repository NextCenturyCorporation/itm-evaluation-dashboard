import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Button, Modal } from "react-bootstrap";
import Dynamic from "./dynamic";
import surveyConfig from './surveyConfig.json';
import './template.css'


const CUSTOM_TYPE = "comparison";

export class ComparisonModel extends Question {
    getType() {
        return CUSTOM_TYPE;
    }

    // return the decisionMakers as the question value
    getValue() {
        return this.decisionMakers;
    }

    setValue(newValue, locNotification) {
        super.setValue(newValue, locNotification);
        this.decisionMakers = newValue;
    }

    get decisionMakers() {
        return this.getPropertyValue("decisionMakers");
    }

    set decisionMakers(decisionMakers) {
        this.setPropertyValue("decisionMakers", decisionMakers);
    }
}

Serializer.addClass(
    CUSTOM_TYPE,
    [
        {
            name: "decisionMakers",
            default: []
        }
    ],
    function () {
        return new ComparisonModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new ComparisonModel(name);
});


export class Comparison extends SurveyQuestionElementBase {

    constructor(props) {
        super(props);

        this.state = {
            dmDetails: [],
            showModal: false
        }

        this.dm = ' '
    }

    get question() {
        return this.questionBase;
    }

    get decisionMakers() {
        return this.question.decisionMakers;
    }

    componentDidMount() {
        let config = surveyConfig
        let decisionMakers = this.decisionMakers;
        // in case of duplicates somehow
        decisionMakers = [...new Set(decisionMakers)];
        let relevantPages = config.pages.filter(page => decisionMakers.includes(page.name));
        let dmDetails = relevantPages.map(page => page.elements[0]);
        //extra cleansing of any potential duplicates
        dmDetails = Array.from(new Set(dmDetails.map(detail => JSON.stringify(detail)))).map(str => JSON.parse(str));
        console.log(dmDetails)
        this.question.value = decisionMakers

        this.setState({ dmDetails });
    }

    handleShowModal = (content) => {
        console.log(content)
        this.dm = content
        this.setState({ showModal: true});
    };

    handleCloseModal = () => {
        this.setState({ showModal: false});
    };

    renderElement() {
        return (
            <>
            {this.state.dmDetails.map((dm, index) => (
                    <Button key={dm.name} className="mx-3" onClick={() => this.handleShowModal(dm)}>
                        {dm.dmName}
                    </Button>
            ))}
            <Modal show={this.state.showModal} onHide={this.handleCloseModal} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>{this.dm.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Dynamic
                        patients={this.dm.patients} 
                        situation={this.dm.situation} 
                        supplies={this.dm.supplies} 
                        decision={this.dm.decision} 
                        dmName={this.dm.dmName}
                        actions={this.dm.actions}
                        explanation={this.dm.explanation}
                        showModal={false}
                    />
                </Modal.Body>
            </Modal>
            </>
        )
    }
}
