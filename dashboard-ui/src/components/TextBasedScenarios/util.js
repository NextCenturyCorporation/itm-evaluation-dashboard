// add proper choice id's to questions
const mapAnswers = (scenario, scenarioMappings) => {
    if (!scenario.participantID) { return; }
    const scenarioConfig = scenarioMappings[scenario.title.replace(' Scenario', '')];
    Object.entries(scenario).forEach(field => {
        if (!field[1].questions) { return; }
        Object.entries(field[1].questions).forEach(question => {
            if (!question[1].probe) { return; }
            const page = scenarioConfig.pages.find((page) => page.name === field[0]);
            const pageQuestion = page.elements.find((element) => element.name === question[0]);
            const indexOfAnswer = pageQuestion.choices.indexOf(question[1].response);
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
        if (!field[1].questions) { return; }
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
    const url = 'http://localhost:8080/api/v1/new_session';
    const options = {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
    };

    try {
        const fetch = (await import('node-fetch')).default;
        const startSession = await fetch(url, options);
        const sessionId = await startSession.json();
        Object.entries(scenarioResults).forEach(field => {
            if (!field[1].questions) { return; }
            Object.entries(field[1].questions).forEach(async question => {
                if (question[1].response && !question[0].includes("Follow Up")) {
                    // post a response
                    const responseOptions = {
                        method: 'POST',
                        headers: { 
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            response: {
                                choice: question[1].choice,
                                justification: "justification",
                                probe_id: question[1].probe,
                                scenario_id: scenarioId,
                            },
                            session_id: sessionId
                        })
                    };
                    const responseUrl = 'http://localhost:8080/api/v1/response';
                    try {
                        await fetch(responseUrl, responseOptions);
                    } catch (error) {
                        console.error(`Error in submitting response for probe ${question[1].probe}:`, error);
                    }
                }
            })
        })
        // get alignment for session
        const targetId = 'ADEPT-metrics_eval-alignment-target-train-HIGH';
        const urlAlignment = `http://localhost:8080/api/v1/alignment/session?session_id=${sessionId}&target_id=${targetId}&population=false`;
        const optionsAlignment = {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        };
        const alignmentResponse = await fetch(urlAlignment, optionsAlignment);
        const alignmentData = await alignmentResponse.json();

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
    const url = 'http://localhost:8084/api/v1/new_session?user_id=default_use';
    const options = {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
    };

    try {
        const fetch = (await import('node-fetch')).default;
        const startSession = await fetch(url, options);
        const sessionId = startSession.json();
        console.log(startSession.json());
        Object.entries(scenarioResults).forEach(field => {
            if (!field[1].questions) { return; }
            Object.entries(field[1].questions).forEach(async question => {
                if (question[1].response) {
                    // post a response
                    const responseOptions = {
                        method: 'POST',
                        headers: { 
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            session_id: sessionId,
                            response: {
                                choice: question[1].choice,
                                justification: "justification",
                                probe_id: question[1].probe,
                                scenario_id: scenarioId,
                            },
                        })
                    };
                    const responseUrl = 'http://localhost:8084/api/v1/response';
                    try {
                        await fetch(responseUrl, responseOptions);
                    } catch (error) {
                        console.error(`Error in submitting response for probe ${question[1].probe}:`, error);
                    }
                }
            })
        })
        // get alignment for session
        const targetId = 'maximization_high';
        const urlAlignment = `http://localhost:8084/api/v1/alignment/session?session_id=${sessionId}&target_id=${targetId}`;
        const optionsAlignment = {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        };
        const alignmentResponse = await fetch(urlAlignment, optionsAlignment);
        const alignmentData = await alignmentResponse.json();

        scenarioResults.alignmentData = alignmentData;
        scenarioResults.serverSessionId = sessionId;
        console.log(alignmentData)
    } catch (error) {
        console.error('Error', error);
    }
}

module.exports = { mapAnswers, addProbeIDs, getAdeptAlignment, getSoarTechAlignments }