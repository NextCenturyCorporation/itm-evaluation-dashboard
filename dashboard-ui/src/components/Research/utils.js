import * as FileSaver from 'file-saver';
import XLSX from 'xlsx-js-style';
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


const PH1_COMPETENCE = {
    'ST-1': ['qol-human-8022671-SplitLowMulti-ph1', 'qol-human-5032922-SplitLowMulti-ph1', 'qol-human-0000001-SplitEvenMulti-ph1', 'qol-synth-LowExtreme-ph1', 'qol-synth-LowCluster-ph1'],
    'ST-2': ['qol-human-8022671-SplitLowMulti-ph1', 'qol-human-5032922-SplitLowMulti-ph1', 'qol-human-0000001-SplitEvenMulti-ph1', 'qol-synth-LowExtreme-ph1', 'qol-synth-LowCluster-ph1',
        'vol-human-1774519-SplitHighMulti-ph1', 'vol-synth-LowCluster-ph1'],
    'ST-3': ['qol-human-8022671-SplitLowMulti-ph1', 'qol-human-5032922-SplitLowMulti-ph1', 'qol-human-0000001-SplitEvenMulti-ph1', 'qol-synth-LowExtreme-ph1', 'qol-synth-LowCluster-ph1',
        'vol-human-8022671-SplitHighMulti-ph1', 'vol-human-1774519-SplitHighMulti-ph1', 'vol-synth-LowCluster-ph1'],
    'AD-1': [],
    'AD-2': [],
    'AD-3': []
};


const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const fileExtension = '.xlsx';

