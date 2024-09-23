import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { VisualizationPanel, VisualizerBase } from 'survey-analytics';
import 'survey-analytics/survey.analytics.min.css';
import './surveyResults.css';
import { Model } from 'survey-core';
import { FormControlLabel, Modal, Switch } from "@mui/material";
import { ResultsTable } from './resultsTable';
import CloseIcon from '@material-ui/icons/Close';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@mui/material/IconButton';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { useSelector } from 'react-redux';


const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

function getQuestionAnswerSets(pageName, config, genericName = null) {
    const pagesFound = config.pages.filter((page) => page.name === pageName);
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
                    name: (genericName ? (genericName.split(':')[0] + ':' + el.name.slice(9)).replace('::', ':') : el.name),
                    title: override ? "Given the information provided, I would prefer" : (genericName ? (genericName.split(':')[0] + ':' + el.name.slice(9)).replace('::', ':') : el.name),
                    type: "radiogroup",
                    choices: override ? el.choices.map((choice) => choice.substr(15)) : el.choices
                });
            }
        }
        return surveyJson;
    }
    else if (pageName.includes('vs') && config.version == 4) {
        // comparison pages are created during runtime in version 4, so we need to handle them differently
        const surveyJson = { elements: [] };
        const bname = pageName.split(' vs ')[0].trim();
        const aname = pageName.split(' vs ')[1].trim();
        const mname = pageName.split(' vs ')[2].trim();
        if (aname != '' && mname != '') {
            surveyJson.elements.push({
                name: genericName ? "Aligned vs Baseline: Forced Choice" : aname + " vs " + bname + ": Forced Choice",
                title: genericName ? "Aligned vs Baseline: Forced Choice" : aname + " vs " + bname + ": Forced Choice",
                type: "radiogroup",
                choices: genericName ? ["Aligned", "Baseline"] : [aname, bname]
            });
            surveyJson.elements.push({
                name: (genericName ? "Aligned vs Baseline" : aname + " vs " + bname) + ": Rate your confidence about the delegation decision indicated in the previous question",
                title: genericName ? "Aligned vs Baseline: Delegation Confidence" : aname + " vs " + bname + ": Delegation Confidence",
                type: "radiogroup",
                choices: ["Not confident at all", "Not confident", "Somewhat confident", "Confident", "Completely confident"]
            });
            surveyJson.elements.push({
                name: genericName ? "Aligned vs Misaligned: Forced Choice" : aname + " vs " + mname + ": Forced Choice",
                title: genericName ? "Aligned vs Misaligned: Forced Choice" : aname + " vs " + mname + ": Forced Choice",
                type: "radiogroup",
                choices: genericName ? ["Aligned", "Misaligned"] : [aname, mname]
            });
            surveyJson.elements.push({
                name: (genericName ? "Aligned vs Baseline" : aname + " vs " + mname) + ": Rate your confidence about the delegation decision indicated in the previous question",
                title: genericName ? "Aligned vs Misaligned: Delegation Confidence" : aname + " vs " + mname + ": Delegation Confidence",
                type: "radiogroup",
                choices: ["Not confident at all", "Not confident", "Somewhat confident", "Confident", "Completely confident"]
            });
        }
        else {
            const secondName = mname == '' ? aname : mname;
            surveyJson.elements.push({
                name: genericName ? ((secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") + "Forced Choice") : (secondName + " vs " + bname + ": Forced Choice"),
                title: genericName ? ((secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") + "Forced Choice") : (secondName + " vs " + bname + ": Forced Choice"),
                type: "radiogroup",
                choices: genericName ? [secondName == mname ? "Misaligned" : "Aligned", "Baseline"] : [secondName, bname]
            });
            surveyJson.elements.push({
                name: (genericName ? (secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") : (secondName + " vs " + bname)) + ": Rate your confidence about the delegation decision indicated in the previous question",
                title: genericName ? ((secondName == mname ? "Misaligned vs Baseline: " : "Aligned vs Baseline: ") + "Delegation Confidence") : (secondName + " vs " + bname + ": Delegation Confidence"),
                type: "radiogroup",
                choices: ["Not confident at all", "Not confident", "Somewhat confident", "Confident", "Completely confident"]
            });
        }

        return surveyJson;
    }
    return {};
}

const vizPanelOptions = {
    allowHideQuestions: false,
    defaultChartType: "bar",
    labelTruncateLength: -1,
    showPercentages: true,
    allowDragDrop: false
}

function ScenarioGroup({ scenario, scenarioIndices, data, version }) {
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
        <h2 className='scenario-header'>{scenarioIndices[String(scenario)]}</h2>
        <div className='singletons'>
            {singles?.map((singleton) => { return <SingleGraph key={singleton[0].pageName} data={singleton} version={version}></SingleGraph> })}
        </div>
        <div className={version == 4 ? 'singletons' : 'comparisons'}>
            {comparisons?.map((comparison) => { return <SingleGraph key={comparison[0].pageName} data={comparison} version={version}></SingleGraph> })}
        </div>
    </div>);
}

function SingleGraph({ data, version }) {
    const [survey, setSurvey] = React.useState(null);
    const [vizPanel, setVizPanel] = React.useState(null);
    const [pageName, setPageName] = React.useState('Unknown Set');
    const [surveyResults, setSurveyResults] = React.useState([]);
    const surveys = useSelector((state) => state.configs.surveyConfigs);

    React.useEffect(() => {
        if (data.length > 0) {
            setPageName(data[0].pageName + ": Survey Results");
            let surveyJson = [];
            if (version === 1)
                surveyJson = getQuestionAnswerSets(data[0].pageName, surveys['delegation_v1.0']);
            else if (version === 2)
                surveyJson = getQuestionAnswerSets(data[0].pageName, surveys['delegation_v2.0']);
            else if (version === 3)
                surveyJson = getQuestionAnswerSets(data[0].pageName, surveys['delegation_v3.0']);
            else if (version === 4 && data[0].v4Name) {
                surveyJson = getQuestionAnswerSets(data[0].origName, surveys['delegation_v4.0'], data[0].v4Name);
                setPageName((data[0].v4Name + ": Survey Results").replace('vs aligned vs misaligned', 'vs Aligned vs Misaligned'));
            }
            else if (version === 4)
                surveyJson = getQuestionAnswerSets(data[0].pageName, surveys['delegation_v4.0']);

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
    }, [data, version, surveys]);

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
                if (document.getElementById("viz_" + pageName))
                    document.getElementById("viz_" + pageName).innerHTML = "";
            }
        }
    }, [vizPanel, pageName]);


    return (<div>
        <h3 className="page-name">{pageName.split(':')[0].slice(-3) == 'vs ' ? pageName.replace(' vs :', ':') : pageName.replace('vs  vs', 'vs')}</h3>
        <div id={"viz_" + pageName} />
    </div>);
}


export function SurveyResults() {
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
    });
    const [scenarioIndices, setScenarioIndices] = React.useState(null);
    const [selectedScenario, setSelectedScenario] = React.useState("");
    const [resultData, setResultData] = React.useState(null);
    const [showTable, setShowTable] = React.useState(false);
    const [filterBySurveyVersion, setVersionOption] = React.useState("");
    const [versions, setVersions] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState(null)
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    const [generalizePages, setGeneralization] = React.useState(true);

    React.useEffect(() => {
        // component did mount
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            // component will unmount
            window.removeEventListener('scroll', toggleVisibility);
        }
    }, []);

    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };


    React.useEffect(() => {
        if (data && filterBySurveyVersion) {
            const filteredData = data.getAllSurveyResults.filter(result => {
                if (!result.results) { return false; }
                return filterBySurveyVersion === (Math.floor(result.results.surveyVersion));
            });

            setFilteredData(filteredData);

            let scenarios = {}
            for (const result of filteredData) {
                if (result.results) {
                    
                    for (const x of Object.keys(result.results)) {
                        if (result.results[x]?.scenarioIndex) {
                            const scenarioIndex = String(result.results[x].scenarioIndex);
                            const scenarioName = result.results[x]?.scenarioName || `Scenario ${scenarioIndex}`;
                            scenarios[scenarioIndex] = scenarioName;
                        }
                    }
                }
            }
            setScenarioIndices(scenarios);

            if (Object.keys(scenarios).length > 0) {
                setSelectedScenario("");
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
                    if (String(res?.scenarioIndex) === String(selectedScenario)) {
                        const resCopy = structuredClone(res);
                        const indexBy = (filterBySurveyVersion != 4 || !generalizePages) ? resCopy.pageType + '_' + resCopy.pageName : resCopy.pageType + '_' + resCopy.admAuthor + '_' + resCopy.admAlignment;
                        if (filterBySurveyVersion == 4 && generalizePages) {
                            resCopy.v4Name = resCopy.admAuthor.replace('TAD', 'Parallax').replace('kitware', 'Kitware') + ' ' + resCopy.admAlignment[0].toUpperCase() + resCopy.admAlignment.slice(1);
                            resCopy.origName = resCopy.pageName;
                            resCopy.pageName = resCopy.v4Name;
                            // update question names for generalizing data
                            if (resCopy.questions) {
                                for (const q of Object.keys(resCopy.questions)) {
                                    if (resCopy.pageType.includes('single')) {
                                        const newQ = (resCopy.admAuthor.replace('TAD', 'Parallax').replace('kitware', 'Kitware') + ' ' + resCopy.admAlignment[0].toUpperCase() + resCopy.admAlignment.slice(1) + ':' + q.slice(9)).replace('::', ':');
                                        resCopy.questions[newQ] = resCopy.questions[q];
                                    }
                                    else {
                                        const pageADMs = resCopy.origName.split(' vs ');
                                        const qADMs = q.split(':')[0].split(' vs ');
                                        const newQ = (qADMs[0] == pageADMs[1] ? 'Aligned' : 'Misaligned') + ' vs ' + (qADMs[1] == pageADMs[0] ? 'Baseline' : 'Misaligned') + ':' + q.split(':')[1];
                                        if (q.includes('Forced')) {
                                            resCopy.questions[newQ] = { 'response': resCopy.questions[q].response == pageADMs[0] ? 'Baseline' : resCopy.questions[q].response == pageADMs[1] ? 'Aligned' : 'Misaligned' };
                                        }
                                        else {
                                            resCopy.questions[newQ] = resCopy.questions[q];
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            resCopy.v4Name = undefined;
                        }
                        if (Object.keys(separatedData).includes(indexBy)) {
                            separatedData[indexBy].push(resCopy);
                        } else {
                            separatedData[indexBy] = [resCopy];
                        }
                    }

                }
            }
            setResultData(separatedData);
        }
    }, [selectedScenario, filterBySurveyVersion, filteredData, generalizePages]);

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

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const toggleGeneralizability = (event) => {
        setGeneralization(event.target.checked);
    }

    return (<div className="delegation-results">
        {loading && <p>Loading</p>}
        {error && <p>Error</p>}
        {data && <>
            <div className="delegation-results-nav">
                <div className="selection-section">
                    <div className="nav-header">
                        <span className="nav-header-text">Survey Version</span>
                    </div>
                    <List component="nav" className="nav-list" aria-label="secondary mailbox folder">
                        {versions.map((item) =>
                            <ListItem id={"version_" + item} key={"version_" + item}
                                button
                                selected={filterBySurveyVersion === item}
                                onClick={() => { setVersionOption(item); setSelectedScenario(""); }}>
                                <ListItemText primary={item + '.x'} />
                            </ListItem>
                        )}
                    </List>
                </div>
                {scenarioIndices && Object.keys(scenarioIndices).length > 0 &&
                    <div className="selection-section">
                        <div className="nav-header">
                            <span className="nav-header-text">Scenario</span>
                        </div>
                        <List component="nav" className="nav-list" aria-label="secondary mailbox folder">
                            {Object.entries(scenarioIndices).map(([index, name]) =>
                                <ListItem id={"scenario_" + index} key={"scenario_" + index}
                                    button
                                    selected={String(selectedScenario) === String(index)}
                                    onClick={() => { 
                                        setSelectedScenario(String(index)); 
                                        }}>
                                    <ListItemText primary={name} />
                                </ListItem>
                            )}
                        </List>
                    </div>}
            </div>
            {filterBySurveyVersion && selectedScenario != "" ?
                <div className="graph-section">
                    <div className="options">
                        {filterBySurveyVersion == 4 &&
                            <FormControlLabel className='prettyToggle' labelPlacement='top' control={<Switch defaultChecked onChange={toggleGeneralizability} />} label="Generalize Data" />}
                        <button className='navigateBtn' onClick={() => setShowTable(true)}>View Tabulated Data</button>
                    </div>
                    <ScenarioGroup scenario={selectedScenario} scenarioIndices={scenarioIndices} data={resultData} version={filterBySurveyVersion} />
                </div>
                :
                <div className="graph-section">
                    <button className='navigateBtn' onClick={() => setShowTable(true)}>View Tabulated Data</button>
                    <h2>Please select a survey version and scenario to view graphical results</h2>
                </div>}
            <Modal className='table-modal' open={showTable} onClose={closeModal}>
                <div className='modal-body'>
                    <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                    <ResultsTable data={data.getAllSurveyResults} />
                </div>
            </Modal>
        </>}
        {showScrollButton && (
            <IconButton onClick={(e) => {
                e.stopPropagation()
                scrollToTop()
            }} style={{
                position: 'fixed',
                left: '20px',
                bottom: '20px',
                borderRadius: '10px',
                backgroundColor: '#592610',
                color: 'white',
                cursor: 'pointer',
                zIndex: 1000,
                boxShadow: '0px 2px 10px rgba(0,0,0,0.3)'
            }}>
                Back To Top <ArrowUpwardIcon fontSize='large' />
            </IconButton>
        )}
    </div>);
}
