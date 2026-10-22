module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/performance-tests/**/*.test.[jt]s?(x)'],
    transform: { '^.+\\.[jt]sx?$': ['babel-jest', {
        configFile: false, presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-react']
    }] },
    moduleNameMapper: { '\\.css$': '<rootDir>/performance-tests/styleMock.js' },
    testTimeout: 60000,
    maxWorkers: 1
};
