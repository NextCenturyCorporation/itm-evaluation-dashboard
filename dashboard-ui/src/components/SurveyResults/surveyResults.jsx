import React, { useState, useEffect } from 'react';
import { VisualizationPanel } from 'survey-analytics';
import 'survey-analytics/survey.analytics.min.css';
import { Model } from 'survey-core';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';

const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

const surveyChoiceScale = [
    { value: 5, text: "Strongly agree" },
    { value: 4, text: "Agree" },
    { value: 3, text: "Neither agree nor disagree" },
    { value: 2, text: "Disagree" },
    { value: 1, text: "Strongly disagree" }
];

const scenariosAndDMs = {
    "Scenario 1": ["1", "2"],
    "Scenario 2": ["3", "4"],
    "Scenario 3": ["5", "6"],
    "Scenario 4": ["7", "8"]
};

const surveyJson = {
    elements: [{
        name: "agreement-score",
        title: "How would you describe your experience with our product?",
        type: "radiogroup",
        choices: surveyChoiceScale,
        isRequired: true
    }, {
        name: "nps-score",
        title: "On a scale of zero to ten, how likely are you to recommend our product to a friend or colleague?",
        type: "rating",
        rateMin: 0,
        rateMax: 10,
    }],
    showQuestionNumbers: "off",
    completedHtml: "Thank you for your feedback!",
};

const surveyResults = [{
    "satisfaction-score": 5,
    "nps-score": 10
}, {
    "satisfaction-score": 5,
    "nps-score": 9
}, {
    "satisfaction-score": 3,
    "nps-score": 6
}, {
    "satisfaction-score": 3,
    "nps-score": 6
}, {
    "satisfaction-score": 2,
    "nps-score": 3
}];

const vizPanelOptions = {
    allowHideQuestions: false
}

function ScenarioGroup({title, data}) {
    return (<></>);
}

export function SurveyResults() {
    const [survey, setSurvey] = useState(null);
    const [vizPanel, setVizPanel] = useState(null);
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS);

    // if (!survey && data) {
    //     // create a survey config based off of answers in the survey data
    //     const surveyJson = {elements:[]};
    //     surveyJson.elements.push({
    //         name: 'x',
    //         title: 'x',
    //         type: "radiogroup",
    //         choices: surveyChoiceScale
    //     });
    //     const survey = new Model(surveyJson);
    //     setSurvey(survey);
    // }

    // if (!vizPanel && !!survey) {
    //     const vizPanel = new VisualizationPanel(
    //         survey.getAllQuestions(),
    //         surveyResults,
    //         vizPanelOptions
    //     );
    //     vizPanel.showToolbar = false;
    //     setVizPanel(vizPanel);
    // }

    useEffect(() => {
        if (!loading && !error) {
            console.log(data);
            vizPanel.render("surveyVizPanel");
            return () => {
                document.getElementById("surveyVizPanel").innerHTML = "";
            }
        }
    }, [vizPanel, loading, error]);

    return (
        <>
            {loading && <p>Loading</p>}
            {error && <p>Error</p>}
            {data && <>
            <ScenarioGroup title="test" data={{"test": 123}} />
            </>}
        </>
    );
}

