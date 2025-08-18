import * as FileSaver from 'file-saver';
import XLSX from 'xlsx-js-style';
import { isDefined } from "../AggregateResults/DataFunctions";
import { admOrderMapping, getDelEnvMapping } from '../Survey/delegationMappings';
import { formatTargetWithDecimal, adjustScenarioNumber } from '../Survey/surveyUtils';

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
            if (dataCopy[pid][k] === '-') {
                dataCopy[pid][k] = '';
            }
        }
    }

    // keys as fallback if headers not provided
    const columnHeaders = headers || Object.keys(dataCopy[Object.keys(dataCopy)[0]] || {});

    // maintain column order by using headers if provided
    const ws = headers ?
        XLSX.utils.json_to_sheet(dataCopy, { header: headers }) :
        XLSX.utils.json_to_sheet(dataCopy);

    // Adjust column widths
    const colWidths = columnHeaders.map(header => ({ wch: Math.max(header.length, 20) }));
    ws['!cols'] = colWidths;

    if (participantData) {
        // apply conditional formatting to participant data
        const lightGreenIfNotNull = ['Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4', 'AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3'];
        const phase2 = dataCopy[0]['Evaluation'] === 'June 2025 Collaboration'

        for (let row = 1; row <= dataCopy.length; row++) {
            for (let col = 0; col < columnHeaders.length; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = ws[cellRef];

                if (cell) {
                    const val = cell.v;
                    const headerName = columnHeaders[col];

                    if (lightGreenIfNotNull.includes(headerName) && isDefined(val)) {
                        cell.s = {
                            fill: {
                                fgColor: { rgb: 'c2ecc2' }  // Light green color
                            }
                        };
                    }
                    const delThreshold = phase2 ? 5 : 4;
                    if ((headerName === 'Delegation' && val >= delThreshold) || (headerName === 'Text' && ((val === 5 && !phase2) || (val === 4 && phase2))) || (headerName === 'Sim Count' && val === 4)) {
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
    const textResultsForPID = textResults.filter((data) => data.evalNumber === evalNum && data.participantID === pid);
    const alignments = [];
    const distanceAlignments = [];
    let addedMJ = false;
    for (const textRes of textResultsForPID) {
        // adept
        if (Object.keys(textRes).includes('combinedAlignmentData') || !Object.keys(textRes).includes("alignmentData")) {
            if (!addedMJ) {
                if (textRes['mostLeastAligned']) {
                    const atts = [];
                    for (const attSet of textRes['mostLeastAligned']) {
                        for (const att of attSet.response) {
                            for (const k of Object.keys(att)) {
                                atts.push({ 'target': k, 'score': att[k] });
                            }
                        }
                    }
                    alignments.push(...atts);
                }
                if (textRes['distance_based_most_least_aligned']) {
                    const distanceAtts = [];
                    for (const attSet of textRes['distance_based_most_least_aligned']) {
                        for (const att of attSet.response) {
                            for (const k of Object.keys(att)) {
                                distanceAtts.push({ 'target': k, 'score': att[k] });
                            }
                        }
                    }
                    distanceAlignments.push(...distanceAtts);
                }
                addedMJ = true;
            }
        }
        else {
            // st
            alignments.push(...textRes['alignmentData'])
        }
    }
    return { textResultsForPID, alignments, distanceAlignments };
}

function findWrongDelMaterials(evalNum, participantLog, surveyResults) {
    const good_pids = ['202411581', '202411353', '202411546']; // hard code some pids that have other problems
    const completed_surveys = surveyResults.filter((res) => res.results?.evalNumber === evalNum && ((evalNum === 4 && isDefined(res.results['Post-Scenario Measures'])) || (evalNum === 5 && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0)));
    const bad_pids = [];
    for (const res of completed_surveys) {
        const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
        if (good_pids.includes(pid)) {
            continue;
        }
        const logData = participantLog.find(
            log => String(log['ParticipantID']) === pid && log['Type'] !== 'Test'
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
                if (actualAdm !== expectedAdm || !actualScenario.includes(expectedAtt.replace('QOL', 'qol').replace('VOL', 'vol'))) {
                    bad_pids.push(pid);
                    break;
                }
            }
        }
    }
    return bad_pids;
}

export function getEval89Attributes(target) {
    target = target.toLowerCase();
    if (target.indexOf("safety") > -1) {
        return "PS";
    }
    else if (target.indexOf("search") > -1) {
        return "SS";
    }
    else if (target.indexOf("affiliation") > -1) {
        if (target.indexOf("merit") > -1) {
            return "AF-MF";
        }
        return "AF";
    }
    else if (target.indexOf("merit") > -1) {
        return "MF";
    }
    console.error("No attribute found for target " + target);
    return "";
}

export function getRQ134Data(evalNum, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim, fullSetOnly = false, includeDreServer = true, calibrationScores = false) {
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
    const allProbeSetAssessment = [];
    const allProbeSetObservation = [];
    const allTargets = [];
    const allAttributes = [];
    const TEXT_COUNT_NEEDED = evalNum >= 8 ? 4 : 5;
    const SIM_ENTRY_COUNT_NEEDED = evalNum >= 8 ? 0 : 3;
    let populationHeader = true;
    if (evalNum === 4 && (!fullSetOnly || !includeDreServer)) {
        populationHeader = false;
    }

    // find participants that have completed the delegation survey
    const completed_surveys = surveyResults.filter((res) => res.results?.evalNumber === evalNum && ((evalNum === 4 && isDefined(res.results['Post-Scenario Measures'])) || ((evalNum === 5 || evalNum === 6 || evalNum === 8 || evalNum === 9) && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0)));
    const wrong_del_materials = evalNum === 5 ? findWrongDelMaterials(evalNum, participantLog, surveyResults) : [];
    for (const res of completed_surveys) {
        const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
        if (!isDefined(res.results['Post-Scenario Measures']) && surveyResults.filter((res) => res.results?.['Participant ID Page']?.questions['Participant ID']?.response === pid && isDefined(res.results['Post-Scenario Measures']))) {
            // filter incomplete surveys from participants who have a complete survey
            continue;
        }
        const orderLog = res.results['orderLog']?.filter((x) => x.includes('Medic'));
        // see if participant is in the participantLog
        const logData = participantLog.find(
            log => String(log['ParticipantID']) === pid && String(log['Type']) !== 'Test' //Casting is required here because log['ParticipantID'] is a Number type
        );
        const textCount = textResults.filter((x) => x.participantID === pid).length;
        if (!logData || textCount < TEXT_COUNT_NEEDED) {
            continue;
        }
        if (fullSetOnly && (logData.surveyEntryCount < 1 || textCount < TEXT_COUNT_NEEDED || logData.simEntryCount < SIM_ENTRY_COUNT_NEEDED)) {
            continue;
        }
        const { textResultsForPID, alignments, distanceAlignments } = getAlignments(evalNum, textResults, pid);
        if (evalNum === 8 || evalNum === 9) {
            logData['ADMOrder'] = 5;
        }
        // set up object to store participant data
        const admOrder = pid === '202411327' ? admOrderMapping[3] : (wrong_del_materials.includes(pid) ? admOrderMapping[1] : admOrderMapping[logData['ADMOrder']]);
        let trial_num = 1;
        const st_scenario = pid === '202411327' ? 'ST-2' : (wrong_del_materials.includes(pid) ? 'ST-3' : (logData['Del-1']?.includes('ST') ? logData['Del-1'] : logData['Del-2']));
        const ad_scenario = pid === '202411327' ? 'AD-2' : (wrong_del_materials.includes(pid) ? 'AD-1' : (logData['Del-1']?.includes('AD') ? logData['Del-1'] : logData['Del-2']));

        for (const entry of admOrder) {
            const types = ['baseline', 'aligned', 'misaligned', 'low-affiliation-high-merit', 'high-affiliation-high-merit', 'low-affiliation-low-merit', 'high-affiliation-low-merit', 'most aligned group', 'comparison'];
            for (const t of types) {

                let page = Object.keys(res.results).find((k) => {
                    const obj = res.results[k];
                    const alignMatches = obj['admAlignment'] === t || (obj['pageType'] === 'comparison' && t === 'comparison');
                    const ta2Matches = obj['admAuthor'] === (entry['TA2'] === 'Kitware' ? 'kitware' : 'TAD');
                    let scenario = false;

                    if (evalNum >= 8) {
                        // All text scenarios are same number
                        const ph2_scenario = "PH2-" + logData["AF-text-scenario"];
                        let mapping_array_number;
                        switch (entry['Attribute']) {
                            case "AF":
                                mapping_array_number = 0;
                                break;
                            case "MF":
                                mapping_array_number = 1;
                                break;
                            case "SS":
                                mapping_array_number = 2;
                                break;
                            case "PS":
                                mapping_array_number = 3;
                                break;
                            case "AF-MF":
                                mapping_array_number = 4;
                                break;
                            default:
                                console.log("Scenario not found");
                        }

                        scenario = getDelEnvMapping(evalNum)[ph2_scenario][mapping_array_number];
                        const scenarioMatches = obj['scenarioIndex']?.slice(0, -6) === scenario?.slice(0, -6);

                        return alignMatches && ta2Matches && scenarioMatches;
                    }

                    if (entry['TA1'] === 'Adept') {
                        scenario = entry['Attribute'] === 'MJ' ? getDelEnvMapping(evalNum)[ad_scenario][0] : getDelEnvMapping(evalNum)[ad_scenario][1];
                    }
                    else {
                        scenario = entry['Attribute'] === 'QOL' ? getDelEnvMapping(evalNum)[st_scenario][0] : getDelEnvMapping(evalNum)[st_scenario][1];
                    }
                    const scenarioMatches = obj['scenarioIndex'] === scenario;

                    return alignMatches && ta2Matches && scenarioMatches;
                });
                if (!page) {
                    // likely from missing misaligned/aligned for those few parallax adms
                    continue;
                }
                page = res.results[page];
                const entryObj = {};
                entryObj['Delegator ID'] = pid;
                entryObj['ADM Order'] = wrong_del_materials.includes(pid) ? 1 : logData['ADMOrder'];
                entryObj['Datasource'] = evalNum == 8 ? "P2E_June_2025" : evalNum == 9 ? "P2E_July_2025" : (evalNum === 4 ? 'DRE' : evalNum === 5 ? (logData.Type === 'Online' ? 'P1E_online' : 'P1E_IRL') : (logData.Type === 'Online' ? 'P1E_online_2025' : 'P1E_IRL_2025'));
                entryObj['Delegator_grp'] = logData['Type'] === 'Civ' ? 'Civilian' : logData['Type'] === 'Mil' ? 'Military' : logData['Type'];
                const CURRENT_ROLE_QTEXT = evalNum >= 8 ? 'What is your current role' : 'What is your current role (choose all that apply):';
                const roles = res.results?.['Post-Scenario Measures']?.questions?.[CURRENT_ROLE_QTEXT]?.['response'];
                // override 102, who is military
                if (evalNum < 8) {
                    entryObj['Delegator_mil'] = roles?.includes('Military Background') || pid === '202409102' ? 'yes' : 'no';
                }
                else {
                    entryObj['Delegator_mil'] = res.results?.['Post-Scenario Measures']?.questions?.["Served in Military"]?.['response'] == 'Never Served' ? 'no' : 'yes';
                }
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
                entryObj['Scenario'] = entry['TA1'] === 'Adept' ? ad_scenario : st_scenario;
                allScenarios.push(entryObj['Scenario']);
                entryObj['TA2_Name'] = entry['TA2'];
                allTA2s.push(entry['TA2']);
                entryObj['ADM_Type'] = t === 'comparison' ? 'comparison' : ['misaligned', 'aligned', 'low-affiliation-high-merit', 'high-affiliation-high-merit', 'low-affiliation-low-merit', 'high-affiliation-low-merit', 'most aligned group'].includes(t) ? 'aligned' : 'baseline';
                entryObj['Target'] = (evalNum >= 8 && t === 'baseline') ? '-' : (page['admTarget'] ?? '-');
                if (entryObj['Target'] !== '-') {
                    allTargets.push(entryObj['Target']);
                }

                let foundADM;
                if (evalNum < 8) {
                    foundADM = admData.find((adm) => adm.history?.[0].parameters.adm_name === page['admName'] && (adm.history?.[0].response?.id ?? adm.history?.[1].response?.id) === page['scenarioIndex'].replace('IO', 'MJ') &&
                        adm.history?.[adm.history.length - 1].parameters.target_id === page['admTarget']);
                } else {
                    foundADM = admData.find((adm) => adm.adm_name === page['admName'] && adm.evaluation.scenario_id === page['scenarioIndex'] &&
                        adm.evaluation.alignment_target_id === page['admTarget']);
                }

                const alignment = foundADM?.history[foundADM.history.length - 1]?.response?.score ?? '-';
                const distance_alignment = foundADM?.history[foundADM.history.length - 1]?.response?.distance_based_score ?? '-';

                entryObj[(populationHeader ? 'P1E/Population ' : '') + 'Alignment score (ADM|target)'] = alignment;
                if (evalNum === 5 || evalNum === 6)
                    entryObj['DRE/Distance Alignment score (ADM|target)'] = entry['TA1'] === 'Adept' ? distance_alignment : alignment;

                // if DRE data is included in PH1 set, update DRE columns accordingly
                if (evalNum === 4 && fullSetOnly && includeDreServer) {
                    entryObj['DRE/Distance Alignment score (ADM|target)'] = entryObj['P1E/Population Alignment score (ADM|target)'];
                    entryObj['P1E/Population Alignment score (ADM|target)'] = entry['TA1'] === 'Adept' ? page.ph1AdmAlignment : entryObj['P1E/Population Alignment score (ADM|target)']
                }

                const simEntry = simData.find((x) => x.evalNumber === evalNum && x.pid === pid &&
                    (['QOL', 'VOL'].includes(entryObj['Attribute']) ? x.ta1 === 'st' : x.ta1 === 'ad') &&
                    x.scenario_id.toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
                const alignmentData = simEntry?.data?.alignment?.adms_vs_text;
                entryObj['Alignment score (Participant_sim|Observed_ADM(target))'] = alignmentData?.find((x) => (x['adm_author'] === (entry['TA2'] === 'Kitware' ? 'kitware' : 'TAD')) &&
                    x['adm_alignment'].includes(entryObj['ADM_Type']) && x['adm_target'] === page['admTarget'])?.score ?? '-';

                entryObj[(populationHeader ? 'P1E/Population ' : '') + 'Alignment score (Delegator|target)'] = alignments.find((a) => a.target === page['admTarget']?.replaceAll('.', '') || a.target === page['admTarget'])?.score ?? '-';
                const txt_distance = distanceAlignments.find((a) => a.target === page['admTarget'] || ((evalNum === 5 || evalNum === 6) && a.target === page['admTarget']?.replace('.', '')))?.score ?? '-';
                if (evalNum === 5 || evalNum === 6)
                    entryObj['DRE/Distance Alignment score (Delegator|target)'] = entry['TA1'] === 'Adept' ? txt_distance : entryObj['P1E/Population Alignment score (Delegator|target)'];
                // if DRE data is included in PH1 set, update DRE columns accordingly
                if (evalNum === 4 && fullSetOnly && includeDreServer) {
                    entryObj['DRE/Distance Alignment score (Delegator|target)'] = entryObj['P1E/Population Alignment score (Delegator|target)'];
                    entryObj['P1E/Population Alignment score (Delegator|target)'] = entry['TA1'] === 'Adept' ? page.ph1TxtAlignment : entryObj['P1E/Population Alignment score (Delegator|target)']
                }

                entryObj['Server Session ID (Delegator)'] = t === 'comparison' ? '-' : textResultsForPID.find((r) => r.scenario_id.includes(entryObj['TA1_Name'] === 'Adept' ? 'MJ' : (entryObj['Target'].includes('qol') ? 'qol' : 'vol')))?.[entryObj['TA1_Name'] === 'Adept' ? 'combinedSessionId' : 'serverSessionId'] ?? '-';
                entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t === 'comparison' ? '-' : t;

                const choiceProcess = ((evalNum === 8 || evalNum === 9) && t !== 'comparison' && t !== 'baseline' && !page['admChoiceProcess'])
                    ? determineChoiceProcessJune2025(textResultsForPID, page, t)
                    : page['admChoiceProcess'];

                entryObj['ADM Loading'] = t === 'comparison' ? '-' :
                    t === 'baseline' ? 'normal' :
                        ['least aligned', 'most aligned'].includes(choiceProcess) ? 'normal' : 'exemption';
                if (evalNum === 5 || evalNum === 6)
                    entryObj['DRE ADM Loading'] = entry['TA1'] === 'Adept' ? page.dreChoiceProcess : entryObj['ADM Loading'];
                // if DRE data is included in PH1 set, update DRE columns accordingly
                if (evalNum === 4 && fullSetOnly && includeDreServer) {
                    entryObj['DRE ADM Loading'] = entryObj['ADM Loading'];
                    entryObj['ADM Loading'] = entry['TA1'] === 'Adept' ? page.ph1ChoiceProcess : entryObj['ADM Loading']
                }

                entryObj['Competence Error'] = (evalNum === 5 || evalNum === 6) && entry['TA2'] === 'Kitware' && entryObj['ADM_Type'] === 'aligned' && PH1_COMPETENCE[entryObj['Scenario']].includes(entryObj['Target']) ? 1 : 0;

                let comparison_entry;
                if (evalNum < 8) {
                    comparison_entry = comparisons?.find((x) => x['ph1_server'] !== true && x['dre_server'] !== true && x['adm_type'] === t && x['pid'] === pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] === 'Parallax' && x['adm_author'] === 'TAD') || (entry['TA2'] === 'Kitware' && x['adm_author'] === 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                } else {
                    comparison_entry = comparisons?.find((x) => x['adm_type'] === t && x['pid'] === pid && x['adm_scenario'] === page['scenarioIndex'] && x['adm_alignment_target'] === page['admTarget']);
                }
                const alignmentComparison = comparison_entry?.score ?? '-'

                entryObj[(populationHeader ? 'P1E/Population ' : '') + 'Alignment score (Delegator|Observed_ADM (target))'] = alignmentComparison;
                if (evalNum === 5 || evalNum === 6) {
                    entryObj['DRE/Distance Alignment score (Delegator|Observed_ADM (target))'] = entry['TA1'] === 'Adept' ? comparison_entry?.distance_based_score : entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];
                }

                if (calibrationScores) {
                    entryObj['Calibration Alignment Score (Delegator|Observed_ADM (target))'] = JSON.stringify(comparison_entry?.calibration_scores)
                    // st only files so don't use adpet specific column labels
                    entryObj['P1E Alignment Score (Delegator|target)'] = entryObj['P1E/Population Alignment score (Delegator|target)']
                    entryObj['P1E Alignment score (Delegator|Observed_ADM (target))'] = entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))']
                    entryObj['P1E Alignment score (ADM|target)'] = entryObj['P1E/Population Alignment score (ADM|target)']
                }

                if (evalNum >= 8) {
                    entryObj['Alignment score (ADM|target)'] = (t === 'baseline') ? '-' : entryObj['P1E/Population Alignment score (ADM|target)'];
                    entryObj['Alignment score (Delegator|target)'] = (t === 'baseline') ? '-' : entryObj['P1E/Population Alignment score (Delegator|target)'];
                    entryObj['Alignment score (Delegator|Observed_ADM (target))'] = entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];

                    let aligned_target_name = page["baselineTarget"] !== undefined ? page["baselineTarget"]?.toLowerCase() : page["admTarget"]?.toLowerCase();
                    if (aligned_target_name === undefined) {
                        aligned_target_name = "";
                    }

                    switch (true) {
                        case entryObj['Target'].toLowerCase().indexOf("safety") !== -1 || aligned_target_name.indexOf("safety") !== -1:
                            entryObj['Attribute'] = "PS";
                            break;
                        case entryObj['Target'].toLowerCase().indexOf("affiliation") !== -1 || aligned_target_name.indexOf("affiliation") !== -1:
                            if (entryObj['Target'].toLowerCase().indexOf("merit") !== -1 || aligned_target_name.indexOf("merit") !== -1) {
                                entryObj['Attribute'] = "AF-MF";
                            } else {
                                entryObj['Attribute'] = "AF";
                            }
                            break;
                        case entryObj['Target'].toLowerCase().indexOf("search") !== -1 || aligned_target_name.indexOf("search") !== -1:
                            entryObj['Attribute'] = "SS";
                            break;
                        case entryObj['Target'].toLowerCase().indexOf("merit") !== -1 || aligned_target_name.indexOf("merit") !== -1:
                            if (entryObj['Target'].toLowerCase().indexOf("affiliation") !== -1 || aligned_target_name.indexOf("affiliation") !== -1) {
                                entryObj['Attribute'] = "AF-MF";
                            } else {
                                entryObj['Attribute'] = "MF";
                            }
                            break;
                        case page["scenarioIndex"]?.indexOf("-AF-MF") !== -1:
                            entryObj['Attribute'] = "AF-MF";
                            break;
                        default:
                            console.log("Target and Attributes don't match for Evaluations greater than 8.")
                    }
                    // All Scenarios for Eval 8 are in same set, so you can grab any of them to get Probe Set
                    entryObj['Probe Set Assessment'] = logData["AF-text-scenario"];
                    allProbeSetAssessment.push(entryObj['Probe Set Assessment'])
                    // 2-> 3, 3 -> 1. Multi KDMA gets an additional bump
                    const isMultiKdma = entryObj['Target'].includes('affiliation') && entryObj['Target'].includes('merit');
                    entryObj['Probe Set Observation'] = adjustScenarioNumber(
                        isMultiKdma ? adjustScenarioNumber(entryObj['Probe Set Assessment']) : entryObj['Probe Set Assessment']
                    );
                    allProbeSetObservation.push(entryObj['Probe Set Observation'])
                    entryObj['Server Session ID (Delegator)'] = t === 'comparison' ? '-' : textResultsForPID[0]?.combinedSessionId;
                }

                // include truncation error status for all, column visibility toggled from rq134.jsx
                entryObj['Truncation Error'] = comparison_entry?.truncation_error ? 1 : 0;

                if (evalNum === 4 && fullSetOnly) {
                    const ph1_comparison_entry = comparisons?.find((x) => x['ph1_server'] === true && x['adm_type'] === t && x['pid'] === pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] === 'Parallax' && x['adm_author'] === 'TAD') || (entry['TA2'] === 'Kitware' && x['adm_author'] === 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                    entryObj['DRE/Distance Alignment score (Delegator|Observed_ADM (target))'] = entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];
                    if (entryObj['TA1_Name'] === 'Adept')
                        entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'] = ph1_comparison_entry?.score ?? '-';
                }

                entryObj['Trust_Rating'] = RATING_MAP[page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it']?.['response'] ?? '-' : '-'];
                if (t === 'comparison') {
                    const adms = page['pageName'].split(' vs ');

                    if (evalNum >= 8 && adms.length === 4) {
                        handleMultiKdmaComparison(res.results, page, entryObj, allObjs)
                    } else {
                        const alignedAdm = adms[1];
                        const baselineAdm = adms[0];
                        const misalignedAdm = adms[2];
                        const qAB = page.questions[alignedAdm + ' vs ' + baselineAdm + ': Forced Choice']?.response ?? '-';
                        const qAM = page.questions[alignedAdm + ' vs ' + misalignedAdm + ': Forced Choice']?.response ?? '-';

                        entryObj['Delegation preference (A/B)'] = qAB === '-' ? '-' : (qAB === alignedAdm ? 'A' : 'B');
                        entryObj['Delegation preference (A/M)'] = qAM === '-' ? '-' : (qAM === alignedAdm ? 'A' : 'M');
                        // need to back-populate previous rows with which was chosen
                        for (let i = 0; i < 3; i++) {
                            switch (allObjs[allObjs.length - 1 - i]['ADM_Aligned_Status (Baseline/Misaligned/Aligned)']) {
                                case 'aligned':
                                    allObjs[allObjs.length - 1 - i]['Delegation preference (A/B)'] = entryObj['Delegation preference (A/B)'] === 'A' ? 'y' : 'n';
                                    allObjs[allObjs.length - 1 - i]['Delegation preference (A/M)'] = entryObj['Delegation preference (A/M)'] === 'A' ? 'y' : 'n';
                                    break
                                case 'baseline':
                                    allObjs[allObjs.length - 1 - i]['Delegation preference (A/B)'] = entryObj['Delegation preference (A/B)'] === 'B' ? 'y' : 'n';
                                    break
                                case 'misaligned':
                                    allObjs[allObjs.length - 1 - i]['Delegation preference (A/M)'] = entryObj['Delegation preference (A/M)'] === 'M' ? 'y' : 'n';
                                    break
                                default:
                                    break
                            }
                        }
                    }

                }
                else {
                    entryObj['Delegation preference (A/B)'] = '-';
                    entryObj['Delegation preference (A/M)'] = '-';
                }

                entryObj['Trustworthy_Rating'] = RATING_MAP[page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + ': This medic is trustworthy']?.['response'] ?? '-' : '-'];
                entryObj['Agreement_Rating'] = RATING_MAP[page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + ': Do you agree with the decisions that this medic made?']?.['response'] ?? '-' : '-'];
                if (evalNum === 8 || evalNum === 9) {
                    entryObj['Trustworthy_Rating'] = RATING_MAP[page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + ': this medic is trustworthy']?.['response'] ?? '-' : '-'];
                    entryObj['Agreement_Rating'] = RATING_MAP[page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + ': Do you agree with the decision that this medic made?']?.['response'] ?? '-' : '-'];
                }
                entryObj['SRAlign_Rating'] = RATING_MAP[page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + ': The way this medic makes medical decisions is how I make decisions']?.['response'] ?? '-' : '-'];
                allObjs.push(entryObj);
            }
        }
    }

    return { allObjs, allTA1s, allTA2s, allScenarios, allTargets, allAttributes, allProbeSetAssessment, allProbeSetObservation};
}

