import React from 'react';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';
import Select from 'react-select';
import { Modal } from '@mui/material';
import CloseIcon from '@material-ui/icons/Close';
import { DownloadButtons } from './tables/download-buttons';
import { RQDefinitionTable } from './variables/rq-variables';
import { getAllEvals } from './utils';
import './dre-rq.css';
import '../../css/resultsTable.css';

const RENAME_MAP = {
    question7: 'Specify specialty, level, year or other specific information about your role'
}

const DEMO_COLLECTION_EVALS = new Set([15, 16]);

const PH1_EVALS = new Set([4, 5, 6]);

const PH1_HEADERS = [
    'Participant ID', 'Survey Version',
    'As I was reading through the scenarios and Medic decisions, I actively thought about how I would handle the same situation',
    'I was easily able to imagine myself as the medic in these scenarios',
    'I could easily draw from an experience / similar situation to imagine myself as the medics in these scenarios',
    'I am a computer gaming enthusiast',
    'I consider myself a seasoned first responder',
    'I have completed disaster response training such as those offered by the American Red Cross, FEMA, or the Community Emergency Response Team (CERT)',
    'I have completed disaster response training provided by the United States Military',
    'What is your current role (choose all that apply):',
    'Branch and Status', 'Military Medical Training',
    'Years experience in military medical role',
    'VR Experience Level', 'VR Comfort Level',
];

const PH2_HEADERS = [
    'Participant ID', 'Survey Version',
    'As I was reading through the scenarios and Medic decisions, I actively thought about how I would handle the same situation',
    'I was easily able to imagine myself as the medic in these scenarios',
    'I could easily draw from an experience / similar situation to imagine myself as the medics in these scenarios',
    'How would you describe your experience with virtual reality technology',
    'What is your current role',
    'Specify specialty, level, year or other specific information about your role',
    'Years of experience in role', 'Primary practice environment',
    'Have you participated in mass casualty events', 'Served in Military',
    'Military Branch', 'Did you serve in a military medical role',
    'What was/is your medical-related MOS or rate',
    'How many years of experience do you have serving in a medical role in the military',
    'In which environments have you provided medical care during military service',
    'When did you last complete TCCC training or recertification',
    'How would you rate your expertise with TCCC procedures',
    'How many real-world casualties have you assessed using TCCC protocols',
    'VR Experience Level', 'VR Comfort Level',
];


const GET_SURVEY_RESULTS = gql`
    query getAllSurveyResultsByEval($evalNumber: Float!) {
        getAllSurveyResultsByEval(evalNumber: $evalNumber)
    }`

const GET_DEMO_DATA = gql`
    query GetDemographicsByEval($evalNumber: Float!) {
        getDemographicsByEval(evalNumber: $evalNumber)
    }`


