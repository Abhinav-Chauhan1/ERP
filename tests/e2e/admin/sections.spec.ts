import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Section Management', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        const schoolCodeInput = page.locator('input[name="schoolCode"]');
        await schoolCodeInput.waitFor({ state: 'visible', timeout: 10000 });
        await schoolCodeInput.click();
        await schoolCodeInput.fill('TEST-INTL');
        await expect(schoolCodeInput).toHaveValue('TEST-INTL');
        await page.click('button[type="submit"]');

        const identifierInput = page.locator('input[name="identifier"]');
        await identifierInput.waitFor({ state: 'visible', timeout: 15000 });
        await identifierInput.click();
        await identifierInput.fill(SCHOOL_ADMIN.email);
        await expect(identifierInput).toHaveValue(SCHOOL_ADMIN.email);
        await page.click('button[type="submit"]');

        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
        await passwordInput.click();
        await passwordInput.fill(SCHOOL_ADMIN.pass);
        await expect(passwordInput).toHaveValue(SCHOOL_ADMIN.pass);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*\/admin/, { timeout: 30000 });
        await expect(page.locator('h1', { hasText: /Welcome back/i })).toBeVisible({ timeout: 15000 });

        // Navigate to sections page
        await page.goto('/admin/classes/sections');
        await expect(page.locator('h1', { hasText: 'Section Management' })).toBeVisible({ timeout: 30000 });
    });

    test('should load sections page with create button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Create Section/i })).toBeVisible();
    });

    test('should create a new section via dialog', async ({ page }) => {
        const uniqueSuffix = Date.now().toString().slice(-6);
        const sectionName = `Section-${uniqueSuffix}`;

        // Wait for the page to load class dropdown data
        await page.waitForTimeout(2000);

        // Click Create Section button to open the dialog
        await page.getByRole('button', { name: /Create Section/i }).click();

        // Wait for dialog to appear
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Create New Section')).toBeVisible();

        // Select a class from the dropdown explicitly
        await page.getByRole('dialog').locator('button:has-text("Select class")').or(page.getByRole('dialog').locator('button').first()).click();
        await page.waitForTimeout(500);
        await page.locator('div[role="option"]').first().click();

        // Fill section name
        await page.getByPlaceholder('e.g. A, B, C, Science').fill(sectionName);

        // Submit the form
        await page.getByRole('dialog').getByRole('button', { name: 'Create Section' }).click();

        // Wait for success toast completely
        await expect(page.getByText('Section created successfully')).toBeVisible({ timeout: 15000 });

        // Force a small wait because Next.js router.refresh() might unmount the dialog slowly in prod
        await page.waitForTimeout(2000);

        // Close the dialog explicitly if it is somehow still open despite success
        const closeBtn = page.getByRole('button', { name: 'Close', exact: true });
        if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
        }

        // The new section should appear as a card on the page
        await expect(page.getByText(sectionName).first()).toBeVisible({ timeout: 15000 });
    });
});
