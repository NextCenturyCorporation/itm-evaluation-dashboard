// Used for live scoring and rescoring (as a fail safe if first pass through errors)

import axios from 'axios';

export const submitResponses = async (scenario, scenarioID, urlBase, sessionID) => {
    // if we don't have a session, don't cause more errors
    if (!sessionID) return;
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

export const getMostLeastAligned = async (sessionId, url, scenario, evalNumber, skipKdmaFilter = false, enable_subpop = false, allow_multiattribute_targets = false) => {
    const endpoint = '/api/v1/get_ordered_alignment';

    const getTargets = () => {
        if (skipKdmaFilter) return [null];

        if ([13, 15].includes(evalNumber) && scenario) {
            const attrMatch = scenario.scenario_id.match(/(AF|MF|PS|SS)/);
            if (attrMatch) {
                const attrMap = { AF: 'affiliation', MF: 'merit', PS: 'personal_safety', SS: 'search' };
                return [attrMap[attrMatch[1]]];
            }
        }

        if (evalNumber === 16) return ['affiliation', 'merit'];

        return (evalNumber >= 8 && evalNumber !== 12)
            ? ['affiliation', 'merit', 'search', 'personal_safety']
            : ['Moral judgement', 'Ingroup Bias'];
    };

    if (!sessionId) return null;

    const targets = getTargets();
    const responses = [];

    for (const target of targets) {
        const params = { session_id: sessionId };
        if (target) params.kdma_id = target;
        if (enable_subpop) params.enable_subpop = enable_subpop
        if (allow_multiattribute_targets) params.allow_multiattribute_targets = allow_multiattribute_targets

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

    // null (rather than an empty array) so alignment checks can tell scoring never happened
    return responses.length > 0 ? responses : null;
};

export const getKdmaProfile = async (sessionId, url, enable_subpop = false) => {
    const endpoint = '/api/v1/computed_kdma_profile'
    if (!sessionId) return null;
    const params = {session_id: sessionId}
    if (enable_subpop) params.enable_subpop = enable_subpop
    try {
        const response = await axios.get(`${url}${endpoint}`, {params});
        return response.data;
    } catch (e) {
        console.error('Error getting kdmas:', e);
        return null;
    }
};

export const createAdeptSession = async (url) => {
    const response = await axios.post(`${url}/api/v1/new_session`);
    return response.data;
};

// Return null instead of throwing if it fails. Record data as normal, no scoring tho (fix on participant progress table)
export const createAdeptSessionSafe = async (url) => {
    try {
        return await createAdeptSession(url);
    } catch (e) {
        console.error('Error creating ADEPT session, data will be uploaded without alignment:', e);
        return null;
    }
};

export const getSubPop = async (sessionId, url) => {
    if (!sessionId) return null;
    try {
        const response = await axios.get(`${url}/api/v1/subpopulation?session_id=${sessionId}`);
        return response.data
    } catch (e) {
        console.error('Error getting subpopulation group: ', e)
        return null
    }
}


export const getAdeptUrl = (evalNumber) => {
    return evalNumber === 12 ? process.env.REACT_APP_ADEPT_DRE_URL : process.env.REACT_APP_ADEPT_URL;
};