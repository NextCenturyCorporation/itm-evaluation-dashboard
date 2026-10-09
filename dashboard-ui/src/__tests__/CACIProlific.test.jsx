/**
 * @jest-environment puppeteer
 */

import { TEST_WAIT_TIMEOUT, SURVEY_STEP_TIMEOUT, LONG_TEST_TIMEOUT, pressAllKeys, startCaciProlificSurvey, waitForProlificEntry, agreeToProlificConsent, waitForSurveyIntro, surveyFlowNavigateAndComplete, completeTextScenarioAndReachSurvey, logPageDebug } from "../__mocks__/testUtils";

const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;
const PROLIFIC_PID = "ALS_test1210b";
const PROLIFIC_RETURN_URL = "https://app.prolific.com/submissions/complete?cc=C155IMPM";

const SURVEY_NAVIGATION_OPTIONS = {
    timeout: TEST_WAIT_TIMEOUT,
    waitUntil: 'domcontentloaded'
};

async function blockExternalRequests(page) {
    await page.setRequestInterception(true);

    page.on('request', request => {
        // Avoid Chromium document initialization stalls and exercise the
        // offline-scoring fallback; live ADEPT calls have their own test suite.
        if (request.url() === PROLIFIC_RETURN_URL ||
            /\/consent[^/]*\.pdf(?:\?|$)/.test(request.url()) ||
            request.url().startsWith(`${process.env.REACT_APP_ADEPT_URL}/api/v1/`)) {
            request.abort();
            return;
        }

        request.continue();
    });
}

jest.setTimeout(TEST_WAIT_TIMEOUT * 3);

describe('Test CACI Prolific entry method', () => {
    beforeEach(async () => {
        page = await browser.newPage();
        await blockExternalRequests(page);
    });

    it('/remote-text-survey?caciProlific=true preserves PROLIFIC_PID with optional consent', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=${PROLIFIC_PID}`, SURVEY_NAVIGATION_OPTIONS);
        if (await waitForProlificEntry(page)) {
            await page.waitForSelector('text/I Agree', { timeout: TEST_WAIT_TIMEOUT });
            await page.waitForSelector('text/I Do Not Agree', { timeout: TEST_WAIT_TIMEOUT });
            await pressAllKeys(page, 'Consent Form');
        }
        await agreeToProlificConsent(page);
        await page.waitForSelector('text/Instructions', { timeout: TEST_WAIT_TIMEOUT });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
            b?.click();
        });
        if (IS_PH1) {
            await page.waitForSelector('text/Page 1 of', { timeout: TEST_WAIT_TIMEOUT });
            await page.waitForSelector('input[type="radio"]', { timeout: TEST_WAIT_TIMEOUT });
        }
        else {
            await page.waitForSelector('text/Scenario Details', { timeout: TEST_WAIT_TIMEOUT });
        }
        const currentUrl = page.url();
        expect(currentUrl.includes(`PROLIFIC_PID=${PROLIFIC_PID}`)).toBe(true);
    });

    it('Clicking "I Do Not Agree" redirects to Prolific return URL when consent is shown', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=${PROLIFIC_PID}`, SURVEY_NAVIGATION_OPTIONS);
        if (!await waitForProlificEntry(page)) {
            expect(await page.$('text/I Do Not Agree')).toBeNull();
            return;
        }

        const waitForReturnHit = page.waitForRequest(
            req => req.url() === PROLIFIC_RETURN_URL,
            { timeout: SURVEY_STEP_TIMEOUT }
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
    });

    it('any key combo during text scenario should have no effect on progress', async () => {
        await startCaciProlificSurvey(page);
        await pressAllKeys(page, IS_PH1 ? "Page 1 of" : "Scenario Details");
    });

    it('text-scenario through CACI Prolific should be navigable and end with survey', async () => {
        await startCaciProlificSurvey(page);
        await completeTextScenarioAndReachSurvey(page, { isPhase1: IS_PH1 });
        // Allow extra time for the complete scenario and upload flow.
    }, LONG_TEST_TIMEOUT + 30000);

    it('any key combo during survey should have no effect on progress', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`, SURVEY_NAVIGATION_OPTIONS);
        await agreeToProlificConsent(page);
        const startSurveyUrl = page.url();
        expect(startSurveyUrl.includes(`PROLIFIC_PID=${PROLIFIC_PID}`)).toBe(true);
        const maybeInstructions = await page.$('text/Instructions');
        expect(maybeInstructions).toBeNull();

        await waitForSurveyIntro(page);
        await pressAllKeys(page, 'In the final part of the study,');
    });

    it('survey through CACI Prolific should be navigable', async () => {
        try {
            await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`, SURVEY_NAVIGATION_OPTIONS);
            await agreeToProlificConsent(page);
            await waitForSurveyIntro(page);

            const result = await surveyFlowNavigateAndComplete(page, { isPhase1: IS_PH1 });

            if (!IS_PH1) {
                expect(result).toBeDefined();
                expect(result.submitted).toBe(true);
            }
        }
        catch (error) {
            await logPageDebug(page, 'CACI Prolific final survey test failed');
            throw error;
        }
    });

});
