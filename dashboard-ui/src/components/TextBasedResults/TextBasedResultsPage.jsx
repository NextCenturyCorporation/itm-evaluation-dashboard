import React, { useMemo } from 'react';
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
import NoSelection from './NoSelection';
import { shortenAnswer, p2Attributes } from './util';
import { PAGES, getEvalOptionsForPage } from '../Research/utils';

const GET_SCENARIO_RESULTS_BY_EVAL = gql`
    query getAllScenarioResultsByEval($evalNumber: Float!){
        getAllScenarioResultsByEval(evalNumber: $evalNumber)
  }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_ALL_TEXT_BASED_CONFIGS = gql`
    query GetAllTextBasedConfigs {
        getAllTextBasedConfigs
    }`;

const KEYS_WITHOUT_TIME = ['kdmas', 'group_targets', 'lowAlignmentData', 'highAlignmentData'];
const METADATA_KEYS = ['question', 'total', 'questionMapping', 'originalKey', 'undefined'];
const QUESTION_PREFIX = {
    PROBE: 'probe ',
    TEMPLATE: 'template '
};

const sortByProbeNumber = (a, b) => {
    const aMatch = a.match(/Probe (\d+)/);
    const bMatch = b.match(/Probe (\d+)/);
    if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
    }
    return a.localeCompare(b);
};

const getScenarioAttribute = (scenarioName) => {
    const match = scenarioName.match(/-(PS-AF|AF|MF|PS|SS)\d*-eval/i);
    return match ? match[1] : null;
};

const cleanTitle = (title, scenario, questionMapping = null) => {
    const foundAttr = p2Attributes.find(attr => scenario && scenario.includes(attr));
    const attrOrScenario = foundAttr || '';

    let number;
    if (questionMapping) {
        const firstChoice = Object.values(questionMapping)[0];
        if (firstChoice?.probe_id) {
            const probeMatch = firstChoice.probe_id.match(/Probe\s*(\d+)/i);
            if (probeMatch) {
                number = probeMatch[1];
            }
        }
    }

    if (!number) {
        const probeMatch = title.match(/Probe\s*(\d+)/i);
        if (probeMatch) {
            number = probeMatch[1];
        }
    }

    return `Probe-${attrOrScenario}-${number}`;
};

const cleanTitleLegacy = (title) => {
    return title.replace(/probe\s*/, '').trim();
};

const shouldUseLegacy = (evalNumber) => {
    return evalNumber < 8 || evalNumber === 12;
}

function SingleGraph({ data, pageName, scenario, selectedEval }) {
    const [survey, setSurvey] = React.useState(null);
    const [vizPanel, setVizPanel] = React.useState(null);
    const [surveyResults, setSurveyResults] = React.useState([]);

    React.useEffect(() => {
        if (data) {
            const filteredData = Object.fromEntries(
                Object.entries(data).filter(([key]) => !METADATA_KEYS.includes(key))
            );

            // set survey question for graph
            const surveyJson = {
                elements: [{
                    name: pageName,
                    title: data['question'],
                    type: "radiogroup",
                    choices: Object.keys(filteredData).map((x) => shortenAnswer(x))
                }]
            };
            const survey = new Model(surveyJson);
            setSurvey(survey);

            // get results ready for graph
            const curResults = [];
            for (const answer of Object.keys(filteredData)) {
                for (let i = 0; i < filteredData[answer]; i++) {
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
        allowDragDrop: false,
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
            <h3 className='question-header'>
                {(shouldUseLegacy(selectedEval) ? cleanTitleLegacy(pageName) : cleanTitle(pageName, scenario, data.questionMapping))} (N={data['total']})
            </h3>
            <div id={"viz_" + pageName} className='full-width-graph' />
        </div>
    );
}

function getQuestionText(qkey, scenario, questionMapping = null) {
    if (qkey === 'Participant ID') { return qkey; }
    const isTime = qkey.toLowerCase().includes('time (s)');
    const base = cleanTitle(qkey, scenario, questionMapping);
    return `${base}${isTime ? '-Time' : '-Resp'}`;
}

function getQuestionTextLegacy(qkey, scenario, textBasedConfigs) {
    const pagesForScenario = textBasedConfigs[scenario]['pages'];
    for (const page of pagesForScenario) {
        for (const res of page['elements']) {
            if (res['name'] === qkey && res['choices']) {
                // set title name
                return cleanTitleLegacy(res['title'] + ' - ' + (scenario.includes("Adept") && qkey.includes("3") ? (qkey + 'a') : qkey.includes("Follow Up") ? (qkey.split("Follow Up")[0] + "3b") : qkey));
            }
        }
    }
    return cleanTitleLegacy(qkey);
}

function ParticipantView({ data, scenarioName, textBasedConfigs, selectedEval, participantBased, scenarioOptions, participantLog }) {
    const [organizedData, setOrganizedData] = React.useState(null);
    const [, setExcelData] = React.useState(null);
    const [orderedHeaders, setHeaders] = React.useState([]);
    const [questionMappings, setQuestionMappings] = React.useState({});

    React.useEffect(() => {
        const formatted = {};
        const headers = ['Participant ID'];
        const excel = [];
        const mappings = {};

        for (const entry of data) {
            const obj = {
                'Participant ID': entry['participantID']
            };
            formatted[entry['_id']] = { ...obj };

            Object.keys(entry).forEach(key => {
                if (key === 'alignmentData') {
                    if (!headers.includes('Alignment Data')) {
                        headers.push('Alignment Data')
                    }
                    if (entry[key]) {
                        let temp = ''
                        for (const alignment of entry[key]) {
                            temp += `${alignment.target}: ${alignment.score},`
                            temp += '\n'
                        }
                        formatted[entry['_id']]['Alignment Data'] = 'Download file to view alignment data';
                        obj['Alignment Data'] = temp;
                    }
                } else if (!KEYS_WITHOUT_TIME.includes(key)) {
                    // top level pages with timing
                    const time_key = key + ' time (s)';
                    if (typeof (entry[key]) === 'object' && !Array.isArray(entry[key])) {
                        if (!headers.includes(time_key)) {
                            headers.push(time_key);
                        }

                        formatted[entry['_id']][time_key] = Math.round(entry[key]?.['timeSpentOnPage'] * 100) / 100;
                        obj[time_key] = Math.round(entry[key]?.['timeSpentOnPage'] * 100) / 100;

                        if (entry[key]?.questions) {
                            Object.keys(entry[key].questions).forEach(q => {
                                if (entry[key].questions[q]?.response !== undefined) {
                                    if (!headers.includes(q)) {
                                        headers.push(q);
                                    }
                                    // Store question mapping if it exists and has content
                                    const qMapping = entry[key].questions[q].question_mapping;
                                    if (qMapping && Object.keys(qMapping).length > 0) {
                                        if (!mappings[q]) {
                                            mappings[q] = qMapping;
                                        }
                                        // ALSO store it for the time_key using the page name (key)
                                        if (!mappings[time_key]) {
                                            mappings[time_key] = qMapping;
                                        }
                                    }
                                    formatted[entry['_id']][q] = entry[key].questions[q].response;
                                    const objKey = shouldUseLegacy(entry['evalNumber']) ? getQuestionTextLegacy(q, scenarioName, textBasedConfigs) : getQuestionText(q, scenarioName, mappings[q])
                                    obj[objKey] = entry[key].questions[q].response;
                                }
                            });
                        }
                    }
                }
            });
            if (entry['evalNumber'] === 3) {
                formatted[entry['_id']]['Alignment Data'] = 'Download file to view alignment data';
                let temp = `${entry.highAlignmentData?.alignment_target_id}: ${entry.highAlignmentData?.score},\n`
                temp += `${entry.lowAlignmentData?.alignment_target_id}: ${entry.lowAlignmentData?.score}`
                obj['Alignment Data'] = temp;
            }
            excel.push(obj);
        }

        setOrganizedData(formatted);
        setHeaders(headers);
        setExcelData(excel);
        setQuestionMappings(mappings);
    }, [data, scenarioName, textBasedConfigs]);

    const exportToExcel = async (allScenarios = false, attribute = null, singleScenario = null) => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const fixedHeaders = allScenarios
            ? ['Participant ID', 'Eval Number', 'Set']
            : ['Participant ID'];
        const dynamicHeaders = [];
        const headerMap = new Map();
        const participantDataMap = new Map();

        const processProbeData = (entry, pageName, scenario, participantRow) => {
            const probeData = entry[pageName];
            if (!probeData || typeof probeData !== 'object' || Array.isArray(probeData)) return;

            // Find the question that has a response and populated question_mapping
            let pageQuestionMapping = null;
            if (probeData.questions) {
                for (const qData of Object.values(probeData.questions)) {
                    if (qData?.response && qData?.question_mapping && Object.keys(qData.question_mapping).length > 0) {
                        pageQuestionMapping = qData.question_mapping;
                        break;
                    }
                }
            }

            const time_key = shouldUseLegacy(entry.evalNumber)
                ? getQuestionTextLegacy(pageName + ' time (s)', scenario, textBasedConfigs)
                : getQuestionText(pageName + ' time (s)', scenario, pageQuestionMapping);

            if (!headerMap.has(time_key)) {
                headerMap.set(time_key, dynamicHeaders.length);
                dynamicHeaders.push(time_key);
            }
            participantRow[time_key] = Math.round(probeData.timeSpentOnPage * 100) / 100;

            if (probeData.questions) {
                Object.entries(probeData.questions).forEach(([q, qData]) => {
                    if (qData?.response !== undefined) {
                        const questionMapping = qData?.question_mapping;
                        const questionHeader = shouldUseLegacy(entry.evalNumber)
                            ? getQuestionTextLegacy(q, scenario, textBasedConfigs)
                            : getQuestionText(q, scenario, questionMapping);

                        if (!headerMap.has(questionHeader)) {
                            headerMap.set(questionHeader, dynamicHeaders.length);
                            dynamicHeaders.push(questionHeader);
                        }
                        participantRow[questionHeader] = qData.response;
                    }
                });
            }
        };

        const processEntry = (entry, scenario) => {
            const participantId = entry.participantID;
            
            if (!participantDataMap.has(participantId)) {
                participantDataMap.set(participantId, {
                    'Participant ID': participantId,
                    ...(allScenarios && { 'Eval Number': entry.evalNumber })
                });
            }
            const participantRow = participantDataMap.get(participantId);

            const pageOrder = textBasedConfigs[scenario]?.pages?.map(page => page.name) || [];

            // use order from config to determine headers
            pageOrder.forEach(pageName => processProbeData(entry, pageName, scenario, participantRow));

            // if not in config
            Object.keys(entry)
                .filter(key => !KEYS_WITHOUT_TIME.includes(key) && !pageOrder.includes(key))
                .forEach(key => processProbeData(entry, key, scenario, participantRow));

            if (allScenarios) {
                const logEntry = participantLog?.getParticipantLog?.find(
                    log => String(log['ParticipantID']) === participantId
                );

                if (attribute) {
                    // for attr download only look at specific set in plog
                    const attributeSetValue = logEntry?.[`${attribute}-text-scenario`];
                    participantRow['Set'] = attributeSetValue || '';
                } else {
                    // downloading all results, check all attributes
                    const setValues = ['PS-AF', 'AF', 'MF', 'PS', 'SS']
                        .map(attr => logEntry?.[`${attr}-text-scenario`])
                        .filter(Boolean);

                    participantRow['Set'] = new Set(setValues).size === 1 ? setValues[0] : 'Various';
                }
            }
        };

        const scenariosToProcess = allScenarios
            ? scenarioOptions.filter(scenario => {
                if (!attribute) return true;

                const scenarioAttr = getScenarioAttribute(scenario);
                return scenarioAttr && scenarioAttr.toUpperCase() === attribute.toUpperCase();
            })
            : [singleScenario];

        for (const scenario of scenariosToProcess) {
            const scenarioData = participantBased?.[scenario];
            if (!scenarioData) continue;

            for (const entry of scenarioData) {
                processEntry(entry, scenario);
            }
        }

        const allHeaders = [...fixedHeaders, ...dynamicHeaders];
        const allData = Array.from(participantDataMap.values())
            .map(row => allHeaders.reduce((acc, header) => ({ ...acc, [header]: row[header] !== undefined ? row[header] : '' }), {}))
            .sort((a, b) => a['Participant ID'].localeCompare(b['Participant ID'], undefined, { numeric: true, sensitivity: 'base' }));

        const ws = XLSX.utils.json_to_sheet(allData, { header: allHeaders });
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });

        const filename = allScenarios
            ? `text_result_data_${attribute ? attribute + '_' : ''}all_scenarios_eval${selectedEval}${fileExtension}`
            : `text_result_data_${singleScenario}${fileExtension}`;

        FileSaver.saveAs(data, filename);
    };

    const attr = getScenarioAttribute(scenarioName);

    return (<div className="participant-text-results">
        {!shouldUseLegacy(selectedEval) && (
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    {attr && (
                        <button onClick={() => exportToExcel(true, attr)} className="me-2 mb-2">
                            {`Download All ${attr} Results`}
                        </button>
                    )}
                    <button onClick={() => exportToExcel(false, null, scenarioName)} className="mb-2">Download Scenario Results</button>
                </div>
                <div>
                    <button onClick={() => exportToExcel(true)} className=" mb-2">Download All Results</button>
                </div>
            </div>
        )}
        {shouldUseLegacy(selectedEval) && (
            <div className="mb-2">
                <button onClick={exportToExcel}>Download Scenario Results</button>
            </div>
        )}
        <div className="table-container">
            {organizedData && <table className="itm-table by-participant">
                <thead>
                    <tr>
                        {orderedHeaders.map((key) => {
                            const header = shouldUseLegacy(selectedEval)
                                ? getQuestionTextLegacy(key, scenarioName, textBasedConfigs)
                                : getQuestionText(key, scenarioName, questionMappings[key]);
                            return <th key={scenarioName + "_" + key}>{header}</th>;
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
    const { data: participantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [scenarioChosen, setScenario] = React.useState(null);
    const [dataFormat, setDataFormat] = React.useState("text")
    const [responsesByScenario, setByScenario] = React.useState(null);
    const [questionAnswerSets, setResults] = React.useState(null);
    const [participantBased, setParticipantBased] = React.useState(null);
    const evalOptions = getEvalOptionsForPage(PAGES.TEXT_RESULTS);
    const [selectedEval, setSelectedEval] = React.useState(evalOptions[0].value);
    const [scenarioOptions, setScenarioOptions] = React.useState([]);
    const { data: allTextBasedConfigsData, loading: configsLoading } = useQuery(GET_ALL_TEXT_BASED_CONFIGS, {
        fetchPolicy: 'cache-first'
    });

    const textBasedConfigs = useMemo(() => {
        if (!allTextBasedConfigsData?.getAllTextBasedConfigs) return {};

        const configs = {};
        for (const config of allTextBasedConfigsData.getAllTextBasedConfigs) {
            let scenarioName = config.scenario_id;
            configs[scenarioName] = config;
        }
        return configs;
    }, [allTextBasedConfigsData]);

    const filteredTextBasedConfigs = useMemo(() => {
        return Object.fromEntries(
            Object.entries(textBasedConfigs)
                .filter(([key, value]) => value['eval'] !== 'mre')
                .map(([key, value]) => {
                    if (value['eval'] === 'mre-eval') {
                        let newKey = key.replace(/ Scenario$/, '');
                        newKey = newKey.replace(/\w+/g, function (word) {
                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                        });
                        newKey = newKey.replace(/Soartech/, 'SoarTech');
                        return [newKey, value];
                    }
                    return [key, value];
                })
        );
    }, [textBasedConfigs]);

    const { loading, error, data } = useQuery(GET_SCENARIO_RESULTS_BY_EVAL, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
        variables: { "evalNumber": selectedEval },
        skip: !selectedEval
    });

    React.useEffect(() => {
        const tmpResponses = {};
        const participants = {};
        const uniqueScenarios = new Set();

        if (data?.getAllScenarioResultsByEval && participantLog?.getParticipantLog) {
            // First, initialize structure from configs
            Object.keys(filteredTextBasedConfigs).forEach(scenario => {
                tmpResponses[scenario] = {};
                if (scenario === 'undefined') { return }
                const pages = filteredTextBasedConfigs[scenario].pages;
                if (!pages || !Array.isArray(pages)) return;
                filteredTextBasedConfigs[scenario].pages.forEach(page => {
                    const elements = page.elements;
                    if (!elements || !Array.isArray(elements)) return;
                    page.elements.forEach(element => {
                        if (element.choices) {
                            tmpResponses[scenario][element.name] = {
                                question: element.title,
                                total: 0,
                                originalKey: element.name
                            };

                            element.choices.forEach(choice => {
                                tmpResponses[scenario][element.name][choice.text] = 0;
                            });
                        }
                    });
                });
            });

            for (const result of data.getAllScenarioResultsByEval) {
                const pid = result['participantID'];
                const logData = participantLog.getParticipantLog.find(
                    log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
                );
                if ((selectedEval === 4 || selectedEval === 5) && !logData) {
                    continue;
                }
                try {
                    const scenario = result.scenario_id || result.title;
                    if (scenario) {
                        uniqueScenarios.add(scenario);
                    }

                    if (scenario && filteredTextBasedConfigs[scenario]) {
                        if (!participants[scenario]) {
                            participants[scenario] = [];
                        }
                        participants[scenario].push(result);

                        for (const k of Object.keys(result)) {
                            if (typeof (result[k]) !== 'object' || !result[k]?.questions) {
                                continue;
                            }

                            // Check if this is a probe question that's not in the config
                            const hasProbeQuestion = Object.keys(result[k].questions).some(q =>
                                q.startsWith(QUESTION_PREFIX.PROBE) && result[k].questions[q].response
                            );

                            if (hasProbeQuestion && !tmpResponses[scenario][k]) {
                                const probeQuestionKey = Object.keys(result[k].questions).find(q => q.startsWith(QUESTION_PREFIX.PROBE));
                                const questionMapping = result[k].questions[probeQuestionKey]?.question_mapping;
                                // This is a probe question not in the config, add it
                                tmpResponses[scenario][k] = {
                                    question: `${k} - What action would you take?`,
                                    total: 0,
                                    originalKey: k,
                                    questionMapping: questionMapping
                                };
                            }

                            for (const q of Object.keys(result[k].questions)) {
                                if (result[k].questions[q].response) {
                                    const answer = typeof result[k].questions[q].response === 'object'
                                        ? JSON.stringify(result[k].questions[q].response)
                                        : result[k].questions[q].response;

                                    // For probe questions, use the page name as the key
                                    const questionKey = q.startsWith(QUESTION_PREFIX.PROBE) ? k : q;

                                    if (tmpResponses[scenario][questionKey]) {
                                        if (tmpResponses[scenario][questionKey][answer] !== undefined) {
                                            tmpResponses[scenario][questionKey][answer] += 1;
                                        } else {
                                            tmpResponses[scenario][questionKey][answer] = 1;
                                        }
                                        tmpResponses[scenario][questionKey].total += 1;
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing result:`, error);
                    console.log('Problematic result:', result);
                }
            }

            const sortedScenarios = Array.from(uniqueScenarios).sort((a, b) =>
                a.localeCompare(b, undefined, { sensitivity: 'base' })
            );

            setByScenario(tmpResponses);
            setParticipantBased(participants);
            setScenarioOptions(Array.from(sortedScenarios));
        }
    }, [data, filteredTextBasedConfigs, participantLog, selectedEval]);

    React.useEffect(() => {
        if (scenarioChosen && responsesByScenario && responsesByScenario[scenarioChosen]) {
            let found = false;
            for (const k of Object.keys(responsesByScenario[scenarioChosen])) {
                const hasData = Object.keys(responsesByScenario[scenarioChosen][k])
                    .filter(key => !METADATA_KEYS.includes(key))
                    .length > 0;

                if (hasData && responsesByScenario[scenarioChosen][k].total > 0) {
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
        return (<div className="text-scenario-results">
            {questionAnswerSets ?
                Object.keys(questionAnswerSets)
                    .filter(qkey => questionAnswerSets[qkey].total > 0)
                    .sort(sortByProbeNumber)
                    .map((qkey, ind) => {
                        const displayKey = questionAnswerSets[qkey].originalKey || qkey;
                        return (<div className='result-section' key={displayKey + '_' + ind}>
                            <h3 className='question-header'>{(shouldUseLegacy(selectedEval) ? cleanTitleLegacy(displayKey) : cleanTitle(displayKey, scenarioChosen, questionAnswerSets[qkey].questionMapping))} (N={questionAnswerSets[qkey]['total']})</h3>
                            <p>{questionAnswerSets[qkey]['question']}</p>
                            <table className="itm-table text-result-table">
                                <thead>
                                    <tr>
                                        <th className="answer-column">Answer</th>
                                        <th className="count-column">Count</th>
                                        <th className="count-column">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(questionAnswerSets[qkey])
                                        .filter(answer => !METADATA_KEYS.includes(answer))
                                        .map((answer) => (
                                            <tr key={displayKey + '_' + answer}>
                                                <td className="answer-column">{shortenAnswer(answer)}</td>
                                                <td className="count-column">{questionAnswerSets[qkey][answer]}</td>
                                                <td className="count-column">
                                                    <b>
                                                        {questionAnswerSets[qkey]['total'] > 0
                                                            ? `${Math.floor((questionAnswerSets[qkey][answer] / questionAnswerSets[qkey]['total']) * 100)}%`
                                                            : '-'}
                                                    </b>
                                                </td>
                                            </tr>
                                        ))
                                    }
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
                Object.keys(questionAnswerSets)
                    .filter(qkey => questionAnswerSets[qkey].total > 0)
                    .sort(sortByProbeNumber)
                    .map((qkey) => {
                        return (<SingleGraph key={qkey} data={questionAnswerSets[qkey]} pageName={qkey} scenario={scenarioChosen} selectedEval={selectedEval} />);
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

    if (configsLoading) {
        return <div>Loading configurations...</div>;
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
        {scenarioChosen ? (
            <div className="result-display" >
                <div className="text-based-header">
                    <div />
                    <h2>{scenarioChosen}</h2>
                    <ToggleButtonGroup className="viewGroup" type="checkbox" value={dataFormat} onChange={handleFormatChange}>
                        <ToggleButton variant="secondary" id='choose-text' value={"text"}>Text</ToggleButton>
                        <ToggleButton variant="secondary" id='choose-chart' value={"charts"}>Charts</ToggleButton>
                        <ToggleButton variant="secondary" id='choose-participant' value={"participants"}>Participants</ToggleButton>
                    </ToggleButtonGroup>
                </div>
                {dataFormat === 'text' ? <TextResultsSection /> : dataFormat === 'participants' ? <ParticipantView data={scenarioChosen && participantBased ? participantBased[scenarioChosen] : []} scenarioName={scenarioChosen} textBasedConfigs={filteredTextBasedConfigs} selectedEval={selectedEval} participantBased={participantBased} scenarioOptions={scenarioOptions} participantLog={participantLog} /> : <ChartedResultsSection />}
            </div>) : (
            <NoSelection />
        )}
    </div>);
}