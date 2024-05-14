import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import './resultsTable.css';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';

/* A list of names that are not pages to record in the excel sheet */
const NON_PAGES = ['user', 'surveyVersion', 'startTime', 'timeComplete', 'Participant ID'];


function formatTime(seconds) {
    seconds = Math.round(seconds);
    let minutes = (Math.floor(seconds / 60) % 60);
    minutes = minutes.toString().length !== 2 ? '0' + minutes.toString() : minutes.toString();
    let formatted_seconds = seconds % 60;
    formatted_seconds = formatted_seconds.toString().length < 2 ? '0' + formatted_seconds.toString() : formatted_seconds.toString();
    return `${minutes}:${formatted_seconds}`
}

const STARTING_HEADERS = ['Participant Id', 'Survey Version', 'Start Time', 'End Time', 'Total Time', 'Completed Simulation'];

export function ResultsTable({ data }) {
    const [formattedData, setFormattedData] = React.useState([]);
    const [filterBySurveyVersion, setVersionOption] = React.useState(['2']);
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
            entryObj['Participant Id'] = entry['Participant ID']?.questions['Participant ID']?.response;
            if (!entryObj['Participant Id']) {
                entryObj['Participant Id'] = entry['Participant ID Page']?.questions['Participant ID']?.response;
                if (!entryObj['Participant Id']) {
                    continue;
                }
            }
            entryObj['Survey Version'] = version;
            if (version && !tmpVersion.includes(version)) {
                tmpVersion.push(version);
            }
            entryObj['Start Time'] = new Date(entry?.startTime)?.toLocaleString();
            entryObj['End Time'] = new Date(entry?.timeComplete)?.toLocaleString();
            const timeDifSeconds = (new Date(entry?.timeComplete).getTime() - new Date(entry?.startTime).getTime()) / 1000;
            entryObj['Total Time'] = formatTime(timeDifSeconds);
            if (entryObj < 2) {
                entryObj['Completed Simulation'] = (!entry['Participant ID']?.questions?.Condition?.response?.includes('NOT')).toString();
            } else {
                entryObj['Completed Simulation'] = (!entry['Participant ID Page']?.questions?.['VR Scenarios Completed']?.response?.includes('none')).toString();
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
                                else if (typeof (entry[page][key][q].response) !== 'object') {
                                    if (!allHeaders.includes(header_name)) {
                                        allHeaders.push(header_name);
                                    }
                                    entryObj[header_name] = entry[page][key][q].response.toString();
                                } else if (q === "What is your current role (choose all that apply):" || q === "VR Scenarios Completed") {
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
        setFormattedData(allObjs);
        setHeaders(found_headers);
        setVersions(tmpVersion);
    }, [data, filterBySurveyVersion, selectAll]);


    const exportToExcel = async () => {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
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
                    setVersionOption(['2']);
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


