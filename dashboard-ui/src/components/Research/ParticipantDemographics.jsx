import React from 'react';
import { useQuery, useApolloClient } from 'react-apollo';
import gql from 'graphql-tag';
import Select from 'react-select';
import { getAllEvals, exportToExcel } from './utils';
import './dre-rq.css';
import '../../css/resultsTable.css';
import { Modal } from '@mui/material';
import CloseIcon from '@material-ui/icons/Close';
import { RQDefinitionTable } from './variables/rq-variables';
import ph1File from './variables/Variable Definitions Demographics_PH1.xlsx'
import ph2File from './variables/Variable Definitions Demographics_PH2.xlsx'

const PH1_DEFINITION_FILE = ph1File
const PH2_DEFINITION_FILE = ph2File

const RENAME_MAP = {
    question7: 'Specify specialty, level, year or other specific information about your role'
}

const PH1_EVALS = new Set([4, 5, 6])

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
    'VR Experience Level', 'VR Comfort Level'
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
    'VR Experience Level', 'VR Comfort Level'
]

const ALL_HEADERS = [
    'Eval',
    ...PH1_HEADERS,
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
    'How many real-world casualties have you assessed using TCCC protocols'
]

const GET_SURVEY_RESULTS = gql`
    query getAllSurveyResultsByEval($evalNumber: Float!) {
        getAllSurveyResultsByEval(evalNumber: $evalNumber)
    }`

const GET_DEMO_DATA = gql`
    query GetDemographicsByEval($evalNumber: Float!) {
        getDemographicsByEval(evalNumber: $evalNumber)
    }`


function buildRowsForEval(evalNum, surveyData, demoData, isDemoCollection) {

    let records = []
    const vrByPid = {}
    const surveyPsmByPid = {}

    if (isDemoCollection && surveyData?.getAllSurveyResultsByEval) {
        const demoByPid = {}
        if (demoData?.getDemographicsByEval) {
            demoData.getDemographicsByEval.forEach(rec => {
                const pid = rec.results?.pid ?? rec.surveyId
                if (pid) demoByPid[pid] = rec
            })
        }
        surveyData.getAllSurveyResultsByEval.forEach(res => {
            const pid = res.results?.pid
            if (pid) {
                vrByPid[pid] = res.results?.['VR Page']?.questions ?? res.results?.['Participant ID Page']?.questions ?? {}
                surveyPsmByPid[pid] = res.results?.['Post-Scenario Measures']?.questions ?? {}
            }
        })
        records = surveyData.getAllSurveyResultsByEval
            .filter(res => res.results?.pid)
            .map(res => demoByPid[res.results.pid] ?? res)
    } else if (!isDemoCollection && surveyData?.getAllSurveyResultsByEval) {
        records = surveyData.getAllSurveyResultsByEval.filter(
            res => res.results?.['Post-Scenario Measures']
        )
    }

    const versionByPid = {}
    if (isDemoCollection && surveyData?.getAllSurveyResultsByEval) {
        surveyData.getAllSurveyResultsByEval.forEach(res => {
            if (res.results?.pid && res.results?.surveyVersion) {
                versionByPid[res.results.pid] = res.results.surveyVersion
            }
        })
    }

    records = records.filter(res => !(evalNum === 8 && String(res.results?.surveyVersion) === '1.3'))

    if (records.length === 0) return []

    return records.map(res => {
        const pid = res.results?.pid ?? ''
        const version = res.results?.surveyVersion ?? versionByPid[res.results?.pid ?? res.surveyId] ?? ''
        const vrQuestions = isDemoCollection
            ? (vrByPid[res.results?.pid ?? res.surveyId] ?? {})
            : (res.results?.['VR Page']?.questions ?? res.results?.['Participant ID Page']?.questions ?? {})

        const psm = res.results?.['Post-Scenario Measures'] ?? {}
        const isFlat = !psm.questions
        const questionEntries = isFlat
            ? Object.entries(psm).filter(([k]) => !['timeSpentOnPage', 'pageName'].includes(k))
            : Object.entries(psm.questions ?? {})

        const row = { 'Participant ID': pid, 'Survey Version': version }

        for (const [key, val] of questionEntries) {
            const header = RENAME_MAP[key] ?? key
            const response = isFlat ? val : val?.response
            row[header] = Array.isArray(response) ? response.join(', ') : (response ?? '')
        }

        if (isDemoCollection) {
            const surveyQuestions = surveyPsmByPid[pid] ?? {}
            for (const [key, val] of Object.entries(surveyQuestions)) {
                const header = RENAME_MAP[key] ?? key
                if (!row[header]) {
                    const response = val?.response
                    row[header] = Array.isArray(response) ? response.join(', ') : (response ?? '')
                }
            }
        }

        for (const [key, val] of Object.entries(vrQuestions)) {
            const header = RENAME_MAP[key] ?? key
            if (!row[header]) {
                const response = val?.response
                row[header] = Array.isArray(response) ? response.join(', ') : (response ?? '')
            }
        }

        return row
    });
}

