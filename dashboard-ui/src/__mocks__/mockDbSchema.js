const mongoose = require('mongoose');

function createSchema(collectionName, schema) {
    const namedSchema = new mongoose.Schema(
        schema,
        {
            collection: collectionName
        }
    );

    const schemaType = mongoose.model(collectionName, namedSchema);
    return schemaType;
}

const SurveyResults = createSchema('surveyResults', {
    results: { type: JSON, required: true }
});

const SurveyVersion = createSchema('surveyVersion', {
    version: { type: String, required: true }
});

const ParticipantLog = createSchema('participantLog', {
    Type: { type: String, required: true },
    ParticipantID: { type: Number, required: true },
    "Text-1": { type: String, required: true },
    "Text-2": { type: String, required: true },
    "Sim-1": { type: String, required: true },
    "Sim-2": { type: String, required: true },
    "Del-1": { type: String, required: true },
    "Del-2": { type: String, required: true },
    ADMOrder: { type: Number, required: true },
    claimed: { type: Boolean },
    simEntryCount: { type: Number },
    surveyEntryCount: { type: Number },
    textEntryCount: { type: Number },
    hashedEmail: { type: String },
});

const AdmLog = createSchema('test', {
    evaluation: { type: JSON },
    history: { type: Array, required: true },
    evalNumber: { type: Number, required: true },
    evalName: { type: String, required: true }
});

const UserScenarioResults = createSchema('userScenarioResults', {
    scenario_id: { type: String, required: true },
    participantID: { type: String, required: true },
    title: { type: String, required: true },
    timeComplete: { type: String, required: true },
    startTime: { type: String, required: true },
    scenarioOrder: { type: Array },
    evalNumber: { type: Number, required: true },
    evalName: { type: String, required: true },
    combinedSessionId: { type: String },
    mostLeastAligned: { type: Array },
    kdmas: { type: Array },
    dreSessionId: { type: String }
});


export { SurveyResults, SurveyVersion, ParticipantLog, AdmLog, UserScenarioResults };