module.exports = {
    launch: {
        headless: true,  // Set to `false` to see the browser window
        // slowMo: 25,       // Optional: Slow down actions to see what is happening
        defaultViewport: null,  // Optional: Fullscreen viewport
    },
    browserContext: 'default',
    server: {
        command: 'npm run start:test',
        port: 3001,
        launchTimeout: 120000
    },
    globalTeardown: './testTeardown.js',
};
