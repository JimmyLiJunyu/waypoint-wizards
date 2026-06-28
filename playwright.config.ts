import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
});
