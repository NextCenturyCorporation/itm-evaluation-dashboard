/**
 * @jest-environment puppeteer
 */

async function testRouteRedirection(route, expectedRedirect = '/login') {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForSelector('text=Loading...', { hidden: true });
    const currentUrl = page.url();
    expect(currentUrl).toBe(`http://localhost:3000${expectedRedirect}`);
}

describe('Route Redirection and Access Control Tests', () => {

    it('test that non-admin cannot access anything', async () => {
        await page.goto('http://localhost:3000');

        await page.waitForSelector('text/Sign In'); // Jest-puppeteer specific selector for text

        // Retrieve the element and assert its presence
        const loginText = await page.$eval('body', (body) => {
            return body.textContent.includes('Sign in');
        });

        expect(loginText).toBe(true);

    });
    it('Test unsigned in user can access adept survey entry point', async () => {
        await page.goto('http://localhost:3000/remote-text-survey?adeptQualtrix=true');
        const currentUrl = await page.url();

        // Assert the URL
        expect(currentUrl).toBe('http://localhost:3000/remote-text-survey?adeptQualtrix=true');
    });
    const routes = [
        '/results',
        '/adm-results',
        '/adm-probe-responses',
        '/humanSimParticipant',
        '/scenarios',
        '/humanProbeData',
        '/human-results',
        '/research-results/rq1',
        '/research-results/rq2',
        '/research-results/rq3',
        '/research-results/exploratory-analysis',
        '/randomlink',
        '/survey',
        '/review-text-based',
        '/review-delegation',
        '/survey-results',
        '/text-based-results',
        '/admin',
        '/random-link'
    ];
    routes.forEach(route => {
        it(`redirects ${route} to login when not authenticated`, async () => {
            await testRouteRedirection(route);
        });
    });

});