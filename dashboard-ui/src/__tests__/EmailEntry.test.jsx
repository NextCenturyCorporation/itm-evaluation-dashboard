/**
 * @jest-environment puppeteer
 */

import { countElementsWithText } from "../__mocks__/testUtils";

let firstPid = 0;

describe('Test email-entry text scenarios', () => {

    it('/participantText should only have email-entry option', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('text=Text Scenario Login');
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/participantText`);

        let count = await countElementsWithText(page, "Sign In");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Create Account");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Text Scenario Login");
        expect(count).toBeGreaterThan(0);
    }, 30000);

    it('/participantText should error on non-duplicate email', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('test@12.com');
        // will time out if this element is not found
        await page.waitForSelector('text=Email Mismatch');
    }, 30000);

    it('/participantText should not error on matching email (case insensitive)', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('T');
        let count = await countElementsWithText(page, "Email Mismatch");
        expect(count).toBeGreaterThan(0);
        await email2.type('esT@123.com');
        count = await countElementsWithText(page, "Email Mismatch");
        expect(count).toBe(0);
    }, 30000);

    it('matching emails on /participantText should navigate to /text-based', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('tester@123.com');
        await email2.type('tester@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        firstPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
    }, 30000);

    it('new email entry on /participantText should generate new PID', async () => {
        page = await browser.newPage();
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('tester1@123.com');
        await email2.type('TESTER1@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        const thisPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
        expect(thisPid).not.toBe(firstPid);
    }, 30000);

    it('duplicate email entry on /participantText should generate duplicate PID', async () => {
        page = await browser.newPage();
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('tester@123.com');
        await email2.type('TESTER@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        const thisPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
        expect(thisPid).toBe(firstPid);
    }, 30000);
});