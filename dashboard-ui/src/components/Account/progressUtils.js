
import { submitResponses, getMostLeastAligned, getKdmaProfile, createAdeptSession, getAdeptUrl } from '../TextBasedScenarios/adeptUtils';
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

// has mostLeastAligned (and populated) or not
const hasMLA = (scenarioResult) => {
    const mla = scenarioResult?.mostLeastAligned;
    if (!mla || (Array.isArray(mla) && mla.length === 0)) return false;
    if (Array.isArray(mla)) {
        return mla.some(entry => Array.isArray(entry?.response) && entry.response.length > 0);
    }
    return true;
};

// checks all documents
export const checkAlignmentStatus = (allTextResults, pid) => {
    const results = (allTextResults || []).filter(r => r.participantID === pid);
    if (results.length === 0) {
        return { allPopulated: false, totalScenarios: 0, missingCount: 0, missingScenarios: [], scenarioDetails: [] };
    }

    const scenarioDetails = results.map(r => ({
        scenario_id: r.scenario_id,
        _id: r._id?.$oid || r._id,
        hasMLA: hasMLA(r),
        evalNumber: r.evalNumber
    }));

    const missingScenarios = scenarioDetails.filter(d => !d.hasMLA).map(d => d.scenario_id);

    return {
        allPopulated: missingScenarios.length === 0,
        totalScenarios: results.length,
        missingCount: missingScenarios.length,
        missingScenarios,
        scenarioDetails
    };
};


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
 * Re-runs ADEPT alignment scoring for scenarios missing mostLeastAligned.
 * Uses the same shared functions as TextBasedScenariosPage.
