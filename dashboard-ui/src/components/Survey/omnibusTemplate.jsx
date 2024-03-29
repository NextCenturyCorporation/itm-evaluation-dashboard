import React from "react";
import { ElementFactory, Question, Serializer } from "survey-core";
import { SurveyQuestionElementBase } from "survey-react-ui";
import { Accordion } from "react-bootstrap";
import Dynamic from "./dynamic";
import surveyConfig2x from './surveyConfig2x.json';
import './template.css'


const CUSTOM_TYPE = "omnibus";

export class OmnibusModel extends Question {
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
        return new OmnibusModel("");
    },
    "question"
);

ElementFactory.Instance.registerElement(CUSTOM_TYPE, (name) => {
    return new OmnibusModel(name);
});


export class Omnibus extends SurveyQuestionElementBase {

    constructor(props) {
        super(props);

        this.state = {
            dmDetails: []
        }
    }

    get question() {
        return this.questionBase;
    }

    get decisionMakers() {
        return this.question.decisionMakers;
    }

    componentDidMount() {
        let config = surveyConfig2x
        let decisionMakers = this.decisionMakers;
        // in case of duplicates somehow
        decisionMakers = [...new Set(decisionMakers)];
        let relevantPages = config.pages.filter(page => decisionMakers.includes(page.name));
        let dmDetails = relevantPages.map(page => page.elements[0]);
        //extra cleansing of any potential duplicates
        dmDetails = Array.from(new Set(dmDetails.map(detail => JSON.stringify(detail)))).map(str => JSON.parse(str));
        this.question.value = decisionMakers

        this.setState({ dmDetails });
    }

    renderElement() {
        const { dmDetails } = this.state;
        return (
            <Accordion alwaysOpen defaultActiveKey={['0', '1', '2', '3']}>
                {dmDetails.map((dm, index) => (
                    <Accordion.Item eventKey={index.toString()} key={dm.name}>
                        <Accordion.Header>Scenario</Accordion.Header>
                        <Accordion.Body>
                            <Dynamic
                                actions={dm.actions}
                                decision={dm.decision}
                                explanation={dm.explanation}
                                dmName={dm.name}
                                patients={dm.patients}
                                situation={dm.situation}
                                supplies={dm.supplies}
                                showModal={false}
                            />
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>
        )
    }
}
