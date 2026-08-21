/**
 * @jest-environment puppeteer
 */

import { checkRouteContent, loginAdmin, createAccount, FOOTER_TEXT } from "../__mocks__/testUtils";

const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;

describe('Verify content on page matches expectation for route', () => {
    // log in as admin
    beforeAll(async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await createAccount(page, 'admin', 'admin@123.com', 'secretAdminPassword123');
        await loginAdmin(page);
    }, 30000);

    it('Check /survey-results route content', async () => {
        await checkRouteContent(page, '/survey-results', ['Survey Complete', 'Survey Incomplete']);
        // can take a long time to load this page
    }, 30000);

    it('Check / route content', async () => {
        await checkRouteContent(page, '/', ['Program Questions', '1. Does alignment score predict measures of trust?']);
    }, 60000);

    it('Check /survey route content', async () => {
        await checkRouteContent(page, '/survey', ['Enter Participant ID']);
        page = await browser.newPage();
        await page.goto(`${process.env.REACT_APP_TEST_URL}/`);
        await page.waitForSelector(FOOTER_TEXT);
    });

    it('Check /review-text-based route content', async () => {
        await checkRouteContent(page, '/review-text-based', ['Review Text-Based Scenarios', 'Select a configuration:', 'This page is for reviewing materials only']);
    });

    it('Check /review-delegation route content', async () => {
        await checkRouteContent(page, '/review-delegation', ['Review Delegation Materials', 'Select a configuration:', 'This page is for reviewing materials only']);
    });


    it('Check /text-based-results route content', async () => {
        await checkRouteContent(page, '/text-based-results', ['Evaluation']);
    });
    it('Check /humanSimParticipant route content', async () => {
        await checkRouteContent(
            page,
            '/humanSimParticipant',
            ['Participant-Level Data', 'View Definitions', 'Download Participant Data'],
            IS_PH1
        );
    });
    it('Check /humanProbeData route content', async () => {
        await checkRouteContent(page, '/humanProbeData', ['Human Simulator Probe Data']);
    });
    it('Check /human-results route content', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/human-results`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('.human-results', { timeout: 30000 });
    });

    it('Check /results route content', async () => {
        // based off ph2 RQ2 table
        await checkRouteContent(page, '/results', ['Evaluation', 'Scenario'], IS_PH1);
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
        // Phase 1 version:
        if (IS_PH1) {
            await checkRouteContent(page, '/research-results/rq2', ['RQ2: Do aligned ADMs have the ability to tune to a subset of the attribute space?', 'RQ2.1 Data', 'RQ2.2 & 2.3 Data'], true);
        }
        else {
            // Phase 2 version:
            await checkRouteContent(page, '/research-results/rq2', ['RQ2: Do aligned ADMs have the ability to tune to a subset of the attribute space?', 'RQ2.2 & 2.3 Data']);
        }
    });
    it('Check /research-results/rq3 route content', async () => {
        await checkRouteContent(page, '/research-results/rq3', ['RQ3: Does alignment affect delegation preference for ADMs?', 'RQ3 Data']);
    });

    it('Check /research-results/exploratory-analysis route content', async () => {
        await checkRouteContent(
            page,
            '/research-results/exploratory-analysis',
            [
                'RQ5: To what extent does alignment score predict identical',
                'RQ6: Does attribute assessment in different formats produce the same results?',
                'RQ7: Exploratory: How do the attributes interact?'
            ],
            IS_PH1
        );
    });
    it('Check /myaccount route content', async () => {
        await checkRouteContent(page, '/myaccount', ['My Account', 'Manage your account settings', 'Username', 'admin', 'Email Address', 'admin@123.com', 'Confirm New Password']);
    });
    it('Check /admin route content', async () => {
        await checkRouteContent(page, '/admin', ['Admin Dashboard', 'Please confirm your identity before continuing', 'Username: admin']);
    });

    it('Admin Dashboard should require confirmation', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/admin`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('input[placeholder="Enter Password"]', { timeout: 30000 });
        await page.type('input[placeholder="Enter Password"]', 'secretAdminPassword123');
        await page.$$eval('.btn-primary', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Submit').click();
        });
        const expectedText = ['Admin Dashboard', 'Survey Version', 'Administrators', 'Evaluators', 'Experimenters', 'ADEPT Users']
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: 5000 });
        }
    });

    it('Admin Dashboard should error on incorrect password', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/admin`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('input[placeholder="Enter Password"]', { timeout: 30000 });
        await page.type('input[placeholder="Enter Password"]', 'secretAdminPassword1234');
        await page.$$eval('.btn-primary', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Submit').click();
        });
        await page.waitForSelector(`.error-message`, { timeout: 5000 });
    }, 15000);
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
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Consent Form', { timeout: 15000 });
        await page.$$eval('button', btns => {
            Array.from(btns).find(btn => btn.innerText?.trim() === 'I Agree')?.click();
        });
        const expectedText = ['Instructions', 'Welcome to the ITM Text Scenario experiment', 'Guidelines:', 'Choose the option that best matches how you would triage the scenario'];
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: 15000 });
        }
    }, 30000);

});