import React from 'react';
import 'survey-core/defaultV2.min.css';
import './surveyResults.css';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { VisualizationPanel } from 'survey-analytics';
import { Model } from 'survey-core';

const GET_SCENARIO_RESULTS = gql`
    query GetScenarioResults{
        getAllScenarioResults
    }`;

const SCENARIO_OPTIONS = [
    "Adept Urban",
    "Adept Submarine",
    "Adept Desert",
    "Adept Jungle",
    "SoarTech Urban",
    "SoarTech Submarine",
    "SoarTech Desert",
    "SoarTech Jungle"
];

function shortenAnswer(answer) {
    switch (answer) {
        case 'I mostly considered the potential to save the most lives.':
            return "Save the Most Lives";
        case 'I considered the intent to cause harm and the degree of responsibility for the situation.':
            return "Intent to Cause Harm/Responsibility";
        case 'I primarily considered the likely medical impact and tried to save the most lives.':
            return "Medical Impact/Save the Most Lives";
        case 'The patient further from the IED':
            return "Patient further from IED"
        case 'The patient closer to the IED':
            return "Patient closer to IED";
        case 'Perform vitals assessment on Casualty W':
            return "Vitals: Casualty W";
        case 'Perform vitals assessment on Casualty X':
            return "Vitals: Casualty X";
        case 'Perform vitals assessment on Casualty V':
            return "Vitals: Casualty V";
        case 'Assess Casualty W for internal bleeding':
            return "Assess Casualty W";
        case 'Assess Casualty X for pelvic fracture':
            return "Assess Casualty X";
        case 'Provide burn dressing with pain control':
            return "Burn dressing and pain control";
        case 'Plan to treat both by alternating bag valve mask (BVM) ':
            return "Treat both with BVM";
        case 'Do not treat and search for help':
            return 'Search for help';
        case 'Apply Pain Med/Aid Bag to Casualty U':
            return 'Treat Casualty U: Pain Meds/Aid Bag';
        case 'Call to find out if additional support is possible':
            return 'Call for support';
        case 'Move forward with evacuating without confirming care capabilities':
            return 'Evacuate';
        case 'Hold casualties to determine if they can be transported':
            return 'Hold for transport';
        case 'Transport Casualty V to local hospital':
            return 'Casualty V: transport to local hospital';
        case 'Apply Decompression Needle to Casualty W':
            return 'Casualty W: Needle Treatment';
        case 'Check respiration on Casualty W':
            return 'Casualty W: Respiration';
        case 'Not assessing local capabilities and move forward with evacuating':
            return 'Evacuate';
        default:
            return answer;
    }
}

