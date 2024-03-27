import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { VisualizationPanel, VisualizerBase } from 'survey-analytics';
import 'survey-analytics/survey.analytics.min.css';
import './surveyResults.css';
import { Model } from 'survey-core';
import surveyConfig2x from '../Survey/surveyConfig2x.json';
import surveyConfig1x from '../Survey/surveyConfig1x.json'
import { Modal } from "@mui/material";
import { ResultsTable } from './resultsTable';
import CloseIcon from '@material-ui/icons/Close';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';


const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

function getQuestionAnswerSets(pageName, version) {
    const pagesFound = (version === 1 ? surveyConfig1x : surveyConfig2x).pages.filter((page) => page.name === pageName);
    if (pagesFound.length > 0) {
        const page = pagesFound[0];
        const surveyJson = { elements: [] };
        for (const el of page.elements) {
            let override = false;
            if (el.type === 'radiogroup') {
                if (el.name.includes("Given the information provided")) {
                    override = true;
                }
                surveyJson.elements.push({
                    name: el.name,
                    title: override ? "Given the information provided, I would prefer" : el.name,
                    type: "radiogroup",
                    choices: override ? el.choices.map((choice) => choice.substr(15)) : el.choices
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

function ScenarioGroup({ scenario, data, version }) {
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
            {singles?.map((singleton) => { return <SingleGraph key={singleton[0].pageName} data={singleton} version={version}></SingleGraph> })}
        </div>
        <div className='comparisons'>
            {comparisons?.map((comparison) => { return <SingleGraph key={comparison[0].pageName} data={comparison} version={version}></SingleGraph> })}
        </div>
    </div>);
}

function SingleGraph({ data, version }) {
    const [survey, setSurvey] = React.useState(null);
    const [vizPanel, setVizPanel] = React.useState(null);
    const [pageName, setPageName] = React.useState('Unknown Set');
    const [surveyResults, setSurveyResults] = React.useState([]);

    React.useEffect(() => {
        if (data.length > 0) {
            setPageName(data[0].pageName + ": Survey Results");
            // create a survey config based off of answers in the survey data
            const surveyJson = getQuestionAnswerSets(data[0].pageName, version);
            const curResults = [];
            for (const entry of data) {
                const entryResults = {};
                for (const q of Object.keys(entry.questions)) {
                    if (entry.questions[q].response?.includes("to delegate")) {
                        entryResults[q] = entry.questions[q].response.substr(15);
                    } else {
                        entryResults[q] = entry.questions[q].response;
                    }
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
        VisualizerBase.customColors = ["green", "lightgreen", "lightblue", "orange", "red"];
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
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
    });
    const [scenarioIndices, setScenarioIndices] = React.useState(null);
    const [selectedScenario, setSelectedScenario] = React.useState(-1);
    const [resultData, setResultData] = React.useState(null);
    const [showTable, setShowTable] = React.useState(false);
    const [filterBySurveyVersion, setVersionOption] = React.useState("");
    const [versions, setVersions] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState(null)

    React.useEffect(() => {
        if (data && filterBySurveyVersion) {
            const filteredData = data.getAllSurveyResults.filter(result => {
                if (!result.results) { return false; }
                return filterBySurveyVersion === (Math.floor(result.results.surveyVersion));
            });

            setFilteredData(filteredData);

            let indices = [];
            for (const result of filteredData) {
                if (result.results) {
                    for (const x of Object.keys(result.results)) {
                        if (result.results[x]?.scenarioIndex) {
                            indices.push(result.results[x].scenarioIndex);
                        }
                    }
                }
            }
            indices = Array.from(new Set(indices));
            indices.sort((a, b) => a - b);
            setScenarioIndices(indices);
            if (indices.length > 0) {
                setSelectedScenario(0);
            }
        }
    }, [filterBySurveyVersion, data]);

    React.useEffect(() => {
        if (filteredData) {
            const separatedData = {};
            for (const result of filteredData) {
                let obj = result;
                if (result.results) {
                    obj = result.results;
                }
                for (const x of Object.keys(obj)) {
                    const res = obj[x];
                    if (res?.scenarioIndex === selectedScenario) {
                        const indexBy = res.pageType + '_' + res.pageName;
                        if (Object.keys(separatedData).includes(indexBy)) {
                            separatedData[indexBy].push(res);
                        } else {
                            separatedData[indexBy] = [res];
                        }
                    }
                }
            }
            setResultData(separatedData);
        }
    }, [selectedScenario, filterBySurveyVersion]);

    // detect survey versions in data set
    React.useEffect(() => {
        if (!data) { return; }

        let detectedVersions = [];
        for (const result of data.getAllSurveyResults) {
            const obj = result.results;
            if (!obj || !obj.surveyVersion) { continue; }

            const majorVersion = String(obj.surveyVersion).charAt(0)
            if (majorVersion && detectedVersions.indexOf(majorVersion) === -1) {
                detectedVersions.push(majorVersion)
            }
        }

        detectedVersions = detectedVersions.map(str => parseInt(str, 10))

        setVersions(detectedVersions);
    }, [data]);

    const closeModal = () => {
        setShowTable(false);
    }

    const updateVersions = (selected) => {
        setVersionOption(selected.target.value);
    };

    return (<>
        {loading && <p>Loading</p>}
        {error && <p>Error</p>}
        {data && <>
            <div className="selection-box">
                {!filterBySurveyVersion && (<center><h3>Select Major Version To View Graphs Or Select Tabulated Data</h3></center>)}
                <div className="selection-header">
                <FormControl className='version-select'>
                    <InputLabel>Survey Version</InputLabel>
                    <Select
                        value={filterBySurveyVersion}
                        label="Survey Version"
                        renderValue={(selected) => `${selected}.x`}
                        onChange={updateVersions}
                    >
                        {versions.map((v) => {
                            return <MenuItem key={v} value={v}>
                                <Checkbox checked={filterBySurveyVersion === v} />
                                <ListItemText primary={`${v}` + '.x'} />
                            </MenuItem>;
                        })}
                    </Select>
                </FormControl>
                <button className='navigateBtn' onClick={() => setShowTable(true)}>View Tabulated Data</button>
                </div>
                {filterBySurveyVersion && (
                    <>
                        <div className='selection-header'>{scenarioIndices?.length > 0 ? <h3>Select a Scenario to See Results:</h3> : <h3>No Survey Results Found</h3>}</div>
                        <section className="button-section">
                            {scenarioIndices?.map((index) => {
                                return <button key={"scenario_btn_" + index} disabled={index === selectedScenario} onClick={() => setSelectedScenario(index)} className="selection-btn">Scenario {index}</button>
                            })}
                        </section>
                    </>
                )}
            </div>
            {filterBySurveyVersion && selectedScenario > 0 && <ScenarioGroup scenario={selectedScenario} data={resultData} version={filterBySurveyVersion}></ScenarioGroup>}
            <Modal className='table-modal' open={showTable} onClose={closeModal}>
                <div className='modal-body'>
                    <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                    <ResultsTable data={data.getAllSurveyResults} />
                </div>
            </Modal>
        </>}
    </>);
}
