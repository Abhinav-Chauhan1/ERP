import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Finance Dashboard & Fee Structure', () => {

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

    test('should load finance dashboard', async ({ page }) => {
        await page.goto('/admin/finance');
        await expect(page.locator('h1', { hasText: 'Finance Management' })).toBeVisible({ timeout: 30000 });
    });

    test('should load fee structure page', async ({ page }) => {
        await page.goto('/admin/finance/fee-structure');
        await expect(page.locator('h1', { hasText: 'Fee Structure Management' })).toBeVisible({ timeout: 30000 });

        // Verify create buttons exist
        await expect(page.getByRole('button', { name: /Create Fee Structure/i }).first()).toBeVisible({ timeout: 10000 });
    });

    test('should load fee payments page', async ({ page }) => {
        await page.goto('/admin/finance/fees/list');
        await expect(page.locator('h1', { hasText: 'Fee Payments' })).toBeVisible({ timeout: 30000 });
    });

    test('should navigate to payments page', async ({ page }) => {
        await page.goto('/admin/finance/payments');
        await expect(page).toHaveURL(/.*\/admin\/finance\/payments/, { timeout: 30000 });
    });
});
