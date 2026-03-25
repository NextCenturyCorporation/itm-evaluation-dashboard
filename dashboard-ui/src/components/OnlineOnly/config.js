import bcrypt from 'bcryptjs';
import { shuffle } from '../Survey/surveyUtils';
export const evalNameToNumber = {
    'Phase 2 April 2026 Evaluation': 16,
    'Phase 2 February 2026 Evaluation': 15,
    'Phase 2 October 2025 Collaboration': 13,
    'Eval 12 UK Phase 1': 12,
    'Phase 2 September 2025 Collaboration': 10,
    'Phase 2 July 2025 Collaboration': 9,
    'Phase 2 June 2025 Collaboration': 8,
    'phase1': 5
}

const p1Mappings = {
    'AD-1': ['phase1-adept-eval-MJ2', 'phase1-adept-train-MJ1', 'phase1-adept-train-IO1'],
    'AD-2': ['phase1-adept-eval-MJ4', 'phase1-adept-train-MJ1', 'phase1-adept-train-IO1'],
    'AD-3': ['phase1-adept-eval-MJ5', 'phase1-adept-train-MJ1', 'phase1-adept-train-IO1'],
    'ST-1': ['qol-ph1-eval-2', 'vol-ph1-eval-2'],
    'ST-2': ['qol-ph1-eval-3', 'vol-ph1-eval-3'],
    'ST-3': ['qol-ph1-eval-4', 'vol-ph1-eval-4'],
}

export const LOG_VARIATIONS_PHASE1 = [
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 }
];

export const phase1ParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {
    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    const setNum = newPid % 24

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        'evalNum': evalNum,
        ...LOG_VARIATIONS_PHASE1[setNum]
    };
}

export const juneJulyParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {
    const scenarioSet = Math.floor(Math.random() * 3) + 1;

    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        "AF-text-scenario": scenarioSet,
        "MF-text-scenario": scenarioSet,
        "PS-text-scenario": scenarioSet,
        "SS-text-scenario": scenarioSet,
        'evalNum': evalNum
    };
};

export const septemberParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {
    const scenarioSet = Math.floor(Math.random() * 3) + 1;

    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        "AF-text-scenario": scenarioSet,
        "MF-text-scenario": scenarioSet,
        "PS-text-scenario": scenarioSet,
        "PS-AF-text-scenario": Math.floor(Math.random() * 2) + 1,
        'evalNum': evalNum
    };
}

export const ukParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {
    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        'evalNum': evalNum
    };
}

export const octoberParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {

    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        'evalNum': evalNum
    };
};

export const febParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {
    const scenarioSet = Math.floor(Math.random() * 2) + 1;
    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        'evalNum': evalNum,
        "AF-text-scenario": scenarioSet,
        "MF-text-scenario": scenarioSet,
        "PS-text-scenario": scenarioSet,
        "SS-text-scenario": scenarioSet,
    };
};

export const aprilParticipantData = (currentSearchParams, hashedEmail, newPid, type, evalNum) => {
    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    return {
        "ParticipantID": newPid,
        "Type": type,
        "prolificId": prolificId,
        "contactId": contactId,
        "claimed": true,
        "simEntryCount": 0,
        "surveyEntryCount": 0,
        "textEntryCount": 0,
        "hashedEmail": email,
        'evalNum': evalNum,
        /*
        We are using PS2 and SS2. There is only one AF and oen MF so I am putting 2 just for consistency
        */
        "AF-text-scenario": 2,
        "MF-text-scenario": 2,
        "PS-text-scenario": 2,
        "SS-text-scenario": 2,
    };
};

export const scenarioIdsFromLog = (participantLog, currentEval) => {
    const num = evalNameToNumber[currentEval];

    const configs = {
        16: {
            prefix: 'April2026',
            types: ['AF', 'MF', 'PS', 'SS'],
            noDigitTypes: ['AF', 'MF'],
            prefixOverrides: { PS: 'Feb2026', SS: 'Feb2026' },
            suffix: 'assess'
        },
        15: { prefix: 'Feb2026', types: ['AF', 'MF', 'PS', 'SS'], suffix: 'assess' },
        10: { prefix: 'Sept2025', types: ['AF', 'MF', 'PS', 'PS-AF'], suffix: 'eval' },
        9:  { prefix: 'July2025', types: ['AF', 'MF', 'PS', 'SS'], suffix: 'eval' },
        8:  { prefix: 'June2025', types: ['AF', 'MF', 'PS', 'SS'], suffix: 'eval' },
    };

    const buildId = (config, type) => {
        const prefix = config.prefixOverrides?.[type] || config.prefix;
        const digit = config.noDigitTypes?.includes(type) ? '' : participantLog[`${type}-text-scenario`];
        return `${prefix}-${type}${digit}-${config.suffix}`;
    };

    // paired ordering, return early to skip general shuffle
    if (num === 15) {
        const config = configs[15];
        let pairPSAF = [buildId(config, 'PS'), buildId(config, 'AF')];
        let pairMFSS = [buildId(config, 'MF'), buildId(config, 'SS')];
        if (Math.random() < 0.5) pairPSAF.reverse();
        const paired = Math.random() < 0.5
            ? [...pairPSAF, ...pairMFSS]
            : [...pairMFSS, ...pairPSAF];
        return paired;
    }

    let scenarios;

    if (configs[num]) {
        scenarios = configs[num].types.map(type => buildId(configs[num], type));
    } else if (num === 5) {
        scenarios = [
            ...(p1Mappings[participantLog['Text-1']] || []),
            ...(p1Mappings[participantLog['Text-2']] || []),
        ];
    } else if (num === 12) {
        scenarios = ['DryRunEval-MJ5-eval', 'vol-ph1-eval-2', 'DryRunEval.IO1', 'DryRunEval.MJ1'];
    } else if (num === 13) {
        scenarios = [1, 2, 3].flatMap(n =>
            ['AF', 'MF', 'PS', 'SS'].map(type => `July2025-${type}${n}-eval`)
        );
    } else {
        return [];
    }

    if (num >= 8 && num !== 13) {
        shuffle(scenarios);
    }

    // Eval 16 - subpopulation scenario always first
    if (num === 16) {
        scenarios.unshift('April2026-subpopulation');
    }

    return scenarios;
};