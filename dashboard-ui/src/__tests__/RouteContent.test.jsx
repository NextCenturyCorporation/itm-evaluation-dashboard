/**
 * @jest-environment puppeteer
 */

import { checkRouteContent, loginAdmin, createAccount, FOOTER_TEXT } from "../__mocks__/testUtils";


jest.setTimeout(330000);

describe('Verify content on page matches expectation for route', () => {
    // log in as admin
    beforeAll(async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`, { timeout: 300000 });
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await createAccount(page, 'admin', 'admin@123.com', 'secretAdminPassword123');
        await loginAdmin(page);
    }, 330000);

    it('Check /survey-results route content', async () => {
        await checkRouteContent(page, '/survey-results', ['Survey Complete', 'Survey Incomplete']);
        // can take a long time to load this page
    }, 330000);

    it('Check / route content', async () => {
        await checkRouteContent(page, '/', ['Program Questions', '1. Does alignment score predict measures of trust?']);
    });

    it('Check /survey route content', async () => {
        await checkRouteContent(page, '/survey', ['Enter Participant ID']);
        page = await browser.newPage();
        await page.goto(`${process.env.REACT_APP_TEST_URL}/`, { timeout: 300000 });
        await page.waitForSelector(FOOTER_TEXT);
    });

    it('Check /review-text-based route content', async () => {
        await checkRouteContent(page, '/review-text-based', ['Review Text-Based Scenarios', 'Select a configuration:', 'This page is for reviewing materials only']);
    });

    it('Check /review-delegation route content', async () => {
        await checkRouteContent(page, '/review-delegation', ['Review Delegation Materials', 'Select a configuration:', 'This page is for reviewing materials only']);
    });


    it('Check /text-based-results route content', async () => {
        await checkRouteContent(page, '/text-based-results', ['Text-Based Scenario Results', 'To view results, follow these steps:']);
    }, 330000);
    it('Check /humanSimParticipant route content', async () => {
        await checkRouteContent(page, '/humanSimParticipant', ['Participant-Level Data', 'YrsMilExp', 'Date']);
    }, 330000);
    it('Check /humanProbeData route content', async () => {
        await checkRouteContent(page, '/humanProbeData', ['Human Simulator Probe Data']);
    });
    it('Check /human-results route content', async () => {
        await checkRouteContent(page, '/human-results', ['Please select a scenario and participant to view results']);
    }, 330000);

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
        await checkRouteContent(page, '/research-results/exploratory-analysis', ['RQ4: Does alignment score predict perceived alignment?', 'RQ4 Data',
            'RQ8: Exploratory: How do the assessed attributes predict behavior in open triage scenarios?', 'RQ8 Data', 'Delegation Data by Block']);
    }, 330000);
    it('Check /myaccount route content', async () => {
        await checkRouteContent(page, '/myaccount', ['My Account', 'Manage your account settings', 'Username', 'admin', 'Email Address', 'admin@123.com', 'Confirm New Password']);
    });
    it('Check /admin route content', async () => {
        await checkRouteContent(page, '/admin', ['Admin Dashboard', 'Please confirm your identity before continuing', 'Username: admin']);
    });

    it('Admin Dashboard should require confirmation', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/admin`, { timeout: 300000 });
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('input[placeholder="Enter Password"]', { timeout: 300000 });
        const password = await page.$('input[placeholder="Enter Password"]');
        await password.type('secretAdminPassword123');
        await page.$$eval('.btn-primary', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Submit').click();
        });
        const expectedText = ['Admin Dashboard', 'Survey Version', 'Administrators', 'Evaluators', 'Experimenters', 'ADEPT Users']
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: 300000 });
        }
    }, 330000);

    it('Admin Dashboard should error on incorrect password', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/admin`, { timeout: 300000 });
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('input[placeholder="Enter Password"]', { timeout: 300000 });
        const password = await page.$('input[placeholder="Enter Password"]');
        await password.type('secretAdminPassword1234');
        await page.$$eval('.btn-primary', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Submit').click();
        });
        await page.waitForSelector(`.error-message`, { timeout: 300000 });
    }, 330000);
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
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`, { timeout: 300000 });
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Consent Form', { timeout: 300000 });
        await page.$$eval('button', btns => {
            Array.from(btns).find(btn => btn.innerText?.trim() === 'I Agree')?.click();
        });
        const expectedText = ['Instructions', 'Welcome to the ITM Text Scenario experiment', 'Guidelines:', 'Choose the option that best matches how you would triage the scenario'];
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: 300000 });
        }
    }, 330000);

});