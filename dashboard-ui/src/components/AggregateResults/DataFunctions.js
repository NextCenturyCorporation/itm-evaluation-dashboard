/*
 * functions that help with data aggregation
 */

const SIM_MAP = {
    "submarine": 1,
    "jungle": 2,
    "urban": 3,
    "desert": 4,
    "dryrun-adept-eval-MJ2": 1,
    "dryrun-adept-eval-MJ4": 2,
    "dryrun-adept-eval-MJ5": 3,
    "dryrun-soartech-eval-qol1": 1,
    "dryrun-soartech-eval-qol2": 2,
    "dryrun-soartech-eval-qol3": 3,
    "dryrun-soartech-eval-vol1": 1,
    "dryrun-soartech-eval-vol2": 2,
    "dryrun-soartech-eval-vol3": 3,
    "phase1-adept-eval-MJ2": 1,
    "phase1-adept-eval-MJ4": 2,
    "phase1-adept-eval-MJ5": 3,
    "phase1-soartech-eval-qol2": 1,
    "phase1-soartech-eval-qol3": 2,
    "phase1-soartech-eval-qol4": 3,
    "phase1-soartech-eval-vol2": 1,
    "phase1-soartech-eval-vol3": 2,
    "phase1-soartech-eval-vol4": 3
}

const adept_dre_names = {
    '1': 'DryRunEval-MJ2-eval',
    '2': 'DryRunEval-MJ4-eval',
    '3': 'DryRunEval-MJ5-eval'
}

const st_dre_names = {
    '1': 'QOL-VOL-1',
    '2': 'QOL-VOL-2',
    '3': 'QOL-VOL-3'
}

const MED_ROLE_MAP = {
    "M-3 Medical student": 1,
    "M-4 medical student": 1,
    "EM resident": 2,
    "EM/IM resident": 2,
    "EM faculty": 3,
    "Emergency medical technician": 4,
    "Paramedic": 5,
    "Other": 6
};

const MED_EXP_MAP = {
    "No": 0,
    "Not sure": 1,
    "Yes": 2
};

const TRUST_MAP = {
    "Strongly disagree": 1,
    "Disagree": 2,
    "Neither agree nor disagree": 3,
    "Agree": 4,
    "Strongly agree": 5
};

const COMFORT_MAP = {
    "Very uncomfortable": 2,
    "Slightly uncomfortable": 1,
    "Neutral": 0,
    "Comfortable": 0,
    "Very comfortable": 0
};

const TEXT_BASED_MAP = {
    "(1) ST Jungle, AD Jungle; AD Submarine, ST Submarine": 1,
    "(2) AD Submarine, ST Submarine; ST Jungle, AD Jungle": 2,
    "(3) ST Desert, AD Desert; AD Urban, ST Urban": 3,
    "(4) AD Urban, ST Urban; ST Desert, AD Desert": 4,
    "I have not completed any text-based scenarios": 0,
    "Item 5": 0,
    "DryRunEval-MJ2-eval": 1,
    "DryRunEval-MJ4-eval": 2,
    "DryRunEval-MJ5-eval": 3,
    "qol-dre-1-eval": 1,
    "qol-dre-2-eval": 2,
    "qol-dre-3-eval": 3,
    "vol-dre-1-eval": 1,
    "vol-dre-2-eval": 2,
    "vol-dre-3-eval": 3,
    "phase1-adept-eval-MJ2": 1,
    "phase1-adept-eval-MJ4": 2,
    "phase1-adept-eval-MJ5": 3,
    "qol-ph1-eval-2": 1,
    "qol-ph1-eval-3": 2,
    "qol-ph1-eval-4": 3,
    "vol-ph1-eval-2": 1,
    "vol-ph1-eval-3": 2,
    "vol-ph1-eval-4": 3,
};

