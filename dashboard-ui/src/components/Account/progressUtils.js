import axios from 'axios';

const PHASE1_SCENARIOS = {
    IO1: ['DryRunEval.IO1', 'phase1-adept-train-IO1'],
    MJ1: ['DryRunEval.MJ1', 'phase1-adept-train-MJ1'],
    MJ2: ['DryRunEval-MJ2-eval', 'phase1-adept-eval-MJ2'],
    MJ4: ['DryRunEval-MJ4-eval', 'phase1-adept-eval-MJ4'],
    MJ5: ['DryRunEval-MJ5-eval', 'phase1-adept-eval-MJ5'],
    QOL1: ['qol-dre-1-eval'],
    QOL2: ['qol-dre-2-eval', 'qol-ph1-eval-2'],
    QOL3: ['qol-dre-3-eval', 'qol-ph1-eval-3'],
    QOL4: ['qol-ph1-eval-4'],
    VOL1: ['vol-dre-1-eval'],
    VOL2: ['vol-dre-2-eval', 'vol-ph1-eval-2'],
    VOL3: ['vol-dre-3-eval', 'vol-ph1-eval-3'],
    VOL4: ['vol-ph1-eval-4']
};

const PHASE2_SCENARIO_KEYS = ['AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3', 'PS-AF1', 'PS-AF2'];

export const SCENARIO_HEADERS = [
    'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4',
    ...Object.keys(PHASE1_SCENARIOS),
    ...PHASE2_SCENARIO_KEYS
];

const isPhase2Scenario = (scenarioId, targetKey) => {

    return scenarioId.endsWith(`2025-${targetKey}-eval`) || scenarioId.endsWith(`2026-${targetKey}-assess`);
};

export const setScenarioCompletion = (obj, completedScenarios) => {
    Object.keys(PHASE1_SCENARIOS).forEach(key => {
        const scenarios = PHASE1_SCENARIOS[key];
        obj[key] = scenarios.some(s => completedScenarios.includes(s)) ? 'y' : null;
    });
    
    PHASE2_SCENARIO_KEYS.forEach(key => {
        obj[key] = completedScenarios.some(s => isPhase2Scenario(s, key)) ? 'y' : null;
    });
};

/**
 * Checks whether a text scenario result has a valid mostLeastAligned field.
 */
export const hasMostLeastAligned = (scenarioResult) => {
    if (!scenarioResult) return false;
    const mla = scenarioResult.mostLeastAligned;
    if (!mla) return false;
    if (Array.isArray(mla) && mla.length === 0) return false;
    // Check that at least one entry has a non-empty response array
    if (Array.isArray(mla)) {
        return mla.some(entry => Array.isArray(entry?.response) && entry.response.length > 0);
    }
    return true;
};

/**
 * For a given participant's text scenario results, returns alignment status info.
 */
export const checkAlignmentStatus = (textResults, pid) => {
    const participantResults = (textResults || []).filter(r => r.participantID === pid);

    if (participantResults.length === 0) {
        return {
            allPopulated: false,
            totalScenarios: 0,
            missingCount: 0,
            missingScenarios: [],
            scenarioDetails: []
        };
    }

    const scenarioDetails = participantResults.map(r => {
        const hasMLA = hasMostLeastAligned(r);
        const hasCombinedMLA = !!(r.combinedMostLeastAligned &&
            Array.isArray(r.combinedMostLeastAligned) &&
            r.combinedMostLeastAligned.length > 0);
        const hasIndividualMLA = !!(r.individualMostLeastAligned &&
            Array.isArray(r.individualMostLeastAligned) &&
            r.individualMostLeastAligned.length > 0);

        return {
            scenario_id: r.scenario_id,
            _id: r._id?.$oid || r._id,
            hasMLA,
            hasCombinedMLA,
            hasIndividualMLA,
            evalNumber: r.evalNumber,
            author: r.author
        };
    });

    const missingScenarios = scenarioDetails
        .filter(d => !d.hasMLA)
        .map(d => d.scenario_id);

    return {
        allPopulated: missingScenarios.length === 0,
        totalScenarios: participantResults.length,
        missingCount: missingScenarios.length,
        missingScenarios,
        scenarioDetails
    };
};