*/
export const repairAlignment = async (missingScenarioIds, allParticipantResults, updateMutation, onProgress) => {
    if (!missingScenarioIds?.length) return { success: true, repaired: 0, total: 0, errors: [] };

    const firstMissing = allParticipantResults.find(r => missingScenarioIds.includes(r.scenario_id));
    if (!firstMissing) return { success: false, repaired: 0, total: missingScenarioIds.length, errors: [{ scenario_id: 'all', error: 'No scenario data found' }] };

    const evalNumber = firstMissing.evalNumber;
    const url = getAdeptUrl(evalNumber);
    let repaired = 0;
    const errors = [];

    const scoreAndUpdate = async (scenarios, sessionId, isEval15Combined, updateFields = {}) => {
        const mla = await getMostLeastAligned(sessionId, url, scenarios[0], evalNumber, isEval15Combined);
        const kdmas = await getKdmaProfile(sessionId, url);
        for (const scenario of scenarios) {
            const docId = scenario._id?.$oid || scenario._id;
            await updateMutation({ variables: { id: docId, updates: { ...updateFields, mostLeastAligned: mla, kdmas, combinedSessionId: sessionId } } });
            if (missingScenarioIds.includes(scenario.scenario_id)) repaired++;
        }
        return { mla, kdmas };
    };

    try {
        if (evalNumber === 15) {
            // Group by PS-AF / MF-SS pairs
            const groups = {};
            for (const sid of missingScenarioIds) {
                const gk = getEval15Group(sid);
                if (!gk) { errors.push({ scenario_id: sid, error: 'Unknown group' }); continue; }
                if (!groups[gk]) groups[gk] = [];
                groups[gk].push(sid);
            }

            for (const [groupKey, sids] of Object.entries(groups)) {
                const groupScenarios = allParticipantResults.filter(r => getEval15Group(r.scenario_id) === groupKey);
                onProgress?.(`Eval 15: scoring ${groupKey} group (${groupScenarios.length} scenarios)...`);

                // Individual MF scoring
                for (const scenario of groupScenarios) {
                    if (scenario.scenario_id.includes('MF') && !hasMLA({ mostLeastAligned: scenario.individualMostLeastAligned })) {
                        onProgress?.(`Individual scoring: ${scenario.scenario_id}...`);
                        const sid = await createAdeptSession(url);
                        await submitResponses(scenario, scenario.scenario_id, url, sid);
                        const indMLA = await getMostLeastAligned(sid, url, scenario, evalNumber);
                        const indKdmas = await getKdmaProfile(sid, url);
                        const docId = scenario._id?.$oid || scenario._id;
                        await updateMutation({ variables: { id: docId, updates: { individualSessionId: sid, individualMostLeastAligned: indMLA, individualKdmas: indKdmas } } });
                    }
                }

                // Combined scoring for the pair
                onProgress?.(`Combined scoring: ${groupKey}...`);
                const combinedSid = await createAdeptSession(url);
                for (const scenario of groupScenarios) {
                    await submitResponses(scenario, scenario.scenario_id, url, combinedSid);
                }
                await scoreAndUpdate(groupScenarios, combinedSid, true);
            }
        } else if (evalNumber === 13) {
            // Group by attribute prefix
            const groups = {};
            for (const sid of missingScenarioIds) {
                const gk = getEval13Group(sid);
                if (!gk) { errors.push({ scenario_id: sid, error: 'Unknown group' }); continue; }
                if (!groups[gk]) groups[gk] = [];
                groups[gk].push(sid);
            }

            for (const [prefix, sids] of Object.entries(groups)) {
                const groupScenarios = allParticipantResults.filter(r => getEval13Group(r.scenario_id) === prefix);

                // Individual scoring per missing scenario
                for (const sid of sids) {
                    const scenario = allParticipantResults.find(r => r.scenario_id === sid);
                    if (!scenario) continue;
                    onProgress?.(`Individual scoring: ${sid}...`);
                    const sessionId = await createAdeptSession(url);
                    await submitResponses(scenario, scenario.scenario_id, url, sessionId);
                    const mla = await getMostLeastAligned(sessionId, url, scenario, evalNumber);
                    const kdmas = await getKdmaProfile(sessionId, url);
                    const docId = scenario._id?.$oid || scenario._id;
                    await updateMutation({ variables: { id: docId, updates: { sessionId, mostLeastAligned: mla, kdmas } } });
                    repaired++;
                }

                // Combined scoring if all 3 exist
                if (groupScenarios.length === 3) {
                    onProgress?.(`Combined scoring: ${prefix} group...`);
                    const combinedSid = await createAdeptSession(url);
                    for (const scenario of groupScenarios) {
                        await submitResponses(scenario, scenario.scenario_id, url, combinedSid);
                    }
                    const combinedMLA = await getMostLeastAligned(combinedSid, url, groupScenarios[0], evalNumber);
                    const combinedKdmas = await getKdmaProfile(combinedSid, url);
                    for (const scenario of groupScenarios) {
                        const docId = scenario._id?.$oid || scenario._id;
                        await updateMutation({ variables: { id: docId, updates: { combinedSessionId: combinedSid, combinedMostLeastAligned: combinedMLA, combinedKdmas } } });
                    }
                }
            }
        } else {
            // Default: all ADEPT scenarios share one combined session
            const adeptScenarios = allParticipantResults.filter(r =>
                r.author === 'ADEPT' || ['adept', '2025', '2026'].some(t => (r.scenario_id || '').includes(t))
            );
            onProgress?.(`Combined session for ${adeptScenarios.length} ADEPT scenarios...`);
            const combinedSid = await createAdeptSession(url);
            for (const scenario of adeptScenarios) {
                onProgress?.(`Submitting probes: ${scenario.scenario_id}...`);
                await submitResponses(scenario, scenario.scenario_id, url, combinedSid);
            }
            onProgress?.('Computing alignment...');
            await scoreAndUpdate(adeptScenarios, combinedSid, false);
        }
    } catch (e) {
        console.error('Repair error:', e);
        errors.push({ scenario_id: 'batch', error: e.message });
    }

    return { success: errors.length === 0, repaired, total: missingScenarioIds.length, errors };
};