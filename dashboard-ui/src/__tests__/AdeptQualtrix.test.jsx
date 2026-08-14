/**
 * @jest-environment puppeteer
 */

import { pressAllKeys, startAdeptQualtrixSurvey } from "../__mocks__/testUtils"


describe('Test adept qualtrix entry method', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    }, 30000);

    it('/remote-text-survey?adeptQualtrix=true should generate online PID', async () => {
        await startAdeptQualtrixSurvey(page);
        const currentUrl = page.url();
        const pid = currentUrl.split('pid=').slice(-1)[0].split('&')[0];
        expect(pid).toBeTruthy();
        expect(Number.isInteger(Number(pid))).toBe(true);
        expect(Number(pid)).toBeGreaterThanOrEqual(0);
    });

    it('Each login to /remote-text-survey?adeptQualtrix=true should generate a valid PID', async () => {
        for (let i = 0; i < 2; i++) {
            page = await browser.newPage();
            await startAdeptQualtrixSurvey(page);
            const currentUrl = page.url();
            const pid = currentUrl.split('pid=').slice(-1)[0].split('&')[0];

            expect(pid).toBeTruthy();
            expect(Number.isInteger(Number(pid))).toBe(true);
            expect(Number(pid)).toBeGreaterThanOrEqual(0);
        }
    }, 30000);

    it('any key combo during text scenario should have no effect on progress', async () => {
        await startAdeptQualtrixSurvey(page);
        await pressAllKeys(page, "Scenario Details");
    }, 30000);

});