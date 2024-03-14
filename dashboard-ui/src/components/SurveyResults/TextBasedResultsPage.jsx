import React from 'react';
import 'survey-core/defaultV2.min.css';
import './surveyResults.css';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const GET_SCENARIO_RESULTS = gql`
    query GetScenarioREsults{
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
            setResults(responsesByScenario[scenarioChosen]);
        }
    }, [scenarioChosen]);

    const ResultsSection = () => {
        // display the results for the chosen scenario
        return (<div className="scenario-results">
            <div className="text-based-header">
                <h2>Text-Based Scenario Results for: {scenarioChosen}</h2>
            </div>
            {questionAnswerSets ?
                Object.keys(questionAnswerSets).map((qkey) => {
                    return (<div className='result-section' key={qkey}>
                        <h3 className='question-header'>{qkey}</h3>
                        {Object.keys(questionAnswerSets[qkey]).map((answer) => {
                            if (answer != 'total') {
                                return (<div key={qkey + '_' + answer}>
                                    {answer}: {questionAnswerSets[qkey][answer]} / {questionAnswerSets[qkey]['total']} = <b>{Math.floor((questionAnswerSets[qkey][answer] / questionAnswerSets[qkey]['total']) * 100)}%</b>
                                </div>);
                            }
                        })}
                    </div>);
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