export function ParticipantDemographics() {
    const evalOptions = getAllEvals()
    const [selectedEval, setSelectedEval] = React.useState(evalOptions[0]?.value ?? null)
    const [formattedData, setFormattedData] = React.useState([])
    const [headers, setHeaders] = React.useState([])
    const [showDefinitions, setShowDefinitions] = React.useState(false)

    const isDemoCollection = DEMO_COLLECTION_EVALS.has(selectedEval);
    const isPhase1 = PH1_EVALS.has(selectedEval);


    const { data } = useQuery(GET_SURVEY_RESULTS, {
        variables: { evalNumber: selectedEval },
        skip: !selectedEval,
    });


    const { data: demoData } = useQuery(GET_DEMO_DATA, {
        variables: { evalNumber: selectedEval },
        skip: !selectedEval || !isDemoCollection,
    });


    React.useEffect(() => {
        setFormattedData([]);
        setHeaders([]);

        let records = [];
        const vrByPid = {};

        if (isDemoCollection && data?.getAllSurveyResultsByEval) {
            const demoByPid = {};
            if (demoData?.getDemographicsByEval) {
                demoData.getDemographicsByEval.forEach(rec => {
                    const pid = rec.results?.pid ?? rec.surveyId;
                    if (pid) demoByPid[pid] = rec;
                });
            }

            data.getAllSurveyResultsByEval.forEach(res => {
                const pid = res.results?.pid;
                if (pid) {
                    vrByPid[pid] =
                        res.results?.['VR Page']?.questions ??
                        res.results?.['Participant ID Page']?.questions ??
                        {};
                }
            });

            records = data.getAllSurveyResultsByEval
                .filter(res => res.results?.pid)
                .map(res => demoByPid[res.results.pid] ?? res);
        } else if (!isDemoCollection && data?.getAllSurveyResultsByEval) {
            records = data.getAllSurveyResultsByEval.filter(
                res => res.results?.['Post-Scenario Measures']
            );
        }


        const versionByPid = {};
            if (isDemoCollection && data?.getAllSurveyResultsByEval) {
                data.getAllSurveyResultsByEval.forEach(res => {
                    if (res.results?.pid && res.results?.surveyVersion) {
                        versionByPid[res.results.pid] = res.results.surveyVersion;
                    }
                });
            }

        if (records.length === 0) return;

        const rows = records.map(res => {
            const pid = res.results?.pid ?? '';
            const version = res.results?.surveyVersion ?? versionByPid[res.results?.pid ?? res.surveyId] ?? '';
            const vrQuestions = isDemoCollection
                ? (vrByPid[res.results?.pid ?? res.surveyId] ?? {})
                : (res.results?.['VR Page']?.questions ??
                res.results?.['Participant ID Page']?.questions ??
                {});

            const psm = res.results?.['Post-Scenario Measures'] ?? {};
            const isFlat = !psm.questions;
            const questionEntries = isFlat
                ? Object.entries(psm).filter(([k]) => !['timeSpentOnPage', 'pageName'].includes(k))
                : Object.entries(psm.questions ?? {});

            const row = { 'Participant ID': pid, 'Survey Version': version };

            for (const [key, val] of questionEntries) {
                const header = RENAME_MAP[key] ?? key;
                const response = isFlat ? val : val?.response;
                row[header] = Array.isArray(response) ? response.join(', ') : (response ?? '');
            }

            for (const [key, val] of Object.entries(vrQuestions)) {
                const header = RENAME_MAP[key] ?? key;
                if (!row[header]) {
                    const response = val?.response;
                    row[header] = Array.isArray(response) ? response.join(', ') : (response ?? '');
                }
            }

            return row;
        });

        setFormattedData(rows);
        setHeaders(isPhase1 ? PH1_HEADERS : PH2_HEADERS);
    }, [data, demoData, isDemoCollection, selectedEval]);


        return (
        <div className="researchQuestion">
            <div className="rq-selection-section">
                <Select
                    onChange={(opt) => setSelectedEval(opt.value)}
                    options={evalOptions}
                    defaultValue={evalOptions[0]}
                    placeholder="Select Evaluation"
                    value={evalOptions.find(o => o.value === selectedEval)}
                    styles={{ menu: provided => ({ ...provided, zIndex: 9999 }) }}
                />
            </div>
            <div className="section-container">
                <h2>Participant Demographics</h2>
                <section className="tableHeader">
                    <p className="filteredText">{formattedData.length} participant{formattedData.length !== 1 ? 's' : ''}</p>
                    <DownloadButtons
                        formattedData={formattedData}
                        filteredData={formattedData}
                        HEADERS={headers}
                        fileName={`Participant_Demographics_eval${selectedEval}`}
                        extraAction={() => setShowDefinitions(true)}
                    />
                </section>
                <div className="resultTableSection">
                    <table className="itm-table">
                        <thead>
                            <tr>
                                {headers.map((h, i) => <th key={i}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {formattedData.length > 0 ? (
                                formattedData.map((row, ri) => (
                                    <tr key={ri} className={ri % 2 === 0 ? 'row-even' : 'row-odd'}>
                                        {headers.map((h, ci) => (
                                            <td key={ci}>{row[h]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={headers.length}>No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal className="table-modal" open={showDefinitions} onClose={() => setShowDefinitions(false)}>
                <div className="modal-body">
                    <span className="close-icon" onClick={() => setShowDefinitions(false)}><CloseIcon /></span>
                    <RQDefinitionTable
                        xlFile={null}
                        downloadName={`Definitions_Demographics_eval${selectedEval}.xlsx`}
                    />
                </div>
            </Modal>
        </div>
    );
}