const RESPONSIBILITY_MAP = {
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

// 1 is high alignment, 0 is low alignment
const ATTRIBUTE_MAP = {
    "Medic-ST1": 1,
    "Medic-ST2": 0,
    "Medic-ST3": 1,
    "Medic-ST4": 0,
    "Medic-ST5": 1,
    "Medic-ST6": 0,
    "Medic-ST7": 1,
    "Medic-ST8": 0,
    "Medic-AD1": 1,
    "Medic-AD2": 0,
    "Medic-AD3": 1,
    "Medic-AD4": 0,
    "Medic-AD5": 1,
    "Medic-AD6": 0,
    "Medic-AD7": 1,
    "Medic-AD8": 0,
    "Medic-A": 1,
    "Medic-B": 0,
    "Medic-C": 1,
    "Medic-D": 0
};

const TEXT_MEDIAN_ALIGNMENT_VALUES = {};
const SIM_MEDIAN_ALIGNMENT_VALUES = {};
const SIM_ORDER = {};
export const POST_MRE_EVALS = [4, 5, 6];
const AGGREGATED_DATA = { 'PropTrust': { 'total': 0, 'count': 0 }, 'Delegation': { 'total': 0, 'count': 0 }, 'Trust': { 'total': 0, 'count': 0 } };

// get text alignment scores for every participant, and the median value of those scores
function getTextKDMA(data) {
    const alignmentMap = {};
    // get all recorded kdmas by participant id
    for (const res of data.getAllScenarioResultsByEval) {
        if (res.participantID && res.highAlignmentData?.kdma_values) {
            // recover from typos in pids
            switch (res.participantID) {
                case '202402':
                    res.participantID = '2024202';
                    break;
                case '202417':
                    res.participantID = '2024217';
                    break;
                case '2021216':
                    res.participantID = '2024216';
                    break;
                case '202419':
                    res.participantID = '2024219';
                    break;
                default:
                    break;
            }
            for (const kdma of res.highAlignmentData.kdma_values) {
                const kdmaKey = kdma.kdma;
                const kdmaVal = kdma.value;
                // only look at the result if the participant id is at the top level! other versions are old
                if (Object.keys(alignmentMap).includes(res.participantID)) {
                    const resAtPid = alignmentMap[res.participantID];
                    if (Object.keys(resAtPid).includes(kdmaKey)) {
                        resAtPid[kdmaKey]['total'] += kdmaVal;
                        resAtPid[kdmaKey]['count'] += 1;
                    }
                    else {
                        resAtPid[kdmaKey] = { 'total': kdmaVal, 'count': 1 };
                    }
                }
                else {
                    alignmentMap[res.participantID] = {};
                    alignmentMap[res.participantID][kdmaKey] = { 'total': kdmaVal, 'count': 1 };
                }
            }
        }
    }

    // combine kdmas into a single value (average) for each kdma for each participant
    const kdmas = {};
    for (const pid of Object.keys(alignmentMap)) {
        for (const kdma of Object.keys(alignmentMap[pid])) {
            const avg = alignmentMap[pid][kdma]['total'] / alignmentMap[pid][kdma]['count'];
            alignmentMap[pid][kdma] = avg;
            if (Object.keys(kdmas).includes(kdma)) {
                kdmas[kdma].push(avg);
            } else {
                kdmas[kdma] = [avg];
            }
        }
    }
    // get median for each kdma
    for (const k of Object.keys(kdmas)) {
        kdmas[k].sort((a, b) => a - b);
        // if even, take the middle two values
        if (kdmas[k].length % 2 === 0) {
            TEXT_MEDIAN_ALIGNMENT_VALUES[k] = (kdmas[k][Math.floor(kdmas[k].length / 2) - 1] + kdmas[k][Math.floor(kdmas[k].length / 2)]) / 2;
        }
        else {
            // if odd, just grab middle val
            TEXT_MEDIAN_ALIGNMENT_VALUES[k] = kdmas[k][Math.floor(kdmas[k].length / 2) + 1];
        }
    }
    // return object of kdma values for each participant
    return alignmentMap;
}

function getTextAlignment(data) {
    const alignmentMap = {};
    // get all recorded kdmas by participant id
    for (const res of data.getAllScenarioResultsByEval) {
        if (res.participantID) {
            // recover from typos in pids
            let pid = res.participantID;
            switch (pid) {
                case '202402':
                    pid = '2024202';
                    break;
                case '202417':
                    pid = '2024217';
                    break;
                case '2021216':
                    pid = '2024216';
                    break;
                case '202419':
                    pid = '2024219';
                    break;
                default:
                    break;
            }
            if (!Object.keys(alignmentMap).includes(pid)) {
                if (res.highAlignmentData?.alignment_target_id.includes('ADEPT')) {
                    alignmentMap[pid] = { 'ad': {}, 'st': {} };
                    alignmentMap[pid]['ad']['high'] = res.highAlignmentData?.score ?? 0;
                    alignmentMap[pid]['ad']['low'] = res.lowAlignmentData?.score ?? 0;
                    alignmentMap[pid]['ad']['highC'] = isDefined(res.highAlignmentData?.score) ? 1 : 0;
                    alignmentMap[pid]['ad']['lowC'] = isDefined(res.lowAlignmentData?.score) ? 1 : 0;
                    alignmentMap[pid]['st']['high'] = 0;
                    alignmentMap[pid]['st']['low'] = 0;
                    alignmentMap[pid]['st']['highC'] = 0;
                    alignmentMap[pid]['st']['lowC'] = 0;
                } else {
                    alignmentMap[pid] = { 'ad': {}, 'st': {} };
                    alignmentMap[pid]['st']['high'] = res.highAlignmentData?.score ?? 0;
                    alignmentMap[pid]['st']['low'] = res.lowAlignmentData?.score ?? 0;
                    alignmentMap[pid]['st']['highC'] = isDefined(res.highAlignmentData?.score) ? 1 : 0;
                    alignmentMap[pid]['st']['lowC'] = isDefined(res.lowAlignmentData?.score) ? 1 : 0;
                    alignmentMap[pid]['ad']['high'] = 0;
                    alignmentMap[pid]['ad']['low'] = 0;
                    alignmentMap[pid]['ad']['highC'] = 0;
                    alignmentMap[pid]['ad']['lowC'] = 0;
                }
            }
            else {
                if (res.highAlignmentData?.alignment_target_id.includes('ADEPT')) {
                    alignmentMap[pid]['ad']['high'] += res.highAlignmentData?.score;
                    alignmentMap[pid]['ad']['low'] += res.lowAlignmentData?.score;
                    alignmentMap[pid]['ad']['highC'] += isDefined(res.highAlignmentData?.score) ? 1 : 0;
                    alignmentMap[pid]['ad']['lowC'] += isDefined(res.lowAlignmentData?.score) ? 1 : 0;
                } else {
                    alignmentMap[pid]['st']['high'] += res.highAlignmentData?.score;
                    alignmentMap[pid]['st']['low'] += res.lowAlignmentData?.score;
                    alignmentMap[pid]['st']['highC'] += isDefined(res.highAlignmentData?.score) ? 1 : 0;
                    alignmentMap[pid]['st']['lowC'] += isDefined(res.lowAlignmentData?.score) ? 1 : 0;
                }
            }
        }
    }
    for (const pid of Object.keys(alignmentMap)) {
        alignmentMap[pid]['ad']['high'] = alignmentMap[pid]['ad']['high'] / alignmentMap[pid]['ad']['highC'];
        alignmentMap[pid]['ad']['low'] = alignmentMap[pid]['ad']['low'] / alignmentMap[pid]['ad']['lowC'];
        alignmentMap[pid]['st']['high'] = alignmentMap[pid]['st']['high'] / alignmentMap[pid]['st']['highC'];
        alignmentMap[pid]['st']['low'] = alignmentMap[pid]['st']['low'] / alignmentMap[pid]['st']['lowC'];
    }
    return alignmentMap;
}

function getSimAlignment(data) {
    // get sim alignment from mongo; also populate order of sims completed
    const alignments = {};
    const sims = {};
    for (const entry of data) {
        const pid = entry.pid.replace('"', '').trim();
        if (!Object.keys(alignments).includes(pid)) {
            alignments[pid] = {};
            sims[pid] = {};
        }
        sims[pid][entry.env] = entry.timestamp;
        const k = entry.data;
        if (Object.keys(k).includes('alignment') && k.alignment && Object.keys(k.alignment).includes('kdma_values')) {
            for (let x of k.alignment['kdma_values']) {
                if (Object.keys(alignments[pid]).includes(x.kdma)) {
                    alignments[pid][x.kdma]['total'] += x.value;
                    alignments[pid][x.kdma]['count'] += 1;
                } else {
                    alignments[pid][x.kdma] = { 'total': x.value, 'count': 1 }
                }
            }

        }
    }
    Object.keys(alignments).forEach((x) => Object.keys(alignments[x]).forEach((y) => alignments[x][y] = alignments[x][y]['total'] / alignments[x][y]['count']));
    const kdmas = {};
    for (const pid of Object.keys(alignments)) {
        for (const kdma of Object.keys(alignments[pid])) {
            const avg = alignments[pid][kdma];
            if (Object.keys(kdmas).includes(kdma)) {
                kdmas[kdma].push(avg);
            } else {
                kdmas[kdma] = [avg];
            }
        }
    }
    // get median for each kdma
    for (const k of Object.keys(kdmas)) {
        kdmas[k].sort((a, b) => a - b);
        // if even, take the middle two values
        if (kdmas[k].length % 2 === 0) {
            SIM_MEDIAN_ALIGNMENT_VALUES[k] = (kdmas[k][Math.floor(kdmas[k].length / 2) - 1] + kdmas[k][Math.floor(kdmas[k].length / 2)]) / 2;
        }
        else {
            // if odd, just grab middle val
            SIM_MEDIAN_ALIGNMENT_VALUES[k] = kdmas[k][Math.floor(kdmas[k].length / 2) + 1];
        }
    }
    for (const pid of Object.keys(sims)) {
        // get time-based order of simulations
        SIM_ORDER[pid] = Object.keys(sims[pid]).sort((a, b) => sims[pid][a] - sims[pid][b]);
    }
    return alignments;
}

function isDefined(x) {
    return x !== undefined && x !== null;
}

function safeGet(obj, args, backup) {
    // safely looks through a path in an object to get the value.
    // if a backup is provided (for slightly different survey versions) and the path of args does not work, backup is used
    // returns null if neither path can be followed
    let path = { ...obj };
    let useBackup = false;
    for (const arg of args) {
        if (Object.keys(path).includes(arg) && isDefined(path[arg])) {
            path = path[arg];
        }
        else {
            useBackup = true;
            break;
        }
    }
    if (useBackup) {
        if (backup) {
            return safeGet(obj, backup, null);
        }
        else {
            // console.warn(`Could not get data at path [${args}]`, obj);
            return null;
        }
    }
    else {
        return path;
    }
}

function getStConfRate(res) {
    // gets the overall delegation rate (1=delegated, 0=no delegation) for a participant
    const stSet1 = safeGet(res, ['results', 'Medic-ST1 vs Medic-ST2', 'questions', 'Medic-ST1 vs Medic-ST2: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSet2 = safeGet(res, ['results', 'Medic-ST3 vs Medic-ST4', 'questions', 'Medic-ST3 vs Medic-ST4: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSet3 = safeGet(res, ['results', 'Medic-ST5 vs Medic-ST6', 'questions', 'Medic-ST5 vs Medic-ST6: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSet4 = safeGet(res, ['results', 'Medic-ST7 vs Medic-ST8', 'questions', 'Medic-ST7 vs Medic-ST8: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSets = [stSet1, stSet2, stSet3, stSet4];
    let val = 0;
    let tally = 0;
    for (let s of stSets) {
        if (isDefined(s)) {
            val += CONFIDENCE_MAP[s];
            tally += 1;
        }
    }
    return tally > 0 ? val / tally : null;
}

function getAdConfRate(res) {
    // gets the overall delegation rate (1=delegated, 0=no delegation) for a participant
    const stSet1 = safeGet(res, ['results', 'Medic-AD1 vs Medic-AD2', 'questions', 'Medic-AD1 vs Medic-AD2: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSet2 = safeGet(res, ['results', 'Medic-AD3 vs Medic-AD4', 'questions', 'Medic-AD3 vs Medic-AD4: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSet3 = safeGet(res, ['results', 'Medic-AD5 vs Medic-AD6', 'questions', 'Medic-AD5 vs Medic-AD6: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSet4 = safeGet(res, ['results', 'Medic-AD7 vs Medic-AD8', 'questions', 'Medic-AD7 vs Medic-AD8: Rate your confidence about the delegation decision indicated in the previous question', 'response']);
    const stSets = [stSet1, stSet2, stSet3, stSet4];
    let val = 0;
    let tally = 0;
    for (let s of stSets) {
        if (isDefined(s)) {
            val += CONFIDENCE_MAP[s];
            tally += 1;
        }
    }
    return tally > 0 ? val / tally : null;
}

function getAnyDelRate(sets, forced = false) {
    let val = 0;
    let tally = 0;
    let high = 0; // how many high-aligned ADMs were chosen
    let low = 0; // how many low-aligned ADMs were chosen
    let chosen = 0; // how many times the participant actually chose (not both or neither)
    for (let s of sets) {
        if (isDefined(s)) {
            val += s !== 'I would prefer not to delegate to either Medic';
            tally += 1;
            if (s.includes('only') || forced) {
                for (const x of Object.keys(ATTRIBUTE_MAP)) {
                    if (s.includes(x)) {
                        high += ATTRIBUTE_MAP[x] === 1;
                        low += ATTRIBUTE_MAP[x] === 0;
                        chosen += 1;
                        break;
                    }
                }
            }
        }
    }
    return { 'val': val, 'tally': tally, 'high': high, 'low': low, 'delegated': chosen };
}

function getAdDelRate(res, forced = false) {
    // gets the delegation rate for adept scenarios (1=delegated, 0=no delegation) for a participant
    const q = forced ? 'Forced Choice' : 'Given the information provided';
    const adSet1 = safeGet(res, ['results', 'Medic-AD1 vs Medic-AD2', 'questions', 'Medic-AD1 vs Medic-AD2: ' + q, 'response']);
    const adSet2 = safeGet(res, ['results', 'Medic-AD3 vs Medic-AD4', 'questions', 'Medic-AD3 vs Medic-AD4: ' + q, 'response']);
    const adSet3 = safeGet(res, ['results', 'Medic-AD5 vs Medic-AD6', 'questions', 'Medic-AD5 vs Medic-AD6: ' + q, 'response']);
    const adSet4 = safeGet(res, ['results', 'Medic-AD7 vs Medic-AD8', 'questions', 'Medic-AD7 vs Medic-AD8: ' + q, 'response']);
    const adSets = [adSet1, adSet2, adSet3, adSet4];
    return getAnyDelRate(adSets, forced);
}

function getStDelRate(res, forced = false) {
    // gets the delegation rate for soartech scenarios (1=delegated, 0=no delegation) for a participant
    const q = forced ? 'Forced Choice' : 'Given the information provided';
    const stSet1 = safeGet(res, ['results', 'Medic-ST1 vs Medic-ST2', 'questions', 'Medic-ST1 vs Medic-ST2: ' + q, 'response']);
    const stSet2 = safeGet(res, ['results', 'Medic-ST3 vs Medic-ST4', 'questions', 'Medic-ST3 vs Medic-ST4: ' + q, 'response']);
    const stSet3 = safeGet(res, ['results', 'Medic-ST5 vs Medic-ST6', 'questions', 'Medic-ST5 vs Medic-ST6: ' + q, 'response']);
    const stSet4 = safeGet(res, ['results', 'Medic-ST7 vs Medic-ST8', 'questions', 'Medic-ST7 vs Medic-ST8: ' + q, 'response']);
    const stSets = [stSet1, stSet2, stSet3, stSet4];
    return getAnyDelRate(stSets, forced);
}

function getOverallDelRate(res) {
    // gets the overall delegation rate (1=delegated, 0=no delegation) for a participant
    let val = 0;
    let tally = 0;
    if (!POST_MRE_EVALS.includes(res.results.evalNumber)) {
        const st = getStDelRate(res);
        const ad = getAdDelRate(res);
        val = st['val'] + ad['val'];
        tally = st['tally'] + ad['tally'];
    }
    else {
        // 1 for choosing aligned, 0 for not choosing aligned
        for (const pageName of Object.keys(res.results)) {
            if (pageName.includes(' vs ')) {
                for (const q of Object.keys(res.results[pageName].questions)) {
                    // ignore parallax runs where it's only misaligned vs baseline
                    if (q.includes("Forced Choice") && res.results[pageName]['admAlignment'].includes(' aligned')) {
                        tally += 1;
                        const response = res.results[pageName].questions[q].response;
                        const aligned = q.split(' vs ')[0]; // aligned is always listed first in forced choice questions
                        val += response == aligned ? 1 : 0;
                    }
                }
            }
        }
    }
    return tally > 0 ? val / tally : null;
}

function getOverallTrust(res) {
    // gets the overall trust level of a participant
    let val = 0;
    let tally = 0;
    if (!POST_MRE_EVALS.includes(res.results.evalNumber)) {
        const adMedics = ['Medic-AD1', 'Medic-AD2', 'Medic-AD3', 'Medic-AD4', 'Medic-AD5', 'Medic-AD6', 'Medic-AD7', 'Medic-AD8'];
        const stMedics = ['Medic-ST1', 'Medic-ST2', 'Medic-ST3', 'Medic-ST4', 'Medic-ST5', 'Medic-ST6', 'Medic-ST7', 'Medic-ST8'];

        for (let medic of [...adMedics, ...stMedics]) {
            const comfort = safeGet(res, ['results', medic, 'questions', medic + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it', 'response']);
            if (isDefined(comfort)) {
                val += RESPONSIBILITY_MAP[comfort];
                tally += 1;
            }
        }
    }
    else {
        for (const page of Object.keys(res.results)) {
            if (!page.includes('Medic') || page.includes(' vs ')) {
                continue;
            }
            else {
                const comfort = safeGet(res, ['results', page, 'questions', page + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it', 'response']);
                if (isDefined(comfort)) {
                    val += RESPONSIBILITY_MAP[comfort];
                    tally += 1;
                }
            }
        }
    }
    return tally > 0 ? val / tally : null;
}

function getAttributeAlignment(res, att, medics, q, trans) {
    // takes in a single result from the results of the query, the attribute to
    // match/mismatch, the medic prefix to search for, the question
    // we're looking for, and the translation we want to put the answer through
    let align = 0;
    let alignTally = 0;
    let misalign = 0;
    let misalignTally = 0;
    for (let x of medics) {
        // some adept scenarios in the config are missing the question and are only labelled by name
        let data = safeGet(res, ['results', x, 'questions', x + ': ' + q, 'response'], q === 'The way this medic makes medical decisions is how I make decisions' ? ['results', x, 'questions', x, 'response'] : undefined)
        if (!data) {
            data = safeGet(res, ['results', 'Omnibus: ' + x, 'questions', x + ': ' + q, 'response']);
        }
        if (data) {
            const trustVal = trans[data];
            if (ATTRIBUTE_MAP[x] === att) {
                align += trustVal;
                alignTally += 1;
            } else {
                misalign += trustVal;
                misalignTally += 1;
            }
        }

    }
    return { 'align': alignTally > 0 ? align / alignTally : null, 'misalign': misalignTally > 0 ? misalign / misalignTally : null };
}

function populateHumanDataRow(rowObject, version) {
    let adept = 0;
    let soartech = 1;
    if (rowObject[0]._id.indexOf("_st_") > -1) {
        adept = 1;
        soartech = 0;
    }
    let returnObj = {};
    if (version == 3) {
        returnObj = {
            "Participant": rowObject[0].pid,
            "SimEnv": rowObject[0].env,
            "SimOrder": rowObject[0].simOrder,
            "AD_P1": rowObject[adept].data.data.length > 0 ? rowObject[adept].data.data[0].probe.kdma_association["MoralDesert"] : "",
            "AD_P2": rowObject[adept].data.data.length > 1 ? rowObject[adept].data.data[1].probe.kdma_association["MoralDesert"] : "",
            "AD_P3": rowObject[adept].data.data.length > 2 ? rowObject[adept].data.data[2].probe.kdma_association["MoralDesert"] : "",
            "ST_1.1": "",
            "ST_1.2": "",
            "ST_1.3": "",
            "ST_2.2": "",
            "ST_2.3": "",
            "ST_3.1": "",
            "ST_3.2": "",
            "ST_4.1": "",
            "ST_4.2": "",
            "ST_4.3": "",
            "ST_5.1": "",
            "ST_5.2": "",
            "ST_5.3": "",
            "ST_6.1": "",
            "ST_6.2": "",
            "ST_8.1": "",
            "ST_8.2": "",
            "AD_KDMA_Env": rowObject[adept]?.data?.alignment?.kdma_values?.length > 0 ? Math.round(rowObject[adept].data.alignment.kdma_values[0].value * 100) / 100 : "",
            "ST_KDMA_Env": rowObject[soartech]?.data?.alignment?.kdma_values?.length > 0 ? Math.round(rowObject[soartech].data.alignment.kdma_values[0].value * 100) / 100 : "",
            "AD_KDMA": isNaN(Math.round(rowObject[adept].avgKDMA * 100) / 100) ? "" : Math.round(rowObject[adept].avgKDMA * 100) / 100,
            "ST_KDMA": isNaN(Math.round(rowObject[soartech].avgKDMA * 100) / 100) ? "" : Math.round(rowObject[soartech].avgKDMA * 100) / 100
        };

        const soartechProbeIds = ["1.1", "1.2", "1.3", "2.2", "2.3", "3.1", "3.2", "4.1", "4.2", "4.3", "5.1", "5.2", "5.3", "6.1", "6.2", "8.1", "8.2"]

        for (let i = 0; i < rowObject[soartech].data.data.length; i++) {
            for (let j = 0; j < soartechProbeIds.length; j++) {
                if (rowObject[soartech].data.data[i].found_match !== false) {
                    if (rowObject[soartech].data.data[i].probe_id.indexOf(soartechProbeIds[j]) > -1) {
                        returnObj["ST_" + soartechProbeIds[j]] = rowObject[soartech].data.data[i].probe.kdma_association["maximization"];
                    }
                }
            }
        }
    }
    else if (POST_MRE_EVALS.includes(version)) {
        returnObj = {
            "Participant": rowObject[0].pid
        };
        const adept_mapping = { 'MJ2': 1, 'MJ4': 2, 'MJ5': 3 };
        if (rowObject[0].scenario_id.includes('ol')) {
            returnObj['ST_Scenario'] = version == 4 ? rowObject[0].scenario_id.split('ol-dre-')[1].split('-')[0] : Number(rowObject[0].scenario_id.split('ol-ph1-eval-')[1].split('-')[0]) - 1;
            returnObj[rowObject[0].scenario_id.split('ol')[0] == 'q' ? 'QOL_Session_Id' : 'VOL_Session_Id'] = rowObject[0]?.data?.alignment?.['sid'] ?? '-';
        }
        else {
            returnObj['ADEPT_Scenario'] = adept_mapping[rowObject[0].scenario_id.split('-')[1].split('-')[0]];
            returnObj['ADEPT_Session_Id'] = rowObject[0].data?.alignment?.['sid']?.replaceAll('"', '') ?? '-';
        }

        const mj2ProbeIds = ["Probe 2", "Probe 2A-1", "Probe 2B-1", "Probe 3-B.2", "Probe 4", "Probe 4-B.1", "Probe 4-B.1-B.1", "Probe 5", "Probe 5-A.1", "Probe 5-B.1", "Probe 6", "Probe 7", "Probe 8", "Probe 9", "Probe 9-A.1", "Probe 9-B.1", "Probe 10"];
        const mj4ProbeIds = ["Probe 1", "Probe 2 kicker", "Probe 2 passerby", "Probe 2-A.1", "Probe 2-D.1", "Probe 2-D.1-B.1", "Probe 3", "Probe 3-A.1", "Probe 3-B.1", "Probe 6", "Probe 7", "Probe 8", "Probe 9", "Probe 10", "Probe 10-A.1", "Probe 10-A.1-B.1", "Probe 10-B.1", "Probe 10-C.1"];
        const mj5ProbeIds = ["Probe 1", "Probe 1-A.1", "Probe 1-B.1", "Probe 2", "Probe 2-A.1", "Probe 2-A.1-A.1", "Probe 2-A.1-B.1", "Probe 2-A.1-B.1-A.1", "Probe 2-B.1", "Probe 2-B.1-A.1", "Probe 2-B.1-B.1", "Probe 2-B.1-B.1-A.1", "Probe 3", "Probe 4", "Probe 4.5", "Probe 7", "Probe 8", "Probe 8-A.1", "Probe 8-A.1-A.1", "Probe 9", "Probe 9-A.1", "Probe 9-B.1", "Probe 9-C.1"];

        const qol1ProbeIds = version == 4 ? ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "qol-dre-train2-Probe-11", "12"] : ['qol-ph1-eval-2-Probe-1', 'qol-ph1-eval-2-Probe-2', 'qol-ph1-eval-2-Probe-3', 'qol-ph1-eval-2-Probe-4', 'qol-ph1-eval-2-Probe-5', 'qol-ph1-eval-2-Probe-6'];
        const qolProbeIds = version == 4 ? ["qol-dre-?-eval-Probe-1", "qol-dre-?-eval-Probe-2", "qol-dre-?-eval-Probe-3", "qol-dre-?-eval-Probe-4", "qol-dre-?-eval-Probe-5", "qol-dre-?-eval-Probe-6", "qol-dre-?-eval-Probe-7", "qol-dre-?-eval-Probe-8", "qol-dre-?-eval-Probe-9", "qol-dre-?-eval-Probe-10", "qol-dre-?-eval-Probe-11", "qol-dre-?-eval-Probe-12"] : ['qol-ph1-eval-?-Probe-1', 'qol-ph1-eval-?-Probe-2', 'qol-ph1-eval-?-Probe-3', 'qol-ph1-eval-?-Probe-4', 'qol-ph1-eval-?-Probe-5', 'qol-ph1-eval-?-Probe-6'];
        const volProbeIds = version == 4 ? ["vol-dre-?-eval-Probe-1", "vol-dre-?-eval-Probe-2", "vol-dre-?-eval-Probe-3", "vol-dre-?-eval-Probe-4", "vol-dre-?-eval-Probe-5", "vol-dre-?-eval-Probe-6", "vol-dre-?-eval-Probe-7", "vol-dre-?-eval-Probe-8", "vol-dre-?-eval-Probe-9", "vol-dre-?-eval-Probe-10", "vol-dre-?-eval-Probe-11", "vol-dre-?-eval-Probe-12"] : ['vol-ph1-eval-?-Probe-1', 'vol-ph1-eval-?-Probe-2', 'vol-ph1-eval-?-Probe-3', 'vol-ph1-eval-?-Probe-4', 'vol-ph1-eval-?-Probe-5', 'vol-ph1-eval-?-Probe-6'];
        const vol1ProbeIds = version == 4 ? ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "vol-dre-train2-Probe-11", "vol-dre-train2-Probe-12"] : ['vol-ph1-eval-2-Probe-1', 'vol-ph1-eval-2-Probe-2', 'vol-ph1-eval-2-Probe-3', 'vol-ph1-eval-2-Probe-4', 'vol-ph1-eval-2-Probe-5', 'vol-ph1-eval-2-Probe-6'];

        for (let i = 0; i < rowObject[0].data.data.length; i++) {
            if (rowObject[0]['scenario_id'].includes('qol') || rowObject[0]['scenario_id'].includes('vol')) {
                for (let j = 0; j < qolProbeIds.length; j++) {
                    if (rowObject[0].data.data[i].found_match !== false) {
                        if (rowObject[0]['scenario_id'].includes('qol') && rowObject[0].data.data[i].probe_id.indexOf(qol1ProbeIds[j]) > -1) {
                            returnObj["QOL_" + (j + 1)] = rowObject[0].data.data[i].probe.kdma_association?.["QualityOfLife"] ?? '-';
                        }
                        else if (rowObject[0]['scenario_id'].includes('qol') && (rowObject[0].data.data[i].probe_id.indexOf(qolProbeIds[j].replace('?', 2)) > -1 || rowObject[0].data.data[i].probe_id.indexOf(qolProbeIds[j].replace('?', 3)) > -1 || rowObject[0].data.data[i].probe_id.indexOf(qolProbeIds[j].replace('?', 4)) > -1)) {
                            returnObj["QOL_" + (j + 1)] = rowObject[0].data.data[i].probe.kdma_association?.["QualityOfLife"] ?? '-';
                        }
                        else if (rowObject[0]['scenario_id'].includes('vol') && rowObject[0].data.data[i].probe_id.indexOf(vol1ProbeIds[j]) > -1) {
                            returnObj["VOL_" + (j + 1)] = rowObject[0].data.data[i].probe.kdma_association?.["PerceivedQuantityOfLivesSaved"] ?? '-';
                        }
                        else if (rowObject[0]['scenario_id'].includes('vol') && (rowObject[0].data.data[i].probe_id.indexOf(volProbeIds[j].replace('?', 2)) > -1 || rowObject[0].data.data[i].probe_id.indexOf(volProbeIds[j].replace('?', 3)) > -1 || rowObject[0].data.data[i].probe_id.indexOf(volProbeIds[j].replace('?', 4)) > -1)) {
                            returnObj["VOL_" + (j + 1)] = rowObject[0].data.data[i].probe.kdma_association?.["PerceivedQuantityOfLivesSaved"] ?? '-';
                        }
                    }
                }
            }
            else {
                if (rowObject[0]['scenario_id'].includes('MJ2')) {
                    for (let j = 0; j < mj2ProbeIds.length; j++) {
                        if (rowObject[0].data.data[i].found_match !== false) {
                            if (rowObject[0].data.data[i].probe_id.indexOf(mj2ProbeIds[j]) > -1) {
                                returnObj["MJ_" + mj2ProbeIds[j].split('Probe ')[1].replace(' ', '_')] = rowObject[0].data.data[i].probe.kdma_association?.["Moral judgement"] ?? '-';
                                returnObj["IO_" + mj2ProbeIds[j].split('Probe ')[1].replace(' ', '_')] = rowObject[0].data.data[i].probe.kdma_association?.["Ingroup Bias"] ?? '-';
                            }
                        }
                    }
                }
                else if (rowObject[0]['scenario_id'].includes('MJ4')) {
                    for (let j = 0; j < mj4ProbeIds.length; j++) {
                        if (rowObject[0].data.data[i].found_match !== false) {
                            if (rowObject[0].data.data[i].probe_id.indexOf(mj4ProbeIds[j]) > -1) {
                                returnObj["MJ_" + mj4ProbeIds[j].split('Probe ')[1].replace(' ', '_')] = rowObject[0].data.data[i].probe.kdma_association?.["Moral judgement"] ?? '-';
                                returnObj["IO_" + mj4ProbeIds[j].split('Probe ')[1].replace(' ', '_')] = rowObject[0].data.data[i].probe.kdma_association?.["Ingroup Bias"] ?? '-';
                            }
                        }
                    }
                }
                else if (rowObject[0]['scenario_id'].includes('MJ5')) {
                    for (let j = 0; j < mj5ProbeIds.length; j++) {
                        if (rowObject[0].data.data[i].found_match !== false) {
                            if (rowObject[0].data.data[i].probe_id.indexOf(mj5ProbeIds[j]) > -1) {
                                returnObj["MJ_" + mj5ProbeIds[j].split('Probe ')[1].replace(' ', '_')] = rowObject[0].data.data[i].probe.kdma_association?.["Moral judgement"] ?? '-';
                                returnObj["IO_" + mj5ProbeIds[j].split('Probe ')[1].replace(' ', '_')] = rowObject[0].data.data[i].probe.kdma_association?.["Ingroup Bias"] ?? '-';
                            }
                        }
                    }
                }
            }
        }
    }

    return returnObj;
}

function getGroupKey(row, selectedEval) {
    if (selectedEval === 3) {
        return row.SimEnv;
    } else if (POST_MRE_EVALS.includes(selectedEval)) {
        const adeptName = adept_dre_names[row.ADEPT_Scenario] || row.ADEPT_Scenario;
        const stName = st_dre_names[row.ST_Scenario] || row.ST_Scenario;
        return `${adeptName}_${stName}`;
    }
}

function formatCellData(data) {
    if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data);
    }
    return data;
}

function sortedObjectKeys(objectKeys, selectedEval) {
    // sorting tables for humanProbeData, compare adept, if same, then compare st
    if (POST_MRE_EVALS.includes(selectedEval)) {
        return objectKeys.sort((a, b) => {
            const [aAdept, aSoarTech] = a.split('_');
            const [bAdept, bSoarTech] = b.split('_');

            const adeptComparison = aAdept.localeCompare(bAdept);

            if (adeptComparison === 0) {
                return aSoarTech.localeCompare(bSoarTech);
            }

            return adeptComparison;
        });
    }
    return objectKeys;
};

function populateDataSet(data) {
    let simAlign = null;
    if (data.getAllSimAlignmentByEval) {
        const version = data.getAllSimAlignmentByEval[0]?.evalNumber;
        const simData = data.getAllSimAlignmentByEval.filter((x) => !x.openWorld);
        simAlign = getSimAlignment(simData);
        let tempGroupHumanSimData = version == 3 ? Object.groupBy(simData, ({ env }) => env) : Object.groupBy(simData, ({ pid }) => pid);
        Object.keys(tempGroupHumanSimData).forEach(key => {
            if (version == 3) {
                tempGroupHumanSimData[key] = Object.groupBy(tempGroupHumanSimData[key], ({ pid }) => pid);
                let tempGroupPidArray = [];
                Object.keys(tempGroupHumanSimData[key]).forEach(keyPid => {
                    if (keyPid.indexOf(" ") === -1) {
                        tempGroupPidArray.push(populateHumanDataRow(tempGroupHumanSimData[key][keyPid], simData[0].evalNumber));
                    }
                });
                tempGroupHumanSimData[key] = tempGroupPidArray;
            }
            else {
                tempGroupHumanSimData[key] = tempGroupHumanSimData[key].map((x) => populateHumanDataRow([x], version));
                let combinedObj = {};
                for (const x of tempGroupHumanSimData[key]) {
                    combinedObj = { ...combinedObj, ...x };
                }
                tempGroupHumanSimData[key] = [combinedObj];
            }
        });
        // for version 4, we will only separate by ADEPT, since they have different probes and we want to combine ST and Adept into one row per participant
        if (POST_MRE_EVALS.includes(version)) {
            tempGroupHumanSimData = Object.values(tempGroupHumanSimData).flat();
            const adept_mapping = { 1: ["DryRunEval-MJ2-eval"], 2: ["DryRunEval-MJ4-eval"], 3: ["DryRunEval-MJ5-eval"] }
            tempGroupHumanSimData = Object.groupBy(tempGroupHumanSimData, ({ ADEPT_Scenario }) => adept_mapping[ADEPT_Scenario]);
        }

        AGGREGATED_DATA["groupedSim"] = tempGroupHumanSimData;
    }
    const txtAlign = getTextKDMA(data);
    const txtScores = getTextAlignment(data);
    const allResults = [];
    for (const res of data.getAllSurveyResultsByEval) {
        // if survey instructions does not exist, we don't want the entry
        if ([2, 4, 5, 6].includes(res.results?.surveyVersion) && Object.keys(res.results).includes('Survey Introduction')) {
            // use this result!
            const tmpSet = {};

            // get participant id. two different versions exist: one with Participant ID and the other with Participant ID Page
            let pid = safeGet(res, ['results', 'Participant ID', 'questions', 'Participant ID', 'response'], ['results', 'Participant ID Page', 'questions', 'Participant ID', 'response']);
            if (!pid) {
                pid = safeGet(res, ['results', 'pid'])
            }
            if (!pid || pid === '42' || pid === '019') {
                // ignore some pids
                continue;
            }
            if (POST_MRE_EVALS.includes(res.results.evalNumber)) {
                const valid_id = data?.getParticipantLog?.filter((x) => x?.ParticipantID?.toString() == pid && x['Type'] != 'Test');
                if (valid_id.length == 0) {
                    // only include valid ids for survey version 4 & 5
                    continue;
                }
            }
            // fix typo
            if (pid === '20234204') {
                pid = '2024204';
            }
            tmpSet['ParticipantID'] = pid.trim();

            // get date. see if start time exists. If not, use end time
            tmpSet['Date'] = new Date(safeGet(res, ['results', 'startTime'], ['results', 'timeComplete'])).toLocaleDateString();

            // get med role. if more than one, choose other. Ignore military experience (also becomes "other"=6)
            const medRoles = safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'What is your current role (choose all that apply):', 'response']);
            if (!medRoles) {
                tmpSet['MedRole'] = null;
            }
            else if (medRoles.length > 1) {
                tmpSet['MedRole'] = 6;
            } else {
                tmpSet['MedRole'] = MED_ROLE_MAP[medRoles[0]] ? MED_ROLE_MAP[medRoles[0]] : 6;
            }

            // get seasoned first responder. use not sure as default
            const medExp = safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'I consider myself a seasoned first responder', 'response']);
            tmpSet['MedExp'] = isDefined(medExp) ? isDefined(MED_EXP_MAP[medExp]) ? MED_EXP_MAP[medExp] : 1 : null;

            // get military experience. If any is provided, 1. else 0 // TODO: should we be using military medical training or branch and status?? OR military background from "what is your current role"
            const milExp = safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'Military Medical Training', 'response']);
            tmpSet['MilitaryExp'] = milExp ? 1 : 0;

            // get years military experience.
            tmpSet['YrsMilExp'] = safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'Years experience in military medical role', 'response']);

            // get trust measures; average
            const trust1 = TRUST_MAP[safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'I feel that people are generally reliable', 'response'])] ?? 0;
            const trust2 = TRUST_MAP[safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'I usually trust people until they give me a reason not to trust them', 'response'])] ?? 0;
            const trust3 = TRUST_MAP[safeGet(res, ['results', 'Post-Scenario Measures', 'questions', 'Trusting another person is not difficult for me', 'response'])] ?? 0;
            tmpSet['PropTrust'] = (trust1 + trust2 + trust3) / 3;
            AGGREGATED_DATA['PropTrust']['total'] += tmpSet['PropTrust'];
            AGGREGATED_DATA['PropTrust']['count'] += 1;


            // get overall delegation. not delegate = 0, delegate at all = 1; average
            tmpSet['Delegation'] = getOverallDelRate(res);
            AGGREGATED_DATA['Delegation']['total'] += tmpSet['Delegation'];
            AGGREGATED_DATA['Delegation']['count'] += 1;

            // get overall trust for medics; average
            tmpSet['Trust'] = getOverallTrust(res);
            AGGREGATED_DATA['Trust']['total'] += tmpSet['Trust'];
            AGGREGATED_DATA['Trust']['count'] += 1;

            // get post vr state. 
            tmpSet['PostVRstate'] = COMFORT_MAP[safeGet(res, ['results', 'Participant ID Page', 'questions', 'VR Comfort Level', 'response'], ['results', 'VR Page', 'questions', 'VR Comfort Level', 'response'])] ?? '-';
            allResults.push(tmpSet);
            const textOrder = TEXT_BASED_MAP[safeGet(res, ['results', 'Participant ID Page', 'questions', 'Have you completed the text-based scenarios', 'response'], ['results', 'Participant ID', 'questions', 'Have you completed the text-based scenarios', 'response'])];


            if (POST_MRE_EVALS.includes(res.results.evalNumber)) {
                tmpSet['AD_Scenario_Sim'] = SIM_MAP[SIM_ORDER[pid]?.find((x) => x.includes('adept'))] ?? '-';
                tmpSet['QOL_Scenario_Sim'] = SIM_MAP[SIM_ORDER[pid]?.find((x) => x.includes('qol'))] ?? '-';
                tmpSet['VOL_Scenario_Sim'] = SIM_MAP[SIM_ORDER[pid]?.find((x) => x.includes('vol'))] ?? '-';

                const text_scenarios = data.getAllScenarioResultsByEval.filter((x) => x.participantID == pid);
                tmpSet['AD_Scenario_Text'] = TEXT_BASED_MAP[text_scenarios.find((x) => x?.scenario_id?.includes('DryRunEval-MJ') || x?.scenario_id?.includes('phase1-adept-eval-MJ'))?.scenario_id] ?? '-';
                tmpSet['QOL_Scenario_Text'] = TEXT_BASED_MAP[text_scenarios.find((x) => x?.scenario_id?.includes('qol'))?.scenario_id] ?? '-';
                tmpSet['VOL_Scenario_Text'] = TEXT_BASED_MAP[text_scenarios.find((x) => x?.scenario_id?.includes('qol'))?.scenario_id] ?? '-';

                const adept_sim_kdmas = data.getAllSimAlignmentByEval.find((x) => x?._id?.split('_')[0] == pid && x?.scenario_id?.includes('DryRun'))?.data?.alignment?.kdmas;
                tmpSet['MJ_KDMA_Sim'] = adept_sim_kdmas?.find((x) => x.kdma == 'Moral judgement')?.value;
                tmpSet['IO_KDMA_Sim'] = adept_sim_kdmas?.find((x) => x.kdma == 'Ingroup Bias')?.value;

                const qol_sim_sid = data.getAllSimAlignmentByEval.find((x) => x?._id?.split('_')[0] == pid && x?.scenario_id?.includes('qol'))?.data?.alignment?.sid;
                const qol_sim_kdma = data.getAllSimAlignmentByEval.find((x) => x?._id?.split('_')[0] == pid && x?.scenario_id?.includes('qol'))?.data?.alignment?.kdmas?.computed_kdma_profile?.find((x) => x.kdma == 'QualityOfLife');
                tmpSet['QOL_KDMA_Sim'] = qol_sim_kdma?.value;
                tmpSet['QOL_KDE_Sim'] = ['202409112'].includes(pid) ? '-' : (qol_sim_kdma ? 'link:' + (res.results.evalNumber == 4 ? process.env.REACT_APP_SOARTECH_DRE_URL : process.env.REACT_APP_SOARTECH_URL) + `/api/v1/kdma_profile_graph?session_id=${qol_sim_sid}&kde_type=rawscores` : '-');

                const vol_sim_sid = data.getAllSimAlignmentByEval.find((x) => x?._id?.split('_')[0] == pid && x?.scenario_id?.includes('vol'))?.data?.alignment?.sid;
                const vol_sim_kdma = data.getAllSimAlignmentByEval.find((x) => x?._id?.split('_')[0] == pid && x?.scenario_id?.includes('vol'))?.data?.alignment?.kdmas?.computed_kdma_profile?.find((x) => x.kdma == 'PerceivedQuantityOfLivesSaved');
                tmpSet['VOL_KDMA_Sim'] = vol_sim_kdma?.value;
                tmpSet['VOL_KDE_Sim'] = ['202409111', '202409112'].includes(pid) ? '-' : (vol_sim_kdma ? 'link:' + (res.results.evalNumber == 4 ? process.env.REACT_APP_SOARTECH_DRE_URL : process.env.REACT_APP_SOARTECH_URL) + `/api/v1/kdma_profile_graph?session_id=${vol_sim_sid}&kde_type=rawscores` : '-');

                const adept_text_kdmas = text_scenarios.find((x) => x?.scenario_id?.includes('DryRun') || x?.scenario_id?.includes('adept'))?.kdmas;
                if (Array.isArray(adept_text_kdmas)) {
                    tmpSet['MJ_KDMA_Text'] = adept_text_kdmas?.find((x) => x.kdma == 'Moral judgement')?.value;
                    tmpSet['IO_KDMA_Text'] = adept_text_kdmas?.find((x) => x.kdma == 'Ingroup Bias')?.value;
                }

                // add new individual kdmas for adept
                tmpSet['MJ_KDMA_Text_Narr'] = getKDMAValue(data, pid, "Moral judgement", true);
                tmpSet['MJ_KDMA_Text_NonNarr'] = getKDMAValue(data, pid, "Moral judgement", false);
                tmpSet['IO_KDMA_Text_Narr'] = getKDMAValue(data, pid, "Ingroup Bias", true);
                tmpSet['IO_KDMA_Text_NonNarr'] = getKDMAValue(data, pid, "Ingroup Bias", false);

                const qol_text_sid = text_scenarios.find((x) => x?.scenario_id?.includes('qol'))?.serverSessionId;
                const qol_text_kdma = text_scenarios?.find((x) => x?.scenario_id?.includes('qol'))?.kdmas?.computed_kdma_profile?.find((x) => x.kdma == 'QualityOfLife');
                tmpSet['QOL_KDMA_Text'] = qol_text_kdma?.value;
                tmpSet['QOL_KDE_Text'] = qol_text_kdma ? 'link:' + (res.results.evalNumber == 4 ? process.env.REACT_APP_SOARTECH_DRE_URL : process.env.REACT_APP_SOARTECH_URL) + `/api/v1/kdma_profile_graph?session_id=${qol_text_sid}&kde_type=rawscores` : '-';

                const vol_text_sid = text_scenarios.find((x) => x?.scenario_id?.includes('vol'))?.serverSessionId;
                const vol_text_kdma = text_scenarios?.find((x) => x?.scenario_id?.includes('vol'))?.kdmas?.computed_kdma_profile?.find((x) => x.kdma == 'PerceivedQuantityOfLivesSaved');
                tmpSet['VOL_KDMA_Text'] = vol_text_kdma?.value;
                tmpSet['VOL_KDE_Text'] = vol_text_kdma ? 'link:' + (res.results.evalNumber == 4 ? process.env.REACT_APP_SOARTECH_DRE_URL : process.env.REACT_APP_SOARTECH_URL) + `/api/v1/kdma_profile_graph?session_id=${vol_text_sid}&kde_type=rawscores` : '-';
            }


            if (!POST_MRE_EVALS.includes(res.results.evalNumber)) {
                // get order of text based
                tmpSet['TextOrder'] = textOrder;

                // get sim session order from sim files (date-time-based)
                tmpSet['Sim1'] = SIM_ORDER[pid] ? SIM_MAP[SIM_ORDER[pid][0]] : null;
                tmpSet['Sim2'] = SIM_ORDER[pid] ? SIM_MAP[SIM_ORDER[pid][1]] ?? null : null;

                // verify sim order according to document
                const sims = [tmpSet['Sim1'], tmpSet['Sim2']]
                tmpSet['SimOrder'] = sims.includes(1) ? Number(sims.includes(2)) : sims.includes(3) ? Number(sims.includes(4)) : 0;

                // make sure sim and text were different
                // cannot have textOrder 1,2 with sim 1,2, cannot have textOrder 3,4 with sim 3,4
                tmpSet['TextSimDiff'] = Number(!sims.includes(textOrder));


                // get alignment for text responses from ta1 server (ST)
                // for now, hard code st to maximization
                tmpSet['ST_KDMA_Text'] = txtAlign[pid] ? txtAlign[pid]['maximization'] ? txtAlign[pid]['maximization'] : null : null;

                // get alignment for sim from ta1 server (ST). Hardcode maximization for now
                tmpSet['ST_KDMA_Sim'] = simAlign ? simAlign[pid] ? simAlign[pid]['maximization'] : null : null;

                // get high/low maximization attribute (ST)
                let stAttribute = tmpSet['ST_KDMA_Text'] > TEXT_MEDIAN_ALIGNMENT_VALUES['maximization'] ? 1 : 0;
                tmpSet['ST_AttribGrp_Text'] = stAttribute;
                // get sim attribute alignment
                tmpSet['ST_AttribGrp_Sim'] = tmpSet['ST_KDMA_Sim'] > SIM_MEDIAN_ALIGNMENT_VALUES['maximization'] ? 1 : 0;

                // get alignment for text responses from ta1 server (AD)
                // for now, hard code adept to moral desert
                tmpSet['AD_KDMA_Text'] = txtAlign[pid] ? txtAlign[pid]['MoralDesert'] ? txtAlign[pid]['MoralDesert'] : null : null;

                // get alignment for sim from ta1 server (AD). for now hardcode moral desert
                tmpSet['AD_KDMA_Sim'] = simAlign ? simAlign[pid] ? simAlign[pid]['MoralDesert'] : null : null;

                // get high/low moral deserts attribute (AD)
                let adAttribute = tmpSet['AD_KDMA_Text'] > TEXT_MEDIAN_ALIGNMENT_VALUES['MoralDesert'] ? 1 : 0;
                tmpSet['AD_AttribGrp_Text'] = adAttribute;
                // get sim attribute alignment
                tmpSet['AD_AttribGrp_Sim'] = tmpSet['AD_KDMA_Sim'] > SIM_MEDIAN_ALIGNMENT_VALUES['MoralDesert'] ? 1 : 0;

                for (let i = 0; i < 2; i++) {
                    const suffix = i === 0 ? "_Text" : "_Sim";
                    adAttribute = i === 0 ? tmpSet['AD_AttribGrp_Text'] : tmpSet['AD_AttribGrp_Sim'];
                    stAttribute = i === 0 ? tmpSet['ST_AttribGrp_Text'] : tmpSet['ST_AttribGrp_Sim'];

                    // get delegation rate for ST. not delegate = 0, delegate at all = 1; average
                    const stDel = getStDelRate(res);
                    tmpSet['ST_Del' + suffix] = stDel['tally'] > 0 ? stDel['val'] / stDel['tally'] : null;

                    // get confidence in forced choice ST
                    tmpSet['ST_ConfFC' + suffix] = getStConfRate(res);

                    // get omnibus delegation rate for ST
                    const stOmni = safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Given the information provided', 'response']);
                    tmpSet['ST_Del_Omni' + suffix] = isDefined(stOmni) ? Number(stOmni !== 'I would prefer not to delegate to either Medic') : null;

                    // get omnibus confidence rate for ST
                    tmpSet['ST_ConfFC_Omni' + suffix] = CONFIDENCE_MAP[safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Rate your confidence about the delegation decision indicated in the previous question', 'response'])];

                    // get st align delC and forced - see how many chosen are high, how many are low, divide by number delegated
                    const stDelF = getStDelRate(res, true);
                    // high alignment = 1
                    if (stAttribute === 1) {
                        tmpSet['ST_Align_DelC' + suffix] = stDel['delegated'] > 0 ? stDel['high'] / stDel['delegated'] : null;
                        tmpSet['ST_Align_DelFC' + suffix] = stDelF['tally'] > 0 ? stDelF['high'] / stDelF['tally'] : null;
                    }
                    else {
                        tmpSet['ST_Align_DelC' + suffix] = stDel['delegated'] > 0 ? stDel['low'] / stDel['delegated'] : null;
                        tmpSet['ST_Align_DelFC' + suffix] = stDelF['tally'] > 0 ? stDelF['low'] / stDelF['tally'] : null;
                    }

                    // get alignment of soartech omnibus choice delegation
                    for (let x of Object.keys(ATTRIBUTE_MAP)) {
                        if (stOmni?.includes(x)) {
                            tmpSet['ST_Align_DelC_Omni' + suffix] = Number(ATTRIBUTE_MAP[x] === stAttribute);
                            break;
                        }
                    }

                    // get alignment of soartech omnibus forced choice delegation
                    const stOmniF = safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Forced Choice', 'response']);
                    for (let x of Object.keys(ATTRIBUTE_MAP)) {
                        if (stOmniF?.includes(x)) {
                            tmpSet['ST_Align_DelFC_Omni' + suffix] = Number(ATTRIBUTE_MAP[x] === stAttribute);
                            break;
                        }
                    }

                    // get st align trust and misalign trust
                    // go through soartech medics
                    // if a medic matches stAttribute, add the value of this to the score
                    const st_medics = ['Medic-ST1', 'Medic-ST2', 'Medic-ST3', 'Medic-ST4', 'Medic-ST5', 'Medic-ST6', 'Medic-ST7', 'Medic-ST8'];
                    const trustST = getAttributeAlignment(res, stAttribute, st_medics, "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_Trust' + suffix] = trustST['align'];
                    tmpSet['ST_Misalign_Trust' + suffix] = trustST['misalign'];

                    // get st align agree and misalign agree
                    const agreeST = getAttributeAlignment(res, stAttribute, st_medics, "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_Agree' + suffix] = agreeST['align'];
                    tmpSet['ST_Misalign_Agree' + suffix] = agreeST['misalign'];

                    // get st align trustworthy and misalign trustworthy
                    const trustworthyST = getAttributeAlignment(res, stAttribute, st_medics, "This medic is trustworthy", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_Trustworthy' + suffix] = trustworthyST['align'];
                    tmpSet['ST_Misalign_Trustworthy' + suffix] = trustworthyST['misalign'];

                    // get st align self report and misalign self report
                    const selfReportST = getAttributeAlignment(res, stAttribute, st_medics, "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_AlignSR' + suffix] = selfReportST['align'];
                    tmpSet['ST_Misalign_AlignSR' + suffix] = selfReportST['misalign'];

                    // get st align trust and misalign trust omni
                    const trustSTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_Trust_Omni' + suffix] = trustSTomni['align'];
                    tmpSet['ST_Misalign_Trust_Omni' + suffix] = trustSTomni['misalign'];

                    // get st align agree and misalign agree
                    const agreeSTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_Agree_Omni' + suffix] = agreeSTomni['align'];
                    tmpSet['ST_Misalign_Agree_Omni' + suffix] = agreeSTomni['misalign'];

                    // get st align trustworthy and misalign trustworthy
                    const trustworthySTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "This medic is trustworthy", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_Trustworthy_Omni' + suffix] = trustworthySTomni['align'];
                    tmpSet['ST_Misalign_Trustworthy_Omni' + suffix] = trustworthySTomni['misalign'];

                    // get st align self report and misalign self report
                    const selfReportSTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
                    tmpSet['ST_Align_AlignSR_Omni' + suffix] = selfReportSTomni['align'];
                    tmpSet['ST_Misalign_AlignSR_Omni' + suffix] = selfReportSTomni['misalign'];

                    // get delegation rate for AD. not delegate = 0, delegate at all = 1; average
                    const adDel = getAdDelRate(res);
                    tmpSet['AD_Del' + suffix] = adDel['tally'] > 0 ? adDel['val'] / adDel['tally'] : null;

                    // get confidence in forced choice AD
                    tmpSet['AD_ConfFC' + suffix] = getAdConfRate(res);

                    // get omnibus delegation rate for AD
                    const adOmni = safeGet(res, ['results', 'Omnibus: Medic-C vs Medic-D', 'questions', 'Medic-C vs Medic-D: Given the information provided', 'response']);
                    tmpSet['AD_Del_Omni' + suffix] = isDefined(adOmni) ? Number(adOmni !== 'I would prefer not to delegate to either Medic') : null;

                    // get omnibus confidence rate for AD
                    tmpSet['AD_ConfFC_Omni' + suffix] = CONFIDENCE_MAP[safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Rate your confidence about the delegation decision indicated in the previous question', 'response'])];

                    // get st align delC and forced - see how many chosen are high, how many are low, divide by number delegated
                    const adDelF = getAdDelRate(res, true);
                    // high alignment = 1
                    if (adAttribute === 1) {
                        tmpSet['AD_Align_DelC' + suffix] = adDel['delegated'] > 0 ? adDel['high'] / adDel['delegated'] : null;
                        tmpSet['AD_Align_DelFC' + suffix] = adDelF['tally'] > 0 ? adDelF['high'] / adDelF['tally'] : null;
                    }
                    else {
                        tmpSet['AD_Align_DelC' + suffix] = adDel['delegated'] > 0 ? adDel['low'] / adDel['delegated'] : null;
                        tmpSet['AD_Align_DelFC' + suffix] = adDelF['tally'] > 0 ? adDelF['low'] / adDelF['tally'] : null;
                    }
                    // get alignment of adept omnibus choice delegation
                    for (let x of Object.keys(ATTRIBUTE_MAP)) {
                        if (adOmni?.includes(x)) {
                            tmpSet['AD_Align_DelC_Omni' + suffix] = Number(ATTRIBUTE_MAP[x] === adAttribute);
                            break;
                        }
                    }
                    // get alignment of adept omnibus forced choice delegation
                    const adOmniF = safeGet(res, ['results', 'Omnibus: Medic-C vs Medic-D', 'questions', 'Medic-C vs Medic-D: Forced Choice', 'response']);
                    for (let x of Object.keys(ATTRIBUTE_MAP)) {
                        if (adOmniF?.includes(x)) {
                            tmpSet['AD_Align_DelFC_Omni' + suffix] = Number(ATTRIBUTE_MAP[x] === adAttribute);
                            break;
                        }
                    }

                    // get ad align trust and misalign trust
                    // go through soartech medics
                    // if a medic matches stAttribute, add the value of this to the score
                    const ad_medics = ['Medic-AD1', 'Medic-AD2', 'Medic-AD3', 'Medic-AD4', 'Medic-AD5', 'Medic-AD6', 'Medic-AD7', 'Medic-AD8'];
                    const trustAD = getAttributeAlignment(res, adAttribute, ad_medics, "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_Trust' + suffix] = trustAD['align'];
                    tmpSet['AD_Misalign_Trust' + suffix] = trustAD['misalign'];

                    // get ad align agree and misalign agree
                    const agreeAD = getAttributeAlignment(res, adAttribute, ad_medics, "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_Agree' + suffix] = agreeAD['align'];
                    tmpSet['AD_Misalign_Agree' + suffix] = agreeAD['misalign'];

                    // get ad align trustworthy and misalign trustworthy
                    const trustworthyAD = getAttributeAlignment(res, adAttribute, ad_medics, "This medic is trustworthy", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_Trustworthy' + suffix] = trustworthyAD['align'];
                    tmpSet['AD_Misalign_Trustworthy' + suffix] = trustworthyAD['misalign'];

                    // get ad align self report and misalign self report
                    const selfReportAD = getAttributeAlignment(res, adAttribute, ad_medics, "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_AlignSR' + suffix] = selfReportAD['align'];
                    tmpSet['AD_Misalign_AlignSR' + suffix] = selfReportAD['misalign'];

                    // get ad align trust and misalign trust omni
                    const trustADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_Trust_Omni' + suffix] = trustADomni['align'];
                    tmpSet['AD_Misalign_Trust_Omni' + suffix] = trustADomni['misalign'];

                    // get ad align agree and misalign agree
                    const agreeADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_Agree_Omni' + suffix] = agreeADomni['align'];
                    tmpSet['AD_Misalign_Agree_Omni' + suffix] = agreeADomni['misalign'];

                    // get ad align trustworthy and misalign trustworthy
                    const trustworthyADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "This medic is trustworthy", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_Trustworthy_Omni' + suffix] = trustworthyADomni['align'];
                    tmpSet['AD_Misalign_Trustworthy_Omni' + suffix] = trustworthyADomni['misalign'];

                    // get ad align self report and misalign self report
                    const selfReportADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
                    tmpSet['AD_Align_AlignSR_Omni' + suffix] = selfReportADomni['align'];
                    tmpSet['AD_Misalign_AlignSR_Omni' + suffix] = selfReportADomni['misalign'];

                    // get average of responses for high alignment adms and trust
                    tmpSet['ST_High_Trust'] = stAttribute === 1 ? trustST['align'] : trustST['misalign'];
                    tmpSet['ST_Low_Trust'] = stAttribute === 0 ? trustST['align'] : trustST['misalign'];
                    tmpSet['ST_High_Agree'] = stAttribute === 1 ? agreeST['align'] : agreeST['misalign'];
                    tmpSet['ST_Low_Agree'] = stAttribute === 0 ? agreeST['align'] : agreeST['misalign'];
                    tmpSet['ST_High_Trustworthy'] = stAttribute === 1 ? trustworthyST['align'] : trustworthyST['misalign'];
                    tmpSet['ST_Low_Trustworthy'] = stAttribute === 0 ? trustworthyST['align'] : trustworthyST['misalign'];
                    tmpSet['ST_High_AlignSR'] = stAttribute === 1 ? selfReportST['align'] : selfReportST['misalign'];
                    tmpSet['ST_Low_AlignSR'] = stAttribute === 0 ? selfReportST['align'] : selfReportST['misalign'];
                    tmpSet['ST_AlignScore_High'] = txtScores?.[pid]?.['st']?.['high'];
                    tmpSet['ST_AlignScore_Low'] = txtScores?.[pid]?.['st']?.['low'];

                    tmpSet['ST_High_Trust_Omni'] = stAttribute === 1 ? trustSTomni['align'] : trustSTomni['misalign'];
                    tmpSet['ST_Low_Trust_Omni'] = stAttribute === 0 ? trustSTomni['align'] : trustSTomni['misalign'];
                    tmpSet['ST_High_Agree_Omni'] = stAttribute === 1 ? agreeSTomni['align'] : agreeSTomni['misalign'];
                    tmpSet['ST_Low_Agree_Omni'] = stAttribute === 0 ? agreeSTomni['align'] : agreeSTomni['misalign'];
                    tmpSet['ST_High_Trustworthy_Omni'] = stAttribute === 1 ? trustworthySTomni['align'] : trustworthySTomni['misalign'];
                    tmpSet['ST_Low_Trustworthy_Omni'] = stAttribute === 0 ? trustworthySTomni['align'] : trustworthySTomni['misalign'];
                    tmpSet['ST_High_AlignSR_Omni'] = stAttribute === 1 ? selfReportSTomni['align'] : selfReportSTomni['misalign'];
                    tmpSet['ST_Low_AlignSR_Omni'] = stAttribute === 0 ? selfReportSTomni['align'] : selfReportSTomni['misalign'];

                    tmpSet['AD_High_Trust'] = adAttribute === 1 ? trustAD['align'] : trustAD['misalign'];
                    tmpSet['AD_Low_Trust'] = adAttribute === 0 ? trustAD['align'] : trustAD['misalign'];
                    tmpSet['AD_High_Agree'] = adAttribute === 1 ? agreeAD['align'] : agreeAD['misalign'];
                    tmpSet['AD_Low_Agree'] = adAttribute === 0 ? agreeAD['align'] : agreeAD['misalign'];
                    tmpSet['AD_High_Trustworthy'] = adAttribute === 1 ? trustworthyAD['align'] : trustworthyAD['misalign'];
                    tmpSet['AD_Low_Trustworthy'] = adAttribute === 0 ? trustworthyAD['align'] : trustworthyAD['misalign'];
                    tmpSet['AD_High_AlignSR'] = adAttribute === 1 ? selfReportAD['align'] : selfReportAD['misalign'];
                    tmpSet['AD_Low_AlignSR'] = adAttribute === 0 ? selfReportAD['align'] : selfReportAD['misalign'];
                    tmpSet['AD_AlignScore_High'] = txtScores?.[pid]?.['ad']?.['high'];
                    tmpSet['AD_AlignScore_Low'] = txtScores?.[pid]?.['ad']?.['low'];

                    tmpSet['AD_High_Trust_Omni'] = adAttribute === 1 ? trustADomni['align'] : trustADomni['misalign'];
                    tmpSet['AD_Low_Trust_Omni'] = adAttribute === 0 ? trustADomni['align'] : trustADomni['misalign'];
                    tmpSet['AD_High_Agree_Omni'] = adAttribute === 1 ? agreeADomni['align'] : agreeADomni['misalign'];
                    tmpSet['AD_Low_Agree_Omni'] = adAttribute === 0 ? agreeADomni['align'] : agreeADomni['misalign'];
                    tmpSet['AD_High_Trustworthy_Omni'] = adAttribute === 1 ? trustworthyADomni['align'] : trustworthyADomni['misalign'];
                    tmpSet['AD_Low_Trustworthy_Omni'] = adAttribute === 0 ? trustworthyADomni['align'] : trustworthyADomni['misalign'];
                    tmpSet['AD_High_AlignSR_Omni'] = adAttribute === 1 ? selfReportADomni['align'] : selfReportADomni['misalign'];
                    tmpSet['AD_Low_AlignSR_Omni'] = adAttribute === 0 ? selfReportADomni['align'] : selfReportADomni['misalign'];
                }
            }
        }
    }


    // get all results that don't have delegation survey
    for (let id of [...Object.keys(txtAlign), ...Object.keys(simAlign)]) {
        if (!allResults.find((x) => x['ParticipantID'].trim() === id.trim())) {
            id = id.trim();
            const tmpSet = {};
            tmpSet['ParticipantID'] = id.trim();

            const date = {
                "2024221": new Date("March 20, 2024"),
                "2024222": new Date("March 22, 2024"),
                "2024223": new Date("March 22, 2024"),
                "2024217": new Date("March 20, 2024"),
                "2024214": new Date("March 20, 2024")
            }

            tmpSet['Date'] = date[id] ? date[id].toLocaleDateString() : null;

            // get order of text based (TODO: not hardcoded?)
            const textOrder = {
                "2024221": 1,
                "2024222": 2,
                "2024223": 3,
                "2024217": 1,
                "2024214": 2
            };
            tmpSet['TextOrder'] = textOrder[id];

            // get sim session order from sim files (date-time-based)
            tmpSet['Sim1'] = SIM_ORDER[id] ? SIM_MAP[SIM_ORDER[id][0]] : null;
            tmpSet['Sim2'] = SIM_ORDER[id] ? SIM_MAP[SIM_ORDER[id][1]] ?? null : null;

            // verify sim order according to document
            const sims = [tmpSet['Sim1'], tmpSet['Sim2']]
            tmpSet['SimOrder'] = sims.includes(1) ? Number(sims.includes(2)) : sims.includes(3) ? Number(sims.includes(4)) : 0;

            // make sure sim and text were different
            // cannot have textOrder 1,2 with sim 1,2, cannot have textOrder 3,4 with sim 3,4
            tmpSet['TextSimDiff'] = Number(!sims.includes(textOrder[id]));

            // get alignment for text responses from ta1 server (ST)
            // for now, hard code st to maximization
            tmpSet['ST_KDMA_Text'] = txtAlign[id] ? txtAlign[id]['maximization'] ? txtAlign[id]['maximization'] : null : null;

            // get alignment for sim from ta1 server (ST). Hardcode maximization for now
            tmpSet['ST_KDMA_Sim'] = simAlign ? simAlign[id] ? simAlign[id]['maximization'] : null : null;

            // get high/low maximization attribute (ST)
            let stAttribute = tmpSet['ST_KDMA_Text'] > TEXT_MEDIAN_ALIGNMENT_VALUES['maximization'] ? 1 : 0;
            tmpSet['ST_AttribGrp_Text'] = stAttribute;
            // get sim attribute alignment
            tmpSet['ST_AttribGrp_Sim'] = tmpSet['ST_KDMA_Sim'] > SIM_MEDIAN_ALIGNMENT_VALUES['maximization'] ? 1 : 0;

            // get alignment for text responses from ta1 server (AD)
            // for now, hard code adept to moral desert
            tmpSet['AD_KDMA_Text'] = txtAlign[id] ? txtAlign[id]['MoralDesert'] ? txtAlign[id]['MoralDesert'] : null : null;

            // get alignment for sim from ta1 server (AD). for now hardcode moral desert
            tmpSet['AD_KDMA_Sim'] = simAlign ? simAlign[id] ? simAlign[id]['MoralDesert'] : null : null;

            // get high/low moral deserts attribute (AD)
            let adAttribute = tmpSet['AD_KDMA_Text'] > TEXT_MEDIAN_ALIGNMENT_VALUES['MoralDesert'] ? 1 : 0;
            tmpSet['AD_AttribGrp_Text'] = adAttribute;
            // get sim attribute alignment
            tmpSet['AD_AttribGrp_Sim'] = tmpSet['AD_KDMA_Sim'] > SIM_MEDIAN_ALIGNMENT_VALUES['MoralDesert'] ? 1 : 0;
            tmpSet['AD_AttribGrp_Text'] = adAttribute;

            allResults.push(tmpSet);
        }
    }

    return allResults.filter((x) => isDefined(x['Date']));
}

// grabs the INDIVIDUAL kdma for an adept scenario
function getKDMAValue(data, pid, kdmaType, isNarrative) {
    const text_scenarios = data.getAllScenarioResultsByEval;
    
    if (isNarrative) {
        const narr = ['MJ2', 'MJ4', 'MJ5'];
        const matching = text_scenarios.find(doc => 
            narr.some(n => doc.scenario_id?.includes(n)) && 
            doc.participantID === pid
        );

        if (matching?.individual_kdma) {
            const kdma = matching.individual_kdma.find(k => k.kdma === kdmaType);
            return kdma?.value ?? null;
        }
    } else {
        const prefix = kdmaType === "Moral judgement" ? "MJ" : "IO";
        const matching = text_scenarios.find(doc => 
            doc.scenario_id?.includes(`${prefix}1`) && 
            doc.participantID === pid
        );

        if (matching?.individual_kdma?.[0]) {
            return matching.individual_kdma[0].value;
        }
    }
    
    return null;
}


function getAggregatedData() {
    return AGGREGATED_DATA;
}

function getChartData(data) {
    const scattered = [];
    let i = 0;
    const stt = [];
    const sts = [];
    const adt = [];
    const ads = [];
    for (const x of data) {
        if (x['ST_Align_Trust_Text']) {
            scattered.push({ pid: Number(x['ParticipantID'].split('2024')[1]), id: i, stt: x['ST_KDMA_Text'], sts: x['ST_KDMA_Sim'], adt: x['AD_KDMA_Text'], ads: x['AD_KDMA_Sim'], st_trust: x['ST_Align_Trust_Text'], ad_trust: x['AD_Align_Trust_Text'] });
        }
        if (isDefined(x['ST_KDMA_Text'])) {
            stt.push(x['ST_KDMA_Text']);
        }
        if (isDefined(x['ST_KDMA_Sim'])) {
            sts.push(x['ST_KDMA_Sim']);
        }
        if (isDefined(x['AD_KDMA_Text'])) {
            adt.push(x['AD_KDMA_Text']);
        }
        if (isDefined(x['AD_KDMA_Sim'])) {
            ads.push(x['AD_KDMA_Sim']);
        }
        i += 1;
    }
    return { 'scatter': scattered, 'stt': stt, 'sts': sts, 'adt': adt, 'ads': ads };
}

const getAlignmentComparisonVsTrustRatings = (data) => {
    const byAttribute = {};
    const byAlignment = {};
    const attributes = ['IO', 'MJ', 'QOL', 'VOL'];
    const alignments = ['aligned', 'baseline', 'misaligned'];
    for (const att of attributes) {
        const pairs = [];
        const alignmentPairs = [];
        for (let x of data.filter((d) => d.Attribute == att)) {
            const align = x['DRE Alignment score (Delegator|Observed_ADM (target))'] ?? x['Alignment score (Delegator|Observed_ADM (target))'];
            const trust = x['Trust_Rating'];
            if (isDefined(align) && align != '-' && isDefined(trust) && trust != '-') {
                pairs.push({ x: align, y: trust });
            }
            const alignStatus = x['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'];
            if (isDefined(alignStatus) && alignStatus != '-' && isDefined(trust) && trust != '-') {
                alignmentPairs.push({ x: alignments.indexOf(alignStatus) + (Math.random() * (att == 'IO' || att == 'QOL' ? -1 : 1) / 8), y: trust, label: alignStatus });
            }
        }
        byAttribute[att] = pairs;
        byAlignment[att] = alignmentPairs;
    }
    return { byAttribute, byAlignment };
}

const getAlignmentsByAdmType = (data) => {
    const byAdmType = {};
    const admTypes = ['aligned', 'baseline', 'misaligned'];
    for (const admType of admTypes) {
        const adms = [];
        const targets = [];
        const admPoints = [];
        const targetPoints = [];
        const lessData = data.filter((d) => d['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] == admType && d['ADM Loading'] == 'normal');
        for (let x of lessData) {
            const align_adm = x['DRE Alignment score (Delegator|Observed_ADM (target))'] ?? x['Alignment score (Delegator|Observed_ADM (target))'];
            const align_target = x['Alignment score (Delegator|target)'];
            if (isDefined(align_adm) && align_adm != '-') {
                adms.push(align_adm);
                admPoints.push({ x: admTypes.indexOf(admType) + (Math.random() * (Math.random() > 0.5 ? -1 : 1) / 10), y: align_adm, label: admType });
            }
            if (isDefined(align_target) && align_target != '-') {
                targets.push(align_target);
                targetPoints.push({ x: admTypes.indexOf(admType) + (Math.random() * (Math.random() > 0.5 ? -1 : 1) / 10), y: align_target, label: admType });
            }
        }
        byAdmType[admType] = { adms, targets, admPoints, targetPoints };
    }
    return byAdmType;
}

const getAlignmentsByAdmTypeForTA12 = (data, ta1, ta2) => {
    // ta1 should be ST or Adept, ta2 should be Kitware or Parallax
    const byAdmType = {};
    const admTypes = ['aligned', 'baseline', 'misaligned'];
    for (const admType of admTypes) {
        const adms = [];
        const targets = [];
        const admPoints = [];
        const targetPoints = [];
        const lessData = data.filter((d) => d['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] == admType &&
            d['ADM Loading'] == 'normal' && d['TA1_Name'] == ta1 && (d['TA2_Name'] == ta2 || ta2 == 'Overall'));
        for (let x of lessData) {
            const align_adm = x['DRE Alignment score (Delegator|Observed_ADM (target))'] ?? x['Alignment score (Delegator|Observed_ADM (target))'];
            const align_target = x['Alignment score (Delegator|target)'];
            if (isDefined(align_adm) && align_adm != '-') {
                adms.push(align_adm);
                admPoints.push({ x: admTypes.indexOf(admType) + (Math.random() * (Math.random() > 0.5 ? -1 : 1) / 10), y: align_adm, label: admType });
            }
            if (isDefined(align_target) && align_target != '-') {
                targets.push(align_target);
                targetPoints.push({ x: admTypes.indexOf(admType) + (Math.random() * (Math.random() > 0.5 ? -1 : 1) / 10), y: align_target, label: admType });
            }
        }
        byAdmType[admType] = { adms, targets, admPoints, targetPoints };
    }
    return byAdmType;
}

const getAlignmentsByAttribute = (data) => {
    const byAttribute = {};
    const attributes = ['IO', 'MJ', 'QOL', 'VOL'];
    for (const attribute of attributes) {
        const adms = [];
        const admPoints = [];
        for (let x of data.filter((d) => d['Attribute'] == attribute)) {
            const align_adm = x['DRE Alignment score (Delegator|Observed_ADM (target))'] ?? x['Alignment score (Delegator|Observed_ADM (target))'];
            if (isDefined(align_adm) && align_adm != '-') {
                adms.push(align_adm);
                admPoints.push({ x: attributes.indexOf(attribute) + (Math.random() * (Math.random() > 0.5 ? -1 : 1) / 10), y: align_adm, label: attribute });
            }
        }
        const rescaledAdms = [];
        const rescaledAdmPoints = [];
        const range = Math.max(...adms) - Math.min(...adms);
        const min = Math.min(...adms);
        for (let x of adms) {
            const rescaled = (x - min) / range;
            rescaledAdms.push(rescaled);
            rescaledAdmPoints.push({ x: attributes.indexOf(attribute) + (Math.random() * (Math.random() > 0.5 ? -1 : 1) / 10), y: rescaled, label: attribute });
        }

        byAttribute[attribute] = { adms, admPoints, rescaledAdms, rescaledAdmPoints };
    }
    return byAttribute;
}

function getDelegationPreferences(data, evalNumber = 4) {
    const dataByPid = {};
    const dataByTeams = {
        'AD': { 'baseline': [], 'misaligned': [] },
        'ST (No QOL)': { 'baseline': [], 'misaligned': [] },
        'Kitware': { 'baseline': [], 'misaligned': [] },
        'Parallax': { 'baseline': [], 'misaligned': [] },
        'AD/Parallax': { 'baseline': [], 'misaligned': [] },
        'AD/Kitware': { 'baseline': [], 'misaligned': [] },
        'ST/Parallax': { 'baseline': [], 'misaligned': [] },
        'ST/Kitware': { 'baseline': [], 'misaligned': [] }
    };
    const dataByAttribute = {
        'IO': { 'baseline': [], 'misaligned': [] },
        'MJ': { 'baseline': [], 'misaligned': [] },
        'QOL': { 'baseline': [], 'misaligned': [] },
        'VOL': { 'baseline': [], 'misaligned': [] }
    }
    for (const entry of data.filter((x) => (evalNumber == 4 && x['ADM_Type'] === 'comparison') || ((evalNumber == 5 || evalNumber == 6) && x['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] == 'aligned' && x['ADM Loading'] == 'normal'))) {
        const pid = entry['Delegator_ID'];

        const baseline = entry['Delegation preference (A/B)'];
        const misaligned = entry['Delegation preference (A/M)'];
        if (!Object.keys(dataByPid).includes(pid)) {
            // will store 0 when baseline/misaligned is preferred, 1 otherwise
            dataByPid[pid] = { 'baseline': [], 'misaligned': [] };
        }
        if (['A', 'B', 'y', 'n'].includes(baseline)) {
            const baseVal = ['B', 'n'].includes(baseline) ? 0 : 1;
            dataByAttribute[entry['Attribute']]['baseline'].push(baseVal);
            if (evalNumber == 4 || entry['Attribute'] != 'QOL') {
                dataByPid[pid]['baseline'].push(baseVal);
                if (entry['TA1_Name'] == 'Adept') {
                    dataByTeams['AD']['baseline'].push(baseVal);
                    if (entry['TA2_Name'] == 'Kitware') {
                        dataByTeams['AD/Kitware']['baseline'].push(baseVal);
                        dataByTeams['Kitware']['baseline'].push(baseVal);
                    }
                    else {
                        dataByTeams['AD/Parallax']['baseline'].push(baseVal);
                        dataByTeams['Parallax']['baseline'].push(baseVal);
                    }
                }
                else {
                    dataByTeams['ST (No QOL)']['baseline'].push(baseVal);
                    if (entry['TA2_Name'] == 'Kitware') {
                        dataByTeams['ST/Kitware']['baseline'].push(baseVal);
                        dataByTeams['Kitware']['baseline'].push(baseVal);
                    }
                    else {
                        dataByTeams['ST/Parallax']['baseline'].push(baseVal);
                        dataByTeams['Parallax']['baseline'].push(baseVal);
                    }
                }
            }
        }
        if (['A', 'M', 'y', 'n'].includes(misaligned)) {
            const misVal = ['M', 'n'].includes(misaligned) ? 0 : 1;
            dataByAttribute[entry['Attribute']]['misaligned'].push(misVal);
            if (evalNumber == 4 || entry['Attribute'] != 'QOL') {
                dataByPid[pid]['misaligned'].push(misVal);
                if (entry['TA1_Name'] == 'Adept') {
                    dataByTeams['AD']['misaligned'].push(misVal);
                    if (entry['TA2_Name'] == 'Kitware') {
                        dataByTeams['AD/Kitware']['misaligned'].push(misVal);
                        dataByTeams['Kitware']['misaligned'].push(misVal);
                    }
                    else {
                        dataByTeams['AD/Parallax']['misaligned'].push(misVal);
                        dataByTeams['Parallax']['misaligned'].push(misVal);
                    }
                }
                else {
                    dataByTeams['ST (No QOL)']['misaligned'].push(misVal);
                    if (entry['TA2_Name'] == 'Kitware') {
                        dataByTeams['ST/Kitware']['misaligned'].push(misVal);
                        dataByTeams['Kitware']['misaligned'].push(misVal);
                    }
                    else {
                        dataByTeams['ST/Parallax']['misaligned'].push(misVal);
                        dataByTeams['Parallax']['misaligned'].push(misVal);
                    }
                }
            }
        }
    }
    const preferencePercents = { 'baseline': [], 'misaligned': [] };
    for (const pid of Object.keys(dataByPid)) {
        if (dataByPid[pid]['baseline'].length > 0)
            preferencePercents['baseline'].push(dataByPid[pid]['baseline'].reduce((s, a) => s + a, 0) / dataByPid[pid]['baseline'].length);
        if (dataByPid[pid]['misaligned'].length > 0)
            preferencePercents['misaligned'].push(dataByPid[pid]['misaligned'].reduce((s, a) => s + a, 0) / dataByPid[pid]['misaligned'].length);
    }
    if (evalNumber == 4)
        return preferencePercents;

    const allPercents = { 'combined': preferencePercents };
    for (const key of Object.keys(dataByTeams)) {
        allPercents[key] = {
            'baseline': dataByTeams[key]['baseline'].reduce((s, a) => s + a, 0) / dataByTeams[key]['baseline'].length,
            'misaligned': dataByTeams[key]['misaligned'].reduce((s, a) => s + a, 0) / dataByTeams[key]['misaligned'].length
        };
    }
    for (const key of Object.keys(dataByAttribute)) {
        allPercents[key] = {
            'baseline': dataByAttribute[key]['baseline'].reduce((s, a) => s + a, 0) / dataByAttribute[key]['baseline'].length,
            'misaligned': dataByAttribute[key]['misaligned'].reduce((s, a) => s + a, 0) / dataByAttribute[key]['misaligned'].length
        };
    }
    return allPercents;
}

function getDelegationVsAlignment(data) {
    const delegationVsAlignmentBaseline = { 'IO': [], 'MJ': [], 'QOL': [], 'VOL': [] };
    const delegationVsAlignmentMisaligned = { 'IO': [], 'MJ': [], 'QOL': [], 'VOL': [] };
    const noComparisons = data.filter((x) => x['ADM Type'] !== 'comparison');
    for (const entry of noComparisons) {
        const admType = entry['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'];
        const delAB = entry['Delegation preference (A/B)'];
        const delAM = entry['Delegation preference (A/M)'];
        const alignment = entry['DRE Alignment score (Delegator|Observed_ADM (target))'] ?? entry['Alignment score (Delegator|Observed_ADM (target))'];
        const att = entry['Attribute'];
        const aligned = noComparisons.find((x) => x['Delegator_ID'] === entry['Delegator_ID'] && x['Attribute'] == att && x['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] == 'aligned');
        if (entry['ADM Loading'] !== 'normal' || (isDefined(aligned) && aligned['ADM Loading'] !== 'normal')) {
            continue;
        }
        if (isDefined(alignment) && alignment != '-') {
            if (admType == 'aligned') {
                if (['y', 'n'].includes(delAB)) {
                    delegationVsAlignmentBaseline[att].push({ x: alignment, y: delAB == 'y' ? 0 : 1 });
                }
                if (['y', 'n'].includes(delAM)) {
                    delegationVsAlignmentMisaligned[att].push({ x: alignment, y: delAM == 'y' ? 0 : 1 });
                }
            }
            else if (admType == 'misaligned' && ['y', 'n'].includes(delAM)) {
                delegationVsAlignmentMisaligned[att].push({ x: alignment, y: delAM == 'y' ? 1 : 0 });
            }
            else if (admType == 'baseline' && ['y', 'n'].includes(delAB)) {
                delegationVsAlignmentBaseline[att].push({ x: alignment, y: delAB == 'y' ? 1 : 0 });
            }
        }

    }
    return { delegationVsAlignmentBaseline, delegationVsAlignmentMisaligned };
}

function getRatingsBySelectionStatus(data) {
    const admsOnly = data.filter((x) => ['aligned', 'misaligned', 'baseline'].includes(x['ADM_Aligned_Status (Baseline/Misaligned/Aligned)']));
    const results = { 'Selected': { 'Trust': [], 'Agree': [], 'Trustworthy': [], 'SRAlign': [] }, 'Not Selected': { 'Trust': [], 'Agree': [], 'Trustworthy': [], 'SRAlign': [] } };
    for (const entry of admsOnly) {
        const admType = entry['ADM_Aligned_Status (Baseline/Misaligned/Aligned)']
        switch (admType) {
            case 'baseline':
                switch (entry['Delegation preference (A/B)']) {
                    case 'y':
                        results['Selected']['Trust'].push(entry['Trust_Rating']);
                        results['Selected']['Agree'].push(entry['Agreement_Rating']);
                        results['Selected']['Trustworthy'].push(entry['Trustworthy_Rating']);
                        results['Selected']['SRAlign'].push(entry['SRAlign_Rating']);
                        break;
                    case 'n':
                        results['Not Selected']['Trust'].push(entry['Trust_Rating']);
                        results['Not Selected']['Agree'].push(entry['Agreement_Rating']);
                        results['Not Selected']['Trustworthy'].push(entry['Trustworthy_Rating']);
                        results['Not Selected']['SRAlign'].push(entry['SRAlign_Rating']);
                        break;
                    default:
                        break;
                }
                break;
            case 'aligned':
                const del = entry['Delegation preference (A/B)'] + entry['Delegation preference (A/M)'];
                if (del.includes('y')) {
                    results['Selected']['Trust'].push(entry['Trust_Rating']);
                    results['Selected']['Agree'].push(entry['Agreement_Rating']);
                    results['Selected']['Trustworthy'].push(entry['Trustworthy_Rating']);
                    results['Selected']['SRAlign'].push(entry['SRAlign_Rating']);
                }
                else {
                    results['Not Selected']['Trust'].push(entry['Trust_Rating']);
                    results['Not Selected']['Agree'].push(entry['Agreement_Rating']);
                    results['Not Selected']['Trustworthy'].push(entry['Trustworthy_Rating']);
                    results['Not Selected']['SRAlign'].push(entry['SRAlign_Rating']);
                }
                break;
            case 'misaligned':
                switch (entry['Delegation preference (A/M)']) {
                    case 'y':
                        results['Selected']['Trust'].push(entry['Trust_Rating']);
                        results['Selected']['Agree'].push(entry['Agreement_Rating']);
                        results['Selected']['Trustworthy'].push(entry['Trustworthy_Rating']);
                        results['Selected']['SRAlign'].push(entry['SRAlign_Rating']);
                        break;
                    case 'n':
                        results['Not Selected']['Trust'].push(entry['Trust_Rating']);
                        results['Not Selected']['Agree'].push(entry['Agreement_Rating']);
                        results['Not Selected']['Trustworthy'].push(entry['Trustworthy_Rating']);
                        results['Not Selected']['SRAlign'].push(entry['SRAlign_Rating']);
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    }
    return results;
}

export {
    populateDataSet, getAggregatedData, getChartData, isDefined, getGroupKey,
    formatCellData, sortedObjectKeys, getAlignmentComparisonVsTrustRatings,
    getAlignmentsByAdmType, getDelegationPreferences, getAlignmentsByAttribute, getDelegationVsAlignment,
    getRatingsBySelectionStatus, getAlignmentsByAdmTypeForTA12
};