/**
 * @jest-environment puppeteer
 */

import { FOOTER_TEXT, HOME_TEXT, login, loginAdmin, logout, useMenuNavigation } from "../__mocks__/testUtils";

describe('Ensure navigation dropdowns lead to the correct route', () => {
    // log in as admin
    beforeAll(async () => {
        await loginAdmin(page);
    }, 30000);

    it('[Data Collection -> Take Delegation Survey] dropdown should navigate to /survey', async () => {
        await useMenuNavigation(page, 'Data Collection', 'Take Delegation Survey', '/survey');
        page = await browser.newPage();
        page.goto(`${process.env.REACT_APP_TEST_URL}/`);
        await page.waitForSelector(FOOTER_TEXT);
    });
    it('[Data Collection -> Review Text Scenarios] dropdown should navigate to /review-text-based', async () => {
        await useMenuNavigation(page, 'Data Collection', 'Review Text Scenarios', '/review-text-based');
    });
    it('[Data Collection -> Review Delegation Survey] dropdown should navigate to /review-delegation', async () => {
        await useMenuNavigation(page, 'Data Collection', 'Review Delegation Survey', '/review-delegation');
    });

    it('[Human Evaluation Segments -> Delegation Survey Results] dropdown should navigate to /survey-results', async () => {
        await useMenuNavigation(page, 'Human Evaluation Segments', 'Delegation Survey Results', '/survey-results');
    });
    it('[Human Evaluation Segments -> Text Scenario Results] dropdown should navigate to /text-based-results', async () => {
        await useMenuNavigation(page, 'Human Evaluation Segments', 'Text Scenario Results', '/text-based-results');
    });
    it('[Human Evaluation Segments -> Human Participant Data: Within-Subjects Analysis] dropdown should navigate to /humanSimParticipant', async () => {
        await useMenuNavigation(page, 'Human Evaluation Segments', 'Human Participant Data: Within-Subjects Analysis', '/humanSimParticipant');
    });
    it('[Human Evaluation Segments -> Human Sim Probe Data] dropdown should navigate to /humanProbeData', async () => {
        await useMenuNavigation(page, 'Human Evaluation Segments', 'Human Sim Probe Data', '/humanProbeData');
    });
    it('[Human Evaluation Segments -> Play by Play: Humans in Sim] dropdown should navigate to /human-results', async () => {
        await useMenuNavigation(page, 'Human Evaluation Segments', 'Play by Play: Humans in Sim', '/human-results');
    });

    it('[ADM Evaluation Segments -> ADM Data] dropdown should navigate to /results', async () => {
        await useMenuNavigation(page, 'ADM Evaluation Segments', 'ADM Data', '/results');
    });
    it('[ADM Evaluation Segments -> ADM Alignment Results] dropdown should navigate to /adm-results', async () => {
        await useMenuNavigation(page, 'ADM Evaluation Segments', 'ADM Alignment Results', '/adm-results');
    });
    it('[ADM Evaluation Segments -> ADM Probe Responses] dropdown should navigate to /adm-probe-responses', async () => {
        await useMenuNavigation(page, 'ADM Evaluation Segments', 'ADM Probe Responses', '/adm-probe-responses');
    });

    it('[Data Analysis -> RQ1] dropdown should navigate to /research-results/rq1', async () => {
        await useMenuNavigation(page, 'Data Analysis', 'RQ1', '/research-results/rq1');
    });
    it('[Data Analysis -> RQ2] dropdown should navigate to /research-results/rq2', async () => {
        await useMenuNavigation(page, 'Data Analysis', 'RQ2', '/research-results/rq2');
    });
    it('[Data Analysis -> RQ3] dropdown should navigate to /research-results/rq3', async () => {
        await useMenuNavigation(page, 'Data Analysis', 'RQ3', '/research-results/rq3');
    });
    it('[Data Analysis -> Exploratory Analysis] dropdown should navigate to /research-results/exploratory-analysis', async () => {
        await useMenuNavigation(page, 'Data Analysis', 'Exploratory Analysis', '/research-results/exploratory-analysis');
    });

    it('[user menu -> My Account] dropdown should navigate to /myaccount', async () => {
        await useMenuNavigation(page, '', 'My Account', '/myaccount', true);
    });
    it('[user menu -> Administrator] dropdown should navigate to /admin', async () => {
        await useMenuNavigation(page, '', 'Administrator', '/admin', true);
    });
    it('[user menu -> Progress Table] dropdown should navigate to /participant-progress-table', async () => {
        await useMenuNavigation(page, '', 'Progress Table', '/participant-progress-table', true);
    });
    it('[user menu -> PID Lookup] dropdown should navigate to /pid-lookup', async () => {
        await useMenuNavigation(page, '', 'PID Lookup', '/pid-lookup', true);
    });
    it('[user menu -> Test Text Scenario] dropdown should navigate to /participantTextTester', async () => {
        await useMenuNavigation(page, '', 'Test Text Scenario', '/participantTextTester', true);
    });

});