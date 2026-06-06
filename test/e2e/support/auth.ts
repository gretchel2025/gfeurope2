import { expect, type Locator, type Page } from '@playwright/test';
import { e2eConfig, expectPath, requireAdminCredentials } from './e2eConfig';

export async function signInWithPassword(page: Page, redirectTo: string): Promise<void> {
	const credentials = requireAdminCredentials();
	await page.goto(`/signin?redirectTo=${encodeURIComponent(redirectTo)}`);

	const signOutButton = page.getByRole('button', { name: 'Sign out' }).first();
	if (await isVisible(signOutButton)) {
		await page.getByRole('link', { name: 'Continue' }).click();
		await expect(page).toHaveURL(expectPath('/admin'));
		if (page.url().includes('/admin') && redirectTo !== '/admin') {
			await page.goto(redirectTo);
		}
		await expect(page).toHaveURL(expectPath(redirectTo));
		return;
	}

	const emailLabel = e2eConfig.environment === 'local' ? /Local dev username|Email/i : /^Email$/i;
	await page.getByLabel(emailLabel).fill(credentials.email);
	await page.getByLabel('Password').fill(credentials.password);
	await page.getByRole('button', { name: 'Sign in with password' }).click();
	await expect(page).toHaveURL(expectPath(redirectTo), { timeout: 20_000 });
}

async function isVisible(locator: Locator): Promise<boolean> {
	try {
		await expect(locator).toBeVisible({ timeout: 500 });
		return true;
	} catch {
		return false;
	}
}
