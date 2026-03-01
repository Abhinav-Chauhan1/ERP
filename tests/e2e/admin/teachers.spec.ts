import { test, expect } from '@playwright/test';

test.setTimeout(60000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Teachers Management', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate
        // Step 1: School Code
        await page.goto('/login');
        await page.waitForSelector('input[name="schoolCode"]', { state: 'visible' });
        await page.locator('input[name="schoolCode"]').click();
        await page.locator('input[name="schoolCode"]').fill('TEST-INTL');
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');

        // Step 2: Identifier Form
        await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 10000 });
        await page.locator('input[name="identifier"]').click();
        await page.locator('input[name="identifier"]').fill(SCHOOL_ADMIN.email);
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');

        // Step 3: Password Form
        await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
        await page.locator('input[name="password"]').click();
        await page.locator('input[name="password"]').fill(SCHOOL_ADMIN.pass);
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');

        // Wait for dashboard to fully load
        await expect(page).toHaveURL(/.*\/admin/, { timeout: 30000 });
        await expect(page.locator('h1', { hasText: /Welcome back/i })).toBeVisible({ timeout: 15000 });

        // Navigate to teachers page
        await page.goto('/admin/users/teachers');
        await expect(page).toHaveURL(/.*\/admin\/users\/teachers/, { timeout: 15000 });
    });

    test('should load the teachers list and have add button', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Teachers' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: /Add Teacher/i })).toBeVisible();
        await expect(page.getByPlaceholder('Search teachers')).toBeVisible();
    });

    test('should create a new teacher successfully', async ({ page }) => {
        await page.goto('/admin/users/teachers/create');
        await expect(page).toHaveURL(/.*\/create/);

        // Wait for hydration to avoid React Hook Form resetting inputs
        await page.waitForTimeout(1000);

        const timestamp = Date.now();
        const testEmail = `newteacher${timestamp}@test-intl.edu`;

        // Basic Info
        await page.getByPlaceholder('First name').fill('Jane');
        await page.getByPlaceholder('Last name').fill('Doe');
        await page.getByPlaceholder('Email').fill(testEmail);
        await page.getByPlaceholder('Phone number').fill('5559876543');

        // Employment Details
        await page.getByPlaceholder('Employee ID').fill(`EMP-${timestamp}`);
        await page.getByPlaceholder('Qualification').fill('M.Sc. Mathematics');

        // DatePicker for Join Date (leave default to current date is usually fine, or pick one)
        // For salary
        await page.getByPlaceholder('Salary').fill('50000');

        // Security
        const passwordInputs = page.getByPlaceholder('••••••••');
        await passwordInputs.nth(0).fill('P@ssw0rd123');
        await passwordInputs.nth(1).fill('P@ssw0rd123');

        // Submit form
        await page.getByRole('button', { name: 'Create Teacher', exact: true }).click();

        // Should return to the list and show the success toast / newly created user
        await expect(page).toHaveURL(/.*\/admin\/users\/teachers/);

        // Verify in the list
        await page.getByPlaceholder('Search teachers').fill('Jane Doe');
        await expect(page.getByText(testEmail).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(`EMP-${timestamp}`).first()).toBeVisible(); // Depends if employee ID is rendered, but email for sure is
    });
});