// ---- Repair Logic ----
// Mirrors the alignment scoring from TextBasedScenariosPage.jsx

const getAdeptUrl = (evalNumber) => {
    return evalNumber === 12 ? process.env.REACT_APP_ADEPT_DRE_URL : process.env.REACT_APP_ADEPT_URL;
};

const submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
    for (const [, fieldValue] of Object.entries(scenario)) {
        if (typeof fieldValue !== 'object' || !fieldValue?.questions) continue;
        for (const [questionName, question] of Object.entries(fieldValue.questions)) {
            if (typeof question !== 'object') continue;
            if (question.response && !questionName.includes("Follow Up")) {
                const mapping = question.question_mapping?.[question.response];
                if (!mapping) continue;
                const responseUrl = `${urlBase}/api/v1/response`;
                const choices = Array.isArray(mapping['choice']) ? mapping['choice'] : [mapping['choice']];
                for (const choice of choices) {
                    const responsePayload = {
                        response: {
                            choice,
                            justification: "justification",
                            probe_id: mapping['probe_id'],
                            scenario_id: scenarioID,
                        },
                        session_id: sessionID
                    };
                    try {
                        await axios.post(responseUrl, responsePayload);
                    } catch (err) {
                        console.error('Error submitting response:', err);
                    }
                }
            }
        }
    }
};

const getMostLeastAligned = async (sessionId, url, scenario, isEval15Combined = false, evalNumber = null) => {
    const endpoint = '/api/v1/get_ordered_alignment';

    const getTargets = () => {
        if (isEval15Combined) return [null];

        if ([13, 15].includes(evalNumber) && scenario) {
            const attrMatch = scenario.scenario_id.match(/(AF|MF|PS|SS)/);
            if (attrMatch) {
                const attrMap = { AF: 'affiliation', MF: 'merit', PS: 'personal_safety', SS: 'search' };
                return [attrMap[attrMatch[1]]];
            }
        }

        return (evalNumber >= 8 && evalNumber !== 12)
            ? ['affiliation', 'merit', 'search', 'personal_safety']
            : ['Moral judgement', 'Ingroup Bias'];
    };

    const targets = getTargets();
    const responses = [];

    for (const target of targets) {
        const params = { session_id: sessionId };
        if (target) params.kdma_id = target;

        try {
            const response = await axios.get(`${url}${endpoint}`, { params });
            const filteredData = response.data.filter(obj =>
                !Object.keys(obj).some(key => key.toLowerCase().includes('-group-'))
            );
            responses.push({ target, response: filteredData });
        } catch (err) {
            console.error('Error getting ordered alignment:', err);
        }
    }

    return responses;
};

const attachKdmaValue = async (sessionId, url) => {
    try {
        const response = await axios.get(`${url}/api/v1/computed_kdma_profile?session_id=${sessionId}`);
        return response.data;
    } catch (e) {
        console.error('Error getting kdmas:', e);
        return null;
    }
};

/**
 * Determines the eval-specific group that a scenario belongs to.
 * Returns { groupKey, groupScenarios } for the given scenario among allResults.
 */
const getEval15Group = (scenarioId) => {
    if (scenarioId.includes('PS') || scenarioId.includes('AF')) return 'PS-AF';
    if (scenarioId.includes('MF') || scenarioId.includes('SS')) return 'MF-SS';
    return null;
};

const getEval13Group = (scenarioId) => {
    const match = scenarioId.match(/-(AF|MF|PS|SS)\d+-/);
    return match ? match[1] : null;
};

/**
 * Re-runs alignment scoring for scenarios missing mostLeastAligned.
 * Groups scenarios by their eval-specific pairing before processing.
 *
 * @param {Array} missingScenarioIds - scenario_ids that need repair
 * @param {Array} allParticipantResults - ALL text results for this participant
 * @param {Function} updateScenarioMutation - GraphQL mutation ({ variables: { id, updates } })
 * @param {Function} onProgress - callback(message) for progress updates
 * @returns {{ success: boolean, repaired: number, total: number, errors: Array }}
 */
