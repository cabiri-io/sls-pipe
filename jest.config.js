module.exports = {
  projects: [
    {
      displayName: 'Unit Tests',
      roots: ['<rootDir>/src'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest'
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
  ]
};
