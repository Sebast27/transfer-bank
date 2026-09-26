module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.entity.ts',
        '!src/**/*.port.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: './coverage',
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
        },
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '<rootDir>/test/**/*.spec.ts',
        '<rootDir>/test/**/*.e2e-spec.ts',
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],
};