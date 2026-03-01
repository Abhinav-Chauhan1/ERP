import { test, expect } from '@playwright/test';

test.setTimeout(60000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Parents Management', () => {

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

        // Navigate to parents page
        await page.goto('/admin/users/parents');
        await expect(page).toHaveURL(/.*\/admin\/users\/parents/, { timeout: 15000 });
    });

    test('should load the parents list and have add button', async ({ page }) => {
        await expect(page.locator('h1', { hasText: 'Parents' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: /Add Parent/i })).toBeVisible();
    });

    test('should create a new parent successfully', async ({ page }) => {
        await page.goto('/admin/users/parents/create');
        await expect(page).toHaveURL(/.*\/create/);

        // Wait for hydration to avoid React Hook Form resetting inputs
        await page.waitForTimeout(1000);

        // Use unique names so we can reliably search for them
        const uniqueSuffix = Date.now().toString().slice(-6);
        const firstName = `ParentF${uniqueSuffix}`;
        const lastName = `ParentL${uniqueSuffix}`;
        const testPhone = `98765${uniqueSuffix.slice(-5)}`; // 10 digit mock

        // Basic Info
        await page.getByPlaceholder('First name').fill(firstName);
        await page.getByPlaceholder('Last name').fill(lastName);
        await page.getByPlaceholder('Phone number for login').fill(testPhone);

        // Parent Details
        await page.getByPlaceholder('Occupation').fill('Software Engineer');

        // Select Relation
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: 'Father' }).click();

        // Submit form
        await page.getByRole('button', { name: 'Create Parent', exact: true }).click();

        // Wait for success toast to confirm server action completed
        await expect(page.getByText('Parent created successfully')).toBeVisible({ timeout: 30000 });

        // Should return to the list
        await expect(page).toHaveURL(/\/admin\/users\/parents$/, { timeout: 30000 });

        // Verify the created parent appears in the list by searching by name
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search parents"]').first();
        await searchInput.fill(firstName);
        await expect(page.getByText(`${firstName} ${lastName}`).first()).toBeVisible({ timeout: 15000 });
    });
});
