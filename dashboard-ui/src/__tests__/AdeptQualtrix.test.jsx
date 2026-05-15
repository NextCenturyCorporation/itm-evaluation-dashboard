/**
 * @jest-environment puppeteer
 */

import { pressAllKeys, startAdeptQualtrixSurvey, takePhase1TextScenario, takePhase2TextScenario, waitForSurveyIntro, surveyFlowNavigateAndComplete, completeTextScenarioAndReachSurvey } from "../__mocks__/testUtils"
import { isDefined } from "../components/AggregateResults/DataFunctions";

const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;

describe('Test adept qualtrix entry method', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    }, 30000);

});