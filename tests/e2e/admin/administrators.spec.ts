import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Administrators Management', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate as School Admin
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        // Step 1: School Code
        const schoolCodeInput = page.locator('input[name="schoolCode"]');
        await schoolCodeInput.waitFor({ state: 'visible', timeout: 10000 });
        await schoolCodeInput.click();
        await schoolCodeInput.fill('TEST-INTL');
        await expect(schoolCodeInput).toHaveValue('TEST-INTL');
        await page.click('button[type="submit"]');

        // Step 2: Identifier Form
        const identifierInput = page.locator('input[name="identifier"]');
        await identifierInput.waitFor({ state: 'visible', timeout: 15000 });
        await identifierInput.click();
        await identifierInput.fill(SCHOOL_ADMIN.email);
        await expect(identifierInput).toHaveValue(SCHOOL_ADMIN.email);
        await page.click('button[type="submit"]');

        // Step 3: Password Form
        const passwordInput = page.locator('input[name="password"]');
        await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
        await passwordInput.click();
        await passwordInput.fill(SCHOOL_ADMIN.pass);
        await expect(passwordInput).toHaveValue(SCHOOL_ADMIN.pass);
        await page.click('button[type="submit"]');

        // Wait for dashboard to fully load
        await expect(page).toHaveURL(/.*\/admin/, { timeout: 30000 });
        await expect(page.locator('h1', { hasText: /Welcome back/i })).toBeVisible({ timeout: 15000 });

        // Navigate to administrators page
        await page.goto('/admin/users/administrators');
        await expect(page).toHaveURL(/.*\/admin\/users\/administrators/, { timeout: 15000 });
    });

    test('should load the administrators list and have add button', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Administrators', exact: true })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: /Add Administrator/i })).toBeVisible();
        await expect(page.getByPlaceholder('Search administrators')).toBeVisible();
    });

    test('should validate required fields when creating an administrator', async ({ page }) => {
        // Navigate to create page
        await page.goto('/admin/users/administrators/create');
        await expect(page).toHaveURL(/.*\/create/);

        // Wait for hydration to avoid native form submission before React attaches onSubmit
        await page.waitForTimeout(1000);

        // Click create without filling required fields
        await page.getByRole('button', { name: 'Create Administrator', exact: true }).click();

        // Wait for Zod validation text somewhere in the page
        await expect(page.locator('text=String must contain').first().or(page.locator('text=Required').first()).or(page.locator('text=at least 2 characters').first())).toBeVisible({ timeout: 15000 });
    });

    test('should create a new administrator successfully', async ({ page }) => {
        await page.goto('/admin/users/administrators/create');
        await expect(page).toHaveURL(/.*\/create/);

        // Wait for hydration to avoid React Hook Form resetting inputs
        await page.waitForTimeout(1500);

        const timestamp = Date.now();
        const testEmail = `newadmin${timestamp}@test-intl.edu`;

        // Basic Info
        await page.getByPlaceholder('First name').fill('New');
        await page.getByPlaceholder('Last name').fill('AdminUser');
        await page.getByPlaceholder('Email').fill(testEmail);
        await page.getByPlaceholder('Phone number').fill('5551234567');

        // Administrative Details
        await page.getByPlaceholder('Position').fill('Vice Principal');

        // Security
        const passwordInputs = page.getByPlaceholder('••••••••');
        await passwordInputs.nth(0).fill('P@ssw0rd123');
        await passwordInputs.nth(1).fill('P@ssw0rd123');

        // Submit form
        await page.getByRole('button', { name: 'Create Administrator', exact: true }).click();

        // Should return to the list and show the success toast / newly created user
        await expect(page).toHaveURL(/.*\/admin\/users\/administrators/, { timeout: 30000 });

        // The table should have the new user
        await page.getByPlaceholder('Search administrators').fill('New AdminUser');
        await expect(page.getByText(testEmail).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Vice Principal').first()).toBeVisible();
    });
});
