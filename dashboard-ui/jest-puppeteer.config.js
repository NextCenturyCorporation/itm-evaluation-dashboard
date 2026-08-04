module.exports = {
    launch: {
        headless: true, // Set to false to see the browser window
        // slowMo: 25, // Optional: Slow down actions to see what is happening
        defaultViewport: null, // Optional: Fullscreen viewport
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    },
    browserContext: 'incognito',
    server: {
        command: 'npm run start:test',
        port: process.env.REACT_APP_TEST_PORT,
        launchTimeout: 120000
    },
    globalTeardown: './testTeardown.js'
};