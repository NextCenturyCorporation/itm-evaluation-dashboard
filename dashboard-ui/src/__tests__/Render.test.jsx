/**
 * @jest-environment puppeteer
 */

import { countElementsWithText } from "../__mocks__/testUtils";

describe('Test render', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    })
    it('app should render successfully', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);

        // Test that the login page is rendered and defaults to sign in page
        let currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('text=Sign In');

        // look through all elements for matching text
        const count = await countElementsWithText(page, "Sign In");

        expect(count).toBeGreaterThan(3); // tab, header, description, button
    });
});