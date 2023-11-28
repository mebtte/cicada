import { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'shared',
      rootDir: './shared',
    },
    {
      displayName: 'cli',
      rootDir: './apps/cli',
    },
    {
      displayName: 'pwa',
      rootDir: './apps/pwa',
      moduleNameMapper: {
        '^#/(.*)': `${__dirname}/shared/$1`,
        '^@/(.*)': '<rootDir>/src/$1',
      },
      testEnvironment: 'jest-environment-jsdom',
      globals: {
        __DEFINE__: {
          BUILD_TIME: new Date(),
          WITH_SW: false,
        },
      },
    },
  ],
};

export default config;