export const repairAlignmentForParticipant = async (missingScenarioIds, allParticipantResults, updateScenarioMutation, onProgress) => {
    if (!missingScenarioIds || missingScenarioIds.length === 0) {
        return { success: true, repaired: 0, total: 0, errors: [] };
    }

    // All missing scenarios should share the same evalNumber
    const firstMissing = allParticipantResults.find(r => missingScenarioIds.includes(r.scenario_id));
    if (!firstMissing) {
        return { success: false, repaired: 0, total: missingScenarioIds.length, errors: [{ scenario_id: 'all', error: 'Could not find scenario data' }] };
    }

    const evalNumber = firstMissing.evalNumber;
    const url = getAdeptUrl(evalNumber);
    const sessionEndpoint = '/api/v1/new_session';

    let repaired = 0;
    const errors = [];

    if (evalNumber === 15) {
        // Group by PS-AF / MF-SS pairs
        const groups = {};
        for (const sid of missingScenarioIds) {
            const gk = getEval15Group(sid);
            if (!gk) { errors.push({ scenario_id: sid, error: 'Unknown eval 15 group' }); continue; }
            if (!groups[gk]) groups[gk] = [];
            groups[gk].push(sid);
        }

        for (const [groupKey, scenarioIds] of Object.entries(groups)) {
            // Get ALL scenarios in this group (including ones that already have MLA, since we need to re-submit all probes)
            const groupScenarios = allParticipantResults.filter(r => {
                const gk = getEval15Group(r.scenario_id);
                return gk === groupKey;
            });

            onProgress?.(`Processing eval 15 group ${groupKey} (${groupScenarios.length} scenarios)...`);

            try {
                // Individual MF scoring
                for (const scenario of groupScenarios) {
                    if (scenario.scenario_id.includes('MF') && !hasMostLeastAligned({ mostLeastAligned: scenario.individualMostLeastAligned })) {
                        onProgress?.(`Individual scoring for ${scenario.scenario_id}...`);
                        const indSession = await axios.post(`${url}${sessionEndpoint}`);
                        const indSessionId = indSession.data;
                        await submitResponses(scenario, scenario.scenario_id, url, indSessionId);
                        const indMLA = await getMostLeastAligned(indSessionId, url, scenario, false, 15);
                        const indKdmas = await attachKdmaValue(indSessionId, url);

                        const docId = scenario._id?.$oid || scenario._id;
                        await updateScenarioMutation({ variables: { id: docId, updates: { individualSessionId: indSessionId, individualMostLeastAligned: indMLA, individualKdmas: indKdmas } } });
                    }
                }

                // Combined scoring for the pair
                onProgress?.(`Combined scoring for ${groupKey}...`);
                const combinedSession = await axios.post(`${url}${sessionEndpoint}`);
                const combinedSessionId = combinedSession.data;

                for (const scenario of groupScenarios) {
                    await submitResponses(scenario, scenario.scenario_id, url, combinedSessionId);
                }

                const combinedMLA = await getMostLeastAligned(combinedSessionId, url, groupScenarios[0], true, 15);
                const combinedKdmas = await attachKdmaValue(combinedSessionId, url);

                for (const scenario of groupScenarios) {
                    const docId = scenario._id?.$oid || scenario._id;
                    await updateScenarioMutation({ variables: { id: docId, updates: { combinedSessionId, mostLeastAligned: combinedMLA, kdmas: combinedKdmas } } });
                    if (scenarioIds.includes(scenario.scenario_id)) repaired++;
                }
            } catch (e) {
                console.error(`Error repairing eval 15 group ${groupKey}:`, e);
                for (const sid of scenarioIds) {
                    errors.push({ scenario_id: sid, error: e.message });
                }
            }
        }
    } else if (evalNumber === 13) {
        // Group by attribute prefix (AF, MF, PS, SS)
        const groups = {};
        for (const sid of missingScenarioIds) {
            const gk = getEval13Group(sid);
            if (!gk) { errors.push({ scenario_id: sid, error: 'Unknown eval 13 group' }); continue; }
            if (!groups[gk]) groups[gk] = [];
            groups[gk].push(sid);
        }

        for (const [groupPrefix, scenarioIds] of Object.entries(groups)) {
            const groupScenarios = allParticipantResults.filter(r => {
                const gk = getEval13Group(r.scenario_id);
                return gk === groupPrefix;
            });

            // Individual scoring for each missing scenario
            for (const sid of scenarioIds) {
                const scenario = allParticipantResults.find(r => r.scenario_id === sid);
                if (!scenario) continue;

                onProgress?.(`Individual scoring for ${sid}...`);
                try {
                    const session = await axios.post(`${url}${sessionEndpoint}`);
                    const sessionId = session.data;
                    await submitResponses(scenario, scenario.scenario_id, url, sessionId);
                    const mla = await getMostLeastAligned(sessionId, url, scenario, false, 13);
                    const kdmas = await attachKdmaValue(sessionId, url);

                    const docId = scenario._id?.$oid || scenario._id;
                    await updateScenarioMutation({ variables: { id: docId, updates: { sessionId, mostLeastAligned: mla, kdmas } } });
                    repaired++;
                } catch (e) {
                    errors.push({ scenario_id: sid, error: e.message });
                }
            }

            // Combined scoring if all 3 scenarios exist
            if (groupScenarios.length === 3) {
                onProgress?.(`Combined scoring for ${groupPrefix} group...`);
                try {
                    const combinedSession = await axios.post(`${url}${sessionEndpoint}`);
                    const combinedSessionId = combinedSession.data;

                    for (const scenario of groupScenarios) {
                        await submitResponses(scenario, scenario.scenario_id, url, combinedSessionId);
                    }

                    const combinedMLA = await getMostLeastAligned(combinedSessionId, url, groupScenarios[0], false, 13);
                    const combinedKdmas = await attachKdmaValue(combinedSessionId, url);

                    for (const scenario of groupScenarios) {
                        const docId = scenario._id?.$oid || scenario._id;
                        await updateScenarioMutation({ variables: { id: docId, updates: { combinedSessionId, combinedMostLeastAligned: combinedMLA, combinedKdmas } } });
                    }
                } catch (e) {
                    console.error(`Error in eval 13 combined scoring for ${groupPrefix}:`, e);
                }
            }
        }
    } else {
        // Default: all ADEPT scenarios share one combined session
        const adeptScenarios = allParticipantResults.filter(r =>
            r.author === 'ADEPT' || ['adept', '2025', '2026'].some(term => (r.scenario_id || '').includes(term))
        );

        onProgress?.(`Creating combined session for ${adeptScenarios.length} ADEPT scenarios...`);

        try {
            const session = await axios.post(`${url}${sessionEndpoint}`);
            const combinedSessionId = session.data;

            for (const scenario of adeptScenarios) {
                onProgress?.(`Submitting probes for ${scenario.scenario_id}...`);
                await submitResponses(scenario, scenario.scenario_id, url, combinedSessionId);
            }

            onProgress?.('Computing alignment...');
            const combinedMLA = await getMostLeastAligned(combinedSessionId, url, null, false, evalNumber);
            const combinedKdmas = await attachKdmaValue(combinedSessionId, url);

            for (const scenario of adeptScenarios) {
                const docId = scenario._id?.$oid || scenario._id;
                await updateScenarioMutation({ variables: { id: docId, updates: { combinedSessionId, mostLeastAligned: combinedMLA, kdmas: combinedKdmas } } });
                if (missingScenarioIds.includes(scenario.scenario_id)) repaired++;
            }
        } catch (e) {
            console.error('Error in default repair:', e);
            for (const sid of missingScenarioIds) {
                errors.push({ scenario_id: sid, error: e.message });
            }
        }
    }

    return { success: errors.length === 0, repaired, total: missingScenarioIds.length, errors };
};