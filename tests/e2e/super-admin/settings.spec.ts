import { test, expect } from '@playwright/test';

test.setTimeout(60000);

const SUPER_ADMIN = { email: 'superadmin@test.com', pass: 'superadmin123' };

test.describe('Super Admin: System Settings', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/sd');
        await page.waitForSelector('input[name="email"]', { state: 'visible' });
        await page.locator('input[name="email"]').click();
        await page.locator('input[name="email"]').fill(SUPER_ADMIN.email);

        await page.locator('input[name="password"]').click();
        await page.locator('input[name="password"]').fill(SUPER_ADMIN.pass);
        await page.waitForTimeout(500);

        await page.click('button[type="submit"]');

        // Wait for dashboard to fully load
        await expect(page).toHaveURL(/.*\/super-admin/, { timeout: 30000 });
        await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 15000 });

        // Navigate to settings by clicking the sidebar link
        await page.getByRole('link', { name: 'Settings', exact: true }).click();
        await expect(page).toHaveURL(/.*\/super-admin\/settings/, { timeout: 15000 });
    });

    test('should load the system settings page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'System Settings', exact: true })).toBeVisible({ timeout: 15000 });

        // Verify tabs are present
        await expect(page.getByRole('tab', { name: /Global/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Email/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Database/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Security/i })).toBeVisible();
    });

    test('should display and edit global configuration fields', async ({ page }) => {
        // Global tab is selected by default
        const appNameInput = page.getByPlaceholder('The name of the application displayed to users');
        await expect(appNameInput).toBeVisible({ timeout: 15000 });

        const appUrlInput = page.getByPlaceholder('The base URL of the application');
        await expect(appUrlInput).toBeVisible();

        // Edit a field
        await appNameInput.fill('SikshaMitra Pro ERP');
        await expect(appNameInput).toHaveValue('SikshaMitra Pro ERP');
    });

    test('should switch to email tab and display its fields', async ({ page }) => {
        // Click the Email tab
        await page.getByRole('tab', { name: /Email/i }).click();

        // Verify fields are visible based on placeholder
        const smtpHostInput = page.getByPlaceholder('SMTP server hostname');
        await expect(smtpHostInput).toBeVisible({ timeout: 10000 });
        await expect(smtpHostInput).toHaveValue('smtp.gmail.com');

        const smtpPortInput = page.getByPlaceholder('SMTP server port');
        await expect(smtpPortInput).toBeVisible();
    });

    test('should save settings successfully', async ({ page }) => {
        // Global tab is active. Edit Application Name to trigger unsaved changes
        const appNameInput = page.getByPlaceholder('The name of the application displayed to users');
        await expect(appNameInput).toBeVisible({ timeout: 15000 });

        // Initial state of Save button is disabled
        const saveBtn = page.getByRole('button', { name: 'Save Changes', exact: true });
        await expect(saveBtn).toBeDisabled();

        // Fill triggers change
        await appNameInput.fill('SikshaMitra Ultra ERP');

        // Save button becomes enabled
        await expect(saveBtn).toBeEnabled();

        // Click save
        await saveBtn.click();

        // Button changes to "Saving..." inside the mock API call
        await expect(page.getByRole('button', { name: /Saving\.\.\./i })).toBeVisible();

        // After mock timeout completes, changes are saved and button resets to disabled "Save Changes"
        await expect(saveBtn).toBeDisabled({ timeout: 10000 });
    });
});
