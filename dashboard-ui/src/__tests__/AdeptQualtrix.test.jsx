/**
 * @jest-environment puppeteer
 */

import { pressAllKeys, startAdeptQualtrixSurvey, takeTextScenario } from "../__mocks__/testUtils";
import { isDefined } from "../components/AggregateResults/DataFunctions";


describe('Test adept qualtrix entry method', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    }, 30000);

    it('/remote-text-survey?adeptQualtrix=true should generate online PID', async () => {
        await startAdeptQualtrixSurvey(page);
        const currentUrl = page.url();
        const pid = currentUrl.split('pid=').slice(-1)[0].split('&')[0];
        expect(pid).toBe('202411500');
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
        await pressAllKeys(page, 'Treat Casualty O with');
    }, 30000);

    it('text-scenario through ADEPT Qualtrix should be navigable and end with survey', async () => {
        await startAdeptQualtrixSurvey(page);
        await takeTextScenario(page);
        await page.waitForSelector('text/Please do not close your browser', { timeout: 500 });
        await page.waitForSelector('text/In the final part of the study,', { timeout: 10000000 });
        await pressAllKeys(page, 'In the final part of the study,');
        // very long test because it connects to ST and ADEPT servers to send fake responses
    }, 1000000);

    it('any key combo during survey should have no effect on progress', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true&startSurvey=true&pid=123`);
        await page.waitForSelector('text/In the final part of the study,', { timeout: 500 });
        await pressAllKeys(page, 'In the final part of the study,');
    });

    it('survey through ADEPT Qualtrix should be navigable', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true&startSurvey=true&pid=123`);
        await page.waitForSelector('text/In the final part of the study,', { timeout: 500 });
        await page.$$eval('input', buttons => {
            Array.from(buttons).find(btn => btn.value == 'Next').click();
        });
        await page.waitForSelector('text/Note that in some scenarios', { timeout: 500 });
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
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press('Tab');
        }
        // answer the rest
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('Tab');
            await page.keyboard.press(' ');
        }
        // don't leave to the adept qualtrix form, stay here!
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