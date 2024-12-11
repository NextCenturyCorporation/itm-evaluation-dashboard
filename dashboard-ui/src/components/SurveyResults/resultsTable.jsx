import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import './resultsTable.css';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import { useSelector } from "react-redux";
import { Autocomplete, TextField } from "@mui/material";
import { isDefined } from "../AggregateResults/DataFunctions";
import { DownloadButtons } from "../DRE-Research/tables/download-buttons";

const EVAL_MAP = {
    3: 'MRE',
    4: 'DRE',
    5: 'PH1'
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
    "Total Time",
    "Post-Scenario Measures - Time Taken (mm:ss)",
    "As I was reading through the scenarios and Medic decisions, I actively thought about how I would handle the same situation",
    "I was easily able to imagine myself as the medic in these scenarios",
    "I could easily draw from an experience / similar situation to imagine myself as the medics in these scenarios",
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
    "I feel that people are generally reliable",
    "I usually trust people until they give me a reason not to trust them",
    "Trusting another person is not difficult for me",
    "What was the biggest influence on your delegation decision between different medics?",
    "Have you completed the text-based scenarios",
    "VR Scenarios Completed",
    "VR Experience Level",
    "VR Comfort Level",
    "Additional Information About Discomfort",
    "Note Page - Time Taken (mm:ss)"
];

function formatTime(seconds) {
    seconds = Math.round(seconds);
    let minutes = (Math.floor(seconds / 60) % 60);
    minutes = minutes.toString().length !== 2 ? '0' + minutes.toString() : minutes.toString();
    let formatted_seconds = seconds % 60;
    formatted_seconds = formatted_seconds.toString().length < 2 ? '0' + formatted_seconds.toString() : formatted_seconds.toString();
    return `${minutes}:${formatted_seconds}`
}

