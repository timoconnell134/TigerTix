// jest.config.js (root)
module.exports = {
    projects: [
        {
            displayName: 'backend',
            testEnvironment: 'node',
            testMatch: ['**/tests/**/?(*.)+(test).js'],
            testPathIgnorePatterns: ['/tests/frontend/', '/node_modules/', '/tmp-test-db/']
        },
        {
            displayName: 'frontend',
            testEnvironment: 'jsdom',
            testEnvironmentOptions: { url: 'http://localhost/' },
            testMatch: ['**/tests/frontend/**/?(*.)+(test).js'],
            setupFilesAfterEnv: ['@testing-library/jest-dom'],
            transform: {
                '^.+\\.(js|jsx)$': 'babel-jest'
            },
            moduleNameMapper: {
                // ✅ use the app’s copies to avoid duplicate Reacts
                '^react$': '<rootDir>/frontend/node_modules/react',
                '^react-dom$': '<rootDir>/frontend/node_modules/react-dom',
                '^react-dom/client$': '<rootDir>/frontend/node_modules/react-dom/client',
                // CSS stub
                '\\.(css|less|scss)$': '<rootDir>/tests/__mocks__/styleMock.js'
            },
            testPathIgnorePatterns: ['/node_modules/']
        }
    ],
    moduleFileExtensions: ['js', 'jsx', 'json'],
    collectCoverageFrom: [
        'backend/**/*.{js,jsx}',
        'frontend/src/**/*.{js,jsx}',
        '!**/node_modules/**'
    ],
    // optional but nice:
    roots: ['<rootDir>/tests']
};
