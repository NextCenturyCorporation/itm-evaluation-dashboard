import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import { isDefined } from "../AggregateResults/DataFunctions";
import { admOrderMapping, getDelEnvMapping } from '../Survey/delegationMappings';


export const ADM_NAME_MAP = {
    "TAD-aligned": "Parallax",
    "TAD-severity-baseline": "Parallax",
    "ALIGN-ADM-ComparativeRegression-ICL-Template": "Kitware",
    "ALIGN-ADM-OutlinesBaseline": "Kitware"
};

const RATING_MAP = {
    "Strongly disagree": 1,
    "Disagree": 2,
    "Neither agree nor disagree": 3,
    "Agree": 4,
    "Strongly agree": 5,
    '-': '-'
};


const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const fileExtension = '.xlsx';

export const exportToExcel = async (filename, formattedData, headers) => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'RQ Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, filename + fileExtension);
};

export function getAlignments(evalNum, textResults, pid) {
    const textResultsForPID = textResults.filter((data) => data.evalNumber == evalNum && data.participantID == pid);
    const alignments = [];
    let addedMJ = false;
    for (const textRes of textResultsForPID) {
        if (evalNum == 4) {
        // adept
            if (Object.keys(textRes).includes("combinedAlignmentData")) {
                if (!addedMJ) {
                    alignments.push(...textRes['combinedAlignmentData']);
                    addedMJ = true;
                }
            }
            else {
                // st
                alignments.push(...textRes['alignmentData'])
            }
        }
        else {
            // adept
            if (!Object.keys(textRes).includes("alignmentData")) {
                if (!addedMJ) {
                    const atts = [];
                    for (const attSet of textRes['mostLeastAligned']) {
                        for (const att of attSet.response) {
                            for (const k of Object.keys(att)) {
                                atts.push({ 'target': k, 'score': att[k] });
                            }
                        }
                    }
                    alignments.push(...atts);
                    addedMJ = true;
                }
            }
            else {
                // st
                alignments.push(...textRes['alignmentData'])
            }  
        }
    }
    return { textResultsForPID, alignments };
}

