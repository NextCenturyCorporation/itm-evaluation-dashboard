const mongoose = require('mongoose');

const surveyVersionSchema = new mongoose.Schema({
    version: { type: String, required: true },
},
    { collection: 'surveyVersion' });

const SurveyVersion = mongoose.model('SurveyVersion', surveyVersionSchema);

export { SurveyVersion };