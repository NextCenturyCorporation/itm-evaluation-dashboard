/**
 * @jest-environment puppeteer
 */

import { pressAllKeys, takePhase1TextScenario, takePhase2TextScenario, startCaciProlificSurvey, agreeToProlificConsent } from "../__mocks__/testUtils";

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
        await page.waitForSelector('text/Instructions', { timeout: 20000 });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
            b?.click();
        });
        await page.waitForSelector(`text/${IS_PH1 ? 'Assess the shooter' : 'Scenario Details'}`, { timeout: 30000 });
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
        await pressAllKeys(page, IS_PH1 ? "Assess the shooter" : "Scenario Details");
    }, 30000);

    it('text-scenario through CACI Prolific should be navigable and end with survey', async () => {
        await startCaciProlificSurvey(page);
        if (IS_PH1) {
            await takePhase1TextScenario(page);
        } else {
            await takePhase2TextScenario(page);
        }
        await page.waitForSelector('text/Please do not close your browser', { timeout: 500 });
        await page.waitForSelector('text/In the final part of the study,', { timeout: 10000000 });
        await pressAllKeys(page, 'In the final part of the study,');
        // very long test because it connects to ST and ADEPT servers to send fake responses
    }, 80000000);

    it('any key combo during survey should have no effect on progress', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`);
        await agreeToProlificConsent(page);
        await page.waitForSelector('text/In the final part of the study,', { timeout: 500 });
        await pressAllKeys(page, 'In the final part of the study,');
    }, 100000);

    it('survey through CACI Prolific should be navigable', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&startSurvey=true&PROLIFIC_PID=${PROLIFIC_PID}&pid=123`);
        await agreeToProlificConsent(page);
        await page.waitForSelector('text/In the final part of the study,', { timeout: 500 });
        await page.$$eval('input', buttons => {
            Array.from(buttons).find(btn => btn.value == 'Next').click();
        });

        // phase 1 only
        if (IS_PH1) {
            await page.waitForSelector('text/Note that in some scenarios', { timeout: 50000 });
            await page.$$eval('input', buttons => {
                Array.from(buttons).find(btn => btn.value == 'Next').click();
            });
            await page.waitForSelector('text/Situation', { timeout: 500 });
            let pageNum = 3;
            let medics = 0;
            while (medics < 3) {
                await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 500 });
                await page.focus('input[type="radio"]');
                for (let i = 0; i < 4; i++) {
                    await page.keyboard.press(' ');
                    await page.keyboard.press('Tab');
                }
                await page.$$eval('input', buttons => {
                    Array.from(buttons).find(btn => btn.value == 'Next').click();
                });
                medics += 1;
                pageNum += 1;
            }
            // reached comparison page!
            await page.waitForSelector('text/Medic-B21 vs Medic-V17', { timeout: 500 });
            await page.waitForSelector('text/Medic-B16 vs Medic-B21', { timeout: 500 });
            await page.focus('input[type="radio"]');
            // two MC followed by short answer, twice
            for (let i = 0; i < 2; i++) {
                await page.keyboard.press(' ');
                await page.keyboard.press('Tab');
                await page.keyboard.press(' ');
                await page.keyboard.press('Tab');
                await page.keyboard.press('m');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
            }
            await page.$$eval('input', buttons => {
                Array.from(buttons).find(btn => btn.value == 'Next').click();
            });
        }
        // reached post-scenario measures
        await page.waitForSelector('text/What was the biggest influence on your delegation decision between different medics?', { timeout: 500 });
        // answer short-text question
        await page.keyboard.press('Tab');
        await page.keyboard.press('m');
        // answer initial radio questions
        for (let i = 0; i < 9; i++) {
            await page.keyboard.press('Tab');
            await page.keyboard.press(' ');
        }
        // skip past roles
        for (let i = 0; i < (IS_PH1 ? 8 : 9); i++) {
            await page.keyboard.press('Tab');
        }

        if (!IS_PH1) {
        // phase 2
            await page.keyboard.press('m');
            // answer the rest
            for (let i = 0; i < 5; i++) {
                await page.keyboard.press('Tab');
                await page.keyboard.press(' ');
            }
            // skip past roles
            for (let i = 0; i < 7; i++) {
                await page.keyboard.press('Tab');
            }
            for (let i = 0; i < 2; i++) {
                await page.keyboard.press('Tab');
                await page.keyboard.press(' ');
            }
            await page.keyboard.press('m');
            for (let i = 0; i < 2; i++) {
                await page.keyboard.press('Tab');
                await page.keyboard.press(' ');
            }
            // skip past environments
            for (let i = 0; i < 7; i++) {
                await page.keyboard.press('Tab');
            }
        }
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('Tab');
            await page.keyboard.press(' ');
        }
        // don't leave to the external form, stay here!
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('');
            await dialog.dismiss();
        });
        await page.$$eval('input', buttons => {
            Array.from(buttons).find(btn => btn.value == 'Complete').click();
        });
        await page.waitForSelector('text/Thank you for completing the survey', { timeout: 50000 });
    }, 40000);

});
