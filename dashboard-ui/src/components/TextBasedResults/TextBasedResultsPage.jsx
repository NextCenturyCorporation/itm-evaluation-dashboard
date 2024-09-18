import React from 'react';
import 'survey-core/defaultV2.min.css';
import './TextResults.css';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { VisualizationPanel } from 'survey-analytics';
import { Model } from 'survey-core';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import Select from 'react-select';
import { useSelector } from 'react-redux';

let evalOptions = [];
const get_eval_name_numbers = gql`
    query getEvalIdsForAllScenarioResults{
        getEvalIdsForAllScenarioResults
  }`;

const GET_SCENARIO_RESULTS_BY_EVAL = gql`
    query getAllScenarioResultsByEval($evalNumber: Float!){
        getAllScenarioResultsByEval(evalNumber: $evalNumber)
  }`;

function shortenAnswer(answer) {
    // shortens an answer so the whole thing is visible and understandable without taking up too much screen real estate
    switch (answer) {
        case 'I mostly considered the potential to save the most lives.':
            return "Save the Most Lives";
        case 'I considered the intent to cause harm and the degree of responsibility for the situation.':
            return "Intent to Cause Harm/Responsibility";
        case 'I primarily considered the likely medical impact and tried to save the most lives.':
            return "Medical Impact/Save the Most Lives";
        case 'I considered the intent to cause harm, the degree of responsibility for the situation, and the potential to save the most lives.':
            return 'Intent to Cause Harm/Responsibility/Save the Most Lives';
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
        case 'Carefully divide the burn kit to cover the worst burns on each casualty':
            return 'Divide Burn Kit';
        case "Hold casualties until you get updated info on local hospital's capabilities to manage the casualties":
            return 'Hold until info on local hospital capabilities';
        case "Hold casualties until you get updated info on the capabilities of the embassy":
            return 'Hold until info on embassy capabilities';
        case "I considered the likely medical impact and also the intent to cause harm.":
            return "Medical Impact/Intent to Cause Harm";
        case "I considered the likely medical impact and also the degree of responsibility for the situation.":
            return "Medical Impact/Degree of Responsibility";
        case "Transport both casualties to the local hospital despite hospital availability":
            return "Transport both to hospital";
        case "Hold casualties to determine if they can be transported to safehouse":
            return "Hold for transport to safehouse";
        case "I considered the intent to cause harm, the degree of responsibility for the situation, and helpful things each patient had done.":
            return "Intent to Harm/Responsibility/Helpfulness of Patient";
        case "I considered the intent to cause harm, the degree of responsibility for the situation, the helpful things each patient had done, and the fact that the patients were from different groups":
            return "Intent/Responsibility/Helpfulness/Different Groups";
        case "Provide burn dressing with pain control (Burn kit)":
            return "Burn Kit";
        case "Perform an escharotomy (minor surgical kit)":
            return "Escharotomy";
        case "Get info on local hospital's capabilities to manage the casualties":
            return "Info on Local Hospital";
        case "Get info on the capabilities of the embassy to hold casualties until evacuation":
            return "Info on Embassy";
        case "I mostly considered the fact that the patients were from different groups.":
            return "Patients are from different groups";
        default:
            if (answer.includes("BVM")) {
                return "Treat both with BVM";
            }
            if (answer.includes("until you get updated info on the capabilities of the embassy")) {
                return 'Hold until info on embassy capabilities';
            }
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
                    title: data['question'],
                    type: "radiogroup",
                    choices: Object.keys(data).filter((x) => x !== 'total' && x !== 'question').map((x) => shortenAnswer(x))
                }]
            };
            const survey = new Model(surveyJson);
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
            setSurveyResults([...curResults]);
        }
    }, [data, pageName]);

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
                if (document.getElementById("viz_" + pageName))
                    document.getElementById("viz_" + pageName).innerHTML = "";
            }
        }
    }, [vizPanel, pageName]);


    return (
        <div className='graph-section'>
            <h3 className='question-header'>{pageName} (N={data['total']})</h3>
            <div id={"viz_" + pageName} className='full-width-graph' />
        </div>
    );
}