export function getRQ134Data(evalNum, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim) {
    const surveyResults = dataSurveyResults.getAllSurveyResults;
    const participantLog = dataParticipantLog.getParticipantLog;
    const textResults = dataTextResults.getAllScenarioResults;
    const admData = dataADMs.getAllHistoryByEvalNumber;
    const comparisons = comparisonData.getHumanToADMComparison;
    const simData = dataSim.getAllSimAlignmentByEval;
    const allObjs = [];
    const allTA1s = [];
    const allTA2s = [];
    const allScenarios = [];
    const allTargets = [];
    const allAttributes = [];

    // find participants that have completed the delegation survey
    const completed_surveys = surveyResults.filter((res) => res.results?.evalNumber == evalNum && isDefined(res.results['Post-Scenario Measures']));
    for (const res of completed_surveys) {
        const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response;
        const orderLog = res.results['orderLog']?.filter((x) => x.includes('Medic'));
        // see if participant is in the participantLog
        const logData = participantLog.find(
            log => log['ParticipantID'] == pid
        );
        if (!logData) {
            continue;
        }
        const { textResultsForPID, alignments } = getAlignments(evalNum, textResults, pid);
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
                        scenario = entry['Attribute'] == 'MJ' ? getDelEnvMapping(res.results.surveyVersion)[ad_scenario][0] : getDelEnvMapping(res.results.surveyVersion)[ad_scenario][1];
                    }
                    else {
                        scenario = entry['Attribute'] == 'QOL' ? getDelEnvMapping(res.results.surveyVersion)[st_scenario][0] : getDelEnvMapping(res.results.surveyVersion)[st_scenario][1];
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
                entryObj['Datasource'] = evalNum == 4 ? 'DRE' : logData.Type == 'Online' ? 'P1E_online' : 'P1E_IRL';
                entryObj['Delegator_grp'] = logData['Type'] == 'Civ' ? 'Civilian' : logData['Type'] == 'Mil' ? 'Military' : logData['Type'];
                const roles = res.results?.['Post-Scenario Measures']?.questions?.['What is your current role (choose all that apply):']?.['response'];
                // override 102, who is military
                entryObj['Delegator_mil'] = roles?.includes('Military Background') || pid == '202409102' ? 'yes' : 'no';
                entryObj['Delegator_Role'] = roles ?? '-'
                if (Array.isArray(entryObj['Delegator_Role'])) {
                    entryObj['Delegator_Role'] = entryObj['Delegator_Role'].join('; ');
                }
                entryObj['TA1_Name'] = entry['TA1'];
                allTA1s.push(entry['TA1']);
                entryObj['Trial_ID'] = orderLog ? orderLog.indexOf(page['pageName']) + 1 : trial_num;
                trial_num += 1;
                entryObj['Attribute'] = entry['Attribute'];
                allAttributes.push(entryObj['Attribute']);
                entryObj['Scenario'] = entry['TA1'] == 'Adept' ? ad_scenario : st_scenario;
                allScenarios.push(entryObj['Scenario']);
                entryObj['TA2_Name'] = entry['TA2'];
                allTA2s.push(entry['TA2']);
                entryObj['ADM_Type'] = t == 'comparison' ? 'comparison' : ['misaligned', 'aligned'].includes(t) ? 'aligned' : 'baseline';
                entryObj['Target'] = page['admTarget'] ?? '-';
                if (entryObj['Target'] != '-') {
                    allTargets.push(entryObj['Target']);
                }
                const foundADM = admData.find((adm) => adm.history[0].parameters.adm_name == page['admName'] && (adm.history[0].response?.id ?? adm.history[1].response?.id) == page['scenarioIndex'].replace('IO', 'MJ') &&
                    adm.history[adm.history.length - 1].parameters.target_id == page['admTarget']);
                const alignment = foundADM?.history[foundADM.history.length - 1]?.response?.score ?? '-';
                entryObj['Alignment score (ADM|target)'] = alignment;
                const simEntry = simData.find((x) => x.evalNumber == evalNum && x.pid == pid &&
                    (['QOL', 'VOL'].includes(entryObj['Attribute']) ? x.ta1 == 'st' : x.ta1 == 'ad') &&
                    x.scenario_id.toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                const alignmentData = simEntry?.data?.alignment?.adms_vs_text;
                entryObj['Alignment score (Participant_sim|Observed_ADM(target))'] = alignmentData?.find((x) => (x['adm_author'] == (entry['TA2'] == 'Kitware' ? 'kitware' : 'TAD')) &&
                    x['adm_alignment'].includes(entryObj['ADM_Type']) && x['adm_target'] == page['admTarget'])?.score ?? '-';
                entryObj['Alignment score (Delegator|target)'] = alignments.find((a) => a.target == page['admTarget'] || (evalNum == 5 && a.target == page['admTarget']?.replace('.', '')))?.score ?? '-';
                entryObj['Server Session ID (Delegator)'] = t == 'comparison' ? '-' : textResultsForPID.find((r) => r.scenario_id.includes(entryObj['TA1_Name'] == 'Adept' ? 'MJ' : (entryObj['Target'].includes('qol') ? 'qol' : 'vol')))?.[entryObj['TA1_Name'] == 'Adept' ? 'combinedSessionId' : 'serverSessionId'] ?? '-';
                entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t == 'comparison' ? '-' : t;
                entryObj['ADM Loading'] = t == 'comparison' ? '-' : t == 'baseline' ? 'normal' : ['least aligned', 'most aligned'].includes(page['admChoiceProcess']) ? 'normal' : 'exemption';

                const comparison_entry = comparisons?.find((x) => x['adm_type'] == t && x['pid'] == pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] == 'Parallax' && x['adm_author'] == 'TAD') || (entry['TA2'] == 'Kitware' && x['adm_author'] == 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                entryObj['Alignment score (Delegator|Observed_ADM (target))'] = comparison_entry?.score ?? '-';

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
    return { allObjs, allTA1s, allTA2s, allScenarios, allTargets, allAttributes };
}