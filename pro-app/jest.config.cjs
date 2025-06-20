/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'import.meta': {
      env: {
        VITE_API_HOST: 'http://localhost:8000'
      }
    }
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/tests/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/tests/fileMock.js',
    '^virtual:pwa-register/react': '<rootDir>/src/tests/pwaRegisterMock.js',
    '^../hooks/useIncidents$': '<rootDir>/src/tests/__mocks__/useIncidents.ts',
    '^./useIncidents$': '<rootDir>/src/tests/__mocks__/useIncidents.ts',
    '^../hooks/useTheme$': '<rootDir>/src/tests/__mocks__/useTheme.ts',
    '^./useTheme$': '<rootDir>/src/tests/__mocks__/useTheme.ts',
    '^./SettingsPage$': '<rootDir>/src/tests/__mocks__/SettingsPage.tsx',
    '^axios$': '<rootDir>/src/tests/__mocks__/axios.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.js'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      useESM: true
    }],
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/main.tsx',
  ],
};
