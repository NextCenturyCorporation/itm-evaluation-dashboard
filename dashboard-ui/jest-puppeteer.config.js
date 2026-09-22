module.exports = {
    launch: {
        headless: true, // Set to false to see the browser window
        // slowMo: 25, // Optional: Slow down actions to see what is happening
        defaultViewport: null, // Optional: Fullscreen viewport

        // Required for Chromium inside the Docker test container
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],

        // Bound individual Chrome DevTools protocol operations while still
        // allowing slower Docker/dev-server responses.
        protocolTimeout: 120000
    },

    browserContext: 'incognito',

    server: {
        command: 'npm run start:test',
        port: process.env.REACT_APP_TEST_PORT,

        // Startup can be substantially slower on the dev server than locally.
        launchTimeout: 180000
    },

    globalTeardown: './testTeardown.js'
};