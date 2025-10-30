const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

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
    version: { type: String, required: true },
    textScenarios: { type: String, required: true },
    lowPid: { type: Number, required: true },
    highPid: { type: Number, required: true }
});

const UiStyle = createSchema('uiStyle', {
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

const User = createSchema('users', {
    team: { type: String },
    delegator: { type: Number },
    createdAt: { type: String },
    username: { type: String },
    emails: { type: Array },
    admin: { type: Boolean },
    approved: { type: Boolean },
    rejected: { type: Boolean },
    evaluator: { type: Boolean },
    adeptUser: { type: Boolean }
});

const AdmLog = createSchema('admTargetRuns', {
    _id: { type: String, required: true },
    evaluation: { type: JSON },
    history: { type: Array, required: true },
    evalNumber: { type: Number, required: true },
    evalName: { type: String, required: true },
    results: { type: JSON }
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

const SurveyConfig = createSchema('delegationConfig', {
    _id: { type: String, required: true },
    survey: { type: JSON, required: true }
});

const TextBasedConfig = createSchema('textBasedConfig', {
    _id: { type: String, required: true },
    scenario_id: { type: String, required: true },
    name: { type: String, required: true },
    pages: { type: JSON, required: true },
    author: { type: String },
    showQuestionNumbers: { type: Boolean, required: true },
    showPrevButton: { type: Boolean, required: true },
    title: { type: String, required: true },
    logoPosition: { type: String, required: true },
    completedHtml: { type: String, required: true },
    widthMode: { type: String, required: true },
    showProgressBar: { type: String, required: true },
    eval: { type: String, required: true }
});

const SessionConfig = createSchema("sessions", {
    _id: { type: ObjectId, required: true },
    userId: { type: String, required: true },
    token: { type: String, required: true },
    valid: { type: Boolean, required: true },
});

const EvalData = createSchema("evalData", {
    _id: { type: ObjectId, required: true },
    evalNumber: { type: Number, required: true },
    evalName: { type: String, required: true },
    pages: {type: Object, required: true}
})


export { SurveyConfig, SurveyResults, SurveyVersion, UiStyle, ParticipantLog, AdmLog, UserScenarioResults, User, TextBasedConfig, SessionConfig, EvalData };