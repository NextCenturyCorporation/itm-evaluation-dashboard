import { SURVEY_VERSION_DATA } from "../Survey/survey";
import store from "../../store/store";
import bcrypt from 'bcryptjs';

export const evalNameToNumber = {
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


export const scenarioIdsFromLog = (participantLog, currentEval) => {
    const num = evalNameToNumber[currentEval]
    let scenarios = [];

    if (num === 10) {
        const month = 'Sept2025'
        const scenarioTypes = ['AF', 'MF', 'PS', 'PS-AF']

        scenarios = scenarioTypes.map(type =>
            `${month}-${type}${participantLog[`${type}-text-scenario`]}-eval`
        )
    } else if (num === 8 || num === 9) {
        const monthPrefix = num === 9 ? 'July2025' : 'June2025';
        const scenarioTypes = ['AF', 'MF', 'PS', 'SS'];

        scenarios = scenarioTypes.map(type =>
            `${monthPrefix}-${type}${participantLog[`${type}-text-scenario`]}-eval`
        );
    } else if (num === 5) {
        scenarios = [
            ...p1Mappings[participantLog['Text-1']] || [],
            ...p1Mappings[participantLog['Text-2']] || []
        ];
    }

    if (num >= 8) {
        for (let i = scenarios.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scenarios[i], scenarios[j]] = [scenarios[j], scenarios[i]];
        }
    }

    console.log(scenarios)

    return scenarios
}