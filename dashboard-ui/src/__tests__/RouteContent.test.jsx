/**
 * @jest-environment puppeteer
 */

import { TEST_WAIT_TIMEOUT, LONG_TEST_TIMEOUT, checkRouteContent, checkRouteSelector, loginAdmin, createAccount, FOOTER_TEXT } from "../__mocks__/testUtils";


jest.setTimeout(LONG_TEST_TIMEOUT);

describe('Verify content on page matches expectation for route', () => {
    // log in as admin
    beforeAll(async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`, { timeout: TEST_WAIT_TIMEOUT });
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await createAccount(page, 'admin', 'admin@123.com', 'secretAdminPassword123');
        await loginAdmin(page);
    });

    it('Check /survey-results route content', async () => {
        await checkRouteContent(page, '/survey-results', ['Survey Complete', 'Survey Incomplete']);
        // can take a long time to load this page
    });

    it('Check / route content', async () => {
        await checkRouteContent(page, '/', ['Program Questions', '1. Does alignment score predict measures of trust?']);
    });

    it('Check /survey route content', async () => {
        await checkRouteContent(page, '/survey', ['Enter Participant ID']);
        page = await browser.newPage();
        await page.goto(`${process.env.REACT_APP_TEST_URL}/`, { timeout: TEST_WAIT_TIMEOUT });
        await page.waitForSelector(FOOTER_TEXT);
    });

    it('Check /review-text-based route content', async () => {
        await checkRouteContent(page, '/review-text-based', ['Review Text-Based Scenarios', 'Select a configuration:', 'This page is for reviewing materials only']);
    });

    it('Check /review-delegation route content', async () => {
        await checkRouteContent(page, '/review-delegation', ['Review Delegation Materials', 'Select a configuration:', 'This page is for reviewing materials only']);
    });


    it('Check /text-based-results route content', async () => {
        await checkRouteSelector(page, '/text-based-results', '.text-results');
    });
    it('Check /humanSimParticipant route content', async () => {
        await checkRouteSelector(page, '/humanSimParticipant', '.aggregatePage', ['View Definitions', 'Download Participant Data']);
    });
    it('Check /humanProbeData route content', async () => {
        await checkRouteSelector(page, '/humanProbeData', '.aggregatePage');
    });
    it('Check /human-results route content', async () => {
        await checkRouteSelector(page, '/human-results', '.human-results');
    });

    it('Check /results route content', async () => {
        // based off ph2 RQ2 table
        await checkRouteContent(page, '/results', ['Evaluation', 'Scenario']);
    });
    it('Check /adm-results route content', async () => {
        // TODO: find how to check this a little better (more unique)
        await checkRouteContent(page, '/adm-results', ['Evaluation:']);
    });
    it('Check /adm-probe-responses route content', async () => {
        // TODO: find how to check this a little better (more unique)
        await checkRouteContent(page, '/adm-probe-responses', ['Evaluation', 'Scenario']);
    });

    it('Check /research-results/rq1 route content', async () => {
        await checkRouteContent(page, '/research-results/rq1', ['RQ1: Does alignment score predict measures of trust?', 'RQ1 Data']);
    });
    it('Check /research-results/rq2 route content', async () => {
        await checkRouteContent(page, '/research-results/rq2', ['RQ2: Do aligned ADMs have the ability to tune to a subset of the attribute space?', 'RQ2.2 & 2.3 Data']);
    });
    it('Check /research-results/rq3 route content', async () => {
        await checkRouteContent(page, '/research-results/rq3', ['RQ3: Does alignment affect delegation preference for ADMs?', 'RQ3 Data']);
    });

    it('Check /research-results/exploratory-analysis route content', async () => {
        await checkRouteSelector(page, '/research-results/exploratory-analysis', '.researchQuestion');
    });
    it('Check /myaccount route content', async () => {
        await checkRouteContent(page, '/myaccount', ['My Account', 'Manage your account settings', 'Username', 'admin', 'Email Address', 'admin@123.com', 'Confirm New Password']);
    });
    it('Check /admin route content', async () => {
        await checkRouteContent(page, '/admin', ['Admin Dashboard', 'Please confirm your identity before continuing', 'Username: admin']);
    });

    it('Admin Dashboard should require confirmation', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/admin`, { timeout: TEST_WAIT_TIMEOUT });
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('input[placeholder="Enter Password"]', { timeout: TEST_WAIT_TIMEOUT });
        const password = await page.$('input[placeholder="Enter Password"]');
        await password.type('secretAdminPassword123');
        await page.$$eval('.btn-primary', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Submit').click();
        });
        const expectedText = ['Admin Dashboard', 'Survey Version', 'Administrators', 'Evaluators', 'Experimenters', 'ADEPT Users']
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: TEST_WAIT_TIMEOUT });
        }
    });

    it('Admin Dashboard should error on incorrect password', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/admin`, { timeout: TEST_WAIT_TIMEOUT });
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('input[placeholder="Enter Password"]', { timeout: TEST_WAIT_TIMEOUT });
        const password = await page.$('input[placeholder="Enter Password"]');
        await password.type('secretAdminPassword1234');
        await page.$$eval('.btn-primary', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Submit').click();
        });
        await page.waitForSelector(`.error-message`, { timeout: TEST_WAIT_TIMEOUT });
    });
    it('Check /participant-progress-table route content', async () => {
        await checkRouteContent(page, '/participant-progress-table', ['Participant Progress', 'Prolific ID']);
    });
    it('Check /pid-lookup route content', async () => {
        await checkRouteContent(page, '/pid-lookup', ['Find Participant ID', 'Find PID', 'To get the participant\'s PID, enter their email address']);
    });
    it('Check /participantTextTester route content', async () => {
        await checkRouteContent(page, '/participantTextTester', ['Text Scenario Login', 'Home', 'Start Text Scenario', 'The experimenters will not have access to your email']);
    });
    it('Check /remote-text-survey route content', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`, {
            timeout: TEST_WAIT_TIMEOUT,
            waitUntil: 'domcontentloaded'
        });
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Consent Form', { timeout: TEST_WAIT_TIMEOUT });
        await page.$$eval('button', btns => {
            Array.from(btns).find(btn => btn.innerText?.trim() === 'I Agree')?.click();
        });
        const expectedText = ['Instructions', 'Welcome to the ITM Text Scenario experiment', 'Guidelines:', 'Choose the option that best matches how you would triage the scenario'];
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: TEST_WAIT_TIMEOUT });
        }
    });

});