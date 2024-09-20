import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { isDefined } from "../../AggregateResults/DataFunctions";

const admOrderMapping = {
    1: [{ "TA2": "Kitware", "TA1": "Adept", "Attribute": "MJ" },
    { "TA2": "Parallax", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Parallax", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Kitware", "TA1": "ST", "Attribute": "VOL" },],
    2: [{ "TA2": "Kitware", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Parallax", "TA1": "ST", "Attribute": "VOL" },
    { "TA2": "Parallax", "TA1": "Adept", "Attribute": "MJ" }],
    3: [{ "TA2": "Parallax", "TA1": "Adept", "Attribute": "MJ" },
    { "TA2": "Parallax", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Kitware", "TA1": "ST", "Attribute": "VOL" }],
    4: [{ "TA2": "Parallax", "TA1": "ST", "Attribute": "VOL" },
    { "TA2": "Kitware", "TA1": "ST", "Attribute": "QOL" },
    { "TA2": "Parallax", "TA1": "Adept", "Attribute": "IO" },
    { "TA2": "Kitware", "TA1": "Adept", "Attribute": "MJ" }]
}

const delEnvMapping = {
    "AD-1": ["DryRunEval-MJ2-eval", "DryRunEval-IO2-eval"],
    "AD-2": ["DryRunEval-MJ4-eval", "DryRunEval-IO4-eval"],
    "AD-3": ["DryRunEval-MJ5-eval", "DryRunEval-IO5-eval"],
    "ST-1": ["qol-dre-1-eval", "vol-dre-1-eval"],
    "ST-2": ["qol-dre-2-eval", "vol-dre-2-eval"],
    "ST-3": ["qol-dre-3-eval", "vol-dre-3-eval"],
}

const RATING_MAP = {
    "Strongly disagree": 1,
    "Disagree": 2,
    "Neither agree nor disagree": 3,
    "Agree": 4,
    "Strongly agree": 5,
    '-': '-'
};


const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_ADM_DATA = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const HEADERS = ['ADM Order', 'Delegator_ID', 'Delegator_grp', 'Delegator_Role', 'TA1_Name', 'Trial_ID', 'Attribute', 'Scenario', 'TA2_Name', 'ADM_Type', 'Target', 'Alignment score (ADM|target)', 'Alignment score (Delegator|target)', 'ADM_Aligned_Status (Baseline/Misaligned/Aligned)', 'ADM Loading', 'Alignment score (Delegator|Observed_ADM (target))', 'Trust_Rating', 'Delegation preference (A/B)', 'Delegation preference (A/M)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating'];

export function RQ13() {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingADMs, error: errorADMs, data: dataADMs } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 4 }
    });

    const [formattedData, setFormattedData] = React.useState([]);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && dataADMs?.getAllHistoryByEvalNumber) {
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const participantLog = dataParticipantLog.getParticipantLog;
            const textResults = dataTextResults.getAllScenarioResults;
            const admData = dataADMs.getAllHistoryByEvalNumber;
            const allObjs = [];

            // find participants that have completed the delegation survey
            const completed_surveys = surveyResults.filter((res) => res.results?.surveyVersion == 4 && isDefined(res.results['Post-Scenario Measures']));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response;
                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => log['ParticipantID'] == pid
                );
                if (!logData) {
                    continue;
                }
                const textResultsForPID = textResults.filter((data) => data.evalNumber == 4 && data.participantID == pid);
                const alignments = [];
                let addedMJ = false;
                for (const textRes of textResultsForPID) {
                    if (Object.keys(textRes).includes("combinedAlignmentData")) {
                        if (!addedMJ) {
                            alignments.push(...textRes['combinedAlignmentData']);
                            addedMJ = true;
                        }
                    }
                    else {
                        alignments.push(...textRes['alignmentData'])
                    }
                }
                // set up object to store participant data
                const admOrder = admOrderMapping[logData['ADMOrder']];
                let trial_num = 1;
                const st_scenario = logData['Del-1'].includes('ST') ? logData['Del-1'] : logData['Del-2'];
                const ad_scenario = logData['Del-1'].includes('AD') ? logData['Del-1'] : logData['Del-2'];

                for (const entry of admOrder) {
                    const types = ['baseline', 'aligned', 'misaligned', 'comparison'];
                    for (const t of types) {

                        let page = Object.keys(res.results).find((k) => {
                            const obj = res.results[k];
                            const alignMatches = obj['admAlignment'] == t || obj['pageType'] == 'comparison' && t == 'comparison';
                            const ta2Matches = obj['admAuthor'] == (entry['TA2'] == 'Kitware' ? 'kitware' : 'TAD');
                            let scenario = false;
                            if (entry['TA1'] == 'Adept') {
                                scenario = entry['Attribute'] == 'MJ' ? delEnvMapping[ad_scenario][0] : delEnvMapping[ad_scenario][1];
                            }
                            else {
                                scenario = entry['Attribute'] == 'QOL' ? delEnvMapping[st_scenario][0] : delEnvMapping[st_scenario][1];
                            }

                            const scenarioMatches = obj['scenarioIndex'] == scenario;

                            return alignMatches && ta2Matches && scenarioMatches;
                        });
                        if (!page) {
                            // likely from missing misaligned/aligned for those few parallax adms
                            continue;
                        }
                        page = res.results[page];
                        const entryObj = {};
                        entryObj['ADM Order'] = logData['ADMOrder'];
                        entryObj['Delegator_ID'] = pid;
                        entryObj['Delegator_grp'] = logData['Type'] == 'Civ' ? 'Civilian' : 'Military';
                        entryObj['Delegator_Role'] = res.results?.['Post-Scenario Measures']?.questions?.['What is your current role (choose all that apply):']?.['response'] ?? '-'
                        if (Array.isArray(entryObj['Delegator_Role'])) {
                            entryObj['Delegator_Role'] = entryObj['Delegator_Role'].join('; ');
                        }
                        entryObj['TA1_Name'] = entry['TA1'];
                        entryObj['Trial_ID'] = trial_num;
                        trial_num += 1;
                        entryObj['Attribute'] = entry['Attribute'];
                        entryObj['Scenario'] = entry['TA1'] == 'Adept' ? ad_scenario : st_scenario;
                        entryObj['TA2_Name'] = entry['TA2'];
                        entryObj['ADM_Type'] = t == 'comparison' ? 'comparison' : ['misaligned', 'aligned'].includes(t) ? 'aligned' : 'baseline';
                        entryObj['Target'] = page['admTarget'] ?? '-';
                        const foundADM = admData.find((adm) => adm.history[0].parameters.adm_name == page['admName'] && (adm.history[0].response?.id ?? adm.history[1].response?.id) == page['scenarioIndex'].replace('IO', 'MJ') &&
                            adm.history[adm.history.length - 1].parameters.target_id == page['admTarget']);
                        const alignment = foundADM?.history[foundADM.history.length - 1]?.response?.score ?? '-';
                        entryObj['Alignment score (ADM|target)'] = alignment;
                        entryObj['Alignment score (Delegator|target)'] = alignments.find((a) => a.target == page['admTarget'])?.score ?? '-';
                        entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t == 'comparison' ? '-' : t;
                        entryObj['ADM Loading'] = t == 'comparison' ? '-' : t == 'baseline' ? 'normal' : ['least aligned', 'most aligned'].includes(page['admChoiceProcess']) ? 'normal' : 'exemption';
                        entryObj['Alignment score (Delegator|Observed_ADM (target))'] = '-';

                        entryObj['Trust_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it']?.['response'] ?? '-' : '-'];
                        if (t == 'comparison') {
                            const adms = page['pageName'].split(' vs ');
                            const alignedAdm = adms[1];
                            const baselineAdm = adms[0];
                            const misalignedAdm = adms[2];
                            const qAB = page.questions[alignedAdm + ' vs ' + baselineAdm + ': Forced Choice']?.response ?? '-';
                            const qAM = page.questions[alignedAdm + ' vs ' + misalignedAdm + ': Forced Choice']?.response ?? '-';

                            entryObj['Delegation preference (A/B)'] = qAB == '-' ? '-' : (qAB == alignedAdm ? 'A' : 'B');
                            entryObj['Delegation preference (A/M)'] = qAM == '-' ? '-' : (qAM == alignedAdm ? 'A' : 'M');
                            // need to back-populate previous rows with which was chosen
                            for (let i = 0; i < 3; i++) {
                                switch (allObjs[allObjs.length - 1 - i]['ADM_Aligned_Status (Baseline/Misaligned/Aligned)']) {
                                    case 'aligned':
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/B)'] = entryObj['Delegation preference (A/B)'] == 'A' ? 'y' : 'n';
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/M)'] = entryObj['Delegation preference (A/M)'] == 'A' ? 'y' : 'n';
                                        break
                                    case 'baseline':
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/B)'] = entryObj['Delegation preference (A/B)'] == 'B' ? 'y' : 'n';
                                        break
                                    case 'misaligned':
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/M)'] = entryObj['Delegation preference (A/M)'] == 'M' ? 'y' : 'n';
                                        break
                                    default:
                                        break
                                }
                            }
                        }
                        else {
                            entryObj['Delegation preference (A/B)'] = '-';
                            entryObj['Delegation preference (A/M)'] = '-';
                        }
                        entryObj['Trustworthy_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': This medic is trustworthy']?.['response'] ?? '-' : '-'];
                        entryObj['Agreement_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': Do you agree with the decisions that this medic made?']?.['response'] ?? '-' : '-'];
                        entryObj['SRAlign_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': The way this medic makes medical decisions is how I make decisions']?.['response'] ?? '-' : '-'];
                        allObjs.push(entryObj);
                    }
                }
            }
            setFormattedData(allObjs);
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs]);

    const exportToExcel = async () => {
        // Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Adjust column widths
        const colWidths = HEADERS.map(header => ({ wch: Math.max(header.length, 20) }));
        ws['!cols'] = colWidths;

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Survey Data');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'RQ-1_and_RQ-3 data' + fileExtension);
    };

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs) return <p>Error :</p>;

    return (<>
        <section className='tableHeader'>
            <div className="option-section">
                <button className='downloadBtn' onClick={exportToExcel}>Download Data</button>
            </div>
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (<th key={'header-' + index}>
                                {val}
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {formattedData.map((dataSet, index) => {
                        return (<tr key={dataSet['ParticipantId'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['ParticipantId'] + '-' + val}>
                                    {dataSet[val]}
                                </td>);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </>);
}
