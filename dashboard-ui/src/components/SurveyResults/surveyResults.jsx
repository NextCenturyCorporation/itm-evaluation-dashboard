import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { VisualizationPanel, VisualizerBase } from 'survey-analytics';
import 'survey-analytics/survey.analytics.min.css';
import './surveyResults.css';
import { Model } from 'survey-core';
import { FormControlLabel, Modal, Radio, RadioGroup } from "@mui/material";
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
    else if (pageName.includes('vs') && [4, 5].includes(config.version)) {
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
    allowDragDrop: false,
    minWidth: "100%",
    allowSelection: false
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
            {singles?.map((singleton) => (
                <div className="graph-container" key={singleton[0].pageName}>
                    <SingleGraph data={singleton} version={version} />
                </div>
            ))}
            {comparisons?.map((comparison) => (
                <div className="graph-container" key={comparison[0].pageName}>
                    <SingleGraph data={comparison} version={version} />
                </div>
            ))}
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
            else if (version === 5 && data[0].v4Name) {
                surveyJson = getQuestionAnswerSets(data[0].origName, surveys['delegation_v5.0'], data[0].v4Name);
                setPageName((data[0].v4Name + ": Survey Results").replace('vs aligned vs misaligned', 'vs Aligned vs Misaligned'));
            }
            else if (version === 5)
                surveyJson = getQuestionAnswerSets(data[0].pageName, surveys['delegation_v5.0']);

            const curResults = data.map(entry => {
                const entryResults = {};
                for (const q of Object.keys(entry.questions)) {
                    entryResults[q] = entry.questions[q].response?.includes("to delegate")
                        ? entry.questions[q].response.substr(15)
                        : entry.questions[q].response;
                }
                return entryResults;
            });


            setSurveyResults(curResults);
            setSurvey(new Model(surveyJson));
        }
    }, [data, version, surveys]);

    React.useEffect(() => {
        if (survey && surveyResults.length > 0) {
            const newVizPanel = new VisualizationPanel(
                survey.getAllQuestions(),
                surveyResults,
                vizPanelOptions
            );
            newVizPanel.showToolbar = false;
            VisualizerBase.customColors = ["green", "lightgreen", "lightblue", "orange", "red"];
            setVizPanel(newVizPanel);
        }
    }, [survey, surveyResults]);

    React.useEffect(() => {
        if (vizPanel) {
            const vizElementId = "viz_" + pageName;
            const vizElement = document.getElementById(vizElementId);
            
            if (vizElement) {
                vizElement.innerHTML = "";
                vizPanel.render(vizElementId);
                
                const resizeObserver = new ResizeObserver(() => {
                    vizPanel.layout();
                });
                resizeObserver.observe(vizElement);

                return () => {
                    resizeObserver.disconnect();
                    if (vizElement) {
                        vizElement.innerHTML = "";
                    }
                };
            }
        }
    }, [vizPanel, pageName]);

    return (
        <div>
            <h3 className="page-name">
                {pageName.split(':')[0].slice(-3) === 'vs ' 
                    ? pageName.replace(' vs :', ':') 
                    : pageName.replace('vs  vs', 'vs')}
            </h3>
            <div id={"viz_" + pageName} />
        </div>
    );
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
    const [filterBySurveyVersion, setVersionOption] = React.useState(parseInt(useSelector(state => state?.configs?.currentSurveyVersion)));
    const [versions, setVersions] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState(null)
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    const [generalizePages, setGeneralization] = React.useState(true);
    const surveys = useSelector((state) => state.configs.surveyConfigs);

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

    const indexToScenarioName = (index) => {
        if (filterBySurveyVersion == 4 || filterBySurveyVersion == 5) { return index }
        const currentSurvey = Object.values(surveys).find(survey => survey.version == filterBySurveyVersion);
        const matchingPage = currentSurvey?.pages?.find(page => page.scenarioIndex == index);
        return matchingPage?.scenarioName ? matchingPage.scenarioName : `Scenario ${index}`
    }


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
                            const scenarioName = indexToScenarioName(scenarioIndex)
                            scenarios[scenarioIndex] = scenarioName;
                        }
                    }
                }
            }
            const sortedScenarios = Object.fromEntries(
                Object.entries(scenarios).sort(([,a],[,b]) => a.localeCompare(b))
            );
            setScenarioIndices(sortedScenarios);

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
                        const indexBy = (![4, 5].includes(filterBySurveyVersion) || !generalizePages) ? resCopy.pageType + '_' + resCopy.pageName : resCopy.pageType + '_' + resCopy.admAuthor + '_' + resCopy.admAlignment;
                        if ([4, 5].includes(filterBySurveyVersion) && generalizePages) {
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
        setGeneralization(event.target.value == 'Alignment');
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
                    <List component="nav" className="nav-list version-select" aria-label="secondary mailbox folder">
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
                        <List component="nav" className="nav-list scenario-list" aria-label="secondary mailbox folder">
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
                        {[4, 5].includes(filterBySurveyVersion) &&
                            <FormControlLabel className='prettyToggle' labelPlacement='top' control={<RadioGroup row defaultValue="Alignment" onChange={toggleGeneralizability}>
                                <FormControlLabel value="Alignment" control={<Radio />} label="Alignment" />
                                <FormControlLabel value="Medic" control={<Radio />} label="Medic" />
                            </RadioGroup>} label="View By:" />}
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
