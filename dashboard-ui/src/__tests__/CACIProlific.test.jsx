/**
 * @jest-environment puppeteer
 */

import { pressAllKeys, takePhase1TextScenario, takePhase2TextScenario, startCaciProlificSurvey, agreeToProlificConsent, waitForSurveyIntro, surveyFlowNavigateAndComplete, completeTextScenarioAndReachSurvey } from "../__mocks__/testUtils";

const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;
const PROLIFIC_PID = "ALS_test1210b";
const PROLIFIC_RETURN_URL = "https://app.prolific.com/submissions/complete?cc=C155IMPM";

describe('Test CACI Prolific entry method', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    }, 30000);

    it('/remote-text-survey?caciProlific=true shows consent and preserves PROLIFIC_PID', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=${PROLIFIC_PID}`);
        await page.waitForSelector('text/Consent Form', { timeout: 20000 });
        await page.waitForSelector('text/I Agree', { timeout: 20000 });
        await page.waitForSelector('text/I Do Not Agree', { timeout: 20000 });
        await pressAllKeys(page, 'Consent Form');
        await page.waitForSelector('text/Consent Form', { timeout: 2000 });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
            b?.click();
        });
        await page.waitForSelector('text/Instructions', { timeout: 30000 });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
            b?.click();
        });
        if (IS_PH1) {
            await page.waitForSelector('text/Page 1 of', { timeout: 30000 });
            await page.waitForSelector('input[type="radio"]', { timeout: 30000 });
        }
        else {
            await page.waitForSelector('text/Scenario Details', { timeout: 30000 });
        }
        const currentUrl = page.url();
        expect(currentUrl.includes(`PROLIFIC_PID=${PROLIFIC_PID}`)).toBe(true);
    }, 60000);

    it('Clicking "I Do Not Agree" redirects to Prolific return URL', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=${PROLIFIC_PID}`);
        await page.waitForSelector('text/Consent Form', { timeout: 20000 });

        const waitForReturnHit = page.waitForRequest(req => req.url() === PROLIFIC_RETURN_URL, { timeout: 20000 });
        const clickDisagree = page.$$eval('button', btns => {
          const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Do Not Agree');
          b?.click();
        });
        await Promise.all([waitForReturnHit, clickDisagree]);
        
        await page.waitForNavigation({ waitUntil: 'load', timeout: 20000 }).catch(() => {});
        const finalUrl = page.url();
        expect(
          finalUrl.startsWith('https://app.prolific.com') ||
          finalUrl.startsWith('https://auth.prolific.com')
        ).toBe(true);
    }, 30000);

    it('any key combo during text scenario should have no effect on progress', async () => {
        await startCaciProlificSurvey(page);
        await pressAllKeys(page, IS_PH1 ? "Page 1 of" : "Scenario Details");
    }, 30000);

    it('text-scenario through CACI Prolific should be navigable and end with survey', async () => {
        await startCaciProlificSurvey(page);
        await completeTextScenarioAndReachSurvey(page, { isPhase1: IS_PH1 })
        // very long test because it connects to ST and ADEPT servers to send fake responses
    }, 80000000);

    it('any key combo during survey should have no effect on progress', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`);
        await agreeToProlificConsent(page);
        const startSurveyUrl = page.url();
        expect(startSurveyUrl.includes(`PROLIFIC_PID=${PROLIFIC_PID}`)).toBe(true);
        const maybeInstructions = await page.$('text/Instructions');
        expect(maybeInstructions).toBeNull();

        await waitForSurveyIntro(page);
        await pressAllKeys(page, 'In the final part of the study,');
    }, 100000);

    it('survey through CACI Prolific should be navigable', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`);
        await agreeToProlificConsent(page);
        await waitForSurveyIntro(page);
        await surveyFlowNavigateAndComplete(page, { isPhase1: IS_PH1 });
    }, 40000);

});
