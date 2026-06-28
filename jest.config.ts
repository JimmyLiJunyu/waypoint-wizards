import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/unit/**/*.test.ts",
    "**/__tests__/integration/**/*.test.ts",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!(jose)/)",
  ],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": ["ts-jest", { tsconfig: { allowJs: true } }],
  },
};

export default config;