function SingleGraph({ data, pageName }) {
    const [survey, setSurvey] = React.useState(null);
    const [vizPanel, setVizPanel] = React.useState(null);
    const [surveyResults, setSurveyResults] = React.useState([]);

    React.useEffect(() => {
        if (data) {
            // set survey question for graph
            const surveyJson = {
                elements: [{
                    name: pageName,
                    title: pageName,
                    type: "radiogroup",
                    choices: Object.keys(data).filter((x) => x !== 'total').map((x) => shortenAnswer(x))
                }]
            };
            console.log(data);
            const survey = new Model(surveyJson);
            console.log(survey);
            setSurvey(survey);
            // get results ready for graph
            const curResults = [];
            for (const answer of Object.keys(data)) {
                for (let i = 0; i < data[answer]; i++) {
                    const tmpResult = {};
                    tmpResult[pageName] = shortenAnswer(answer);
                    curResults.push(tmpResult);
                }
            }
            console.log(curResults);
            setSurveyResults([...curResults]);
        }
    }, [data]);

    const vizPanelOptions = {
        allowHideQuestions: false,
        defaultChartType: "bar",
        labelTruncateLength: -1,
        showPercentages: true,
        allowDragDrop: false
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

    React.useEffect(() => {
        if (vizPanel) {
            vizPanel.render("viz_" + pageName);
            return () => {
                document.getElementById("viz_" + pageName).innerHTML = "";
            }
        }
    }, [vizPanel]);


    return (<div id={"viz_" + pageName} className='full-width-graph' />);
}


export default function TextBasedResultsPage() {
    const [scenarioChosen, setScenario] = React.useState(SCENARIO_OPTIONS[0]);
    const { loading, error, data } = useQuery(GET_SCENARIO_RESULTS, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
    });
    const [responsesByScenario, setByScenario] = React.useState(null);
    const [questionAnswerSets, setResults] = React.useState(null);

    React.useEffect(() => {
        // populate responsesByScenario with gql data
        const tmpResponses = {};
        for (let opt of SCENARIO_OPTIONS) {
            tmpResponses[opt] = {};
        }
        if (data?.getAllScenarioResults) {
            for (const result of data.getAllScenarioResults) {
                let scenario = null;
                for (const k of Object.keys(result)) {
                    // find matching scenario for this set
                    scenario = SCENARIO_OPTIONS.filter((x) => k.toLowerCase().includes(x.toLowerCase()));
                    if (scenario.length > 0) {
                        scenario = scenario[0];
                        break;
                    }
                    else {
                        scenario = null;
                    }
                }
                if (scenario) {
                    // once the scenario is found, start populating object with data
                    // go through each item in the result object
                    for (const k of Object.keys(result)) {
                        // if it is an object and has a questions array...
                        if (typeof (result[k]) === 'object' && result[k].questions) {
                            // go through the questions object and find all that has responses
                            for (const q of Object.keys(result[k].questions)) {
                                if (result[k].questions[q].response) {
                                    const answer = result[k].questions[q].response;
                                    // for each response found, log the response and the key
                                    if (Object.keys(tmpResponses[scenario]).includes(q)) {
                                        if (Object.keys(tmpResponses[scenario][q]).includes(answer)) {
                                            tmpResponses[scenario][q][answer] += 1;
                                        }
                                        else {
                                            tmpResponses[scenario][q][answer] = 1;
                                        }
                                    }
                                    else {
                                        tmpResponses[scenario][q] = {};
                                        tmpResponses[scenario][q][answer] = 1;
                                    }
                                    if (Object.keys(tmpResponses[scenario][q]).includes('total')) {
                                        tmpResponses[scenario][q]['total'] += 1;
                                    }
                                    else {
                                        tmpResponses[scenario][q]['total'] = 1;
                                    }

                                }
                            }
                        }
                    }
                }
            }
            setByScenario(tmpResponses);
        }
    }, [data]);

    React.useEffect(() => {
        // only display results concerning the chosen scenario
        if (scenarioChosen && responsesByScenario && responsesByScenario[scenarioChosen]) {
            let found = false;
            for (const k of Object.keys(responsesByScenario[scenarioChosen])) {
                if (Object.keys(responsesByScenario[scenarioChosen][k]).length > 0) {
                    setResults(responsesByScenario[scenarioChosen]);
                    found = true;
                    break;
                }
            }
            if (!found) {
                setResults(null);
            }
        } else {
            setResults(null);
        }
    }, [scenarioChosen]);

    // const ResultsSection = () => {
    //     // display the results for the chosen scenario
    //     return (<div className="scenario-results">
    //         <div className="text-based-header">
    //             <h2>Text-Based Scenario Results for: {scenarioChosen}</h2>
    //         </div>
    //         {questionAnswerSets ?
    //             Object.keys(questionAnswerSets).map((qkey) => {
    //                 return (<div className='result-section' key={qkey}>
    //                     <h3 className='question-header'>{qkey}</h3>
    //                     {Object.keys(questionAnswerSets[qkey]).map((answer) => {
    //                         if (answer != 'total') {
    //                             return (<div key={qkey + '_' + answer}>
    //                                 {answer}: {questionAnswerSets[qkey][answer]} / {questionAnswerSets[qkey]['total']} = <b>{Math.floor((questionAnswerSets[qkey][answer] / questionAnswerSets[qkey]['total']) * 100)}%</b>
    //                             </div>);
    //                         }
    //                     })}
    //                 </div>);
    //             })
    //             : loading ? <h2 className="no-data">Loading Data...</h2> : <h2 className="no-data">No Data Found</h2>}
    //     </div>);
    // }

    const ResultsSection = () => {
        return (<div className="scenario-results2">
            {questionAnswerSets ?
                Object.keys(questionAnswerSets).map((qkey) => {
                    return (<SingleGraph key={qkey} data={questionAnswerSets[qkey]} pageName={qkey} />);
                })
                : loading ? <h2 className="no-data">Loading Data...</h2> : <h2 className="no-data">No Data Found</h2>}
        </div>);
    }

    return (<div className='text-results'>
        <div className='sidebar-options'>
            <h3 className='sidebar-title'>Scenario</h3>
            <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                {SCENARIO_OPTIONS.map((item) =>
                    <ListItem className="nav-list-item" id={"scenario_" + item} key={"scenario_" + item}
                        button
                        selected={scenarioChosen === item}
                        onClick={() => setScenario(item)}>
                        <ListItemText primary={item} />
                    </ListItem>
                )}
            </List>
        </div>
        {scenarioChosen && <ResultsSection />}
    </div>);
}
