import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const SCHOOL_ADMIN = { email: 'admin@test-intl.edu', pass: 'admin123' };

test.describe('Admin: Attendance Management', () => {

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

    test('should load attendance dashboard with all sections', async ({ page }) => {
        await page.goto('/admin/attendance');
        await expect(page.locator('h1', { hasText: 'Attendance Management' })).toBeVisible({ timeout: 30000 });

        // Verify the category cards
        await expect(page.getByText('Student Attendance').first()).toBeVisible();
        await expect(page.getByText('Teacher Attendance').first()).toBeVisible();
        await expect(page.getByText('Attendance Reports').first()).toBeVisible();

        // Verify the Mark Attendance button
        await expect(page.getByRole('link', { name: /Mark Attendance/i }).first()).toBeVisible();
    });

    test('should navigate to student attendance page', async ({ page }) => {
        await page.goto('/admin/attendance/students');
        await expect(page).toHaveURL(/.*\/admin\/attendance\/students/, { timeout: 30000 });
    });
});
