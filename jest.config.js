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
        '!src/**/user.decorator.ts',
        '!src/presentation/controllers/auth.controller.ts',
        '!src/presentation/controllers/transfer.controller.ts',
    ],
    coverageDirectory: './coverage',
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
        './src/core/**/*.ts': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '<rootDir>/test/unit/**/*.spec.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],
};