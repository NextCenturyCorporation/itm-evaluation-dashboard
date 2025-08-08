import React from "react";
import './resultsTable.css';
import { Modal, Autocomplete, TextField } from "@mui/material";
import { isDefined } from "../AggregateResults/DataFunctions";
import { DownloadButtons } from "../Research/tables/download-buttons";
import { FormControlLabel, Radio, RadioGroup } from "@mui/material";
import CloseIcon from '@material-ui/icons/Close';
import { RQDefinitionTable } from "../Research/variables/rq-variables";
import definitionXLFile from './Survey Delegation Variables.xlsx';
import definitionPDFFile from './Survey Delegation Variables.pdf';
import definitionXLFileExploratory from './Exploratory Delegation Variables.xlsx';
import definitionXLFileLegacy from './Survey Delegation Variables - Legacy.xlsx';
import definitionPDFFileLegacy from './Survey Delegation Variables - Legacy.pdf';
import definitionXLFilePH2 from './Survey Delegation Variables - PH2.xlsx';
import definitionXLFileExploratoryPH2 from './Exploratory Delegation Variables - PH2.xlsx';
import { adjustScenarioNumber } from "../Survey/surveyUtils";
import { getEval89Attributes } from "../Research/utils";

const EVAL_MAP = {
    3: 'MRE',
    4: 'DRE',
    5: 'PH1',
    6: 'JAN25',
    8: 'PH2 June',
    9: 'PH2 July'
}

const TRUST_MAP = {
    "Strongly disagree": 1,
    "Disagree": 2,
    "Neither agree nor disagree": 3,
    "Agree": 4,
    "Strongly agree": 5
};

const CONFIDENCE_MAP = {
    "Not confident at all": 1,
    "No confident at all": 1,
    "Not confidence at all": 1,
    "Not confident": 2,
    "Somewhat confident": 3,
    "Confident": 4,
    "Completely confident": 5
};

const STARTING_HEADERS = [
    "Participant ID",
    "Survey Version",
    "Start Time",
    "End Time",
    "Total Time (Minutes)",
    "Total Time (mm:ss)",
    "April 2025",
    "Condition",
    "Post-Scenario Measures - Time Taken (Minutes)",
    "Post-Scenario Measures - Time Taken (mm:ss)",
    "As I was reading through the scenarios and Medic decisions, I actively thought about how I would handle the same situation",
    "I was easily able to imagine myself as the medic in these scenarios",
    "I could easily draw from an experience / similar situation to imagine myself as the medics in these scenarios",

    // ph1 demographics
    "The VR training experience was helpful in making the delegation decisions in these scenarios",
    "I had enough information in this presentation to make the ratings for the questions asked on the previous pages about the DMs",
    "I am a computer gaming enthusiast", 
    "I consider myself a seasoned first responder",
    "I have completed the SALT Triage Certificate Training Course",
    "I have completed disaster response training such as those offered by the American Red Cross, FEMA, or the Community Emergency Response Team (CERT)",
    "I have completed disaster response training provided by the United States Military",
    "How many disaster drills (or simulated mass casualty events with live actors) have you participated in before today (Please enter a whole number)",
    "What is your current role (choose all that apply):",
    "Branch and Status",
    "Military Medical Training",
    "Years experience in military medical role",

    // ph2 demographics
    "How would you describe your experience with virtual reality technology",
    "What is your current role",
    "Specify specialty, level, year or other specific information about your role",
    "Years of experience in role",
    "Primary practice environment",
    "Have you participated in mass casualty events",
    "Served in Military",
    "Military Branch",
    "Did you serve in a military medical role",
    "What was/is your medical-related MOS or rate",
    "How many years of experience do you have serving in a medical role in the military",
    "In which environments have you provided medical care during military service",
    "When did you last complete TCCC training or recertification",
    "How would you rate your expertise with TCCC procedures",
    "How many real-world casualties have you assessed using TCCC protocols",

    "I feel that people are generally reliable",
    "I usually trust people until they give me a reason not to trust them",
    "Trusting another person is not difficult for me",
    "What was the biggest influence on your delegation decision between different medics?",
    "Have you completed the text-based scenarios",
    "VR Scenarios Completed",
    "VR Experience Level",
    "VR Comfort Level",
    "Additional Information About Discomfort",
    "Note Page - Time Taken (Minutes)",
    "Note Page - Time Taken (mm:ss)"
];

const MULTI_KDMA_MAP = {
    "0.0_0.0": "low/low",
    "0.0_1.0": "low/high",
    "1.0_0.0": "high/low",
    "1.0_1.0": "high/high"
}

function formatTimeMMSS(seconds, includeHours = false) {
    seconds = Math.round(seconds);
    let hours = (Math.floor(seconds / 60 / 60) % 60);
    hours = hours.toString().length < 2 ? '0' + hours.toString() : hours.toString();
    let minutes = Math.floor(seconds / 60);
    minutes = includeHours ? minutes % 60 : minutes;
    minutes = minutes.toString().length < 2 ? '0' + minutes.toString() : minutes.toString();
    let formatted_seconds = seconds % 60;
    formatted_seconds = formatted_seconds.toString().length < 2 ? '0' + formatted_seconds.toString() : formatted_seconds.toString();
    return includeHours ? `${hours}:${minutes}:${formatted_seconds}` : `${minutes}:${formatted_seconds}`;
}

function formatTimeMinutes(seconds) {
    const minutes = (seconds / 60).toFixed(3);
    // if trailing zeroes just do a whole number
    return minutes.endsWith('.000') ? minutes.slice(0, -4) : minutes;
}

