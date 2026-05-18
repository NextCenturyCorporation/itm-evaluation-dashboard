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

    it('/remote-text-survey?adeptQualtrix=true should generate online PID', async () => {
        await startAdeptQualtrixSurvey(page);
        const currentUrl = page.url();
        const pid = currentUrl.split('pid=').slice(-1)[0].split('&')[0];
        expect(pid).toBe(IS_PH1 ? "202501700" : "202507100");
    });

    it('PIDs should increase by 1 with each login to /remote-text-survey?adeptQualtrix=true', async () => {
        let pid;
        let firstPid;
        for (let i = 0; i < 2; i++) {
            page = await browser.newPage();
            await startAdeptQualtrixSurvey(page);
            const currentUrl = page.url();
            pid = currentUrl.split('pid=').slice(-1)[0].split('&')[0];
            if (!isDefined(firstPid))
                firstPid = pid;
        }
        expect(Number(pid)).toBe(Number(firstPid) + 1);
    }, 30000);

    it('any key combo during text scenario should have no effect on progress', async () => {
        await startAdeptQualtrixSurvey(page);
        await pressAllKeys(page, IS_PH1 ? "Assess the shooter" : "Scenario Details");
    }, 30000);

});