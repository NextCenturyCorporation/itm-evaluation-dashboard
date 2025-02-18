/**
 * @jest-environment puppeteer
 */

import { FOOTER_TEXT, loginAdmin } from "../__mocks__/testUtils";


describe('Verify content on page matches expectation for route', () => {
    // log in as admin
    beforeAll(async () => {
        await loginAdmin(page);
    }, 30000);

    it('Check /login route content', async () => {
        // will fail because there is no /login when logged in as admin
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Sign in', { timeout: 500 });
    });
});