export const exportToExcel = async (filename, formattedData, headers, participantData = false) => {
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

    if (participantData) {
        // apply conditional formatting to participant data
        const keys = Object.keys(dataCopy[Object.keys(dataCopy)[0]]);
        const lightGreenIfNotNull = ['Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];

        for (let row = 1; row <= dataCopy.length; row++) {
            for (let col = 0; col < keys.length; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = ws[cellRef];

                if (cell) {
                    const val = cell.v;
                    if (lightGreenIfNotNull.includes(keys[col]) && isDefined(val)) {
                        cell.s = {
                            fill: {
                                fgColor: { rgb: 'c2ecc2' }  // Light green color
                            }
                        };
                    }
                    if ((keys[col] == 'Delegation' && val == 1) || (keys[col] == 'Text' && val == 5) || (keys[col] == 'Sim Count' && val == 4)) {
                        cell.s = {
                            fill: {
                                fgColor: { rgb: '7bbc7b' }  // Dark green color
                            }
                        };
                    }
                }
            }
        }
    }

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, participantData ? 'Participants' : 'RQ Data');

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
                if (!addedMJ && textRes['mostLeastAligned']) {
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

function findWrongDelMaterials(evalNum, participantLog, surveyResults) {
    const good_pids = ['202411581', '202411353', '202411546']; // hard code some pids that have other problems
    const completed_surveys = surveyResults.filter((res) => res.results?.evalNumber == evalNum && ((evalNum == 4 && isDefined(res.results['Post-Scenario Measures'])) || (evalNum == 5 && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0)));
    const bad_pids = [];
    for (const res of completed_surveys) {
        const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
        if (good_pids.includes(pid)) {
            continue;
        }
        const logData = participantLog.find(
            log => log['ParticipantID'] == pid && log['Type'] != 'Test'
        );
        if (!logData) {
            continue;
        }
        // get all scenarios the participant saw in the survey
        const scenarios = [];
        for (const pageName of Object.keys(res.results)) {
            const page = res.results[pageName];
            if (page['scenarioIndex']) {
                scenarios.push(page['scenarioIndex']);
            }
        }
        // get the scenarios the participant was supposed to see
        const st_scenario = logData['Del-1'].includes('ST') ? logData['Del-1'] : logData['Del-2'];
        const ad_scenario = logData['Del-1'].includes('AD') ? logData['Del-1'] : logData['Del-2'];
        const adm_order = admOrderMapping[logData['ADMOrder']];
        const good_scenarios = [...getDelEnvMapping(evalNum)[ad_scenario], ...getDelEnvMapping(evalNum)[st_scenario]];
        for (const x of scenarios) {
            if (!good_scenarios.includes(x)) {
                bad_pids.push(pid);
                break;
            }
        }
        if (!bad_pids.includes(pid)) {
            const comparisons = res?.results?.orderLog?.filter((pgname) => pgname.includes(' vs '));
            for (let i = 0; i < adm_order.length; i++) {
                const expectedAdm = adm_order[i]['TA2'];
                const expectedAtt = adm_order[i]['Attribute'];
                const actualAdm = res?.results?.[comparisons[i]]?.['admAuthor'].replace('kitware', 'Kitware').replace('TAD', 'Parallax');
                const actualScenario = res?.results?.[comparisons[i]]?.['scenarioIndex'];
                if (actualAdm != expectedAdm || !actualScenario.includes(expectedAtt.replace('QOL', 'qol').replace('VOL', 'vol'))) {
                    bad_pids.push(pid);
                    break;
                }
            }
        }
    }
    return bad_pids;
}

export function getRQ134Data(evalNum, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim, fullSetOnly = false, includeDreServer = true) {
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
    const completed_surveys = surveyResults.filter((res) => res.results?.evalNumber == evalNum && ((evalNum == 4 && isDefined(res.results['Post-Scenario Measures'])) || ((evalNum == 5 || evalNum == 6) && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0)));
    const wrong_del_materials = evalNum == 5 ? findWrongDelMaterials(evalNum, participantLog, surveyResults) : [];
    for (const res of completed_surveys) {
        const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
        if (!isDefined(res.results['Post-Scenario Measures']) && surveyResults.filter((res) => res.results?.['Participant ID Page']?.questions['Participant ID']?.response == pid && isDefined(res.results['Post-Scenario Measures']))) {
            // filter incomplete surveys from participants who have a complete survey
            continue;
        }
        const orderLog = res.results['orderLog']?.filter((x) => x.includes('Medic'));
        // see if participant is in the participantLog
        const logData = participantLog.find(
            log => log['ParticipantID'] == pid && log['Type'] != 'Test'
        );
        const textCount = textResults.filter((x) => x.participantID == pid).length;
        if (!logData || textCount < 5) {
            continue;
        }
        if (fullSetOnly && (logData.surveyEntryCount < 1 || textCount < 5 || logData.simEntryCount < 3)) {
            continue;
        }
        const { textResultsForPID, alignments } = getAlignments(evalNum, textResults, pid);
        // set up object to store participant data
        const admOrder = pid == '202411327' ? admOrderMapping[3] : (wrong_del_materials.includes(pid) ? admOrderMapping[1] : admOrderMapping[logData['ADMOrder']]);
        let trial_num = 1;
        const st_scenario = pid == '202411327' ? 'ST-2' : (wrong_del_materials.includes(pid) ? 'ST-3' : (logData['Del-1'].includes('ST') ? logData['Del-1'] : logData['Del-2']));
        const ad_scenario = pid == '202411327' ? 'AD-2' : (wrong_del_materials.includes(pid) ? 'AD-1' : (logData['Del-1'].includes('AD') ? logData['Del-1'] : logData['Del-2']));

        for (const entry of admOrder) {
            const types = ['baseline', 'aligned', 'misaligned', 'comparison'];
            for (const t of types) {

                let page = Object.keys(res.results).find((k) => {
                    const obj = res.results[k];
                    const alignMatches = obj['admAlignment'] == t || obj['pageType'] == 'comparison' && t == 'comparison';
                    const ta2Matches = obj['admAuthor'] == (entry['TA2'] == 'Kitware' ? 'kitware' : 'TAD');
                    let scenario = false;

                    if (entry['TA1'] == 'Adept') {
                        scenario = entry['Attribute'] == 'MJ' ? getDelEnvMapping(evalNum)[ad_scenario][0] : getDelEnvMapping(evalNum)[ad_scenario][1];
                    }
                    else {
                        scenario = entry['Attribute'] == 'QOL' ? getDelEnvMapping(evalNum)[st_scenario][0] : getDelEnvMapping(evalNum)[st_scenario][1];
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
                entryObj['Delegator_ID'] = pid;
                entryObj['ADM Order'] = wrong_del_materials.includes(pid) ? 1 : logData['ADMOrder'];
                entryObj['Datasource'] = evalNum == 4 ? 'DRE' : evalNum == 5 ? (logData.Type == 'Online' ? 'P1E_online' : 'P1E_IRL') : (logData.Type == 'Online' ? 'P1E_online_2025' : 'P1E_IRL_2025');
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
                if (evalNum == 5 || evalNum == 6)
                    entryObj['DRE Alignment score (ADM|target)'] = entry['TA1'] == 'Adept' ? page.dreAdmAlignment : alignment;

                // if DRE data is included in PH1 set, update DRE columns accordingly
                if (evalNum == 4 && fullSetOnly && includeDreServer) {
                    entryObj['DRE Alignment score (ADM|target)'] = entryObj['Alignment score (ADM|target)'];
                    entryObj['Alignment score (ADM|target)'] = entry['TA1'] == 'Adept' ? page.ph1AdmAlignment : entryObj['Alignment score (ADM|target)']
                }

                const simEntry = simData.find((x) => x.evalNumber == evalNum && x.pid == pid &&
                    (['QOL', 'VOL'].includes(entryObj['Attribute']) ? x.ta1 == 'st' : x.ta1 == 'ad') &&
                    x.scenario_id.toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                const alignmentData = simEntry?.data?.alignment?.adms_vs_text;
                entryObj['Alignment score (Participant_sim|Observed_ADM(target))'] = alignmentData?.find((x) => (x['adm_author'] == (entry['TA2'] == 'Kitware' ? 'kitware' : 'TAD')) &&
                    x['adm_alignment'].includes(entryObj['ADM_Type']) && x['adm_target'] == page['admTarget'])?.score ?? '-';

                entryObj['Alignment score (Delegator|target)'] = alignments.find((a) => a.target == page['admTarget'] || ((evalNum == 5 || evalNum == 6) && a.target == page['admTarget']?.replace('.', '')))?.score ?? '-';
                if (evalNum == 5 || evalNum == 6)
                    entryObj['DRE Alignment score (Delegator|target)'] = entry['TA1'] == 'Adept' ? page.dreTxtAlignment : entryObj['Alignment score (Delegator|target)'];
                // if DRE data is included in PH1 set, update DRE columns accordingly
                if (evalNum == 4 && fullSetOnly && includeDreServer) {
                    entryObj['DRE Alignment score (Delegator|target)'] = entryObj['Alignment score (Delegator|target)'];
                    entryObj['Alignment score (Delegator|target)'] = entry['TA1'] == 'Adept' ? page.ph1TxtAlignment : entryObj['Alignment score (Delegator|target)']
                }

                entryObj['Server Session ID (Delegator)'] = t == 'comparison' ? '-' : textResultsForPID.find((r) => r.scenario_id.includes(entryObj['TA1_Name'] == 'Adept' ? 'MJ' : (entryObj['Target'].includes('qol') ? 'qol' : 'vol')))?.[entryObj['TA1_Name'] == 'Adept' ? 'combinedSessionId' : 'serverSessionId'] ?? '-';
                entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t == 'comparison' ? '-' : t;

                entryObj['ADM Loading'] = t == 'comparison' ? '-' : t == 'baseline' ? 'normal' : ['least aligned', 'most aligned'].includes(page['admChoiceProcess']) ? 'normal' : 'exemption';
                if (evalNum == 5 || evalNum == 6) 
                    entryObj['DRE ADM Loading'] = entry['TA1'] == 'Adept' ? page.dreChoiceProcess : entryObj['ADM Loading'];
                // if DRE data is included in PH1 set, update DRE columns accordingly
                if (evalNum == 4 && fullSetOnly && includeDreServer) {
                    entryObj['DRE ADM Loading'] = entryObj['ADM Loading'];
                    entryObj['ADM Loading'] = entry['TA1'] == 'Adept' ? page.ph1ChoiceProcess : entryObj['ADM Loading']
                }

                entryObj['Competence Error'] = (evalNum == 5 || evalNum == 6) && entry['TA2'] == 'Kitware' && entryObj['ADM_Type'] == 'aligned' && PH1_COMPETENCE[entryObj['Scenario']].includes(entryObj['Target']) ? 1 : 0;

                const comparison_entry = comparisons?.find((x) => x['ph1_server'] !== true && x['dre_server'] !== true && x['adm_type'] == t && x['pid'] == pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] == 'Parallax' && x['adm_author'] == 'TAD') || (entry['TA2'] == 'Kitware' && x['adm_author'] == 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                const alignmentComparison = comparison_entry?.score ?? '-'
                entryObj['Alignment score (Delegator|Observed_ADM (target))'] = alignmentComparison;
                if (evalNum == 5 || evalNum == 6) {
                    const dre_comparison_entry = comparisons?.find((x) => x['dre_server'] === true && x['adm_type'] == t && x['pid'] == pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] == 'Parallax' && x['adm_author'] == 'TAD') || (entry['TA2'] == 'Kitware' && x['adm_author'] == 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                    entryObj['DRE Alignment score (Delegator|Observed_ADM (target))'] = entry['TA1'] == 'Adept' ? dre_comparison_entry?.score : entryObj['Alignment score (Delegator|Observed_ADM (target))'];
                
                    entryObj['Truncation Error'] = comparison_entry?.truncation_error ? 1 : 0;
                }
                if (evalNum == 4 && fullSetOnly) {
                    const ph1_comparison_entry = comparisons?.find((x) => x['ph1_server'] === true && x['adm_type'] == t && x['pid'] == pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] == 'Parallax' && x['adm_author'] == 'TAD') || (entry['TA2'] == 'Kitware' && x['adm_author'] == 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                    entryObj['DRE Alignment score (Delegator|Observed_ADM (target))'] = entryObj['Alignment score (Delegator|Observed_ADM (target))'];
                    if (entryObj['TA1_Name'] == 'Adept')
                        entryObj['Alignment score (Delegator|Observed_ADM (target))'] = ph1_comparison_entry?.score ?? '-';
                }

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
    const pids = allObjs.map((x) => x['Delegator_ID']);
    return { allObjs, allTA1s, allTA2s, allScenarios, allTargets, allAttributes };
}