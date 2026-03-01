import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Class Management', () => {

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

        // Navigate to classes page
        await page.goto('/admin/classes');
        await expect(page.locator('h1', { hasText: 'Class Management' })).toBeVisible({ timeout: 30000 });
    });

    test('should load classes page with create button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Create Class/i })).toBeVisible();
        await expect(page.locator('text=All Classes').first()).toBeVisible({ timeout: 15000 });
    });

    test('should create a new class via dialog', async ({ page }) => {
        const uniqueSuffix = Date.now().toString().slice(-6);
        const className = `Test Class ${uniqueSuffix}`;

        // Wait for the page to fully load data (classes and academic years)
        await page.waitForTimeout(2000);

        // Click the Create Class button to open the dialog
        await page.getByRole('button', { name: /Create Class/i }).click();

        // Wait for dialog to appear
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Create New Class')).toBeVisible();

        // Select the first available Academic Year explicitly
        await page.getByRole('dialog').locator('button:has-text("Select academic year")').or(page.getByRole('dialog').locator('button').first()).click();
        await page.waitForTimeout(500);
        await page.locator('div[role="option"]').first().click();

        // Fill the class name
        await page.getByPlaceholder('e.g. Grade 10 - Science').fill(className);

        // Submit the form
        await page.getByRole('dialog').getByRole('button', { name: 'Create Class' }).click();

        // Wait for the success toast completely
        await expect(page.getByText('Class created successfully')).toBeVisible({ timeout: 15000 });

        // Force a small wait because Next.js router.refresh() might unmount the dialog slowly in prod
        await page.waitForTimeout(2000);

        // Close the dialog explicitly if it is somehow still stuck open despite success
        const closeBtn = page.getByRole('button', { name: 'Close', exact: true });
        if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
        }

        // The new class should appear in the page
        await expect(page.getByText(className).first()).toBeVisible({ timeout: 15000 });
    });
});
