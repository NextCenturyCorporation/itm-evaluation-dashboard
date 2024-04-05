const axios = require('axios');
const { stUrban, stDesert, stJungle, stSubmarine } = require('./problemProbes')
// add proper choice id's to questions
const mapAnswers = (scenario, scenarioMappings) => {
    if (!scenario.participantID) { return; }
    const scenarioConfig = scenarioMappings[scenario.title.replace(' Scenario', '')];
    Object.entries(scenario).forEach(field => {
        if (!field[1]?.questions) { return; }
        Object.entries(field[1].questions).forEach(question => {
            if (!question[1].probe) { return; }
            const page = scenarioConfig.pages.find((page) => page.name === field[0]);
            const pageQuestion = page.elements.find((element) => element.name === question[0]);
            const indexOfAnswer = pageQuestion.choices.indexOf(question[1].response);
            // should never happen for real data but don't want older test data throwing errors
            if (indexOfAnswer < 0) { return; }
            let choice;
            if (scenario.title.includes("Adept")) {
                if (indexOfAnswer >= 0) {
                    choice = question[1].probe + '.';
                    choice += String.fromCharCode(65 + indexOfAnswer);
                } else {
                    console.error("Error mapping user selection to choice ID");
                }
            } else {
                choice = "choice-" + indexOfAnswer;
            }
            question[1].choice = choice;
        })
    })
};

// add proper probe id's to questions
const addProbeIDs = (scenario, scenarioMappings) => {
    if (!scenario.participantID) { return; }
    const scenarioConfig = scenarioMappings[scenario.title.replace(' Scenario', '')];
    Object.entries(scenario).forEach(field => {
        if (!field[1]?.questions) { return; }
        Object.entries(field[1].questions).forEach(question => {
            if (question[1].response && !question[0].includes("Follow Up")) {
                const page = scenarioConfig.pages.find((page) => page.name === field[0]);
                const pageQuestion = page.elements.find((element) => element.name === question[0]);
                question[1].probe = pageQuestion.probe;
            }
        })
    })
}

const getAdeptAlignment = async (scenarioResults, scenarioId) => {
    /*local host 8080 is where I had adept running, if you had to change your port must change script to match */
    // build fetch for starting new session
    const url = 'http://10.216.38.70/api/v1/new_session';

    try {
        const startSession = await axios.post(url);
        const sessionId = startSession.data;
        let responsePromises = [];
        for (const field of Object.entries(scenarioResults)) {
            if (!field[1]?.questions) { continue; }
            for (const [questionName, question] of Object.entries(field.questions)) {
                if (question.response && !questionName.includes("Follow Up") && question.probe && question.choice) {
                    const responseUrl = 'http://10.216.38.70:8080/api/v1/response';
                    const promise = axios.post(responseUrl, {
                        response: {
                            choice: question.choice,
                            justification: "justification",
                            probe_id: question.probe,
                            scenario_id: scenarioId,
                        },
                        session_id: sessionId
                    }).catch(error => {
                        console.error(`Error in submitting response for probe ${question[1].probe}:`, error);
                    });
                    responsePromises.push(promise);
                }
            }
        }

        // wait for all response submissions to complete
        await Promise.all(responsePromises);
        // get alignment for session
        const targetId = 'ADEPT-metrics_eval-alignment-target-train-HIGH';
        const urlAlignment = `http://10.216.38.70:8080/api/v1/alignment/session?session_id=${sessionId}&target_id=${targetId}&population=false`;
        const alignmentResponse = await axios.get(urlAlignment);
        const alignmentData = alignmentResponse.data;

        scenarioResults.alignmentData = alignmentData;
        scenarioResults.serverSessionId = sessionId;
        console.log(alignmentData)
    } catch (error) {
        console.error('Error:', error);
    }
}

const getSoarTechAlignments = async (scenarioResults, scenarioId) => {
    /*local host 8084 is where I had soartech running, if you had to change your port must change script to match */
    // build fetch for starting new session
    const url = 'http://10.216.38.125:8084/api/v1/new_session?user_id=default_use';

    try {
        const startSession = await axios.post(url);
        const sessionId = await startSession.data;
        let responsePromises = [];
        for (const field of Object.entries(scenarioResults)) {
            if (!field[1]?.questions) { continue; }
            for (const question of Object.entries(field.questions)) {
                if (question[1].response && question[1].probe && question[1].choice) {
                    const problemProbe = isProblemProbe(question[1], scenarioResults.title)
                    if (problemProbe) {
                        // fix probe if it can be, if returns false skip over
                        if (!fixProblemProbe(question[1], problemProbe)) { continue; }
                    }
                    // post a response
                    const responseUrl = 'http://10.216.38.125:8084/api/v1/response';
                  
                        const promise = await axios.post(responseUrl, {
                            session_id: sessionId,
                            response: {
                                choice: question[1].choice,
                                justification: "justification",
                                probe_id: question[1].probe,
                                scenario_id: scenarioId,
                            },
                        }).catch(error => {
                        console.error(`Error in submitting response for probe ${question[1].probe}:`, error);
                    })
                    responsePromises.push(promise);
                }
            }
        }
        
        // wait for all post requests to finish
        await Promise.all(responsePromises);
        // get alignment for session
        const targetId = 'maximization_high';
        const urlAlignment = `http://10.216.38.125:8084/api/v1/alignment/session?session_id=${sessionId}&target_id=${targetId}`;

        const alignmentResponse = await axios.get(urlAlignment).catch(error => {
            console.log("Error retrieving alignment for " + sessionId)
            console.log(error);
        });
        const alignmentData = alignmentResponse ? alignmentResponse.data : null;

        scenarioResults.alignmentData = alignmentData ? alignmentData : null;
        scenarioResults.serverSessionId = sessionId;
        console.log(scenarioResults.alignmentData)
    } catch (error) {
        console.error('Error', error);
    }
}

const isProblemProbe = (question, scenarioTitle) => {
    switch (scenarioTitle) {
        case "SoarTech Submarine":
            return stSubmarine[question.probe] ? stSubmarine : null;
        case "SoarTech Jungle":
            return stJungle[question.probe] ? stJungle : null;
        case "SoarTech Urban":
            return stUrban[question.probe] ? stUrban : null;
        case "SoarTech Desert":
            return stDesert[question.probe] ? stDesert : null;
        default:
            console.log("didnt find scenario title match")
            return null;
    }
}

/* 
* the purpose of this function is to address the soartech probes where the choices from the materials
* do not match up with the YAML files. If the choice can be mapped, this function fixes the choice id
* and returns true. If the choice can't be mapped, the function returns false and 
*/
const fixProblemProbe = (question, mapping) => {
    const probeDict = mapping[question.probe];
    const mappedChoice = probeDict[question.choice];
    if (mappedChoice) {
        question.choice = mappedChoice;
        return true;
    } else {
        return false;
    }
}

module.exports = { mapAnswers, addProbeIDs, getAdeptAlignment, getSoarTechAlignments }