export function ResultsTable({ data, pLog }) {
    const [headers, setHeaders] = React.useState(STARTING_HEADERS);
    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [evals, setEvals] = React.useState([]);
    const [evalFilters, setEvalFilters] = React.useState([{ 'value': '5', 'label': '5 - PH1' }]);
    const [roles, setRoles] = React.useState([]);
    const [roleFilters, setRoleFilters] = React.useState([]);
    const [surveyStatus] = React.useState(['Complete', 'Incomplete']);
    const [statusFilters, setStatusFilters] = React.useState([]);
    const [militaryStatus] = React.useState(['Yes', 'No']);
    const [milFilters, setMilFilters] = React.useState([]);
    const [versions, setVersions] = React.useState([]);
    const [versionFilters, setVersionFilters] = React.useState([]);
    const [origHeaderSet, setOrigHeaderSet] = React.useState([]);


    React.useEffect(() => {
        if (data) {
            const allObjs = [];
            const allVersions = [];
            const allEvals = [];
            let allRoles = [];
            const updatedHeaders = STARTING_HEADERS;
            // set up block headers
            for (let block = 1; block < 5; block++) {
                for (let dm = 1; dm < 4; dm++) {
                    const subheaders = ['TA1', 'TA2', 'Type', 'Target', 'Name', 'Time', 'Scenario', 'Agreement', 'SRAlign', 'Trustworthy', 'Trust'];
                    for (let subhead of subheaders) {
                        updatedHeaders.push(`B${block}_DM${dm}_${subhead}`);
                    }
                }
                const comparisons = ['Compare_DM1', 'Compare_DM2', 'Compare_DM3', 'Compare_Time', 'Compare_FC1', 'Compare_FC1_Conf', 'Compare_FC1_Explain', 'Compare_FC2', 'Compare_FC2_Conf', 'Compare_FC2_Explain'];
                for (let subhead of comparisons) {
                    updatedHeaders.push(`B${block}_${subhead}`);
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
                if (!version || version < 4) {
                    // TODO: show this somewhere else
                    continue;
                }

                // ignore invalid pids
                let pid = entry['Participant ID']?.questions['Participant ID']?.response ?? entry['Participant ID Page']?.questions['Participant ID']?.response ?? entry['pid'];
                if (!pid) {
                    continue;
                }
                const logData = pLog.find(
                    log => log['ParticipantID'] == pid && log['Type'] != 'Test'
                );
                if ((version == 4 || version == 5) && !logData) {
                    continue;
                }
                if (obj['eval'] == 3 && pid.slice(0, 4) != '2024') {
                    continue;
                }

                const lastPage = entry['Post-Scenario Measures'];

                // add data to filter options
                allEvals.push(obj['eval']);
                allVersions.push(version);

                // add data to table
                obj['Participant ID'] = pid;
                obj['Survey Version'] = version;
                obj['Start Time'] = entry.startTime ? new Date(entry.startTime)?.toLocaleString() : null;
                obj['End Time'] = new Date(entry.timeComplete)?.toLocaleString();
                const timeDifSeconds = (new Date(entry.timeComplete).getTime() - new Date(entry.startTime).getTime()) / 1000;
                obj['Total Time'] = entry.startTime ? formatTime(timeDifSeconds) : null;
                if (lastPage) {
                    obj['Post-Scenario Measures - Time Taken (mm:ss)'] = formatTime(lastPage.timeSpentOnPage);
                    for (const q of Object.keys(lastPage.questions)) {
                        if (q != 'What is your current role (choose all that apply):') {
                            obj[q] = lastPage.questions[q].response?.toString();
                        }
                        else {
                            const roles = lastPage.questions[q].response?.toString();
                            allRoles = [...allRoles, ...roles.split(',')];
                            obj[q] = roles.replaceAll(',', '; ');
                        }
                    }
                }

                if (!entry['Note page']) {
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
                    obj["VR Scenarios Completed"] = entry['Participant ID Page']?.questions?.['VR Scenarios Completed']?.response;
                }
                obj["Note Page - Time Taken (mm:ss)"] = formatTime(entry['Note page'].timeSpentOnPage);


                // get blocks of dms
                let block = 1;
                let dm = 1;
                for (const pageName of (entry['orderLog'] ?? Object.keys(entry)).filter((x) => x.includes('Medic'))) {
                    const page = entry[pageName];
                    if (!page) {
                        // should never occur
                        if (lastPage) {
                            console.error('Page not found! ', pageName);
                        }
                        continue;
                    }
                    if (page.pageType == 'singleMedic') {
                        obj[`B${block}_DM${dm}_TA1`] = page.scenarioIndex?.includes('vol') || page.scenarioIndex?.includes('qol') ? 'ST' : 'AD';
                        obj[`B${block}_DM${dm}_TA2`] = page.admAuthor.replace('kitware', 'Kitware').replace('TAD', 'Parallax');
                        obj[`B${block}_DM${dm}_Type`] = page.admAlignment;
                        obj[`B${block}_DM${dm}_Target`] = page.admTarget;
                        obj[`B${block}_DM${dm}_Name`] = pageName;
                        obj[`B${block}_DM${dm}_Time`] = formatTime(page.timeSpentOnPage);
                        obj[`B${block}_DM${dm}_Scenario`] = page.scenarioIndex;
                        obj[`B${block}_DM${dm}_Agreement`] = TRUST_MAP[page.questions?.[pageName + ': Do you agree with the decisions that this medic made?']?.response];
                        obj[`B${block}_DM${dm}_SRAlign`] = TRUST_MAP[page.questions?.[pageName + ': The way this medic makes medical decisions is how I make decisions']?.response];
                        obj[`B${block}_DM${dm}_Trustworthy`] = TRUST_MAP[page.questions?.[pageName + ': This medic is trustworthy']?.response];
                        obj[`B${block}_DM${dm}_Trust`] = TRUST_MAP[page.questions?.[pageName + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it']?.response];
                        dm += 1;
                    }
                    else if (page.pageType == 'comparison') {
                        const alignment = page.admAlignment?.split(' vs ');
                        const order = pageName.replace(' vs  vs ', ' vs ').split(' vs ');
                        const alignedVsBaseline = order[alignment.indexOf('aligned')] + ' vs ' + order[alignment.indexOf('baseline')];
                        const alignedVsMisaligned = order[alignment.indexOf('aligned')] + ' vs ' + order[alignment.indexOf('misaligned')];
                        obj[`B${block}_Compare_DM1`] = order[0] + ' - ' + alignment[0];
                        obj[`B${block}_Compare_DM2`] = order[1] + ' - ' + alignment[1];
                        obj[`B${block}_Compare_DM3`] = order[2] + ' - ' + alignment[2];
                        obj[`B${block}_Compare_Time`] = formatTime(page.timeSpentOnPage);
                        const fc1 = page.questions?.[alignedVsBaseline + ': Forced Choice']?.response
                        obj[`B${block}_Compare_FC1`] = fc1 + ' - ' + alignment[order.indexOf(fc1)];
                        obj[`B${block}_Compare_FC1_Conf`] = CONFIDENCE_MAP[page.questions?.[alignedVsBaseline + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                        obj[`B${block}_Compare_FC1_Explain`] = page.questions?.[alignedVsBaseline + ': Explain your response to the delegation preference question']?.response;
                        const fc2 = page.questions?.[alignedVsMisaligned + ': Forced Choice']?.response
                        obj[`B${block}_Compare_FC2`] = fc2 + ' - ' + alignment[order.indexOf(fc2)];
                        obj[`B${block}_Compare_FC2_Conf`] = CONFIDENCE_MAP[page.questions?.[alignedVsMisaligned + ': Rate your confidence about the delegation decision indicated in the previous question']?.response];
                        obj[`B${block}_Compare_FC2_Explain`] = page.questions?.[alignedVsMisaligned + ': Explain your response to the delegation preference question']?.response;
                        block += 1;
                        dm = 1;
                    }
                }

                allObjs.push(obj);
            }
            // prep filters and data (sort by pid)
            allObjs.sort((a, b) => a['Participant ID'] - b['Participant ID']);
            setVersions(Array.from(new Set(allVersions)).filter((x) => isDefined(x)).map((x) => x.toString()));
            setEvals(Array.from(new Set(allEvals)).filter((x) => isDefined(x)).map((x) => { return { 'value': x.toString(), 'label': x + ' - ' + EVAL_MAP[x] } }));
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setHeaders(updatedHeaders);
            setRoles(Array.from(new Set(allRoles)));
            setOrigHeaderSet(updatedHeaders);
        }
    }, [data, pLog]);

    React.useEffect(() => {
        const filtered = formattedData.filter((x) =>
            (versionFilters.length == 0 || versionFilters.includes(x['Survey Version']?.toString())) &&
            (evalFilters.length == 0 || evalFilters.map((y) => y.value).includes(x['eval']?.toString())) &&
            (roleFilters.length == 0 || roleFilters.some((filter) => x['What is your current role (choose all that apply):']?.split('; ').includes(filter))) &&
            (!statusFilters?.includes('Complete') || isDefined(x['Post-Scenario Measures - Time Taken (mm:ss)'])) &&
            (!statusFilters?.includes('Incomplete') || !isDefined(x['Post-Scenario Measures - Time Taken (mm:ss)'])) &&
            (!milFilters?.includes('Yes') || x['What is your current role (choose all that apply):']?.split('; ').includes('Military Background')) &&
            (!milFilters?.includes('No') || !x['What is your current role (choose all that apply):']?.split('; ').includes('Military Background'))
        );
        setFilteredData(filtered);
        // remove extra headers that have no data
        if (formattedData.length > 0) {
            const usedHeaders = [];
            for (let x of origHeaderSet) {
                for (let datapoint of filtered) {
                    if (isDefined(datapoint[x])) {
                        usedHeaders.push(x);
                        break;
                    }
                }
            }
            setHeaders(usedHeaders);
        }
    }, [versionFilters, evalFilters, formattedData, statusFilters, roleFilters, milFilters]);

    const refineData = (origData) => {
        // remove unwanted headers from download
        const updatedData = structuredClone(origData);
        updatedData.map((x) => {
            delete x.eval;
            return x;
        });
        return updatedData;
    };

    return (<>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                {evals.length > 0 && <Autocomplete
                    multiple
                    options={evals}
                    filterSelectedOptions
                    size="small"
                    defaultValue={evals.filter((x) => x.value == '5')}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Eval"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setEvalFilters(newVal)}
                />}
                <Autocomplete
                    multiple
                    options={versions}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Version"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setVersionFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={roles}
                    filterSelectedOptions
                    size="small"
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
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Survey Status"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setStatusFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={refineData(formattedData)} filteredData={refineData(filteredData)} HEADERS={headers} fileName={'Survey Results'} />
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
                        return (<tr key={dataSet['Participant_ID'] + '-' + index}>
                            {headers.map((val) => {
                                return (<td key={dataSet['Participant_ID'] + '-' + val + '-' + index}>
                                    {dataSet[val] ?? '-'}
                                </td>);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </>);
}

// /* A list of names that are not pages to record in the excel sheet */
const NON_PAGES = ['user', 'surveyVersion', 'startTime', 'timeComplete', 'Participant ID'];



// const STARTING_HEADERS = ['Participant Id', 'Survey Version', 'Start Time', 'End Time', 'Total Time', 'Completed Simulation', 'Order Log', 'Updated Order Log'];

function OLDResultsTable({ data, pLog }) {
    const [formattedData, setFormattedData] = React.useState([]);
    let defaultVersion = useSelector(state => state?.configs?.currentSurveyVersion);
    defaultVersion = defaultVersion.endsWith('.0') ?
        defaultVersion.slice(0, -2) :
        defaultVersion
    const [filterBySurveyVersion, setVersionOption] = React.useState([defaultVersion]);
    const [versions, setVersions] = React.useState(['All']);
    const [selectAll, setSelectAll] = React.useState(false);
    const [headers, setHeaders] = React.useState([...STARTING_HEADERS]);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    React.useEffect(() => {
        // every time data updates, we need to go through and get all the participant data, 
        // putting it in an object
        const allObjs = [];
        const allHeaders = [...STARTING_HEADERS];
        const tmpVersion = ['All'];
        for (let entry of data) {
            entry = entry.results ?? entry;
            const entryObj = {};
            let addToTable = true;
            const version = entry?.surveyVersion
            if (!filterBySurveyVersion.includes(version?.toString()) && !selectAll) {
                addToTable = false;
            }
            let pid = entry['Participant ID']?.questions['Participant ID']?.response ?? entry['Participant ID Page']?.questions['Participant ID']?.response ?? entry['pid'];
            if (!pid) {
                continue;
            }
            const logData = pLog.find(
                log => log['ParticipantID'] == pid && log['Type'] != 'Test'
            );
            if ((version == 4 || version == 5) && !logData) {
                continue;
            }
            entryObj['Participant Id'] = pid;

            entryObj['Survey Version'] = version;
            if (version && !tmpVersion.includes(version)) {
                tmpVersion.push(version);
            }
            entryObj['Start Time'] = new Date(entry?.startTime)?.toLocaleString();
            entryObj['End Time'] = new Date(entry?.timeComplete)?.toLocaleString();
            const timeDifSeconds = (new Date(entry?.timeComplete).getTime() - new Date(entry?.startTime).getTime()) / 1000;
            entryObj['Total Time'] = formatTime(timeDifSeconds);
            if (entryObj['Survey Version'] < 2) {
                entryObj['Completed Simulation'] = (!entry['Participant ID']?.questions?.Condition?.response?.includes('NOT')).toString();
            } else {
                entryObj['Completed Simulation'] = (!entry['Participant ID Page']?.questions?.['VR Scenarios Completed']?.response?.includes('none')).toString();
            }

            // Handle Order Log
            if (Array.isArray(entry['orderLog']) && Array.isArray(entry['updatedOrderLog'])) {
                entryObj['Order Log'] = JSON.stringify(entry['orderLog']);
                entryObj['Updated Order Log'] = JSON.stringify(entry['updatedOrderLog'])
            } else {
                entryObj['Order Log'] = entry['orderLog'] || '-';
                entryObj['Updated Order Log'] = entry['updatedOrderLog'] || '-';
            }

            for (const page of Object.keys(entry)) {
                if (!NON_PAGES.includes(page) && typeof (entry[page]) === 'object') {
                    // get all keys from the page and name them nicely within the excel
                    for (const key of Object.keys(entry[page])) {
                        if (key === 'timeSpentOnPage') {
                            const header_name = page + ' - Time Taken (mm:ss)';
                            if (!allHeaders.includes(header_name)) {
                                allHeaders.push(header_name);
                            }
                            entryObj[header_name] = formatTime(entry[page][key]);
                        }
                        if (key === 'questions') {
                            for (const q of Object.keys(entry[page]['questions'])) {
                                const header_name = q.replace('The information about the situation and the medical decisions were presented in an understandable, easy-to-use format', 'Understandable Format')
                                    .replace('Rate your confidence about the delegation decision indicated in the previous question', 'Delegation Confidence')
                                    .replace('I have completed disaster response training such as those offered by the American Red Cross, FEMA, or the Community Emergency Response Team (CERT)', 'Completed Disaster Response Training')
                                    .replace('How many disaster drills (or simulated mass casualty events with live actors) have you participated in before today (Please enter a whole number)', 'Disaster Drill Count')
                                    .replace('I had enough information in this presentation to make the ratings for the questions asked on the previous pages about the DMs', 'I had enough information to answer these questions');
                                if (!entry[page][key][q].response) { continue; }
                                if (typeof (entry[page][key][q].response) === 'string') {
                                    entryObj[header_name] = entry[page][key][q].response;
                                    if (!allHeaders.includes(header_name)) {
                                        allHeaders.push(header_name);
                                    }
                                }
                                else if (typeof (entry[page][key][q].response) !== 'object' || q === "What is your current role (choose all that apply):" || q === "VR Scenarios Completed") {
                                    if (!allHeaders.includes(header_name)) {
                                        allHeaders.push(header_name);
                                    }
                                    entryObj[header_name] = entry[page][key][q].response.toString();
                                }
                            }
                        }
                    }
                }
            }
            if (addToTable) {
                allObjs.push(entryObj);
            }
        }
        const found_headers = [];
        for (let obj of allObjs) {
            for (const header of allHeaders) {
                if (!(header in obj)) {
                    obj[header] = '-';
                } else {
                    // only include headers that have at least one response
                    if (!found_headers.includes(header)) {
                        found_headers.push(header);
                    }
                }
            }
        }
        allObjs.sort((a, b) => a['Participant Id'] - b['Participant Id']);
        setFormattedData(allObjs);
        setHeaders(found_headers);
        setVersions(tmpVersion);
    }, [data, filterBySurveyVersion, selectAll]);

    const exportToExcel = async () => {
        // Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const dataCopy = structuredClone(formattedData);
        for (let pid of Object.keys(dataCopy)) {
            for (let k of Object.keys(dataCopy[pid])) {
                if (dataCopy[pid][k] == '-') {
                    dataCopy[pid][k] = '';
                }
            }
        }
        const ws = XLSX.utils.json_to_sheet(dataCopy);

        // Adjust column widths
        const colWidths = headers.map(header => ({ wch: Math.max(header.length, 20) }));
        ws['!cols'] = colWidths;

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Survey Data');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'survey_data_v' + filterBySurveyVersion.join('_v') + fileExtension);
    };

    const updateVersions = (selected) => {
        if (selected.target.checked && !selectAll) {
            if (selected.target.value === 'All') {
                setSelectAll(true);
                setVersionOption([...versions]);
            } else {
                setVersionOption([...filterBySurveyVersion, selected.target.value]);
            }
        }
        else {
            if (selectAll && selected.target.value !== 'All') {
                setSelectAll(false);
                setVersionOption(versions.filter((x) => x !== 'All' && x.toString() !== selected.target.value).map((x) => x.toString()));
            }
            else {
                setSelectAll(false);
                if (selected.target.value === 'All') {
                    setVersionOption([]);
                }
                else {
                    setVersionOption(filterBySurveyVersion.filter((x) => x !== selected.target.value));
                }
            }
        }
    };

    return (<>
        {data && <><section className='tableHeader'>
            <h2>Tabulated Survey Results</h2>
            <div className="option-section">
                <FormControl className='version-select'>
                    <InputLabel shrink>Survey Version</InputLabel>
                    <div className='checkboxes'>
                        {versions.map((v) => {
                            return <MenuItem key={v} value={v}>
                                <Checkbox value={v.toString()} checked={filterBySurveyVersion.indexOf(v.toString()) > -1 || selectAll} onChange={updateVersions} />
                                <ListItemText primary={v} />
                            </MenuItem>;
                        })}
                    </div>
                </FormControl>
                <button className='downloadBtn' onClick={exportToExcel}>Download Data</button>
            </div>
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
                        {formattedData.map((dataSet, index) => {
                            return (<tr key={dataSet['ParticipantId'] + '-' + index}>
                                {headers.map((val) => {
                                    return (<td key={dataSet['ParticipantId'] + '-' + val}>
                                        {dataSet[val]}
                                    </td>);
                                })}
                            </tr>);
                        })}
                    </tbody>
                </table>
            </div></>}
    </>);
}