export function ResultsTable({ data, pLog, exploratory = false, comparisonData = null, evalNumbers = [{ 'value': '8', 'label': '8 - PH2 June' }, { 'value': '9', 'label': '9 - PH2 July' }] }) {
    const [headers, setHeaders] = React.useState([...STARTING_HEADERS]);
    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [evals, setEvals] = React.useState([]);
    const [evalFilters, setEvalFilters] = React.useState(evalNumbers);
    const [roles, setRoles] = React.useState([]);
    const [roleFilters, setRoleFilters] = React.useState([]);
    const [surveyStatus] = React.useState(['Complete', 'Incomplete']);
    const [statusFilters, setStatusFilters] = React.useState(null);
    const [militaryStatus] = React.useState(['Yes', 'No']);
    const [milFilters, setMilFilters] = React.useState(null);
    const [versions, setVersions] = React.useState([]);
    const [versionFilters, setVersionFilters] = React.useState([]);
    const [origHeaderSet, setOrigHeaderSet] = React.useState([]);
    const [showLegacy, setShowLegacy] = React.useState(false);
    const [showPh2, setShowPh2] = React.useState(evalNumbers.filter((x) => x.value === '8' || x.value === '9').length > 0 ? true : false);
    const [showDefinitions, setShowDefinitions] = React.useState(false);

    const searchForDreComparison = (comparisonEntry, pid, admType, scenario) => {
        const basicChecks = comparisonEntry['pid'] === pid && comparisonEntry['adm_type'] === admType && comparisonEntry['adm_scenario'] === scenario;
        // we don't care about servers when it comes to ST. check for DRE server for 5&6, and NOT ph1 server for 4
        const dreCheck = (!scenario.includes('adept') && !scenario.includes('DryRunEval')) ||
            ([5, 6].includes(comparisonEntry['evalNumber']) && comparisonEntry['dre_server']) || (comparisonEntry['evalNumber'] === 4 && !comparisonEntry['ph1_server']);
        return basicChecks && dreCheck;
    };

    const searchForPh1Comparison = (comparisonEntry, pid, admType, scenario) => {
        const basicChecks = comparisonEntry['pid'] === pid && comparisonEntry['adm_type'] === admType && comparisonEntry['adm_scenario'] === scenario;
        // we don't care about servers when it comes to ST. check for PH1 server for 4, and NOT dre server for 5&6
        const ph1Check = (!scenario.includes('adept') && !scenario.includes('DryRunEval')) ||
            ([5, 6].includes(comparisonEntry['evalNumber']) && !comparisonEntry['dre_server']) || (comparisonEntry['evalNumber'] === 4 && comparisonEntry['ph1_server']);
        return basicChecks && ph1Check;
    };

    const searchForPh2Comparison = (comparisonEntry, pid, admType, scenario) => {
        return comparisonEntry['pid'] === pid && comparisonEntry['adm_type'] === admType && comparisonEntry['adm_scenario'] === scenario;
    }

    const formatData = React.useCallback((data) => {
        const allObjs = [];
        const allEvals = [];
        const allVersions = [];
        let allRoles = [];
        const updatedHeaders = [...STARTING_HEADERS];
        // set up block headers
        let subheaders = (showLegacy ? [] : showPh2 ? ['Type', 'Attribute', 'Target'] : ['TA1', 'TA2', 'Type', 'Target']).concat(['Name', 'Time', 'Time (mm:ss)', (showPh2 ? 'Probe_Set_Observation' : 'Scenario'), 'Agreement', 'SRAlign', 'Trustworthy', 'Trust']);
        if (exploratory) {
            subheaders = subheaders.concat(showPh2 ? ['Delegator|Observed_ADM'] : ['DRE_Delegator|Observed_ADM', 'P1E_Delegator|Observed_ADM']);
        }

        const dmCount = showLegacy ? 2 : showPh2 ? 4 : 3;
        for (let block = 1; block < 5; block++) {
            for (let dm = 1; dm < 1 + dmCount; dm++) {
                for (let subhead of subheaders) {
                    updatedHeaders.push(`B${block}_DM${dm}_${subhead}`);
                }
            }
            const legacyCompHeaders = ['Compare_DM1', 'Compare_DM2', 'Compare_Time', 'Compare_Time (mm:ss)', 'Compare_FC1', 'Compare_FC1_Conf', 'Compare_FC1_Explain', 'Compare_FC1_Differences'];
            const nonExploratoryCompHeaders = ['Compare_DM1', 'Compare_DM2', 'Compare_DM3', 'Compare_Time', 'Compare_Time (mm:ss)', 'Compare_FC1', 'Compare_FC1_Conf', 'Compare_FC1_Explain', 'Compare_FC2', 'Compare_FC2_Conf', 'Compare_FC2_Explain'];
            if (showPh2) {
                nonExploratoryCompHeaders.splice(8, 0, 'Compare_FC2_Alignment');
                nonExploratoryCompHeaders.splice(5, 0, 'Compare_FC1_Alignment');
                nonExploratoryCompHeaders.splice(3, 0, 'Compare_DM4');
                nonExploratoryCompHeaders.push('Compare_FC3_Alignment', 'Compare_FC3', 'Compare_FC3_Conf', 'Compare_FC3_Explain');
            }
            const exploratoryCompHeaders = ['Compare_DM1', 'Compare_DM2', 'Compare_DM3', 'Compare_Time', 'Compare_Time (mm:ss)', 'Compare_FC1', 'Compare_FC1_Conf', 'Compare_FC1_Explain', (!showPh2 ? [...'FC1_DRE_Align_Diff', 'FC1_P1E_Align_Diff'] : 'FC1_Align_Diff'), 'Compare_FC2', 'Compare_FC2_Conf', 'Compare_FC2_Explain', (!showPh2 ? [...'FC2_DRE_Align_Diff', 'FC2_P1E_Align_Diff'] : 'FC2_Align_Diff')];
            if (showPh2) {
                exploratoryCompHeaders.splice(9, 0, 'Compare_FC2_Alignment');
                exploratoryCompHeaders.splice(5, 0, 'Compare_FC1_Alignment');
                exploratoryCompHeaders.splice(3, 0, 'Compare_DM4');
                exploratoryCompHeaders.push('Compare_FC3_Alignment', 'Compare_FC3', 'Compare_FC3_Conf', 'Compare_FC3_Explain', 'FC3_Align_Diff');
            }
            const comparisons = showLegacy ? legacyCompHeaders : (exploratory ? exploratoryCompHeaders : nonExploratoryCompHeaders);
            for (let subhead of comparisons) {
                updatedHeaders.push(`B${block}_${subhead}`);
            }
        }
        if (showLegacy) {
            // add omnibus columns
            for (let block = 5; block < 7; block++) {
                for (let omni = 1; omni < 3; omni++) {
                    for (let subhead of subheaders) {
                        updatedHeaders.push(`B${block}_Omni${omni}_${subhead}`);
                    }
                }
                const comparisons = ['Compare_Omni1', 'Compare_Omni2', 'Omni_Compare_Time', 'Omni_Compare_Time (mm:ss)', 'Omni_Compare_FC1', 'Omni_Compare_FC1_Conf', 'Omni_Compare_FC1_Explain'];
                for (let subhead of comparisons) {
                    updatedHeaders.push(`B${block}_${subhead}`);
                }
            }
        }

        for (let entry of data) {
            const obj = {};
            // not shown in table, just for filters
            obj['eval'] = entry.evalNumber ?? entry.results?.evalNumber;

            // clean up data, only showing relevant entries
            entry = entry.results ?? entry;
            if (!entry) {
                continue;
            }

            // ignore invalid versions
            const version = entry.surveyVersion;
            if (!version || ((showLegacy && version >= 4) || (!showLegacy && version < 4) || (showPh2 && version < 6) || (!showPh2 && version >= 6))) {
                continue;
            }

            // ignore invalid pids
            let pid = entry['Participant ID']?.questions['Participant ID']?.response ?? entry['Participant ID Page']?.questions['Participant ID']?.response ?? entry['pid'];
            if (!pid) {
                continue;
            }

            if (obj['eval'] === 3 && pid.slice(0, 4) !== '2024') {
                continue;
            }

            const logData = pLog.find(
                log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
            );
            if ((version >= 6) && !logData) {
                continue;
            }

            const lastPage = entry['Post-Scenario Measures'];
            if (showLegacy && !lastPage) {
                // don't ignore those without last page in versions 4 & 5 bc of 12/10 collection problem
                continue;
            }

            if (entry['surveyVersion'] === 1.3) {
                obj['April 2025'] = entry['evalNumber'] === 8 ? 1 : 0;
                obj['Condition'] = entry['Participant ID']?.questions['Condition']?.response ?? '-'
            }

            // add data to filter options
            allEvals.push(obj['eval']);

            // add data to filter options
            allVersions.push(version);

            // add data to table
            obj['Participant ID'] = pid;
            obj['Survey Version'] = version;
            obj['Start Time'] = entry.startTime ? new Date(entry.startTime)?.toLocaleString() : null;
            obj['End Time'] = new Date(entry.timeComplete)?.toLocaleString();
            const timeDifSeconds = (new Date(entry.timeComplete).getTime() - new Date(entry.startTime).getTime()) / 1000;
            obj['Total Time (Minutes)'] = entry.startTime ? formatTimeMinutes(timeDifSeconds) : null;
            obj['Total Time (mm:ss)'] = entry.startTime ? formatTimeMMSS(timeDifSeconds) : null;
            if (lastPage) {
                obj['Post-Scenario Measures - Time Taken (Minutes)'] = formatTimeMinutes(lastPage.timeSpentOnPage);
                obj['Post-Scenario Measures - Time Taken (mm:ss)'] = formatTimeMMSS(lastPage.timeSpentOnPage);
                for (const q of Object.keys(lastPage.questions)) {
                    if (q == 'question7') {
                        obj['Specify specialty, level, year or other specific information about your role'] = lastPage.questions[q].response?.toString();
                    }
                    else if (!q.includes('What is your current role')) {
                        obj[q] = lastPage.questions[q].response?.toString();
                    }
                    else {
                        const roles = lastPage.questions[q].response?.toString();
                        allRoles = [...allRoles, ...roles.split(',')];
                        obj[q] = roles.replaceAll(',', '; ');
                    }
                }
            }

            if (!entry['Note page'] && version < 6) {
                continue;
            }

            if (entry['VR Page']) {
                obj["VR Experience Level"] = entry['VR Page']?.questions?.['VR Experience Level']?.response?.slice(0, 1);
                obj["VR Comfort Level"] = entry['VR Page']?.questions?.['VR Comfort Level']?.response;
                obj["Additional Information About Discomfort"] = entry['VR Page']?.questions?.['Additional Information About Discomfort']?.response;
            }
            else {
                obj["VR Comfort Level"] = entry['Participant ID Page']?.questions?.['VR Comfort Level']?.response;
                obj["Additional Information About Discomfort"] = entry['Participant ID Page']?.questions?.['Additional Information About Discomfort']?.response;
                obj["Have you completed the text-based scenarios"] = entry['Participant ID Page']?.questions?.['Have you completed the text-based scenarios']?.response;
                const vrScenarios = entry['Participant ID Page']?.questions?.['VR Scenarios Completed']?.response?.join(',');
                obj["VR Scenarios Completed"] = vrScenarios ? vrScenarios.split('I have completed the VR').join('').replaceAll(' ,', ',').replaceAll('sub', 'Sub').replaceAll('urb', 'Urb').replaceAll('jung', 'Jung').replaceAll('desert', 'Desert') : null;
            }
            if (version < 6) {
                obj["Note Page - Time Taken (Minutes)"] = formatTimeMinutes(entry['Note page'].timeSpentOnPage);
                obj["Note Page - Time Taken (mm:ss)"] = formatTimeMMSS(entry['Note page'].timeSpentOnPage);
            }

            // get blocks of dms
            let block = 1;
            let dm = 1;
            for (const pageName of ((!showLegacy && entry['orderLog']) ? entry['orderLog'] : Object.keys(entry)).filter((x) => x.includes('Medic'))) {
                const page = entry[pageName.trimEnd()];
                if (!page) {
                    // should never occur
                    if (lastPage) {
                        console.error('Page not found! ', pageName);
                    }
                    continue;
                }

                if ((page.pageType === 'singleMedic' && !pageName.includes('Omnibus')) || (showLegacy && !page.pageType && pageName.includes('Scenario'))) {
                    const cleanPageName = pageName.split(': ').slice(-1).toString();
                    if (!showLegacy) {
                        obj[`B${block}_DM${dm}_TA1`] = page.scenarioIndex?.includes('vol') || page.scenarioIndex?.includes('qol') ? 'ST' : 'AD';
                        obj[`B${block}_DM${dm}_TA2`] = page.admAuthor.replace('kitware', 'Kitware').replace('TAD', 'Parallax');
                        obj[`B${block}_DM${dm}_Type`] = page.admAlignment;
                        if (showPh2) {
                            const att = getEval89Attributes(page.admTarget);
                            obj[`B${block}_DM${dm}_Attribute`] = att;
                            let target = "";
                            if (att != "AF-MF") {
                                target = page.admTarget.split("-").slice(-1);
                            }
                            else {
                                target = MULTI_KDMA_MAP[page.admTarget.split("-").slice(-1)];
                            }
                            obj[`B${block}_DM${dm}_Target`] = target;
                        }
                        else {
                            obj[`B${block}_DM${dm}_Target`] = page.admTarget;
                        }
                    }
                    obj[`B${block}_DM${dm}_Name`] = cleanPageName;
                    obj[`B${block}_DM${dm}_Time`] = formatTimeMinutes(page.timeSpentOnPage);
                    obj[`B${block}_DM${dm}_Time (mm:ss)`] = formatTimeMMSS(page.timeSpentOnPage);
                    if (!showPh2) {
                        obj[`B${block}_DM${dm}_Scenario`] = page.scenarioIndex ?? pageName.split(': ')[0];
                    }
                    else {
                        // All Scenarios for Eval 8 are in same set, so you can grab any of them to get Probe Set
                        const textScenario = logData["AF-text-scenario"];
                        // 2-> 3, 3 -> 1. Multi KDMA gets an additional bump
                        const isMultiKdma = page.admTarget.includes('affiliation') && page.admTarget.includes('merit');
                        obj[`B${block}_DM${dm}_Probe_Set_Observation`] = adjustScenarioNumber(
                            isMultiKdma ? adjustScenarioNumber(textScenario) : textScenario
                        );
                    }
                    obj[`B${block}_DM${dm}_Agreement`] = TRUST_MAP[page.questions?.[cleanPageName + ': Do you agree with the decisions that this medic made?']?.response] ?? TRUST_MAP[page.questions?.[cleanPageName + ': Do you agree with the decision that this medic made?']?.response];
                    obj[`B${block}_DM${dm}_SRAlign`] = TRUST_MAP[page.questions?.[cleanPageName + ': The way this medic makes medical decisions is how I make decisions']?.response] ?? TRUST_MAP[page.questions?.[cleanPageName]?.response];
                    obj[`B${block}_DM${dm}_Trustworthy`] = TRUST_MAP[page.questions?.[cleanPageName + ': This medic is trustworthy']?.response] ?? TRUST_MAP[page.questions?.[cleanPageName + ': this medic is trustworthy']?.response];
                    obj[`B${block}_DM${dm}_Trust`] = TRUST_MAP[page.questions?.[cleanPageName + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it']?.response];
                    if (exploratory) {
                        if (!showPh2) {
                            obj[`B${block}_DM${dm}_DRE_Delegator|Observed_ADM`] = comparisonData.findLast((x) => searchForDreComparison(x, pid, page.admAlignment, page['scenarioIndex']))?.['score'];
                            obj[`B${block}_DM${dm}_P1E_Delegator|Observed_ADM`] = comparisonData.findLast((x) => searchForPh1Comparison(x, pid, page.admAlignment, page['scenarioIndex']))?.['score'];
                        }
                        else {
                            obj[`B${block}_DM${dm}_Delegator|Observed_ADM`] = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, page.admAlignment, page['scenarioIndex']))?.['score'];
                        }
                    }
                    dm += 1;
                }
                else if ((page.pageType === 'comparison' && !pageName.includes('Omnibus')) || (showLegacy && !page.pageType && pageName.includes(' vs '))) {
                    if (!showLegacy) {
                        const order = pageName.replace(' vs  vs ', ' vs ').split(' vs ');
                        // only works for dre/ph1 where we labelled alignment 
                        let alignment = page.admAlignment?.split(' vs ');
                        if (showPh2) {
                            alignment = [];
                            for (const adm of order) {
                                alignment.push(entry[adm]['admAlignment']);
                            }
                        }

                        // multikdma setup 
                        let multiFc1 = '';
                        let multiFc2 = '';
                        let multiFc3 = '';
                        let mostAligned = '';
                        let targets = ['high-affiliation-high-merit', 'low-affiliation-low-merit', 'high-affiliation-low-merit', 'low-affiliation-high-merit'];
                        if (alignment.length > 3) {
                            for (const t of targets) {
                                if (alignment.indexOf(t) == -1) {
                                    mostAligned = t;
                                    break;
                                }
                            }
                            multiFc1 = mostAligned + ' vs ' + alignment[1];
                            multiFc2 = mostAligned + ' vs ' + alignment[2];
                            multiFc3 = mostAligned + ' vs ' + alignment[3];
                        }

                        // set up exploratory variables to find alignment difference
                        let dreAligned, ph1Aligned, dreBaseline, ph1Baseline, dreMisaligned, ph1Misaligned, ph2Aligned, ph2Baseline, ph2Misaligned, ph2Multi1, ph2Multi2, ph2Multi3, ph2Multi4;

                        if (exploratory && comparisonData) {
                            if (!showPh2) {
                                dreAligned = comparisonData.findLast((x) => searchForDreComparison(x, pid, 'aligned', page['scenarioIndex']))?.['score'];
                                ph1Aligned = comparisonData.findLast((x) => searchForPh1Comparison(x, pid, 'aligned', page['scenarioIndex']))?.['score'];
                                dreBaseline = comparisonData.findLast((x) => searchForDreComparison(x, pid, 'baseline', page['scenarioIndex']))?.['score'];
                                ph1Baseline = comparisonData.findLast((x) => searchForPh1Comparison(x, pid, 'baseline', page['scenarioIndex']))?.['score'];
                                dreMisaligned = comparisonData.findLast((x) => searchForDreComparison(x, pid, 'misaligned', page['scenarioIndex']))?.['score'];
                                ph1Misaligned = comparisonData.findLast((x) => searchForPh1Comparison(x, pid, 'misaligned', page['scenarioIndex']))?.['score'];
                            }
                            else if (order.length < 4) {
                                ph2Aligned = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, 'aligned', page['scenarioIndex']))?.['score'];
                                ph2Baseline = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, 'baseline', page['scenarioIndex']))?.['score'];
                                ph2Misaligned = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, 'misaligned', page['scenarioIndex']))?.['score'];
                            } else {
                                ph2Multi1 = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, 'most aligned group', page['scenarioIndex']))?.['score'];
                                ph2Multi2 = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, alignment[1], page['scenarioIndex']))?.['score'];
                                ph2Multi3 = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, alignment[2], page['scenarioIndex']))?.['score'];
                                ph2Multi4 = comparisonData.findLast((x) => searchForPh2Comparison(x, pid, alignment[3], page['scenarioIndex']))?.['score'];
                            }
                        }

                        const alignedVsBaseline = order.length < 4 ? (order[alignment.indexOf('aligned')] + ' vs ' + order[alignment.indexOf('baseline')]) : (order[0] + ' vs ' + order[1]);
                        const alignedVsMisaligned = order.length < 4 ? (order[alignment.indexOf('aligned')] + ' vs ' + order[alignment.indexOf('misaligned')]) : (order[0] + ' vs ' + order[2]);
                        const vsFc3MultiKdma = order[0] + ' vs ' + order[3];
                        obj[`B${block}_Compare_DM1`] = order[0] + ' - ' + alignment[0];
                        obj[`B${block}_Compare_DM2`] = order[1] + ' - ' + alignment[1];
                        obj[`B${block}_Compare_DM3`] = order[2] + ' - ' + alignment[2];
                        if (showPh2 && order.length > 3) {
                            obj[`B${block}_Compare_DM4`] = order[3] + ' - ' + alignment[3];
                        }
                        obj[`B${block}_Compare_Time`] = formatTimeMinutes(page.timeSpentOnPage);
                        obj[`B${block}_Compare_Time (mm:ss)`] = formatTimeMMSS(page.timeSpentOnPage);

                        const fc1 = page.questions?.[alignedVsBaseline + ': Forced Choice']?.response
                        obj[`B${block}_Compare_FC1_Alignment`] = order.length < 4 ? 'aligned vs baseline' : multiFc1;
                        obj[`B${block}_Compare_FC1`] = fc1 + ' - ' + alignment[order.indexOf(fc1)];
                        obj[`B${block}_Compare_FC1_Conf`] = CONFIDENCE_MAP[page.questions?.[alignedVsBaseline + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                        obj[`B${block}_Compare_FC1_Explain`] = page.questions?.[alignedVsBaseline + ': Explain your response to the delegation preference question']?.response;
                        if (exploratory && comparisonData) {
                            if (!showPh2) {
                                obj[`B${block}_FC1_DRE_Align_Diff`] = (isDefined(dreAligned) && isDefined(dreBaseline)) ? (dreAligned - dreBaseline) : null;
                                obj[`B${block}_FC1_P1E_Align_Diff`] = (isDefined(ph1Aligned) && isDefined(ph1Baseline)) ? (ph1Aligned - ph1Baseline) : null;
                            }
                            else if (order.length < 4) {
                                obj[`B${block}_FC1_Align_Diff`] = (isDefined(ph2Aligned) && isDefined(ph2Baseline)) ? (ph2Aligned - ph2Baseline) : null;
                            }
                            else {
                                obj[`B${block}_FC1_Align_Diff`] = (isDefined(ph2Multi1) && isDefined(ph2Multi2)) ? (ph2Multi1 - ph2Multi2) : null;
                            }
                        }
                        const fc2 = page.questions?.[alignedVsMisaligned + ': Forced Choice']?.response
                        obj[`B${block}_Compare_FC2_Alignment`] = order.length < 4 ? 'aligned vs misaligned' : multiFc2;
                        obj[`B${block}_Compare_FC2`] = fc2 + ' - ' + alignment[order.indexOf(fc2)];
                        obj[`B${block}_Compare_FC2_Conf`] = CONFIDENCE_MAP[page.questions?.[alignedVsMisaligned + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                        obj[`B${block}_Compare_FC2_Explain`] = page.questions?.[alignedVsMisaligned + ': Explain your response to the delegation preference question']?.response;
                        if (exploratory && comparisonData) {
                            if (!showPh2) {
                                obj[`B${block}_FC2_DRE_Align_Diff`] = (isDefined(dreAligned) && isDefined(dreMisaligned)) ? (dreAligned - dreMisaligned) : null;
                                obj[`B${block}_FC2_P1E_Align_Diff`] = (isDefined(ph1Aligned) && isDefined(ph1Misaligned)) ? (ph1Aligned - ph1Misaligned) : null;
                            } else if (order.length < 4) {
                                obj[`B${block}_FC2_Align_Diff`] = (isDefined(ph2Aligned) && isDefined(ph2Misaligned)) ? (ph2Aligned - ph2Misaligned) : null;
                            }
                            else {
                                obj[`B${block}_FC2_Align_Diff`] = (isDefined(ph2Multi1) && isDefined(ph2Multi3)) ? (ph2Multi1 - ph2Multi3) : null;
                            }
                        }
                        if (showPh2) {
                            const fc3 = page.questions?.[vsFc3MultiKdma + ': Forced Choice']?.response
                            obj[`B${block}_Compare_FC3_Alignment`] = order.length < 4 ? null : multiFc3;
                            obj[`B${block}_Compare_FC3`] = order.length < 4 ? null : (fc3 + ' - ' + alignment[order.indexOf(fc3)] + (alignment[order.indexOf(fc3)] == 'most aligned group' ? ' (' + mostAligned + ')' : ''));
                            obj[`B${block}_Compare_FC3_Conf`] = CONFIDENCE_MAP[page.questions?.[vsFc3MultiKdma + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                            obj[`B${block}_Compare_FC3_Explain`] = page.questions?.[vsFc3MultiKdma + ': Explain your response to the delegation preference question']?.response;
                            if (exploratory && comparisonData) {
                                obj[`B${block}_FC3_Align_Diff`] = (isDefined(ph2Multi1) && isDefined(ph2Multi4)) ? (ph2Multi1 - ph2Multi4) : null;
                            }
                        }
                        if (showPh2) {
                            const fc3 = page.questions?.[vsFc3MultiKdma + ': Forced Choice']?.response
                            obj[`B${block}_Compare_FC3_Alignment`] = order.length < 4 ? null : multiFc3;
                            obj[`B${block}_Compare_FC3`] = order.length < 4 ? null : (fc3 + ' - ' + alignment[order.indexOf(fc3)] + (alignment[order.indexOf(fc3)] == 'most aligned group' ? ' (' + mostAligned + ')' : ''));
                            obj[`B${block}_Compare_FC3_Conf`] = CONFIDENCE_MAP[page.questions?.[vsFc3MultiKdma + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                            obj[`B${block}_Compare_FC3_Explain`] = page.questions?.[vsFc3MultiKdma + ': Explain your response to the delegation preference question']?.response;
                            if (exploratory && comparisonData) {
                                const dreAligned = comparisonData.findLast((x) => searchForDreComparison(x, pid, 'aligned', page['scenarioIndex']))?.['score'];
                                const ph1Aligned = comparisonData.findLast((x) => searchForPh1Comparison(x, pid, 'aligned', page['scenarioIndex']))?.['score'];
                                const dreMisaligned = comparisonData.findLast((x) => searchForDreComparison(x, pid, 'misaligned', page['scenarioIndex']))?.['score'];
                                const ph1Misaligned = comparisonData.findLast((x) => searchForPh1Comparison(x, pid, 'misaligned', page['scenarioIndex']))?.['score'];
                                obj[`B${block}_FC3_DRE_Align_Diff`] = (isDefined(dreAligned) && isDefined(dreMisaligned)) ? (dreAligned - dreMisaligned) : null;
                                obj[`B${block}_FC3_P1E_Align_Diff`] = (isDefined(ph1Aligned) && isDefined(ph1Misaligned)) ? (ph1Aligned - ph1Misaligned) : null;
                            }
                        }
                    }
                    else {
                        const order = pageName.split(' vs ');
                        obj[`B${block}_Compare_DM1`] = order[0];
                        obj[`B${block}_Compare_DM2`] = order[1];
                        obj[`B${block}_Compare_Time`] = formatTimeMinutes(page.timeSpentOnPage);
                        obj[`B${block}_Compare_Time (mm:ss)`] = formatTimeMMSS(page.timeSpentOnPage);
                        obj[`B${block}_Compare_FC1`] = page.questions?.[pageName + ': Forced Choice']?.response ?? page.questions?.[pageName + ': Given the information provided']?.response;
                        obj[`B${block}_Compare_FC1_Conf`] = CONFIDENCE_MAP[page.questions?.[pageName + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                        obj[`B${block}_Compare_FC1_Explain`] = page.questions?.[pageName + ': Explain your response to the delegation preference question']?.response;
                        obj[`B${block}_Compare_FC1_Differences`] = page.questions?.[pageName + ': What, if anything, would you have done differently in the presented scenario?']?.response;
                    }
                    block += 1;
                    dm = 1;
                }
                if (showLegacy && pageName.includes('Omnibus')) {
                    const cleanPageName = pageName.split(': ').slice(-1).toString();
                    if (page.pageType === 'singleMedic') {
                        obj[`B${block}_Omni${dm}_Name`] = cleanPageName;
                        obj[`B${block}_Omni${dm}_Time`] = formatTimeMinutes(page.timeSpentOnPage);
                        obj[`B${block}_Omni${dm}_Time (mm:ss)`] = formatTimeMMSS(page.timeSpentOnPage);
                        obj[`B${block}_Omni${dm}_Scenario`] = page.scenarioIndex ?? pageName.split(': ')[0];

                        obj[`B${block}_Omni${dm}_Agreement`] = TRUST_MAP[page.questions?.[cleanPageName + ': Do you agree with the decisions that this medic made?']?.response] ?? TRUST_MAP[page.questions?.[cleanPageName + ': Do you agree with the decision that this medic made?']?.response];
                        obj[`B${block}_Omni${dm}_SRAlign`] = TRUST_MAP[page.questions?.[cleanPageName + ': The way this medic makes medical decisions is how I make decisions']?.response] ?? TRUST_MAP[page.questions?.[cleanPageName]?.response];
                        obj[`B${block}_Omni${dm}_Trustworthy`] = TRUST_MAP[page.questions?.[cleanPageName + ': This medic is trustworthy']?.response] ?? TRUST_MAP[page.questions?.[cleanPageName + ': this medic is trustworthy']?.response];
                        obj[`B${block}_Omni${dm}_Trust`] = TRUST_MAP[page.questions?.[cleanPageName + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it']?.response];
                        dm += 1;
                    }
                    else if (page.pageType === 'comparison') {
                        const order = cleanPageName.split(' vs ');
                        obj[`B${block}_Compare_Omni1`] = order[0];
                        obj[`B${block}_Compare_Omni2`] = order[1];
                        obj[`B${block}_Omni_Compare_Time`] = formatTimeMinutes(page.timeSpentOnPage);
                        obj[`B${block}_Omni_Compare_Time (mm:ss)`] = formatTimeMMSS(page.timeSpentOnPage);
                        obj[`B${block}_Omni_Compare_FC1`] = page.questions?.[cleanPageName + ': Forced Choice']?.response ?? page.questions?.[cleanPageName + ': Given the information provided']?.response;
                        obj[`B${block}_Omni_Compare_FC1_Conf`] = CONFIDENCE_MAP[page.questions?.[cleanPageName + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                        obj[`B${block}_Omni_Compare_FC1_Explain`] = page.questions?.[cleanPageName + ': Explain your response to the delegation preference question']?.response;
                        block += 1;
                        dm = 1;
                    }
                }
            }

            allObjs.push(obj);
        }
        // prep filters and data (sort by pid)
        allObjs.sort((a, b) => a['Participant ID'] - b['Participant ID']);
        setEvals(Array.from(new Set(allEvals)).filter((x) => isDefined(x)).map((x) => { return { 'value': x.toString(), 'label': x + ' - ' + EVAL_MAP[x] } }));
        setVersions(Array.from(new Set(allVersions)).filter((x) => isDefined(x)).map((x) => x.toString()));
        setFormattedData(allObjs);
        setFilteredData(allObjs);
        setHeaders(updatedHeaders);
        setRoles(Array.from(new Set(allRoles)));
        setOrigHeaderSet(updatedHeaders);
    }, [pLog, showLegacy, showPh2, exploratory, comparisonData]);

    const getUsedHeaders = React.useCallback((data) => {
        const usedHeaders = [];
        for (let x of origHeaderSet) {
            for (let datapoint of data) {
                if (isDefined(datapoint[x])) {
                    usedHeaders.push(x);
                    break;
                }
            }
        }
        return usedHeaders;
    }, [origHeaderSet]);

    React.useEffect(() => {
        if (data) {
            formatData(data);
        }
    }, [data, pLog, showLegacy, showPh2, formatData]);

    React.useEffect(() => {
        if (exploratory) {
            setEvalFilters(evalNumbers);
            setShowPh2((evalNumbers.filter((x) => x.value === '8' || x.value === '9').length > 0 ? true : false));
        }
    }, [evalNumbers, exploratory]);

    React.useEffect(() => {
        const filtered = formattedData.filter((x) =>
            (versionFilters.length === 0 || versionFilters.includes(x['Survey Version']?.toString())) &&
            (evalFilters.length === 0 || evalFilters.map((y) => y.value).includes(x['eval']?.toString())) &&
            (roleFilters.length === 0 || roleFilters.some((filter) => x[(showPh2 ? 'What is your current role' : 'What is your current role (choose all that apply):')]?.split('; ').includes(filter))) &&
            (!statusFilters?.includes('Complete') || isDefined(x['Post-Scenario Measures - Time Taken (Minutes)'])) &&
            (!statusFilters?.includes('Incomplete') || !isDefined(x['Post-Scenario Measures - Time Taken (Minutes)'])) &&
            ((showPh2 && (!milFilters || x['Served in Military']) &&
                (!milFilters?.includes('Yes') || !x['Served in Military']?.includes('Never Served')) &&
                (!milFilters?.includes('No') || x['Served in Military']?.includes('Never Served'))) ||
                (!showPh2 &&
                    (!milFilters?.includes('Yes') || x['What is your current role (choose all that apply):']?.split('; ').includes('Military Background')) &&
                    (!milFilters?.includes('No') || !x['What is your current role (choose all that apply):']?.split('; ').includes('Military Background'))))
        );
        setFilteredData(filtered);
        // remove extra headers that have no data
        if (formattedData.length > 0) {
            const usedHeaders = getUsedHeaders(filtered);
            setHeaders(usedHeaders);
        }

    }, [versionFilters, evalFilters, formattedData, statusFilters, roleFilters, milFilters, getUsedHeaders]);

    const refineData = (origData) => {
        // remove unwanted headers from download
        const updatedData = structuredClone(origData);
        const usedHeaders = getUsedHeaders(updatedData);
        updatedData.map((x) => {
            delete x.eval;
            for (const h of Object.keys(x)) {
                if (!usedHeaders.includes(h))
                    delete x[h];
            }
            return x;
        });
        return updatedData;
    };

    const toggleDataType = (event) => {
        setShowLegacy(event.target.value === 'Legacy');
        setShowPh2(event.target.value === 'PH2')
        setFilteredData(formattedData);
        setEvalFilters([]);
        setMilFilters(null);
        setRoleFilters([]);
        setStatusFilters(null);
        setVersionFilters([]);
    };

    const openModal = () => {
        setShowDefinitions(true);
    };

    const closeModal = () => {
        setShowDefinitions(false);
    };

    const isFiltered = () => {
        return filteredData.length < (exploratory ? (evalFilters.length === 0 || formattedData.filter((x) => evalFilters.map((y) => y.value).includes(x['eval']?.toString())).length) : formattedData.length);
    };

    const makeDownloadButton = () => {
        let name, xlFile, pdfFile;
        if (showLegacy) {
            name = 'Survey Results Definitions - Legacy.pdf';
            xlFile = definitionXLFileLegacy;
            pdfFile = definitionPDFFileLegacy;
        }
        else if (showPh2) {
            if (exploratory) {
                name = 'Delegation Data By Block Definitions - PH2.xlsx';
                xlFile = definitionXLFileExploratoryPH2;
                pdfFile = definitionXLFileExploratoryPH2;
            }
            else {
                name = 'Survey Results Definitions - PH2.pdf';
                xlFile = definitionXLFilePH2;
                pdfFile = definitionXLFilePH2;
            }
        }
        else if (exploratory) {
            name = 'Delegation Data By Block Definitions.xlsx';
            xlFile = definitionXLFileExploratory;
            pdfFile = definitionXLFileExploratory;
        }
        else {
            name = 'Survey Results Definitions.pdf';
            xlFile = definitionXLFile;
            pdfFile = definitionPDFFile;
        }
        return <RQDefinitionTable downloadName={name} xlFile={xlFile} pdfFile={pdfFile} />
    };

    return (<div className={!isFiltered() && exploratory ? 'lowered-table' : ''}>
        {isFiltered() &&
            <p className='filteredText'>Showing {filteredData.length} of {(exploratory ? (evalFilters.length === 0 || formattedData.filter((x) => evalFilters.map((y) => y.value).includes(x['eval']?.toString())).length) : formattedData.length)} rows based on filters</p>}
        <section className='tableHeader results-download-btns'>
            <div className="filters">
                {!showLegacy && !exploratory && evals.length > 0 && <Autocomplete
                    multiple
                    options={evals}
                    filterSelectedOptions
                    size="small"
                    value={evalFilters}
                    isOptionEqualToValue={(x, y) => x.value === y.value & x.label === y.label}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Eval"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setEvalFilters(newVal)}
                />}
                {showLegacy && <Autocomplete
                    multiple
                    options={versions}
                    filterSelectedOptions
                    size="small"
                    value={versionFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Version"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setVersionFilters(newVal)}
                />}
                <Autocomplete
                    multiple
                    options={roles}
                    filterSelectedOptions
                    size="small"
                    value={roleFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Role"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setRoleFilters(newVal)}
                />
                <Autocomplete
                    options={militaryStatus}
                    filterSelectedOptions
                    size="small"
                    value={milFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Is Military"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setMilFilters(newVal)}
                />
                <Autocomplete
                    options={surveyStatus}
                    filterSelectedOptions
                    size="small"
                    value={statusFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Survey Status"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setStatusFilters(newVal)}
                />
                {!exploratory && <RadioGroup className='simple-radios' row defaultValue="PH2" onChange={toggleDataType}>
                    <FormControlLabel value="Legacy" control={<Radio />} label=" Legacy" />
                    <FormControlLabel value="DRE/PH1" control={<Radio />} label=" DRE/PH1" />
                    <FormControlLabel value="PH2" control={<Radio />} label=" PH2" />
                </RadioGroup>}
            </div>

            <DownloadButtons formattedData={refineData(formattedData)} filteredData={refineData(filteredData)} HEADERS={headers} fileName={exploratory ? 'Delegation Data By Block' : 'Survey Results'} extraAction={openModal} />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {headers.map((val, index) => {
                            return (<th key={'header-' + index}>
                                {val}
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((dataSet, index) => {
                        return (<tr key={dataSet['Participant ID'] + '-' + index}>
                            {headers.map((val) => {
                                return (<td key={dataSet['Participant ID'] + '-' + val + '-' + index}>
                                    {dataSet[val] ?? '-'}
                                </td>);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
        <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
            <div className='modal-body'>
                <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                {makeDownloadButton()}
            </div>
        </Modal>
    </div>);
}