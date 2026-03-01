import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Timetable Management', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/login');
        await page.waitForSelector('input[name="schoolCode"]', { state: 'visible' });
        await page.locator('input[name="schoolCode"]').click();
        await page.locator('input[name="schoolCode"]').fill('TEST-INTL');
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');

        await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 10000 });
        await page.locator('input[name="identifier"]').click();
        await page.locator('input[name="identifier"]').fill(SCHOOL_ADMIN.email);
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');

        await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
        await page.locator('input[name="password"]').click();
        await page.locator('input[name="password"]').fill(SCHOOL_ADMIN.pass);
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*\/admin/, { timeout: 30000 });
        await expect(page.locator('h1', { hasText: /Welcome back/i })).toBeVisible({ timeout: 15000 });
    });

    test('should load timetable page with controls', async ({ page }) => {
        await page.goto('/admin/teaching/timetable');
        await expect(page.locator('h1', { hasText: 'Timetable Management' })).toBeVisible({ timeout: 30000 });

        // Verify the Create Timetable button exists
        await expect(page.getByRole('button', { name: /Create Timetable/i })).toBeVisible({ timeout: 10000 });
    });

    test('should open create timetable dialog', async ({ page }) => {
        await page.goto('/admin/teaching/timetable');
        await expect(page.locator('h1', { hasText: 'Timetable Management' })).toBeVisible({ timeout: 30000 });

        // Wait for data to load
        await page.waitForTimeout(2000);

        // Click Create Timetable to open dialog
        await page.getByRole('button', { name: /Create Timetable/i }).click();

        // Verify dialog appears
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    });
});
