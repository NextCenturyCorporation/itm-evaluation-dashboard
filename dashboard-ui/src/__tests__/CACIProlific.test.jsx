/**
 * @jest-environment puppeteer
 */

import { pressAllKeys, takePhase1TextScenario, takePhase2TextScenario, startCaciProlificSurvey, agreeToProlificConsent, waitForSurveyIntro, surveyFlowNavigateAndComplete, completeTextScenarioAndReachSurvey, logPageDebug } from "../__mocks__/testUtils";

const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;
const PROLIFIC_PID = "ALS_test1210b";
const PROLIFIC_RETURN_URL = "https://app.prolific.com/submissions/complete?cc=C155IMPM";

jest.setTimeout(330000);

describe('Test CACI Prolific entry method', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    }, 330000);

    it('/remote-text-survey?caciProlific=true shows consent and preserves PROLIFIC_PID', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=${PROLIFIC_PID}`, { timeout: 300000 });
        await page.waitForSelector('text/Consent Form', { timeout: 300000 });
        await page.waitForSelector('text/I Agree', { timeout: 300000 });
        await page.waitForSelector('text/I Do Not Agree', { timeout: 300000 });
        await pressAllKeys(page, 'Consent Form');
        await page.waitForSelector('text/Consent Form', { timeout: 300000 });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
            b?.click();
        });
        await page.waitForSelector('text/Instructions', { timeout: 300000 });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
            b?.click();
        });
        if (IS_PH1) {
            await page.waitForSelector('text/Page 1 of', { timeout: 300000 });
            await page.waitForSelector('input[type="radio"]', { timeout: 300000 });
        }
        else {
            await page.waitForSelector('text/Scenario Details', { timeout: 300000 });
        }
        const currentUrl = page.url();
        expect(currentUrl.includes(`PROLIFIC_PID=${PROLIFIC_PID}`)).toBe(true);
    }, 330000);

    it('Clicking "I Do Not Agree" redirects to Prolific return URL', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=${PROLIFIC_PID}`, { timeout: 300000 });
        await page.waitForSelector('text/Consent Form', { timeout: 300000 });

        const waitForReturnHit = page.waitForRequest(
            req => req.url() === PROLIFIC_RETURN_URL,
            { timeout: 300000 }
        );

        const clickDisagree = page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Do Not Agree');
            b?.click();
        });

        const [returnRequest] = await Promise.all([waitForReturnHit, clickDisagree]);

        // The outbound request is the behavior this test owns. In headless Docker,
        // Prolific may redirect Chromium again, so the eventual browser URL is not
        // a stable assertion.
        expect(returnRequest.url()).toBe(PROLIFIC_RETURN_URL);
        console.log(`[TEST DEBUG] Prolific decline request URL: ${returnRequest.url()}`);
        console.log(`[TEST DEBUG] Browser URL after Prolific decline: ${page.url()}`);
    }, 330000);

    it('any key combo during text scenario should have no effect on progress', async () => {
        await startCaciProlificSurvey(page);
        await pressAllKeys(page, IS_PH1 ? "Page 1 of" : "Scenario Details");
    }, 330000);

    it('text-scenario through CACI Prolific should be navigable and end with survey', async () => {
        await startCaciProlificSurvey(page);
        await completeTextScenarioAndReachSurvey(page, { isPhase1: IS_PH1 })
        // very long test because it connects to ST and ADEPT servers to send fake responses
    }, 330000);

    it('any key combo during survey should have no effect on progress', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`, { timeout: 300000 });
        await agreeToProlificConsent(page);
        const startSurveyUrl = page.url();
        expect(startSurveyUrl.includes(`PROLIFIC_PID=${PROLIFIC_PID}`)).toBe(true);
        const maybeInstructions = await page.$('text/Instructions');
        expect(maybeInstructions).toBeNull();

        await waitForSurveyIntro(page);
        await pressAllKeys(page, 'In the final part of the study,');
    }, 330000);

    it('survey through CACI Prolific should be navigable', async () => {
        try {
            await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`, { timeout: 300000 });
            await agreeToProlificConsent(page);
            await waitForSurveyIntro(page);

            const result = await surveyFlowNavigateAndComplete(page, { isPhase1: IS_PH1 });

            if (!IS_PH1) {
                expect(result).toBeDefined();
                expect(result.submitted).toBe(true);
                console.log(`[TEST DEBUG] Phase 2 survey submission detected. navigationStarted=${result.navigationStarted}`);
            }
        }
        catch (error) {
            await logPageDebug(page, 'CACI Prolific final survey test failed');
            throw error;
        }
    }, 330000);

});
