module.exports = {
  rootDir: '.',
  cacheDirectory: '<rootDir>/../../.cache/jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/test/database/'],
  setupFiles: ['<rootDir>/test/setup.cjs'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  clearMocks: true,
  testTimeout: 20000,
};
