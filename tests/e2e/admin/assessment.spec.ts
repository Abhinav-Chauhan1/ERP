import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Assessment & Exams', () => {

    test.beforeEach(async ({ page }) => {
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

    test('should load assessment dashboard', async ({ page }) => {
        await page.goto('/admin/assessment');
        await expect(page.locator('h1', { hasText: 'Assessment Management' })).toBeVisible({ timeout: 30000 });
    });

    test('should load exam management page', async ({ page }) => {
        await page.goto('/admin/assessment/exams');
        await expect(page.locator('h1', { hasText: 'Exam Management' })).toBeVisible({ timeout: 30000 });
    });

    test('should load marks entry page', async ({ page }) => {
        await page.goto('/admin/assessment/marks-entry');
        await expect(page.locator('h1', { hasText: 'Marks Entry' })).toBeVisible({ timeout: 30000 });
    });

    test('should load report cards page', async ({ page }) => {
        await page.goto('/admin/assessment/report-cards');
        await expect(page.locator('h1', { hasText: 'Report Cards' })).toBeVisible({ timeout: 30000 });
    });
});
