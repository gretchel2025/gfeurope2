import { expect, test } from '@playwright/test';
import { adminEventPath, e2eConfig, expectPath } from './support/e2eConfig';
import { signInWithPassword } from './support/auth';

test.describe('authenticated admin read-only smoke', () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }, testInfo) => {
		if (
			testInfo.title === 'prod superuser global admin pages load' &&
			e2eConfig.environment !== 'prod'
		) {
			test.skip(true, 'Global admin smoke is required for prod only.');
		}

		await signInWithPassword(page, '/admin');
	});

	const eventAdminPages = [
		['/admin', 'Admin Directory'],
		[adminEventPath(), 'Dashboard'],
		[adminEventPath('/bookings'), 'Bookings'],
		[adminEventPath('/tickets'), 'Tickets'],
		[adminEventPath('/merchandise'), 'Merchandise'],
		[adminEventPath('/reports'), 'Reports'],
		[adminEventPath('/audit'), 'Audit']
	] as Array<readonly [string, string]>;

	if (e2eConfig.environment !== 'live-dev') {
		eventAdminPages.push([adminEventPath('/system'), 'System Settings']);
	}

	for (const [pathname, heading] of eventAdminPages) {
		test(`${pathname} loads`, async ({ page }) => {
			await page.goto(pathname);

			await expect(page).toHaveURL(expectPath(pathname));
			await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
		});
	}

	test('prod superuser global admin pages load', async ({ page }) => {
		test.skip(e2eConfig.environment !== 'prod', 'Global admin smoke is required for prod only.');

		await page.goto('/admin/global');
		await expect(page).toHaveURL(expectPath('/admin/global/events'));
		await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();

		for (const [pathname, heading] of [
			['/admin/global/events', 'Events'],
			['/admin/global/users', 'Admin Users']
		] as const) {
			await page.goto(pathname);
			await expect(page).toHaveURL(expectPath(pathname));
			await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
		}
	});
});
