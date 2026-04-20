import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/node_modules/**', '!**/dist/**', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@numerito/shared(.*)$': '<rootDir>/../../../packages/shared/dist$1',
    '^@mikro-orm/core$': '<rootDir>/__mocks__/mikro-orm-core.ts',
    '^@mikro-orm/postgresql$': '<rootDir>/__mocks__/mikro-orm-core.ts',
    '^@mikro-orm/nestjs$': '<rootDir>/__mocks__/mikro-orm-core.ts',
  },
};

export default config;
