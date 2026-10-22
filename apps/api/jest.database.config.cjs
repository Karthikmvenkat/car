module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: ['<rootDir>/test/database/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
};
