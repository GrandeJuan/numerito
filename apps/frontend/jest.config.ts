import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testRegex: '.*\\.spec\\.tsx?$',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
