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

const surveyJson = {
    elements: [{
        name: "satisfaction-score",
        title: "How would you describe your experience with our product?",
        type: "radiogroup",
        choices: [
            { value: 5, text: "Fully satisfying" },
            { value: 4, text: "Generally satisfying" },
            { value: 3, text: "Neutral" },
            { value: 2, text: "Rather unsatisfying" },
            { value: 1, text: "Not satisfying at all" }
        ],
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

export default function SurveyResultsPage() {
    const [survey, setSurvey] = useState(null);
    const [vizPanel, setVizPanel] = useState(null);
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS);

    console.log(data.getAllSurveyResults[0])
    if (!survey) {
        const survey = new Model(surveyJson);
        setSurvey(survey);
    }

    if (!vizPanel && !!survey) {
        const vizPanel = new VisualizationPanel(
            survey.getAllQuestions(),
            surveyResults,
            vizPanelOptions
        );
        vizPanel.showToolbar = false;
        setVizPanel(vizPanel);
    }

    useEffect(() => {
        vizPanel.render("surveyVizPanel");
        return () => {
            document.getElementById("surveyVizPanel").innerHTML = "";
        }
    }, [vizPanel]);

    return (
        <div id="surveyVizPanel" />
    );
}
