import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./src/__tests__/e2e",
	timeout: 30000,
	retries: 1,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
		headless: true,
	},
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 30000,
	},
});
