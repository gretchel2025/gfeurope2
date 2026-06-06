import { defineConfig, devices } from '@playwright/test';
import { e2eConfig } from './test/e2e/support/e2eConfig';

export default defineConfig({
	testDir: './test/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: e2eConfig.baseURL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		testIdAttribute: 'data-testid'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
