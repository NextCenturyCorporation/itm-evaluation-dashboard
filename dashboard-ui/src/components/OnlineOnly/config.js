import { SURVEY_VERSION_DATA } from "../Survey/survey";
import store from "../../store/store";
import bcrypt from 'bcryptjs';

export const evalNameToNumber = {
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

export const phase1ParticipantData = (currentSearchParams, hashedEmail, newPid, type) => {
    const prolificId = currentSearchParams ? currentSearchParams.get('PROLIFIC_PID') : null;
    const contactId = currentSearchParams ? currentSearchParams.get('ContactID') : null;
    const email = hashedEmail ? hashedEmail : bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);

    const setNum = newPid % 24
    console.log('newPid:', newPid, 'type:', typeof newPid);
    console.log('setNum:', setNum, 'type:', typeof setNum);
    console.log('LOG_VARIATIONS_PHASE1 length:', LOG_VARIATIONS_PHASE1.length);
    console.log(LOG_VARIATIONS_PHASE1[setNum])

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
        'evalNum': SURVEY_VERSION_DATA[store.getState().configs.currentSurveyVersion].evalNum,
        ...LOG_VARIATIONS_PHASE1[setNum]
    };
}

export const phase2ParticipantData = (currentSearchParams, hashedEmail, newPid, type) => {
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
        'evalNum': SURVEY_VERSION_DATA[store.getState().configs.currentSurveyVersion].evalNum
    };
};


export const scenarioIdsFromLog = (participantLog, currentEval) => {
    let scenarios = [];
    const num = evalNameToNumber[currentEval]
    if (num === 9) {
        scenarios = [
            `July2025-AF${participantLog['AF-text-scenario']}-eval`,
            `July2025-MF${participantLog['MF-text-scenario']}-eval`,
            `July2025-PS${participantLog['PS-text-scenario']}-eval`,
            `July2025-SS${participantLog['SS-text-scenario']}-eval`
        ]
    }

    if (num === 8) {
        scenarios = [
            `June2025-AF${participantLog['AF-text-scenario']}-eval`,
            `June2025-MF${participantLog['MF-text-scenario']}-eval`,
            `June2025-PS${participantLog['PS-text-scenario']}-eval`,
            `June2025-SS${participantLog['SS-text-scenario']}-eval`
        ]
    }

    if (num === 5) {
        console.log(participantLog)
        scenarios.push(...p1Mappings[participantLog['Text-1']])
        scenarios.push(...p1Mappings[participantLog['Text-2']])

        console.log(scenarios)
    }

    if (num >= 8) {
        for (let i = scenarios.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scenarios[i], scenarios[j]] = [scenarios[j], scenarios[i]];
        }
    }

    return scenarios
}