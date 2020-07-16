// eslint-disable-next-line import/no-extraneous-dependencies
const { defaults } = require('jest-config')

module.exports = {
  testEnvironment: 'node',
  testMatch: null,
  // https://github.com/kulshekhar/ts-jest/issues/1343
  // https://github.com/kulshekhar/ts-jest/issues/1134
  transform: {
    '.ts': require.resolve('ts-jest')
  },
  testRegex: '/__tests__/.*\\.test\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  setupFilesAfterEnv: ['jest-extended'],
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.json'
    }
  }
}
