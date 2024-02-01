import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import './resultsTable.css';
import { useQuery } from '@apollo/react-hooks';
import gql from "graphql-tag";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';

/* A list of names that are not pages to record in the excel sheet */
const NON_PAGES = ['user', 'surveyVersion', 'startTime', 'timeComplete', 'Participant ID'];

const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

function formatTime(seconds) {
    seconds = Math.round(seconds);
    let minutes = (Math.floor(seconds / 60) % 60);
    minutes = minutes.toString().length !== 2 ? '0' + minutes.toString() : minutes.toString();
    let formatted_seconds = seconds % 60;
    formatted_seconds = formatted_seconds.toString().length < 2 ? '0' + formatted_seconds.toString() : formatted_seconds.toString();
    return `${minutes}:${formatted_seconds}`
}

export function ResultsTable() {
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS);
    const [formattedData, setFormattedData] = React.useState([]);
    const [headers, setHeaders] = React.useState(['Participant Id', 'Username', 'Survey Version', 'Start Time', 'End Time', 'Total Time', 'Completed Simulation']);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    React.useEffect(() => {
        // every time data updates, we need to go through and get all the participant data, 
        // putting it in an object
        if (data) {
            console.log(data)
            const allObjs = [];
            const allHeaders = [...headers];
            for (let entry of data.getAllSurveyResults) {
                entry = entry.results;
                const entryObj = {};
                entryObj['Participant Id'] = entry?.user?.id;
                entryObj['Username'] = entry?.user?.username;
                entryObj['Survey Version'] = entry?.surveyVersion;
                entryObj['Start Time'] = new Date(entry?.startTime)?.toLocaleString();
                entryObj['End Time'] = new Date(entry?.timeComplete)?.toLocaleString();
                const timeDifSeconds = (new Date(entry?.timeComplete).getTime() - new Date(entry?.startTime).getTime()) / 1000;
                entryObj['Total Time'] = formatTime(timeDifSeconds);
                entryObj['Completed Simulation'] = (!entry['Participant ID']?.questions?.Condition?.response.includes('NOT')).toString();
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
                                    if (typeof (entry[page][key][q].response) === 'string') {
                                        entryObj[header_name] = entry[page][key][q].response;
                                        if (!allHeaders.includes(header_name)) {
                                            allHeaders.push(header_name);
                                        }
                                    }
                                    else if (entry[page][key][q].response && typeof (entry[page][key][q].response) !== 'object') {
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
                allObjs.push(entryObj);
            }
            setFormattedData(allObjs);
            setHeaders(allHeaders);
        }
    }, [data]);
    const exportToExcel = async () => {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        // TODO: make survey name easier to modify
        FileSaver.saveAs(data, 'survey_data' + fileExtension);
    }

    return (<>
        {loading && <p>Loading</p>}
        {error && <p>Error</p>}
        {data && <><section className='tableHeader'>
            <div className="back-header">
                <a href="/survey-results" className="back-icon"><ArrowBackIosIcon /></a>
                <h2>Tabulated Survey Results</h2>
            </div>
            <button className='downloadBtn' onClick={exportToExcel}>Download Data</button>
        </section>
            <div className='resultTableSection'>
                <table>
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


