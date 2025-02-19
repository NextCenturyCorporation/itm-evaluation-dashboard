module.exports = {
    transform: {
        '^.+\\.[t|j]sx?$': 'babel-jest',  // Use babel-jest to transform JS/JSX files
    },
    testEnvironment: 'jsdom', // Use jsdom for browser-like environment
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: [
        '@testing-library/jest-dom/extend-expect', // Optional: For better DOM assertions
        '<rootDir>/src/setupTests.js'
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!query-string)/',  // This will allow transformation of query-string
        "/node_modules/(?!@adobe/css-tools)/"
    ],
    moduleNameMapper: {
        '\\.css$': 'identity-obj-proxy', // Mock CSS imports with identity-obj-proxy
        '\\.(xlsx|pdf|docx|png|R)$': '<rootDir>/src/__mocks__/fileMock.js', // Mock .xlsx, .pdf, .docx, .png, and .R files
    },
    preset: 'jest-puppeteer',
    maxWorkers: 1,
    globals: {
        "process.env": {
            "REACT_APP_TESTING": "true"
        }
    },
    silent: false
};
