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

        // Allow Puppeteer operations up to 5 minutes
        protocolTimeout: 300000
    },

    browserContext: 'incognito',

    server: {
        command: 'npm run start:test',
        port: process.env.REACT_APP_TEST_PORT,

        // Allow the test server up to 5 minutes to start
        launchTimeout: 300000
    },

    globalTeardown: './testTeardown.js'
};