// jest.config.js (root)
module.exports = {
    projects: [
        //  Backend tests (Node)
        {
            displayName: 'backend',
            testEnvironment: 'node',
            testMatch: ['**/tests/**/?(*.)+(test).js'],
            testPathIgnorePatterns: [
                '/tests/frontend/',  // don't run frontend tests in this project
                '/node_modules/',
                '/tmp-test-db/'
            ]
        },

        //  Frontend tests (React + jsdom)
        {
            displayName: 'frontend',
            testEnvironment: 'jsdom',
            testEnvironmentOptions: { url: 'http://localhost/' },
            testMatch: ['**/tests/frontend/**/?(*.)+(test).js'],
            setupFilesAfterEnv: [
                '@testing-library/jest-dom',
                '<rootDir>/tests/frontend/jest-setup-env.js'
            ],
            transform: {
                '^.+\\.(js|jsx)$': 'babel-jest'
            },
            moduleNameMapper: {
                '^react$': '<rootDir>/frontend/node_modules/react',
                '^react-dom$': '<rootDir>/frontend/node_modules/react-dom',
                '^react-dom/client$': '<rootDir>/frontend/node_modules/react-dom/client',
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
    roots: ['<rootDir>/tests']
};
