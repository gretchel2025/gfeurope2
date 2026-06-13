import { expect, test } from '@playwright/test';
import { signInWithPassword } from './support/auth';
import { adminEventPath, e2eConfig, expectPath } from './support/e2eConfig';

test.describe('admin merchandise management', () => {
	test.beforeEach(async ({ page }) => {
		test.skip(e2eConfig.environment !== 'local', 'Merchandise mutations run locally only.');
		await signInWithPassword(page, adminEventPath('/merchandise'));
	});

	test('admin can create, update, and delete a merchandise product', async ({ page }) => {
		const productName = `E2E Merch ${Date.now()}`;
		const updatedProductName = `${productName} Updated`;

		await expect(page).toHaveURL(expectPath(adminEventPath('/merchandise')));
		await expect(page.getByRole('heading', { name: 'Merchandise', exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Products', exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Create Product', exact: true })).toBeVisible();
		await expect(page.getByLabel('Product Name')).toHaveCount(0);

		await page.getByRole('link', { name: 'Create Product', exact: true }).click();
		await expect(page).toHaveURL(expectPath(adminEventPath('/merchandise/new')));
		await expect(page.getByRole('heading', { name: 'Create Product', exact: true })).toBeVisible();

		await page.getByLabel('Product Name').fill(productName);
		await page.getByLabel('Category').selectOption('T-Shirts');
		await page.getByLabel('Price Per Unit').fill('19.50');
		await page.getByLabel('Stock').fill('8');
		await page.getByLabel('Sizes').fill('S, M, L');
		await page.getByLabel('Colors').fill('Navy');
		await page.getByLabel('Product Description').fill('Local e2e merchandise product.');
		await page.getByRole('button', { name: 'Create Product', exact: true }).click();

		await expect(page).toHaveURL(expectPath(adminEventPath('/merchandise')));
		const createdRow = page.getByRole('row').filter({ hasText: productName });
		await expect(createdRow).toBeVisible();
		await expect(createdRow).toContainText('T-Shirts');
		const productId = (await createdRow.locator('td').first().innerText()).trim();
		expect(productId).toMatch(/^MP-[A-Z0-9]{10}$/);

		await createdRow.getByRole('link', { name: 'Update', exact: true }).click();
		await expect(page).toHaveURL(expectPath(adminEventPath(`/merchandise/${productId}`)));
		await expect(page.getByRole('heading', { name: 'Update Product', exact: true })).toBeVisible();
		await expect(page.getByText(productId, { exact: true })).toBeVisible();

		await page.getByLabel('Product Name').fill(updatedProductName);
		await page.getByLabel('Category').selectOption('Books');
		await page.getByLabel('Stock').fill('5');
		await page.getByRole('button', { name: 'Update Product', exact: true }).click();

		await expect(page).toHaveURL(expectPath(adminEventPath('/merchandise')));
		const updatedRow = page.getByRole('row').filter({ hasText: updatedProductName });
		await expect(updatedRow).toBeVisible();
		await expect(updatedRow).toContainText(productId);
		await expect(updatedRow).toContainText('Books');

		await updatedRow.getByRole('button', { name: 'Delete', exact: true }).click();
		await expect(page).toHaveURL(expectPath(adminEventPath('/merchandise')));
		await expect(page.getByRole('row').filter({ hasText: updatedProductName })).toHaveCount(0);
	});
});
