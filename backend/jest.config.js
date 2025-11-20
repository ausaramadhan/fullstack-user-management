/** @type {import('ts-jest').JestConfigWithKs} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  // Abaikan config database di test
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/config/",
    "/server.ts"
  ]
};