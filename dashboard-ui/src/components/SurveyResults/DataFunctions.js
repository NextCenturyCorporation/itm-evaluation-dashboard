/*
 * functions that help with data aggregation
 */

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
    "Strongly disagree": -2,
    "Disagree": -1,
    "Neither agree nor disagree": 0,
    "Agree": 1,
    "Strongly agree": 2
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
    "Item 5": 0
};

const RESPONSIBILITY_MAP = {
    "Strongly disagree": 0,
    "Disagree": 1,
    "Neither agree nor disagree": 2,
    "Agree": 3,
    "Strongly agree": 4
};

const CONFIDENCE_MAP = {
    "Not confident at all": 0,
    "No confident at all": 0,
    "Not confidence at all": 0,
    "Not confident": 1,
    "Somewhat confident": 2,
    "Confident": 3,
    "Completely confident": 4
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

function getAnyDelRate(sets) {
    let val = 0;
    let tally = 0;
    let high = 0; // how many high-aligned ADMs were chosen
    let low = 0; // how many low-aligned ADMs were chosen
    for (let s of sets) {
        if (isDefined(s)) {
            val += s !== 'I would prefer not to delegate to either Medic';
            tally += 1;
            if (s.includes('only')) {
                for (const x of Object.keys(ATTRIBUTE_MAP)) {
                    if (s.includes(x)) {
                        high += ATTRIBUTE_MAP[x] == 1;
                        low += ATTRIBUTE_MAP[x] == 0;
                        break;
                    }
                }
            }
        }
    }
    return { 'val': val, 'tally': tally, 'high': high, 'low': low };
}

function getAdDelRate(res, forced = false) {
    // gets the delegation rate for adept scenarios (1=delegated, 0=no delegation) for a participant
    const q = forced ? 'Forced Choice' : 'Given the information provided';
    const adSet1 = safeGet(res, ['results', 'Medic-AD1 vs Medic-AD2', 'questions', 'Medic-AD1 vs Medic-AD2: ' + q, 'response']);
    const adSet2 = safeGet(res, ['results', 'Medic-AD3 vs Medic-AD4', 'questions', 'Medic-AD3 vs Medic-AD4: ' + q, 'response']);
    const adSet3 = safeGet(res, ['results', 'Medic-AD5 vs Medic-AD6', 'questions', 'Medic-AD5 vs Medic-AD6: ' + q, 'response']);
    const adSet4 = safeGet(res, ['results', 'Medic-AD7 vs Medic-AD8', 'questions', 'Medic-AD7 vs Medic-AD8: ' + q, 'response']);
    const adSets = [adSet1, adSet2, adSet3, adSet4];
    return getAnyDelRate(adSets);
}

function getStDelRate(res, forced = false) {
    // gets the delegation rate for soartech scenarios (1=delegated, 0=no delegation) for a participant
    const q = forced ? 'Forced Choice' : 'Given the information provided';
    const stSet1 = safeGet(res, ['results', 'Medic-ST1 vs Medic-ST2', 'questions', 'Medic-ST1 vs Medic-ST2: ' + q, 'response']);
    const stSet2 = safeGet(res, ['results', 'Medic-ST3 vs Medic-ST4', 'questions', 'Medic-ST3 vs Medic-ST4: ' + q, 'response']);
    const stSet3 = safeGet(res, ['results', 'Medic-ST5 vs Medic-ST6', 'questions', 'Medic-ST5 vs Medic-ST6: ' + q, 'response']);
    const stSet4 = safeGet(res, ['results', 'Medic-ST7 vs Medic-ST8', 'questions', 'Medic-ST7 vs Medic-ST8: ' + q, 'response']);
    const stSets = [stSet1, stSet2, stSet3, stSet4];
    return getAnyDelRate(stSets);
}

function getOverallDelRate(res) {
    // gets the overall delegation rate (1=delegated, 0=no delegation) for a participant
    const st = getStDelRate(res);
    const ad = getAdDelRate(res);
    const val = st['val'] + ad['val'];
    const tally = st['tally'] + ad['tally'];
    return tally > 0 ? val / tally : null;
}

function getOverallTrust(res) {
    // gets the overall trust level of a participant
    const adMedics = ['Medic-AD1', 'Medic-AD2', 'Medic-AD3', 'Medic-AD4', 'Medic-AD5', 'Medic-AD6', 'Medic-AD7', 'Medic-AD8'];
    const stMedics = ['Medic-ST1', 'Medic-ST2', 'Medic-ST3', 'Medic-ST4', 'Medic-ST5', 'Medic-ST6', 'Medic-ST7', 'Medic-ST8'];
    let val = 0;
    let tally = 0;
    for (let medic of [...adMedics, ...stMedics]) {
        const comfort = safeGet(res, ['results', medic, 'questions', medic + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it', 'response']);
        if (isDefined(comfort)) {
            val += RESPONSIBILITY_MAP[comfort];
            tally += 1;
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
        const data = safeGet(res, ['results', x, 'questions', x + ': ' + q, 'response'], ['results', 'Omnibus: ' + x, 'questions', x + ': ' + q, 'response']);
        if (data) {
            const trustVal = trans[data];
            if (ATTRIBUTE_MAP[x] == att) {
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


function populateDataSet(data) {
    const allResults = [];
    for (const res of data.getAllSurveyResults) {
        // console.log(res);
        if (res.results?.surveyVersion === 2) {
            console.log(res);
            // use this result!
            const tmpSet = {};

            // get participant id. two different versions exist: one with Participant ID and the other with Participant ID Page
            tmpSet['ParticipantID'] = safeGet(res, ['results', 'Participant ID', 'questions', 'Participant ID', 'response'], ['results', 'Participant ID Page', 'questions', 'Participant ID', 'response']);

            // get date. see if start time exists. If not, use end time
            tmpSet['Date'] = new Date(safeGet(res, ['results', 'startTime'], ['results', 'timeComplete'])).toLocaleDateString();

            // TODO: GET GENDER!!

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

            // get overall delegation. not delegate = 0, delegate at all = 1; average
            tmpSet['Delegation'] = getOverallDelRate(res);

            // get overall trust for medics; average
            tmpSet['Trust'] = getOverallTrust(res);

            // get post vr state. 
            tmpSet['PostVRstate'] = COMFORT_MAP[safeGet(res, ['results', 'Participant ID Page', 'questions', 'VR Comfort Level', 'response'], ['results', 'Participant ID', 'questions', 'VR Comfort Level', 'response'])] ?? 0;
            allResults.push(tmpSet);

            // get order of text based
            tmpSet['TextOrder'] = TEXT_BASED_MAP[safeGet(res, ['results', 'Participant ID Page', 'questions', 'Have you completed the text-based scenarios', 'response'], ['results', 'Participant ID', 'questions', 'Have you completed the text-based scenarios', 'response'])];

            // TODO: get sim session order from sim files (date-time-based?)
            // TODO: calculate sim order according to document
            // TODO: make sure sim and text were different
            // TODO: get alignment for text responses from ta1 server (ST)
            // TODO: get alignment for sim from ta1 server (ST)
            // TODO: get high/low maximization attribute (ST) DO NOT HARDCODE
            const stAttribute = 1;
            // TODO: get alignment for text responses from ta1 server (AD)
            // TODO: get alignment for sim from ta1 server (AD)
            // TODO: get high/low moral deserts attribute (AD) DO NOT HARDCODE
            const adAttribute = 1;

            // get delegation rate for ST. not delegate = 0, delegate at all = 1; average
            const stDel = getStDelRate(res);
            tmpSet['ST_Del'] = stDel['tally'] > 0 ? stDel['val'] / stDel['tally'] : null;

            // get confidence in forced choice ST
            tmpSet['ST_ConfFC'] = getStConfRate(res);

            // get omnibus delegation rate for ST
            const stOmni = safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Given the information provided', 'response']);
            tmpSet['ST_Del_Omni'] = isDefined(stOmni) ? Number(stOmni !== 'I would prefer not to delegate to either Medic') : null;

            // get omnibus confidence rate for ST
            tmpSet['ST_ConfFC_Omni'] = CONFIDENCE_MAP[safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Rate your confidence about the delegation decision indicated in the previous question', 'response'])];

            // get st align delC and forced - see how many chosen are high, how many are low, divide by number delegated
            const stDelF = getStDelRate(res, true);
            // high alignment = 1
            if (stAttribute == 1) {
                tmpSet['ST_Align_DelC'] = stDel['tally'] > 0 ? stDel['high'] / stDel['tally'] : null;
                tmpSet['ST_Align_DelFC'] = stDelF['tally'] > 0 ? stDelF['high'] / stDelF['tally'] : null;
            }
            else {
                tmpSet['ST_Align_DelC'] = stDel['tally'] > 0 ? stDel['low'] / stDel['tally'] : null;
                tmpSet['ST_Align_DelFC'] = stDelF['tally'] > 0 ? stDelF['low'] / stDelF['tally'] : null;
            }


            // get alignment of soartech omnibus choice delegation
            for (let x of Object.keys(ATTRIBUTE_MAP)) {
                if (stOmni?.includes(x)) {
                    tmpSet['ST_Align_DelC_Omni'] = Number(ATTRIBUTE_MAP[x] == stAttribute);
                    break;
                }
            }
            // get alignment of soartech omnibus forced choice delegation
            const stOmniF = safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Forced Choice', 'response']);
            for (let x of Object.keys(ATTRIBUTE_MAP)) {
                if (stOmniF?.includes(x)) {
                    tmpSet['ST_Align_DelFC_Omni'] = Number(ATTRIBUTE_MAP[x] == stAttribute);
                    break;
                }
            }
            // get st align trust and misalign trust
            // go through soartech medics
            // if a medic matches stAttribute, add the value of this to the score
            const st_medics = ['Medic-ST1', 'Medic-ST2', 'Medic-ST3', 'Medic-ST4', 'Medic-ST5', 'Medic-ST6', 'Medic-ST7', 'Medic-ST8'];
            const trustST = getAttributeAlignment(res, stAttribute, st_medics, "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_Trust'] = trustST['align'];
            tmpSet['ST_Misalign_Trust'] = trustST['misalign'];

            // get st align agree and misalign agree
            const agreeST = getAttributeAlignment(res, stAttribute, st_medics, "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_Agree'] = agreeST['align'];
            tmpSet['ST_Misalign_Agree'] = agreeST['misalign'];

            // get st align trustworthy and misalign trustworthy
            const trustworthyST = getAttributeAlignment(res, stAttribute, st_medics, "This medic is trustworthy", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_Trustworthy'] = trustworthyST['align'];
            tmpSet['ST_Misalign_Trustworthy'] = trustworthyST['misalign'];

            // get st align self report and misalign self report
            const selfReportST = getAttributeAlignment(res, stAttribute, st_medics, "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_AlignSR'] = selfReportST['align'];
            tmpSet['ST_Misalign_AlignSR'] = selfReportST['misalign'];

            // get st align trust and misalign trust omni
            const trustSTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_Trust_Omni'] = trustSTomni['align'];
            tmpSet['ST_Misalign_Trust_Omni'] = trustSTomni['misalign'];

            // get st align agree and misalign agree
            const agreeSTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_Agree_Omni'] = agreeSTomni['align'];
            tmpSet['ST_Misalign_Agree_Omni'] = agreeSTomni['misalign'];

            // get st align trustworthy and misalign trustworthy
            const trustworthySTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "This medic is trustworthy", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_Trustworthy_Omni'] = trustworthySTomni['align'];
            tmpSet['ST_Misalign_Trustworthy_Omni'] = trustworthySTomni['misalign'];

            // get st align self report and misalign self report
            const selfReportSTomni = getAttributeAlignment(res, stAttribute, ['Medic-A', 'Medic-B'], "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
            tmpSet['ST_Align_AlignSR_Omni'] = selfReportSTomni['align'];
            tmpSet['ST_Misalign_AlignSR_Omni'] = selfReportSTomni['misalign'];

            // get delegation rate for AD. not delegate = 0, delegate at all = 1; average
            const adDel = getAdDelRate(res);
            tmpSet['AD_Del'] = adDel['tally'] > 0 ? adDel['val'] / adDel['tally'] : null;

            // get confidence in forced choice AD
            tmpSet['AD_ConfFC'] = getAdConfRate(res);

            // get omnibus delegation rate for AD
            const adOmni = safeGet(res, ['results', 'Omnibus: Medic-C vs Medic-D', 'questions', 'Medic-C vs Medic-D: Given the information provided', 'response']);
            tmpSet['AD_Del_Omni'] = isDefined(adOmni) ? Number(adOmni !== 'I would prefer not to delegate to either Medic') : null;

            // get omnibus confidence rate for AD
            tmpSet['AD_ConfFC_Omni'] = CONFIDENCE_MAP[safeGet(res, ['results', 'Omnibus: Medic-A vs Medic-B', 'questions', 'Medic-A vs Medic-B: Rate your confidence about the delegation decision indicated in the previous question', 'response'])];

            // get st align delC and forced - see how many chosen are high, how many are low, divide by number delegated
            const adDelF = getAdDelRate(res, true);
            // high alignment = 1
            if (adAttribute == 1) {
                tmpSet['AD_Align_DelC'] = adDel['tally'] > 0 ? adDel['high'] / adDel['tally'] : null;
                tmpSet['AD_Align_DelFC'] = adDelF['tally'] > 0 ? adDelF['high'] / adDelF['tally'] : null;
            }
            else {
                tmpSet['AD_Align_DelC'] = adDel['tally'] > 0 ? adDel['low'] / adDel['tally'] : null;
                tmpSet['AD_Align_DelFC'] = adDelF['tally'] > 0 ? adDelF['low'] / adDelF['tally'] : null;
            }
            // get alignment of adept omnibus choice delegation
            for (let x of Object.keys(ATTRIBUTE_MAP)) {
                if (adOmni?.includes(x)) {
                    tmpSet['AD_Align_DelC_Omni'] = Number(ATTRIBUTE_MAP[x] == adAttribute);
                    break;
                }
            }
            // get alignment of adept omnibus forced choice delegation
            const adOmniF = safeGet(res, ['results', 'Omnibus: Medic-C vs Medic-D', 'questions', 'Medic-C vs Medic-D: Forced Choice', 'response']);
            for (let x of Object.keys(ATTRIBUTE_MAP)) {
                if (adOmniF?.includes(x)) {
                    tmpSet['AD_Align_DelFC_Omni'] = Number(ATTRIBUTE_MAP[x] == adAttribute);
                    break;
                }
            }

            // get ad align trust and misalign trust
            // go through soartech medics
            // if a medic matches stAttribute, add the value of this to the score
            const ad_medics = ['Medic-AD1', 'Medic-AD2', 'Medic-AD3', 'Medic-AD4', 'Medic-AD5', 'Medic-AD6', 'Medic-AD7', 'Medic-AD8'];
            const trustAD = getAttributeAlignment(res, adAttribute, ad_medics, "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_Trust'] = trustAD['align'];
            tmpSet['AD_Misalign_Trust'] = trustAD['misalign'];

            // get ad align agree and misalign agree
            const agreeAD = getAttributeAlignment(res, adAttribute, ad_medics, "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_Agree'] = agreeAD['align'];
            tmpSet['AD_Misalign_Agree'] = agreeAD['misalign'];

            // get ad align trustworthy and misalign trustworthy
            const trustworthyAD = getAttributeAlignment(res, adAttribute, ad_medics, "This medic is trustworthy", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_Trustworthy'] = trustworthyAD['align'];
            tmpSet['AD_Misalign_Trustworthy'] = trustworthyAD['misalign'];

            // get ad align self report and misalign self report
            const selfReportAD = getAttributeAlignment(res, adAttribute, ad_medics, "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_AlignSR'] = selfReportAD['align'];
            tmpSet['AD_Misalign_AlignSR'] = selfReportAD['misalign'];

            // get ad align trust and misalign trust omni
            const trustADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_Trust_Omni'] = trustADomni['align'];
            tmpSet['AD_Misalign_Trust_Omni'] = trustADomni['misalign'];

            // get ad align agree and misalign agree
            const agreeADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "Do you agree with the decisions that this medic made?", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_Agree_Omni'] = agreeADomni['align'];
            tmpSet['AD_Misalign_Agree_Omni'] = agreeADomni['misalign'];

            // get ad align trustworthy and misalign trustworthy
            const trustworthyADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "This medic is trustworthy", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_Trustworthy_Omni'] = trustworthyADomni['align'];
            tmpSet['AD_Misalign_Trustworthy_Omni'] = trustworthyADomni['misalign'];

            // get ad align self report and misalign self report
            const selfReportADomni = getAttributeAlignment(res, adAttribute, ['Medic-A', 'Medic-B'], "The way this medic makes medical decisions is how I make decisions", RESPONSIBILITY_MAP);
            tmpSet['AD_Align_AlignSR_Omni'] = selfReportADomni['align'];
            tmpSet['AD_Misalign_AlignSR_Omni'] = selfReportADomni['misalign'];
        }
    }
    return allResults;
}

export { safeGet, isDefined, getOverallDelRate, getOverallTrust, populateDataSet };