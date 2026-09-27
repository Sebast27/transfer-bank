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
        '!src/**/types/*.ts',
        '!src/**/health.controller.ts',
    ],
    coverageDirectory: './coverage',
    coverageThreshold: {
        global: {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './src/core/**/*.ts': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
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