function handleMultiKdmaComparison(survey, page, entryObj, allObjs) {
    const adms = page['pageName'].split(' vs ');
    const admAlignmentMap = {};
    let mostAlignedAdm;

    for (const adm of adms) {
        const admPage = survey[adm];
        if (admPage) {
            admAlignmentMap[adm] = admPage.admAlignment;
            if (admPage.admAlignment === 'most aligned group') {
                mostAlignedAdm = adm
            }
        }
    }

    const alignmentColumnMap = {
        'high-affiliation-high-merit': 'Delegation (A/HH)',
        'high-affiliation-low-merit': 'Delegation (A/HL)',
        'low-affiliation-high-merit': 'Delegation (A/LH)',
        'low-affiliation-low-merit': 'Delegation (A/LL)'
    };

    const alignmentCodeMap = {
        'high-affiliation-high-merit': 'HH',
        'high-affiliation-low-merit': 'HL',
        'low-affiliation-high-merit': 'LH',
        'low-affiliation-low-merit': 'LL'
    };

    const pid = entryObj['Delegator ID'];

    for (const adm of adms) {
        if (admAlignmentMap[adm] === 'most aligned group') {
            continue
        }
        const columnName = alignmentColumnMap[admAlignmentMap[adm]]
        const alignmentCode = alignmentCodeMap[admAlignmentMap[adm]]
        const qKey = `${mostAlignedAdm} vs ${adm}: Forced Choice`
        const response = page.questions[qKey]?.response;

        if (!response) {
            console.warn(`Response not found for forced choice between ${mostAlignedAdm} and ${adm}. PID: ${pid}`)
            continue
        }

        const choseMostAligned = response === mostAlignedAdm
        entryObj[columnName] = choseMostAligned ? 'A' : alignmentCode

        const mostAlignedRow = allObjs.find(obj => obj['Delegator ID'] === pid && obj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] === 'most aligned group')
        if (mostAlignedRow) {
            mostAlignedRow[columnName] = choseMostAligned ? 'y' : 'n'
        }
        const otherAdmRow = allObjs.find(obj => obj['Delegator ID'] === pid && obj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] === admAlignmentMap[adm])
        if (otherAdmRow) {
            otherAdmRow[columnName] = choseMostAligned ? 'n' : 'y'
        }
    }
}



export function determineChoiceProcessJune2025(textResults, page, t) {
    const target = page['admTarget']
    const mostLeastAligned = textResults[0]['mostLeastAligned']

    // no overlap in multi kdma
    if (target.includes('affiliation') && target.includes('merit')) {
        return 'most aligned'
    }

    const matchingTarget = ['affiliation', 'merit', 'personal_safety', 'search']
        .find(t => target.includes(t))

    if (!matchingTarget) return 'exemption'

    const targetObj = mostLeastAligned.find(obj => obj.target === matchingTarget)
    if (!targetObj) return 'exemption'

    // remove multi kdma targets
    const filteredTargets = targetObj['response'].filter(obj => {
        const key = Object.keys(obj)[0]
        return !(key.includes('affiliation') && key.includes('merit'))
    })

    // first el if aligned, last el if misaligned
    const selectedTarget = t === 'aligned'
        ? filteredTargets[0]
        : filteredTargets[filteredTargets.length - 1]

    const focusTarget = formatTargetWithDecimal(Object.keys(selectedTarget)[0])

    // exemption if not match
    return focusTarget === target
        ? (t === 'aligned' ? 'most aligned' : 'least aligned')
        : 'exemption'
}