export function ParticipantDemographics() {
    const evalOptions = getAllEvals()
    const client = useApolloClient()
    const [selectedEval, setSelectedEval] = React.useState(evalOptions[0]?.value ?? null)
    const [formattedData, setFormattedData] = React.useState([])
    const [headers, setHeaders] = React.useState([])
    const [showDefinitions, setShowDefinitions] = React.useState(false);

    const isPhase1 = PH1_EVALS.has(selectedEval)

    const { data } = useQuery(GET_SURVEY_RESULTS, {
        variables: { evalNumber: selectedEval },
        skip: !selectedEval
    })

    const { data: demoData } = useQuery(GET_DEMO_DATA, {
        variables: { evalNumber: selectedEval },
        skip: !selectedEval || PH1_EVALS.has(selectedEval)
    })

    const isDemoCollection = (demoData?.getDemographicsByEval?.length ?? 0) > 0

    React.useEffect(() => {
        setFormattedData([])
        setHeaders([])
        const rows = buildRowsForEval(selectedEval, data, demoData, isDemoCollection)
        setFormattedData(rows)
        setHeaders(isPhase1 ? PH1_HEADERS : PH2_HEADERS)
    }, [data, demoData, isDemoCollection, selectedEval])
    
    const [allEvalsData, setAllEvalsData] = React.useState([])

    React.useEffect(() => {
        const fetchAll = async () => {
            const allRows = []
            for (const { value: evalNum } of evalOptions) {
                const { data: sd } = await client.query({
                    query: GET_SURVEY_RESULTS,
                    variables: { evalNumber: evalNum }
                })
                let dd = null
                const { data: demoResult } = await client.query({
                    query: GET_DEMO_DATA,
                    variables: { evalNumber: evalNum }
                })
                dd = demoResult
                
                const rows = buildRowsForEval(evalNum, sd, dd, (dd?.getDemographicsByEval?.length ?? 0) > 0)
                rows.forEach(row => { row['Eval'] = evalNum; })
                allRows.push(...rows)

            }
            setAllEvalsData(allRows)
        };
        fetchAll()
    }, [])

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
                    <div className='option-section'>
                        <button
                            className='downloadBtn'
                            onClick={() => exportToExcel(
                                `Participant_Demographics_eval${selectedEval}`,
                                formattedData.map(row => Object.fromEntries(headers.map(h => [h, row[h]]))),
                                headers
                            )}
                        >
                            Download Current Eval
                        </button>
                        <button
                            className='downloadBtn'
                            onClick={() => exportToExcel(
                                'Participant_Demographics_all_evals',
                                allEvalsData.map(row => Object.fromEntries(ALL_HEADERS.map(h => [h, row[h]]))),
                                ALL_HEADERS
                            )}
                            disabled={allEvalsData.length === 0}
                            style={{ opacity: allEvalsData.length === 0 ? 0.5 : 1, cursor: allEvalsData.length === 0 ? 'not-allowed' : 'pointer' }}
                        >
                            Download All Data
                        </button>
                        <button className='downloadBtn' onClick={() => setShowDefinitions(true)}>
                            View Variable Definitions
                        </button>
                    </div>

                </section>
                <div className="resultTableSection">
                    <table className="itm-table">
                        {formattedData.length > 0 && (
                            <thead>
                                <tr>
                                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                                </tr>
                            </thead>
                        )}
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
                            xlFile={isPhase1 ? PH1_DEFINITION_FILE : PH2_DEFINITION_FILE}
                            downloadName={`Definitions_Demographics_${isPhase1 ? 'PH1' : 'PH2'}.xlsx`}
                        />
                    </div>
                </Modal>
        </div>
    );
}
