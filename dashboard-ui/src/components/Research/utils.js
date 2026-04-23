import * as FileSaver from 'file-saver';
import XLSX from 'xlsx-js-style';
import { isDefined } from "../AggregateResults/DataFunctions";
import { admOrderMapping, getDelEnvMapping } from '../Survey/delegationMappings';
import { formatTargetWithDecimal, adjustScenarioNumber } from '../Survey/surveyUtils';
import store from '../../store/store';


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

const DELEGATION1_MAP = {
    "Only I make decisions about the patients": 1,
    "I make most decisions, but the medic can make non-critical decisions": 2,
    "The medic makes decisions with my direct supervision": 3,
    "The medic makes decisions for patients, but I check all decisions before evacuation": 4,
    "The medic can make decisions without supervision": 5,
    '-': '-'
};

const DELEGATION2_MAP = {
    "Take care of all the patients in the next wave myself": 1,
    "Take care of most of the patients in the next wave myself": 2,
    "Delegate about half of the patients in the next wave to the medic": 3,
    "Delegate most of the patients in the next wave to the medic": 4,
    "Delegate all of the patients in the next wave to the medic": 5,
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

export const exportToExcel = async (filename, formattedData, headers, participantData = false, selectedPhase = null) => {
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

    const evalNumbers = dataCopy.map(row => row._evalNumber);
    dataCopy.forEach(row => delete row._evalNumber);

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
        const isPhase2 = selectedPhase === 'Phase 2';
        const isUKPhase1 = selectedPhase === 'UK Phase 1';

        for (let row = 1; row <= dataCopy.length; row++) {
            const rowEvalNumber = evalNumbers[row - 1];

            // Determine text threshold based on eval number for this specific row
            let textThreshold;
            if (rowEvalNumber === 13) {
                textThreshold = 12;
            } else if (isPhase2 || isUKPhase1) {
                textThreshold = 4;
            } else {
                textThreshold = 5;
            }

            const delThreshold = isUKPhase1 ? 3 : (isPhase2 ? 5 : 4);

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
                    if ((headerName === 'Delegation' && val >= delThreshold) ||
                        (headerName === 'Text' && val >= textThreshold) ||
                        (headerName === 'Sim Count' && (val === 4 || ((isPhase2 || isUKPhase1) && val === 2)))) {
                        cell.s = {
                            fill: {
                                fgColor: { rgb: '7bbc7b' }  // Dark green color
                            }
                        };
                    }
                    if (headerName === 'Alignment Status' && val) {
                        if (typeof val === 'string' && val.startsWith('Complete')) {
                            cell.s = {
                                fill: {
                                    fgColor: { rgb: '7bbc7b' }
                                }
                            };
                        } else if (typeof val === 'string' && val.startsWith('Missing')) {
                            cell.s = {
                                fill: {
                                    fgColor: { rgb: 'FFE0B2' }
                                }
                            };
                        }
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
    const eval16Alignments = {};
    let addedMJ = false;
    for (const textRes of textResultsForPID) {
        // adept
        if (Object.keys(textRes).includes('combinedSessionId')) {
            if (!addedMJ || evalNum === 15 || evalNum === 16) {
                if (evalNum === 16) {
                    const sourceMap = {
                        'AF-PS': 'AF-PS_mostLeastAligned',
                        'MF-PS': 'MF-PS_mostLeastAligned',
                        'AF': 'combinedMostLeastAligned',
                        'MF': 'combinedMostLeastAligned',
                    };
                    const combinedFilter = { 'AF': 'affiliation', 'MF': 'merit' };
                    for (const [attr, key] of Object.entries(sourceMap)) {
                        if (textRes[key] && !eval16Alignments[attr]) {
                            const atts = [];
                            for (const attSet of textRes[key]) {
                                if (combinedFilter[attr] && attSet.target !== combinedFilter[attr]) continue;
                                for (const att of attSet.response) {
                                    for (const k of Object.keys(att)) {
                                        atts.push({ 'target': k, 'score': att[k] });
                                    }
                                }
                            }
                            eval16Alignments[attr] = atts;
                        }
                    }
                } else if (textRes['mostLeastAligned']) {
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
            if (textRes['alignmentData']) {
                alignments.push(...textRes['alignmentData'])
            } else {
                alignments.push(...textRes['mostLeastAligned'])
            }
        }
    }
    return { textResultsForPID, alignments, distanceAlignments, eval16Alignments };
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

export function getEval12Attributes(target) {
    if (target.includes('vol')) return 'VOL'
    else if (target.includes('Moral')) return 'MJ'
    else return 'IO'
}

export function getEval89Attributes(target, scenarioIndex) {
    const scenario = scenarioIndex.toLowerCase();

    if (scenario.includes("combined")) {
        return "PS, AF (Combined)"
    }
    if (scenario.includes("ps")) {
        if (scenario.indexOf("af") > -1) {
            return "PS-AF"
        }
        return "PS";
    }
    else if (scenario.includes("ss")) {
        return "SS";
    }
    else if (scenario.includes("af")) {
        if (scenario.includes("mf")) {
            return "AF-MF";
        }
        return "AF";
    }
    else if (scenario.includes("mf")) {
        return "MF";
    }

    return target;
}
const ALIGNED_TYPES = new Set([
    'misaligned', 'aligned',
    'low-affiliation-high-merit', 'high-affiliation-high-merit',
    'low-affiliation-low-merit', 'high-affiliation-low-merit',
    'most aligned group'
]);

const TYPES_DEFAULT = ['baseline', 'aligned', 'misaligned', 'low-affiliation-high-merit', 'high-affiliation-high-merit', 'low-affiliation-low-merit', 'high-affiliation-low-merit', 'most aligned group', 'comparison'];
const TYPES_EVAL_10 = ['PS-AF-1', 'PS-AF-2', 'PS-AF-3', 'PS-AF-4', 'low', 'high', 'PS-high_AF-low', 'PS-high_AF-high', 'PS-low_AF-low', 'PS-low_AF-high', 'comparison'];

const ATTR_IDX_EVAL_8_9 = { AF: 0, MF: 1, SS: 2, PS: 3, 'AF-MF': 4 };
const ATTR_IDX_EVAL_10 = { AF: 0, MF: 1, PS: 2, 'PS-AF': 3, PSAF: 4 };

const TYPES_EVAL_16 = ['baseline', 'aligned', 'misaligned', 'comparison'];

const DATASOURCE = {
    16: 'P2E_April_2026',
    15: 'P2E_Feb_2026',
    12: 'UK_2025',
    8: 'P2E_June_2025',
    9: 'P2E_July_2025',
    10: 'P2E_Sept_2025',
    4: 'DRE',
};

function findMatchingPages(evalNum, results, entry, t, logData, st_scenario, ad_scenario) {
    const ta2Author = entry['TA2'] === 'Kitware' ? 'kitware' : 'TAD';

    return Object.keys(results).filter((k) => {
        const obj = results[k];
        const alignMatches = obj['admAlignment'] === t || (obj['pageType'] === 'comparison' && t === 'comparison') || (evalNum === 10 && (obj['admTarget'] == t));
        const ta2Matches = obj['admAuthor'] === ta2Author;

        if (evalNum === 8 || evalNum === 9) return alignMatches && ta2Matches && matchEval8or9(obj, entry, logData, evalNum);
        if (evalNum === 10) return ta2Matches && alignMatches && matchEval10(obj, entry, logData, evalNum);
        if (evalNum === 12) return alignMatches && ta2Matches && matchEval12(obj, entry);
        if (evalNum === 15) return alignMatches && ta2Matches && matchEval15(obj, entry);
        if (evalNum === 16) return ta2Matches && matchEval16(obj, entry, t, results);
        // Default: evals 4, 5, 6
        return alignMatches && ta2Matches && matchDefault(obj, entry, evalNum, st_scenario, ad_scenario);
    });
}

function matchEval8or9(obj, entry, logData, evalNum) {
    const idx = ATTR_IDX_EVAL_8_9[entry['Attribute']];
    if (idx === undefined) { console.log('Scenario not found'); return false; }
    const scenario = getDelEnvMapping(evalNum)['PH2-' + logData['AF-text-scenario']][idx];
    return obj['scenarioIndex']?.slice(0, -6) === scenario?.slice(0, -6);
}

function matchEval10(obj, entry, logData, evalNum) {
    const idx = ATTR_IDX_EVAL_10[entry['Attribute']];
    if (idx === undefined) { console.log('Scenario not found'); return false; }
    let scenario;
    if (idx === 3) scenario = `Sept2025-${entry['Attribute']}${logData['PS-AF-text-scenario']}-eval`;
    else if (idx === 4) scenario = `Sept2025-PSAF${logData['AF-text-scenario']}-eval`;
    else scenario = getDelEnvMapping(evalNum)['PH2-' + logData['AF-text-scenario']][idx];
    return obj['scenarioIndex']?.replace('-combined', '').slice(0, -6) === scenario?.replace('-combined', '').slice(0, -6);
}

function matchEval12(obj, entry) {
    const map = { MJ: 'DryRunEval-MJ2-eval', IO: 'DryRunEval-IO2-eval', VOL: 'vol-ph1-eval-3' };
    return obj['scenarioIndex'] === map[entry['Attribute']];
}

function matchEval15(obj, entry) {
    const admNameMatches = obj['pageType'] === 'comparison'
        ? obj['baselineName']?.includes(entry['admName'])
        : obj['admName']?.includes(entry['admName']);
    const si = obj['scenarioIndex'] ?? '';
    let attrMatch;
    switch (entry['Attribute']) {
        case 'MF-SS': attrMatch = si.includes('MF-SS'); break;
        case 'MF': attrMatch = si.includes('MF') && !si.includes('MF-SS'); break;
        case 'AF-PS': attrMatch = si.includes('AF-PS'); break;
        default: attrMatch = true;
    }
    return admNameMatches && attrMatch;
}

function matchDefault(obj, entry, evalNum, st_scenario, ad_scenario) {
    let scenario;
    if (entry['TA1'] === 'Adept') {
        scenario = entry['Attribute'] === 'MJ' ? getDelEnvMapping(evalNum)[ad_scenario][0] : getDelEnvMapping(evalNum)[ad_scenario][1];
    } else {
        scenario = entry['Attribute'] === 'QOL' ? getDelEnvMapping(evalNum)[st_scenario][0] : getDelEnvMapping(evalNum)[st_scenario][1];
    }
    return obj['scenarioIndex'] === scenario;
}

function matchEval16(obj, entry, t, results) {
    // Match scenario to attribute block
    const si = obj['scenarioIndex'] ?? '';
    let attributeMatch;
    switch (entry['Attribute']) {
        case 'MF-PS': attributeMatch = si.includes('MF-PS') || si.includes('MF') && si.includes('PS'); break;
        case 'AF-PS': attributeMatch = si.includes('AF-PS') || si.includes('AF') && si.includes('PS'); break;
        case 'AF': attributeMatch = si.includes('AF') && !si.includes('AF-PS') && !si.includes('PS'); break;
        case 'MF': attributeMatch = si.includes('MF') && !si.includes('MF-PS') && !si.includes('PS'); break;
        default: attributeMatch = false;
    }
    if (!attributeMatch) return false;

    if (t === 'comparison') return obj['pageType'] === 'comparison';
    if (obj['pageType'] !== 'singleMedic') return false;
    if (entry['Attribute'] === 'AF-PS' || entry['Attribute'] === 'MF-PS') {
        if (t === 'baseline') return obj['admName']?.includes('OutlinesBaseline');
        if (t === 'aligned') return !obj['admName']?.includes('OutlinesBaseline');
        return false; // no misaligned in 2D blocks
    }

    // Oracle blocks (AF, MF): use comparison page metadata to determine roles
    const compPage = Object.values(results).find(p =>
        p['pageType'] === 'comparison' && (p['scenarioIndex'] ?? '') === si
    );
    if (!compPage) return false;

    if (t === 'aligned') return obj['subpop'] === compPage['alignedSubpop'] && obj['admTarget'] === compPage['alignedTarget'];
    if (t === 'baseline') return obj['subpop'] === compPage['otherSubpop'] && obj['admTarget'] === compPage['otherSubpopTarget'];
    if (t === 'misaligned') return obj['admTarget'] === compPage['leastAlignedTarget'];
    return false;
}

function findMatchingADM(admData, page, evalNum) {
    if (evalNum < 8) {
        return admData.find((adm) =>
            adm.history?.[0].parameters.adm_name === page['admName']
            && (adm.history?.[0].response?.id ?? adm.history?.[1].response?.id) === page['scenarioIndex'].replace('IO', 'MJ')
            && adm.history?.[adm.history.length - 1].parameters.target_id === page['admTarget']);
    }
    if (evalNum === 12) {
        const scenario = page['scenarioIndex']?.includes('IO') ? page['scenarioIndex'].replace('IO', 'MJ') : page['scenarioIndex'];
        return admData.find((adm) => adm.adm_name === page['admName'] && adm.alignment_target === page['admTarget'] && adm.scenario === scenario);
    }
    // Eval 16: admMedics collection has flat structure (admName, target, scenarioIndex, alignmentScore)
    if (evalNum === 16) {
        return admData.find((medic) =>
            medic.admName === page['admName']
            && medic.target === page['admTarget']
            && medic.scenarioIndex === page['scenarioIndex']);
    }
    return admData.find((adm) =>
        adm.evaluation?.adm_name?.includes(page['admName'])
        && adm.evaluation.scenario_id === page['scenarioIndex']
        && adm.evaluation.alignment_target_id === page['admTarget']);
}

function resolveAttribute(targetStr, baselineTarget, scenarioIndex) {
    let alignedName = (baselineTarget !== undefined ? baselineTarget?.toLowerCase() : undefined) ?? '';
    const target = targetStr.toLowerCase();
    const scenario = scenarioIndex?.toLowerCase();

    const tgt = (str) => target.indexOf(str) !== -1 || alignedName.indexOf(str) !== -1;
    const scn = (str) => scenario?.includes(str);

    switch (true) {
        case tgt('safety') || tgt('ps-') || scn('-ps'):
            if (tgt('affiliation') || tgt('ps-af') || scn('ps-af')) return 'PS-AF';
            if (scn('-psaf') && scn('-combined')) return 'PSAF-combined';
            return 'PS';
        case tgt('affiliation') || scn('-af'):
            return (target.indexOf('merit') !== -1 || alignedName.indexOf('merit') !== -1) ? 'AF-MF' : 'AF';
        case tgt('search'):
            return 'SS';
        case tgt('merit'):
            return tgt('affiliation') ? 'AF-MF' : 'MF';
        case scn('-af-mf'):
            return 'AF-MF';
        default:
            return null;
    }
}

function handleStandardComparison(evalNum, page, entryObj, allObjs, entry) {
    const adms = page['pageName'].split(' vs ');
    const alignedAdm = (evalNum === 15 || evalNum === 16) ? adms[0] : adms[1];
    const baselineAdm = (evalNum === 15 || evalNum === 16) ? adms[1] : adms[0];
    const misalignedAdm = adms[2];

    const isOracle = evalNum === 16 && entry && (entry['Attribute'] === 'AF' || entry['Attribute'] === 'MF');
    const colAB = isOracle ? 'Delegation Preference (AlignedSS/AlignedOS)' : 'Delegation preference (A/B)';
    const colAM = isOracle ? 'Delegation Preference (AlignedSS/Misaligned)' : 'Delegation preference (A/M)';
    const colPctAB = isOracle ? 'Delegation Percentage (AlignedSS/AlignedOS)' : 'Delegation Percentage (Aligned/Baseline)';
    const colPctAM = isOracle ? 'Delegation Percentage (AlignedSS/Misaligned)' : 'Delegation Percentage (Aligned/Misaligned)';
    const valB = isOracle ? 'AlignedOS' : 'B';
    const valM = isOracle ? 'Misaligned' : 'M';

    const qAB = page.questions[alignedAdm + ' vs ' + baselineAdm + ': Forced Choice']?.response ?? '-';
    const qAM = page.questions[alignedAdm + ' vs ' + misalignedAdm + ': Forced Choice']?.response ?? '-';
    entryObj[colAB] = qAB === '-' ? '-' : (qAB === alignedAdm ? 'A' : valB);
    entryObj[colAM] = qAM === '-' ? '-' : (qAM === alignedAdm ? 'A' : valM);
    entryObj[colPctAB] = '-';
    entryObj[colPctAM] = '-';

    const pctAB = page.questions[alignedAdm + ' vs ' + baselineAdm + ': Percent Delegation']?.response ?? '-';
    const pctAM = misalignedAdm ? page.questions[alignedAdm + ' vs ' + misalignedAdm + ': Percent Delegation']?.response ?? '-' : '-';

    const extractPct = (response, medicName) => {
        if (response === '-' || !response) return '-';
        const match = response.match(new RegExp(medicName + '\\s+(\\d+%)'));
        return match ? match[1] : '0%';
    };

    for (let i = 0; i < 3; i++) {
        const row = allObjs[allObjs.length - 1 - i];
        if (!row) break;
        switch (row['ADM_Aligned_Status (Baseline/Misaligned/Aligned)']) {
            case 'aligned':
            case 'AlignedSS':
                row[colAB] = entryObj[colAB] === 'A' ? 'y' : 'n';
                if (misalignedAdm) row[colAM] = entryObj[colAM] === 'A' ? 'y' : 'n';
                row[colPctAB] = extractPct(pctAB, alignedAdm);
                if (misalignedAdm) row[colPctAM] = extractPct(pctAM, alignedAdm);
                break;
            case 'baseline':
            case 'AlignedOS':
                row[colAB] = entryObj[colAB] === valB ? 'y' : 'n';
                row[colPctAB] = extractPct(pctAB, baselineAdm);
                break;
            case 'misaligned':
            case 'Misaligned':
                row[colAM] = entryObj[colAM] === valM ? 'y' : 'n';
                row[colPctAM] = extractPct(pctAM, misalignedAdm);
                break;
        }
    }
}

function postProcessVolRows(allObjs, volRowIndices, comparisons) {
    for (const volIndex of volRowIndices) {
        const volRow = allObjs[volIndex];
        const comparison = comparisons?.find((x) =>
            x['pid'] === volRow['Delegator ID'] &&
            x['adm_type'] === volRow['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] &&
            x['adm_alignment_target'] === volRow['Target'] &&
            x['adm_scenario'] === 'vol-ph1-eval-3'
        );
        const scores = comparison?.calibration_scores;
        volRow['Alignment score (Delegator|Observed_ADM (target))'] = scores?.['PerceivedQuantityOfLivesSaved'] ?? '-';
        allObjs.push({
            ...volRow,
            'Attribute': 'QOL',
            'Alignment score (Delegator|Observed_ADM (target))': scores?.['QualityOfLife'] ?? '-'
        });
    }
}

function checkDemoForMil(demoEntry) {
    const served = demoEntry?.results?.['Post-Scenario Measures']?.['Served in Military'];
    return isDefined(served) && served !== 'Never Served' ? 'yes' : 'no';
}

function buildEntryRow(context) {
    const {
        evalNum, isPhase2, pid, logData, entry, page, t,
        wrong_del_materials, orderLog, trial_num,
        ad_scenario, st_scenario, populationHeader,
        admData, comparisons, simData, alignments, distanceAlignments, eval16Alignments,
        textResultsForPID, res, fullSetOnly, includeDreServer, calibrationScores,
        allObjs, demoEntry
    } = context;

    const popPrefix = populationHeader ? 'P1E/Population ' : '';
    const isAdept = entry['TA1'] === 'Adept';
    const ta2Author = entry['TA2'] === 'Kitware' ? 'kitware' : 'TAD';
    const entryObj = {};

    // --- Identity & demographics ---
    entryObj['Delegator ID'] = pid;
    entryObj['ADM Order'] = wrong_del_materials.includes(pid) ? 1 : logData['ADMOrder'];
    entryObj['Datasource'] = DATASOURCE[evalNum]
        ?? (evalNum === 5
            ? (logData.Type === 'Online' ? 'P1E_online' : 'P1E_IRL')
            : (logData.Type === 'Online' ? 'P1E_online_2025' : 'P1E_IRL_2025'));
    entryObj['Delegator_grp'] = logData['Type'] === 'Civ' ? 'Civilian' : logData['Type'] === 'Mil' ? 'Military' : logData['Type'];

    const ROLE_Q = evalNum >= 8 ? 'What is your current role' : 'What is your current role (choose all that apply):';
    const roles = res.results?.['Post-Scenario Measures']?.questions?.[ROLE_Q]?.['response'];
    if (evalNum < 8) {
        entryObj['Delegator_mil'] = roles?.includes('Military Background') || pid === '202409102' ? 'yes' : 'no';
    } else {
        const served = res.results?.['Post-Scenario Measures']?.questions?.['Served in Military']?.['response'];
        entryObj['Delegator_mil'] = isDefined(served) ? served == 'Never Served' ? 'no' : 'yes' : checkDemoForMil(demoEntry);
    }
    entryObj['Delegator_Role'] = roles ?? '-';
    if (Array.isArray(entryObj['Delegator_Role'])) {
        entryObj['Delegator_Role'] = entryObj['Delegator_Role'].join('; ');
    }

    entryObj['TA1_Name'] = entry['TA1'];
    entryObj['Trial_ID'] = orderLog ? orderLog.indexOf(page['pageName']) + 1 : trial_num;
    entryObj['Attribute'] = entry['Attribute'];
    entryObj['Scenario'] = isAdept ? ad_scenario : st_scenario;
    entryObj['TA2_Name'] = entry['TA2'];
    entryObj['ADM_Type'] = t === 'comparison' ? 'comparison' : evalNum === 10 ? 'aligned' : ALIGNED_TYPES.has(t) ? 'aligned' : 'baseline';
    if (evalNum === 16 && (entry['Attribute'] === 'AF' || entry['Attribute'] === 'MF') && t !== 'comparison')
        entryObj['ADM_Type'] = 'Oracle';
    entryObj['Target'] = (evalNum >= 8 && evalNum != 12 && evalNum !== 16 && t === 'baseline') ? '-' : (page['admTarget'] ?? '-');

    const foundADM = findMatchingADM(admData, page, evalNum);
    let alignment, distance_alignment;
    if (evalNum === 16) {
        // admMedics has flat alignmentScore, no history array
        alignment = foundADM?.alignmentScore ?? '-';
        distance_alignment = '-';
    } else {
        alignment = foundADM?.history[foundADM.history.length - 1]?.response?.score ?? '-';
        distance_alignment = foundADM?.history[foundADM.history.length - 1]?.response?.distance_based_score ?? '-';
    }
    const admTargetScore = (evalNum === 12 && ['IO', 'MJ'].includes(entryObj['Attribute'])) ? distance_alignment : alignment;

    entryObj[popPrefix + 'Alignment score (ADM|target)'] = admTargetScore;
    if (evalNum === 5 || evalNum === 6)
        entryObj['DRE/Distance Alignment score (ADM|target)'] = isAdept ? distance_alignment : alignment;
    if (evalNum === 4 && fullSetOnly && includeDreServer) {
        entryObj['DRE/Distance Alignment score (ADM|target)'] = entryObj['P1E/Population Alignment score (ADM|target)'];
        entryObj['P1E/Population Alignment score (ADM|target)'] = isAdept ? page.ph1AdmAlignment : entryObj['P1E/Population Alignment score (ADM|target)'];
    }

    // --- Sim alignment ---
    if (evalNum === 12) {
        const simComp = comparisons.find(x => x['sim_scenario'] === 'DryRunEval-MJ4-eval' && x['pid'] === pid && x['adm_alignment_target'] === page['admTarget'] && x['adm_scenario'] === 'DryRunEval-MJ2-eval');
        entryObj['Alignment score (Participant_sim|Observed_ADM(target))'] = simComp?.distance_based_score ?? '-';
    } else {
        const simEntry = simData.find((x) => x.evalNumber === evalNum && x.pid === pid &&
            (['QOL', 'VOL'].includes(entryObj['Attribute']) ? x.ta1 === 'st' : x.ta1 === 'ad') &&
            x.scenario_id.toUpperCase().includes(entryObj['Attribute'].replace('IO', 'MJ')));
        const alignmentData = simEntry?.data?.alignment?.adms_vs_text;
        entryObj['Alignment score (Participant_sim|Observed_ADM(target))'] = alignmentData?.find((x) =>
            (evalNum === 12 || x['adm_author'] === ta2Author) &&
            x['adm_alignment']?.includes(entryObj['ADM_Type']) && x['adm_target'] === page['admTarget'])?.score ?? '-';
    }

    if (evalNum === 16) {
        entryObj[popPrefix + 'Alignment score (Delegator|target)'] = eval16Alignments[entry['Attribute']]?.find(a => a.target === page['admTarget'])?.score ?? '-';
    } else {
        entryObj[popPrefix + 'Alignment score (Delegator|target)'] = alignments.find((a) => a.target === page['admTarget']?.replaceAll('.', '') || a.target === page['admTarget'])?.score ?? '-';
    }
    const txt_distance = distanceAlignments.find((a) => a.target === page['admTarget'] || ((evalNum === 5 || evalNum === 6) && a.target === page['admTarget']?.replace('.', '')))?.score ?? '-';
    if (evalNum === 5 || evalNum === 6)
        entryObj['DRE/Distance Alignment score (Delegator|target)'] = isAdept ? txt_distance : entryObj['P1E/Population Alignment score (Delegator|target)'];
    if (evalNum === 4 && fullSetOnly && includeDreServer) {
        entryObj['DRE/Distance Alignment score (Delegator|target)'] = entryObj['P1E/Population Alignment score (Delegator|target)'];
        entryObj['P1E/Population Alignment score (Delegator|target)'] = isAdept ? page.ph1TxtAlignment : entryObj['P1E/Population Alignment score (Delegator|target)'];
    }

    entryObj['Server Session ID (Delegator)'] = t === 'comparison' ? '-' : textResultsForPID.find((r) => r.scenario_id.includes(isAdept ? 'MJ' : (entryObj['Target'].includes('qol') ? 'qol' : 'vol')))?.[isAdept ? 'combinedSessionId' : 'serverSessionId'] ?? '-';
    entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t === 'comparison' ? '-' : t;
    if (evalNum === 16 && (entry['Attribute'] === 'AF' || entry['Attribute'] === 'MF') && t !== 'comparison')
        entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t === 'aligned' ? 'AlignedSS' : t === 'baseline' ? 'AlignedOS' : 'Misaligned';

    
    const choiceProcess = (isPhase2 && t !== 'comparison' && t !== 'baseline' && !page['admChoiceProcess'])
        ? (evalNum === 16
            ? determineChoiceProcessEval16(eval16Alignments, entry, page, t)
            : determineChoiceProcessJune2025(textResultsForPID, page, t))
        : page['admChoiceProcess'];

    const isOracle = evalNum === 16 && (entry['Attribute'] === 'AF' || entry['Attribute'] === 'MF');

    entryObj['ADM Loading'] = t === 'comparison' ? '-' : 
        (t === 'baseline' && !isOracle) ? 'normal' : 
        (choiceProcess === 'exemption') ? 'exemption' : 'normal';

    if (evalNum === 5 || evalNum === 6)
        entryObj['DRE ADM Loading'] = isAdept ? page.dreChoiceProcess : entryObj['ADM Loading'];
    if (evalNum === 4 && fullSetOnly && includeDreServer) {
        entryObj['DRE ADM Loading'] = entryObj['ADM Loading'];
        entryObj['ADM Loading'] = isAdept ? page.ph1ChoiceProcess : entryObj['ADM Loading'];
    }

    if (evalNum === 15 || evalNum === 16) entryObj['Kitware Model'] = page['admName']?.replace('ALIGN-ADM-', '') ?? '-';
    entryObj['Competence Error'] = (evalNum === 5 || evalNum === 6) && entry['TA2'] === 'Kitware' && entryObj['ADM_Type'] === 'aligned' && PH1_COMPETENCE[entryObj['Scenario']].includes(entryObj['Target']) ? 1 : 0;

    // --- Comparison entry & delegator|observed_ADM alignment ---
    let comparison_entry;
    if (evalNum < 8) {
        comparison_entry = comparisons?.find((x) => x['ph1_server'] !== true && x['dre_server'] !== true && x['adm_type'] === t && x['pid'] === pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] === 'Parallax' && x['adm_author'] === 'TAD') || (entry['TA2'] === 'Kitware' && x['adm_author'] === 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
    } else if (evalNum === 12) {
        const scenarioForComparison = page['scenarioIndex']?.includes('IO') ? page['scenarioIndex'].replace('IO', 'MJ') : page['scenarioIndex'];
        comparison_entry = comparisons?.find((x) => x['pid'] === pid && x['adm_type'] === t && x['adm_alignment_target'] === page['admTarget'] && x['adm_scenario'] === scenarioForComparison);
    } else {
        comparison_entry = comparisons?.find((x) =>
            (evalNum === 10 || evalNum === 16 || x['adm_type'] === t) && x['pid'] === pid && x['adm_scenario'] === page['scenarioIndex'] && x['adm_alignment_target'] === page['admTarget'] &&
            (evalNum !== 10 || x['text_scenario'].includes(entryObj['Attribute'])) &&
            (page['scenarioIndex']?.includes('PS-AF') ? x['text_scenario']?.includes('PS-AF') : !x['text_scenario']?.includes('PS-AF')));
    }

    // Alignment comparison score
    let alignmentComparison;
    if (evalNum === 10 && page['scenarioIndex']?.includes('combined')) {
        const findPSAF = (attr, inc, exc) => comparisons?.find((x) => x['pid'] === pid && x['adm_scenario'] === page['scenarioIndex'] && x['adm_alignment_target'] === page['admTarget'] && x['attribute'] === attr && x['text_scenario'].includes(inc) && !x['text_scenario'].includes(exc));
        const psEntry = findPSAF('PS', 'PS', 'PS-AF');
        const afEntry = findPSAF('AF', 'AF', 'PS-AF');
        if (psEntry?.score && afEntry?.score) alignmentComparison = `PS Score: ${psEntry.score}\nAF Score: ${afEntry.score}`;
        else if (psEntry?.score) alignmentComparison = `PS Score: ${psEntry.score}`;
        else if (afEntry?.score) alignmentComparison = `AF Score: ${afEntry.score}`;
        else alignmentComparison = '-';
    } else {
        alignmentComparison = evalNum === 12 ? comparison_entry?.distance_based_score : comparison_entry?.score ?? '-';
    }

    entryObj[popPrefix + 'Alignment score (Delegator|Observed_ADM (target))'] = alignmentComparison;
    if (evalNum === 5 || evalNum === 6)
        entryObj['DRE/Distance Alignment score (Delegator|Observed_ADM (target))'] = isAdept ? comparison_entry?.distance_based_score : entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];

    if (calibrationScores) {
        entryObj['Calibration Alignment Score (Delegator|Observed_ADM (target))'] = JSON.stringify(comparison_entry?.calibration_scores);
        entryObj['P1E Alignment Score (Delegator|target)'] = entryObj['P1E/Population Alignment score (Delegator|target)'];
        entryObj['P1E Alignment score (Delegator|Observed_ADM (target))'] = entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];
        entryObj['P1E Alignment score (ADM|target)'] = entryObj['P1E/Population Alignment score (ADM|target)'];
    }


    if (evalNum >= 8) {
        entryObj['Alignment score (ADM|target)'] = (t === 'baseline' && evalNum !== 12 && evalNum !== 16) ? '-' : entryObj['P1E/Population Alignment score (ADM|target)'];
        entryObj['Alignment score (Delegator|target)'] = (t === 'baseline' && evalNum !== 12 && evalNum !== 16) ? '-' : entryObj['P1E/Population Alignment score (Delegator|target)'];
        entryObj['Alignment score (Delegator|Observed_ADM (target))'] = entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];

        // Resolve attribute from target/scenario (not eval 15/16 — attributes come from admOrderMapping)
        if (evalNum !== 15 && evalNum !== 16) {
            const resolved = resolveAttribute(entryObj['Target'], page['baselineTarget'], page['scenarioIndex']);
            if (resolved) entryObj['Attribute'] = resolved;
        }

        // Probe sets
        entryObj['Probe Set Assessment'] = page['scenarioIndex'].includes('PS-AF') ? logData['PS-AF-text-scenario'] : logData['AF-text-scenario'];
        if (evalNum === 15) {
            const match = page['scenarioIndex']?.match(/(\d+)-observe$/);
            entryObj['Probe Set Observation'] = match ? parseInt(match[1]) : '-';
        } else if (evalNum !== 10) {
            const isMultiKdma = entryObj['Target'].includes('affiliation') && entryObj['Target'].includes('merit');
            entryObj['Probe Set Observation'] = adjustScenarioNumber(
                isMultiKdma ? adjustScenarioNumber(entryObj['Probe Set Assessment'], 3) : entryObj['Probe Set Assessment'], 3);
        } else {
            const isMultiKdma = page['scenarioIndex'].includes('PS-AF');
            const isCombined = page['scenarioIndex'].includes('PSAF');
            entryObj['Probe Set Observation'] = isMultiKdma ? adjustScenarioNumber(logData['PS-AF-text-scenario'], 2) : adjustScenarioNumber(isMultiKdma ? adjustScenarioNumber(entryObj['Probe Set Assessment'], 3) : entryObj['Probe Set Assessment'], 3);
        }

        // Override server session ID for phase 2
        if (evalNum === 15) {
            if (page['scenarioIndex'] === 'Feb2026-MF3-observe') {
                entryObj['Server Session ID (Delegator)'] = t === 'comparison' ? '-' :
                    textResultsForPID.find(r => r.scenario_id?.includes('MF') && !r.scenario_id?.includes('SS'))?.individualSessionId ?? '-';
            } else {
                const isMFSS = page['scenarioIndex']?.includes('MF-SS');
                const isAFPS = page['scenarioIndex']?.includes('AF-PS');
                entryObj['Server Session ID (Delegator)'] = t === 'comparison' ? '-' :
                    textResultsForPID.find(r =>
                        isMFSS ? (r.scenario_id?.includes('MF') || r.scenario_id?.includes('SS')) :
                            isAFPS ? (r.scenario_id?.includes('AF') || r.scenario_id?.includes('PS')) : true
                    )?.combinedSessionId ?? '-';
            }
        } else {
            entryObj['Server Session ID (Delegator)'] = t === 'comparison' ? '-' : textResultsForPID[0]?.combinedSessionId;
        }
    }

    // --- Truncation error ---
    entryObj['Truncation Error'] = comparison_entry?.truncation_error ? 1 : 0;

    if (evalNum === 4 && fullSetOnly) {
        const ph1_comparison_entry = comparisons?.find((x) => x['ph1_server'] === true && x['adm_type'] === t && x['pid'] === pid && getDelEnvMapping(res.results.surveyVersion)[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] === 'Parallax' && x['adm_author'] === 'TAD') || (entry['TA2'] === 'Kitware' && x['adm_author'] === 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
        entryObj['DRE/Distance Alignment score (Delegator|Observed_ADM (target))'] = entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'];
        if (entryObj['TA1_Name'] === 'Adept')
            entryObj['P1E/Population Alignment score (Delegator|Observed_ADM (target))'] = ph1_comparison_entry?.score ?? '-';
    }

    // --- Survey ratings ---
    const ratingQ = (suffix) => page['pageType'] === 'singleMedic' ? page['questions']?.[page['pageName'] + suffix]?.['response'] ?? '-' : '-';
    entryObj['Trust_Rating'] = RATING_MAP[ratingQ(': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it')];
    entryObj['Trustworthy_Rating'] = RATING_MAP[ratingQ(isPhase2 ? ': this medic is trustworthy' : ': This medic is trustworthy')];
    entryObj['Agreement_Rating'] = RATING_MAP[ratingQ(isPhase2 ? ': Do you agree with the decision that this medic made?' : ': Do you agree with the decisions that this medic made?')];
    entryObj['SRAlign_Rating'] = RATING_MAP[ratingQ(': The way this medic makes medical decisions is how I make decisions')];
    if (evalNum === 16 && t !== "comparison") {
      entryObj["Distrust_Rating"] = RATING_MAP[
        ratingQ(": Based on this experience, I cannot rely on this person with complete confidence.")
      ];
      entryObj["Trustworthy(INT)_Rating"] = RATING_MAP[
        ratingQ(": This medic’s actions and behaviors are not very consistent.")
      ];
      entryObj["Trustworthy(BEN)_Rating"] = RATING_MAP[
        ratingQ(": This medic really looks out for what is important to me.")
      ];
    
      const delAKey = Object.keys(page["questions"] ?? {}).find(k => k.includes("Del Version A"));
      const delBKey = Object.keys(page["questions"] ?? {}).find(k => k.includes("Del Version B"));
      entryObj["Delegation1"] = DELEGATION1_MAP[delAKey ? page["questions"][delAKey]?.response ?? "-" : "-"];
      entryObj["Delegation2"] = DELEGATION2_MAP[delBKey ? page["questions"][delBKey]?.response ?? "-" : "-"];
    }
    
    // --- Delegation preferences ---
    if (t === 'comparison') {
        const adms = page['pageName'].split(' vs ');
        if (evalNum == 10 && adms.length === 2) handlePSAFPreferences(res.results, page, entryObj, allObjs);
        else if (evalNum >= 8 && adms.length === 4) handleMultiKdmaComparison(res.results, page, entryObj, allObjs);
        else handleStandardComparison(evalNum, page, entryObj, allObjs, entry);
    } else {
        entryObj['Delegation preference (A/B)'] = '-';
        entryObj['Delegation preference (A/M)'] = '-';
        entryObj['Delegation Preference (AlignedSS/AlignedOS)'] = '-';
        entryObj['Delegation Percentage (AlignedSS/AlignedOS)'] = '-';
        entryObj['Delegation Preference (AlignedSS/Misaligned)'] = '-';
        entryObj['Delegation Percentage (AlignedSS/Misaligned)'] = '-';
    }

    return entryObj;
}

export function getRQ134Data(evalNum, surveyData, dataParticipantLog, textResultsData, dataADMs, comparisonData, dataSim, fullSetOnly = false, includeDreServer = true, calibrationScores = false, demoData = null) {
    const isPhase2 = [8, 9, 10, 15, 16].includes(evalNum);
    const surveyResults = Array.isArray(surveyData) ? surveyData : surveyData?.getAllSurveyResults ?? [];
    const participantLog = dataParticipantLog.getParticipantLog;
    const textResults = Array.isArray(textResultsData) ? textResultsData : textResultsData?.getAllScenarioResults ?? [];
    const admData = dataADMs.getAllHistoryByEvalNumber;
    const comparisons = Array.isArray(comparisonData) ? comparisonData : comparisonData?.getHumanToADMComparison ?? [];
    const simData = dataSim.getAllSimAlignmentByEval;

    const allObjs = [], allTA1s = [], allTA2s = [], allScenarios = [];
    const allProbeSetAssessment = [], allProbeSetObservation = [];
    const allTargets = [], allAttributes = [];

    const TEXT_COUNT_NEEDED = evalNum === 16 ? 5 : evalNum >= 8 ? 4 : 5;
    const SIM_ENTRY_COUNT_NEEDED = evalNum >= 8 ? 0 : 3;
    let populationHeader = true;
    if (evalNum === 4 && (!fullSetOnly || !includeDreServer)) populationHeader = false;

    const completed_surveys = surveyResults.filter((res) => res.results?.evalNumber === evalNum && ((evalNum === 4 && isDefined(res.results['Post-Scenario Measures'])) || (([5, 6, 8, 9, 10, 12, 15, 16].includes(evalNum)) && Object.keys(res.results).filter((pg) => pg.includes(' vs ')).length > 0)));
    const wrong_del_materials = evalNum === 5 ? findWrongDelMaterials(evalNum, participantLog, surveyResults) : [];
    for (const res of completed_surveys) {
        const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response ?? res.results['pid'];
        // Skip incomplete surveys from participants who have a complete survey
        if (!isDefined(res.results['Post-Scenario Measures']) && surveyResults.filter((r) => r.results?.['Participant ID Page']?.questions['Participant ID']?.response === pid && isDefined(r.results['Post-Scenario Measures'])).length > 0) {
            continue;
        }

        const logData = participantLog.find(log => String(log['ParticipantID']) === pid && String(log['Type']) !== 'Test');
        const textCount = textResults.filter((x) => x.participantID === pid).length;
        if (!logData || textCount < TEXT_COUNT_NEEDED) continue;
        if (fullSetOnly && (logData.surveyEntryCount < 1 || textCount < TEXT_COUNT_NEEDED || logData.simEntryCount < SIM_ENTRY_COUNT_NEEDED)) continue;

        const { textResultsForPID, alignments, distanceAlignments, eval16Alignments } = getAlignments(evalNum, textResults, pid);
        const orderLog = res.results['orderLog']?.filter((x) => x.includes('Medic'));
        const demoEntry = demoData?.find(entry => entry.surveyId === pid) ?? null;

        // ADM order override
        if (isPhase2) logData['ADMOrder'] = evalNum == 10 ? 6 : evalNum == 15 ? 8 : evalNum == 16 ? 9 : 5;
        if (evalNum === 12) logData['ADMOrder'] = 7;

        const admOrder = pid === '202411327' ? admOrderMapping[3] : (wrong_del_materials.includes(pid) ? admOrderMapping[1] : admOrderMapping[logData['ADMOrder']]);
        const st_scenario = pid === '202411327' ? 'ST-2' : (wrong_del_materials.includes(pid) ? 'ST-3' : (logData['Del-1']?.includes('ST') ? logData['Del-1'] : logData['Del-2']));
        const ad_scenario = pid === '202411327' ? 'AD-2' : (wrong_del_materials.includes(pid) ? 'AD-1' : (logData['Del-1']?.includes('AD') ? logData['Del-1'] : logData['Del-2']));

        let trial_num = 1;
        const volRowsToProcess = [];

        for (const entry of admOrder) {
            const types = evalNum === 10 ? TYPES_EVAL_10 : evalNum === 16 ? TYPES_EVAL_16 : TYPES_DEFAULT;

            for (const t of types) {
                let pagesFound = findMatchingPages(evalNum, res.results, entry, t, logData, st_scenario, ad_scenario);
                if (pagesFound.length === 0) continue;
                if (!(evalNum === 10 && t === 'comparison')) pagesFound = [pagesFound[0]];

                for (const pageFound of pagesFound) {
                    const page = res.results[pageFound];

                    const entryObj = buildEntryRow({
                        evalNum, isPhase2, pid, logData, entry, page, t,
                        wrong_del_materials, orderLog, trial_num,
                        ad_scenario, st_scenario, populationHeader,
                        admData, comparisons, simData, alignments, distanceAlignments, eval16Alignments,
                        textResultsForPID, res, fullSetOnly, includeDreServer, calibrationScores,
                        allObjs, demoEntry
                    });

                    // Accumulators — push original entry['Attribute'] to match original behavior
                    allObjs.push(entryObj);
                    allTA1s.push(entry['TA1']);
                    allAttributes.push(entry['Attribute']);
                    allScenarios.push(entryObj['Scenario']);
                    allTA2s.push(entry['TA2']);
                    if (entryObj['Target'] !== '-') allTargets.push(entryObj['Target']);
                    if (evalNum >= 8) {
                        allProbeSetAssessment.push(entryObj['Probe Set Assessment']);
                        allProbeSetObservation.push(entryObj['Probe Set Observation']);
                    }

                    trial_num += 1;
                    if (evalNum === 12 && entryObj['Attribute'] === 'VOL' && t !== 'comparison') {
                        volRowsToProcess.push(allObjs.length - 1);
                    }
                }
            }
        }

        if (evalNum === 12) {
            postProcessVolRows(allObjs, volRowsToProcess, comparisons);
            allAttributes.push('QOL');
        }
    }

    return { allObjs, allTA1s, allTA2s, allScenarios, allTargets, allAttributes, allProbeSetAssessment, allProbeSetObservation };
}


function handlePSAFPreferences(survey, page, entryObj, allObjs) {
    const adms = page['pageName'].split(' vs ');
    const admTargetMap = {};
    const targetIDs = [];
    for (const adm of adms) {
        const admPage = survey[adm];
        if (admPage) {
            admTargetMap[adm] = admPage.admTarget;
            targetIDs.push(admPage.admTarget.slice(-1));
        }
    }
    targetIDs.sort();
    const pid = entryObj['Delegator ID'];
    const choice = admTargetMap[page.questions?.[page['pageName'] + ": Forced Choice"]?.response] ?? null;
    const columnName = `Delegation Preference (PSAF-${targetIDs[0]}/PSAF-${targetIDs[1]})`
    entryObj[columnName] = choice;
    const firstRow = allObjs.find(obj => obj['Delegator ID'] === pid && obj['Target'] === admTargetMap[adms[0]])
    if (firstRow) {
        firstRow[columnName] = choice === admTargetMap[adms[0]] ? 'y' : 'n'
    }
    const secondRow = allObjs.find(obj => obj['Delegator ID'] === pid && obj['Target'] === admTargetMap[adms[1]])
    if (secondRow) {
        secondRow[columnName] = choice === admTargetMap[adms[1]] ? 'y' : 'n'
    }
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

export const PAGES = {
    RQ1: 'rq1',
    RQ2: 'rq2',
    RQ3: 'rq3',
    EXPLORATORY_ANALYSIS: 'exploratoryAnalysis',
    ADM_PROBE_RESPONSES: 'admProbeResponses',
    ADM_ALIGNMENT: 'admAlignment',
    ADM_RESULTS: 'admResults',
    HUMAN_SIM_PLAY_BY_PLAY: 'humanSimPlayByPlay',
    HUMAN_SIM_PROBES: 'humanSimProbes',
    PARTICIPANT_LEVEL_DATA: 'participantLevelData',
    TEXT_RESULTS: 'textResults',
    PROGRAM_QUESTIONS: 'programQuestions'
}

/*
 * Returns the list of eval options for the dropdown of a page.
 * Needs the evalData collection and page name
 */
export function getEvalOptionsForPage(page) {
    const dropdownOptions = [];
    for (const evalData of store.getState()?.configs?.evals) {
        if (evalData.pages[page]) {
            dropdownOptions.push({ value: evalData.evalNumber, label: evalData.evalName });
        }
    }
    dropdownOptions.reverse();
    return dropdownOptions;
}

function matchesAttribute(attr, target) {
    const hasAF = target.includes('AF');
    const hasMF = target.includes('MF');
    const hasPS = target.includes('PS');

    if (attr === 'AF-PS') return hasAF && hasPS;
    if (attr === 'MF-PS') return hasMF && hasPS;

    if (attr === 'AF') return hasAF && !hasMF && !hasPS;
    if (attr === 'MF') return hasMF && !hasAF && !hasPS;
    if (attr === 'PS') return hasPS && !hasAF && !hasMF;

    return false;
}

function determineChoiceProcessEval16(eval16Alignments, entry, page, t) {
    const attr = entry['Attribute'];
    const target = page['admTarget'];
    const isOracle = attr === 'AF' || attr === 'MF';

    const atts = eval16Alignments[attr];
    if (!atts || atts.length === 0) return 'exemption';

    const filtered = atts.filter(a => matchesAttribute(attr, a.target));

    if (filtered.length === 0) return 'exemption';

    let mostAligned = filtered[0];
    let leastAligned = filtered[0];

    for (const a of filtered) {
        if (a.score > mostAligned.score) mostAligned = a;
        if (a.score < leastAligned.score) leastAligned = a;
    }

    const selectedTarget =
        (t === 'aligned' || (isOracle && t === 'baseline'))
            ? mostAligned.target
            : t === 'misaligned'
                ? leastAligned.target
                : null;

            
    if (!selectedTarget) return 'exemption';

    if (selectedTarget !== target) {
        console.log('[Eval16 Alignment Exemption]', {
            attribute: attr,
            expectedTarget: selectedTarget,
            actualTarget: target,
            type: t,
            mostAligned,
            leastAligned
        });
    }

    return selectedTarget === target
        ? (t === 'aligned' ? 'most aligned' : 'least aligned')
        : 'exemption';
}