function getQuestionText(qkey, scenario) {
    const pagesForScenario = textBasedConfigs[scenario]['pages'];
    for (const page of pagesForScenario) {
        for (const res of page['elements']) {
            if (res['name'] === qkey && res['choices']) {
                // set title name
                return res['title'] + ' - ' + (scenario.includes("Adept") && qkey.includes("3") ? (qkey + 'a') : qkey.includes("Follow Up") ? (qkey.split("Follow Up")[0] + "3b") : qkey);
            }
        }
    }
    return qkey;
}


function ParticipantView({ data, scenarioName }) {
    const [organizedData, setOrganizedData] = React.useState(null);
    const [excelData, setExcelData] = React.useState(null);
    const [orderedHeaders, setHeaders] = React.useState([]);
    React.useEffect(() => {
        const formatted = {};
        const headers = ['Participant ID'];
        const excel = [];
        for (const page of data) {
            const obj = {
                'Participant ID': page['participantID']
            };
            formatted[page['_id']] = { ...obj };

            for (const key of Object.keys()) {
                if (key === 'highAlignmentData') {
                    if (!headers.includes('KDMA')) {
                        headers.push('KDMA')
                    }
                    formatted[page['_id']]['KDMA'] = page[key]['kdma_values'][0]['kdma'] + ' - ' + page[key]['kdma_values'][0]['value'].toFixed(2).toString();
                    obj['KDMA'] = page[key]['kdma_values'][0]['kdma'] + ' - ' + page[key]['kdma_values'][0]['value'].toFixed(2).toString();
                    continue;
                }
                if (key === 'alignmentData' || key === 'lowAlignmentData') {
                    continue;
                }
                // top level pages with timing
                const time_key = key + ' time (s)';
                if (typeof (page[key]) === 'object' && !Array.isArray(page[key])) {
                    if (!headers.includes(time_key)) {
                        headers.push(time_key);
                    }

                    formatted[page['_id']][time_key] = Math.round(page[key]['timeSpentOnPage'] * 100) / 100;
                    obj[time_key] = Math.round(page[key]['timeSpentOnPage'] * 100) / 100;
                    if (Object.keys(page[key]).includes('questions')) {
                        for (const q of Object.keys(page[key]['questions'])) {
                            if (Object.keys(page[key]['questions'][q]).includes('response')) {
                                if (!headers.includes(q)) {
                                    headers.push(q);
                                }
                                formatted[page['_id']][q] = page[key]['questions'][q]['response'];
                                obj[getQuestionText(q, scenarioName)] = page[key]['questions'][q]['response'];
                            }
                        }
                    }
                }
            }
            excel.push(obj);
        }
        setOrganizedData(formatted);
        setHeaders(headers);
        setExcelData(excel);
    }, [data, scenarioName]);

    const exportToExcel = async () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'text_result_data_' + scenarioName + fileExtension);
    };

    return (<div className="participant-text-results">
        <button onClick={exportToExcel}>Download Results</button>
        <div className="table-container">
            {organizedData && <table className="itm-table by-participant">
                <thead>
                    <tr>
                        {orderedHeaders.map((key) => {
                            return <th key={scenarioName + "_" + key}>{getQuestionText(key, scenarioName)}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(organizedData).map((k) => {
                        return <tr key={k}>
                            {orderedHeaders.map((h) => {
                                return <td key={k + '_' + h}>{Object.keys(organizedData[k]).includes(h) ? organizedData[k][h].toString() : '-'}</td>
                            })}
                        </tr>
                    })}
                </tbody>
            </table>}
        </div>
    </div>);
}


export default function TextBasedResultsPage() {
    const { loading: loadingEvalNames, error: errorEvalNames, data: evalIdOptionsRaw } = useQuery(get_eval_name_numbers);
    const [scenarioChosen, setScenario] = React.useState(null);
    const [dataFormat, setDataFormat] = React.useState("text")
    const [responsesByScenario, setByScenario] = React.useState(null);
    const [questionAnswerSets, setResults] = React.useState(null);
    const [participantBased, setParticipantBased] = React.useState(null);
    const [selectedEval, setSelectedEval] = React.useState(null);
    const [evalOptions, setEvalOptions] = React.useState([]);
    const [scenarioOptions, setScenarioOptions] = React.useState([]);
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    console.log(textBasedConfigs)

    const { loading, error, data } = useQuery(GET_SCENARIO_RESULTS_BY_EVAL, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
        variables: { "evalNumber": selectedEval },
        skip: !selectedEval
    });

    console.log(data)

    React.useEffect(() => {
        if (evalIdOptionsRaw?.getEvalIdsForAllScenarioResults) {
            const options = evalIdOptionsRaw.getEvalIdsForAllScenarioResults.map(result => ({
                value: result._id.evalNumber,
                label: result._id.evalName
            }));
            setEvalOptions(options);
        }
    }, [evalIdOptionsRaw]);

    React.useEffect(() => {
        // populate responsesByScenario with gql data
        const tmpResponses = {};
        const participants = {};
        const uniqueScenarios = new Set();

        if (data?.getAllScenarioResultsByEval) {
            for (const result of data.getAllScenarioResultsByEval) {
                if (result.scenario_id) {
                    uniqueScenarios.add(result.scenario_id)
                }

                let scenario = result.scenario_id;
                if (scenario) {
                    if (!tmpResponses[scenario]) {
                        tmpResponses[scenario] = {}
                        participants[scenario] = [] 
                    }

                    participants[scenario].push(result);
                    // once the scenario is found, start populating object with data
                    // go through each item in the result object
                    const pagesForScenario = textBasedConfigs[result['title']]['pages'];
                    let qs = [];
                    for (const k of Object.keys(result)) {
                        // if it is an object and has a questions array...
                        if (typeof (result[k]) === 'object' && result[k]?.questions) {
                            // go through the questions object and find all that has responses
                            for (const q of Object.keys(result[k].questions)) {
                                // start by getting *all* possible responses to the question
                                for (const page of pagesForScenario) {
                                    for (const res of page['elements']) {
                                        if (res['name'] === q && res['choices']) {
                                            for (const choice of res['choices']) {
                                                if (!Object.keys(tmpResponses[scenario]).includes(q)) {
                                                    tmpResponses[scenario][q] = {};
                                                }
                                                if (!Object.keys(tmpResponses[scenario][q]).includes(choice)) {
                                                    tmpResponses[scenario][q][choice] = 0;
                                                }
                                                // set title name
                                                tmpResponses[scenario][q]['question'] = res['title'];
                                            }
                                        }
                                    }

                                }
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
                                if (Object.keys(tmpResponses[scenario]).includes(q) && Object.keys(tmpResponses[scenario][q]).includes('question')) {
                                    // if duplicate questions are present, precede with "After inject"
                                    if (qs.includes(tmpResponses[scenario][q]['question'])) {
                                        tmpResponses[scenario][q]['question'] = 'After inject, ' + tmpResponses[scenario][q]['question'];
                                        qs = [];
                                    }
                                    qs.push(tmpResponses[scenario][q]['question']);
                                }
                            }
                        }

                    }
                }
            }
            setByScenario(tmpResponses);
            setParticipantBased(participants);
            setScenarioOptions(Array.from(uniqueScenarios));
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
    }, [scenarioChosen, responsesByScenario]);

    const TextResultsSection = () => {
        // display the results for the chosen scenario
        return (<div className="text-scenario-results">
            {questionAnswerSets ?
                Object.keys(questionAnswerSets).map((qkey, ind) => {
                    return (<div className='result-section' key={qkey + '_' + ind}>
                        <h3 className='question-header'>{qkey} (N={questionAnswerSets[qkey]['total']})</h3>
                        <p>{questionAnswerSets[qkey]['question']}</p>
                        <table className="itm-table text-result-table">
                            <thead>
                                <tr>
                                    <th className="answer-column">
                                        Answer
                                    </th>
                                    <th className="count-column">
                                        Count
                                    </th>
                                    <th className="count-column">
                                        Percentage
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(questionAnswerSets[qkey]).map((answer) => {
                                    if (answer !== 'total' && answer !== 'question') {
                                        return (<tr key={qkey + '_' + answer}>
                                            <td className="answer-column">{shortenAnswer(answer)}</td>
                                            <td className="count-column">{questionAnswerSets[qkey][answer]}</td>
                                            <td className="count-column"><b>{Math.floor((questionAnswerSets[qkey][answer] / questionAnswerSets[qkey]['total']) * 100)}%</b></td>
                                        </tr>);
                                    }
                                    return <></>;
                                })}
                            </tbody>
                        </table>
                    </div>);
                })
                : loading ? <h2 className="no-data">Loading Data...</h2> : error ? <h2 className="no-data">Error fetching data</h2> : <h2 className="no-data">No Data Found</h2>}
        </div>);
    }

    const ChartedResultsSection = () => {
        return (<div className="chart-scenario-results">
            {questionAnswerSets ?
                Object.keys(questionAnswerSets).map((qkey) => {
                    return (<SingleGraph key={qkey} data={questionAnswerSets[qkey]} pageName={qkey} />);
                })
                : loading ? <h2 className="no-data">Loading Data...</h2> : <h2 className="no-data">No Data Found</h2>}
        </div>);
    }

    const handleFormatChange = (selected) => {
        if (selected.length === 2) {
            setDataFormat(selected[1]);
        }
    };

    function selectEvaluation(option) {
        setSelectedEval(option.value);
        setScenario(null);
    }

    return (<div className='text-results'>
        <div className='sidebar-options'>
            <h3 className='sidebar-title'>Evaluation</h3>
            <Select

                styles={{
                    // Fixes the overlapping problem of the component
                    menu: provided => ({ ...provided, zIndex: 9999 })
                }}
                options={evalOptions}
                onChange={selectEvaluation}
                value={evalOptions.find(option => option.value === selectedEval)}
                label="Single select"
                isLoading={loadingEvalNames}
            />
            {selectedEval && scenarioOptions.length > 0 && (
                <div>
                    <h3 className='sidebar-title'>Scenario</h3>
                    <List className="nav-list" component="nav">
                        {scenarioOptions.map((item) =>
                            <ListItem
                                className="nav-list-item"
                                id={"scenario_" + item}
                                key={"scenario_" + item}
                                button
                                selected={scenarioChosen === item}
                                onClick={() => setScenario(item)}
                            >
                                <ListItemText primary={item} />
                            </ListItem>
                        )}
                    </List>
                </div>
            )}
        </div>
        {scenarioChosen && <div className="result-display">
            <div className="text-based-header">
                <div />
                <h2>{scenarioChosen}</h2>
                <ToggleButtonGroup className="viewGroup" type="checkbox" value={dataFormat} onChange={handleFormatChange}>
                    <ToggleButton variant="secondary" id='choose-text' value={"text"}>Text</ToggleButton>
                    <ToggleButton variant="secondary" id='choose-chart' value={"charts"}>Charts</ToggleButton>
                    <ToggleButton variant="secondary" id='choose-participant' value={"participants"}>Participants</ToggleButton>
                </ToggleButtonGroup>
            </div>
            {dataFormat === 'text' ? <TextResultsSection /> : dataFormat === 'participants' ? <ParticipantView data={scenarioChosen && participantBased ? participantBased[scenarioChosen] : []} scenarioName={scenarioChosen} /> : <ChartedResultsSection />}
        </div>}
    </div>);
}
