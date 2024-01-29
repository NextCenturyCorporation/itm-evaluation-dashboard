import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { VisualizationPanel } from 'survey-analytics';
import 'survey-analytics/survey.analytics.min.css';
import './surveyResults.css';
import { Model } from 'survey-core';
import surveyConfig from '../Survey/surveyConfig.json';

const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

function getQuestionAnswerSets(pageName) {
    const pagesFound = surveyConfig.pages.filter((page) => page.name == pageName);
    if (pagesFound.length > 0) {
        const page = pagesFound[0];
        const surveyJson = { elements: [] };
        for (const el of page.elements) {
            if (el.type == 'radiogroup') {
                surveyJson.elements.push({
                    name: el.name,
                    title: el.name,
                    type: "radiogroup",
                    choices: el.choices
                });
            }
        }
        return surveyJson;
    }
    return {};
}

const vizPanelOptions = {
    allowHideQuestions: false
}

function ScenarioGroup({ scenario, data }) {
    const [singles, setSingles] = React.useState([]);
    const [comparisons, setComparisons] = React.useState([]);

    React.useEffect(() => {
        if (data) {
            const singleData = [];
            const comparisonData = [];
            for (const k of Object.keys(data)) {
                if (k.includes('singleMedic')) {
                    singleData.push(data[k]);
                }
                else if (k.includes('comparison')) {
                    comparisonData.push(data[k]);
                }
            }
            setSingles([...singleData]);
            setComparisons([...comparisonData]);
        }
    }, [data]);

    return (<div className='scenario-group'>
        <h2 className='scenario-header'>Scenario {scenario}</h2>
        <div className='singletons'>
            {singles?.map((singleton) => { return <SingleGraph key={singleton[0].pageName} data={singleton}></SingleGraph> })}
        </div>
        <div className='comparisons'>
            {comparisons?.map((comparison) => { return <SingleGraph key={comparison[0].pageName} data={comparison}></SingleGraph> })}
        </div>
    </div>);
}

function SingleGraph({ data }) {
    const [survey, setSurvey] = React.useState(null);
    const [vizPanel, setVizPanel] = React.useState(null);
    const [pageName, setPageName] = React.useState('Unknown Set');
    const [surveyResults, setSurveyResults] = React.useState([]);

    React.useEffect(() => {
        if (data.length > 0) {

            setPageName(data[0].pageName + ": Survey Results");
            // create a survey config based off of answers in the survey data
            const surveyJson = getQuestionAnswerSets(data[0].pageName);
            const curResults = [];
            for (const entry of data) {
                const entryResults = {};
                for (const q of Object.keys(entry.questions)) {
                    entryResults[q] = entry.questions[q].response;
                }
                curResults.push(entryResults);
            }
            setSurveyResults([...curResults]);
            const survey = new Model(surveyJson);
            setSurvey(survey);
        }
    }, [data]);

    if (!vizPanel && !!survey) {
        const vizPanel = new VisualizationPanel(
            survey.getAllQuestions(),
            surveyResults,
            vizPanelOptions
        );
        vizPanel.showToolbar = false;
        setVizPanel(vizPanel);
    }

    React.useEffect(() => {
        if (vizPanel) {
            vizPanel.render("viz_" + pageName);
            return () => {
                document.getElementById("viz_" + pageName).innerHTML = "";
            }
        }
    }, [vizPanel]);


    return (<div>
        <h3 className="page-name">{pageName}</h3>
        <div id={"viz_" + pageName} />
    </div>);
}


export function SurveyResults() {
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS);
    const [scenarioIndices, setScenarioIndices] = React.useState(null);
    const [selectedScenario, setSelectedScenario] = React.useState(-1);
    const [resultData, setResultData] = React.useState(null);

    React.useEffect(() => {
        if (data) {
            const separatedData = {};
            for (const result of data.getAllSurveyResults) {
                if (result.results) {
                    for (const x of Object.keys(result.results)) {
                        const res = result.results[x];
                        if (res.scenarioIndex === selectedScenario) {
                            // TODO: prep data to send to surveyGroup
                            const indexBy = res.pageType + '_' + res.pageName;
                            if (Object.keys(separatedData).includes(indexBy)) {
                                separatedData[indexBy].push(res);
                            } else {
                                separatedData[indexBy] = [res];
                            }
                        }
                    }
                }
            }
            setResultData(separatedData);
        }
    }, [selectedScenario]);

    if (!scenarioIndices && data) {
        // go through data to find all scenario indicies
        let indices = [];
        for (const result of data.getAllSurveyResults) {
            if (result.results) {
                for (const x of Object.keys(result.results)) {
                    if (result.results[x].scenarioIndex) {
                        indices.push(result.results[x].scenarioIndex);
                    }
                }
            }
        }
        indices = Array.from(new Set(indices));
        indices.sort((a, b) => a - b);
        setScenarioIndices([...indices]);
        if (indices.length > 0) {
            setSelectedScenario(1);
        }
    }


    return (<>
        {loading && <p>Loading</p>}
        {error && <p>Error</p>}
        {data && <>
            <div className="selection-box">
                {scenarioIndices?.length > 0 ? <h3>Select a Scenario to See Results:</h3> : <h3>No Survey Results Found</h3>}
                <section className="button-section">
                    {scenarioIndices?.map((index) => {
                        return <button key={"scenario_btn_" + index} disabled={index === selectedScenario} onClick={() => setSelectedScenario(index)} className="selection-btn">Scenario {index}</button>
                    })}
                </section>
            </div>
            {selectedScenario > 0 && <ScenarioGroup scenario={selectedScenario} data={resultData}></ScenarioGroup>}

        </>}
    </>);
}
