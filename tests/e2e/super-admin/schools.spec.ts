import { test, expect } from '@playwright/test';

test.setTimeout(60000);

const SUPER_ADMIN = { email: 'superadmin@test.com', pass: 'superadmin123' };

test.describe('Super Admin: School Management', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate as Super Admin before each test
        await page.goto('/sd');
        await page.waitForSelector('input[name="email"]', { state: 'visible' });
        await page.locator('input[name="email"]').click();
        await page.locator('input[name="email"]').fill(SUPER_ADMIN.email);

        await page.locator('input[name="password"]').click();
        await page.locator('input[name="password"]').fill(SUPER_ADMIN.pass);
        await page.waitForTimeout(500);

        await page.click('button[type="submit"]');

        // Wait for redirect to super-admin dashboard
        await expect(page).toHaveURL(/.*super-admin.*/, { timeout: 30000 });
    });

    // ==================== READ ====================

    test('should view the list of configured schools', async ({ page }) => {
        await page.goto('/super-admin/schools');

        // Wait for the schools table to be rendered
        await expect(page.locator('table')).toBeVisible({ timeout: 15000 });

        // Check if the Test International School is in the table
        await expect(page.getByText('Test International School').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display school details in the table', async ({ page }) => {
        await page.goto('/super-admin/schools');

        // Wait for school data to load
        await expect(page.locator('table')).toBeVisible({ timeout: 15000 });

        // Verify table column headers exist (use exact: true to avoid matching checkbox header)
        await expect(page.getByRole('columnheader', { name: 'School', exact: true })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status', exact: true })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Plan', exact: true })).toBeVisible();

        // Verify school row data
        await expect(page.getByText('ACTIVE').first()).toBeVisible();
    });

    test('should have search and filter controls', async ({ page }) => {
        await page.goto('/super-admin/schools');

        // Verify search input exists
        await expect(page.getByPlaceholder(/Search schools/i)).toBeVisible({ timeout: 15000 });

        // Verify filter dropdowns exist (from error context: "All Status", "All Plans", "All Onboarding")
        await expect(page.getByText('All Status').first()).toBeVisible();
        await expect(page.getByText('All Plans').first()).toBeVisible();
    });

    // ==================== CREATE ====================

    test('should have an Add School button', async ({ page }) => {
        await page.goto('/super-admin/schools');

        const addButton = page.getByRole('button', { name: /Add School/i });
        await expect(addButton).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to create school page', async ({ page }) => {
        await page.goto('/super-admin/schools');

        // Click the Add School button
        await page.getByRole('button', { name: /Add School/i }).click({ timeout: 15000 });

        // Should navigate to create page
        await expect(page).toHaveURL(/.*\/super-admin\/schools\/create/, { timeout: 15000 });

        // Verify create form elements are visible
        await expect(page.getByText('Create New School')).toBeVisible({ timeout: 10000 });
    });

    test('should display the school creation form with required fields', async ({ page }) => {
        await page.goto('/super-admin/schools/create');

        // Wait for form to render
        await expect(page.getByText('Create New School')).toBeVisible({ timeout: 15000 });

        // Verify required form fields are present
        await expect(page.locator('#schoolName')).toBeVisible();
        await expect(page.locator('#schoolCode')).toBeVisible();
        await expect(page.locator('#contactEmail')).toBeVisible();

        // Verify section headings
        await expect(page.getByText('Basic Information')).toBeVisible();
        await expect(page.getByText('Authentication Configuration')).toBeVisible();

        // Verify submit and cancel buttons
        await expect(page.getByRole('button', { name: /Create School/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Cancel/i })).toBeVisible();
    });

    test('should auto-generate school code from school name', async ({ page }) => {
        await page.goto('/super-admin/schools/create');

        await expect(page.locator('#schoolName')).toBeVisible({ timeout: 15000 });

        // Type a school name
        await page.locator('#schoolName').click();
        await page.locator('#schoolName').fill('Demo Academy');
        await page.waitForTimeout(500);

        // School code should auto-populate (uppercase, spaces -> underscores)
        const schoolCodeValue = await page.locator('#schoolCode').inputValue();
        expect(schoolCodeValue).toBe('DEMO_ACADE');
    });

    // ==================== DETAIL VIEW ====================

    test('should open school detail dialog via row actions', async ({ page }) => {
        await page.goto('/super-admin/schools');

        // Wait for table
        await expect(page.locator('table')).toBeVisible({ timeout: 15000 });

        // Click the actions button
        const actionsCell = page.locator('table tbody tr').first().locator('td').last();
        const actionsButton = actionsCell.locator('button');
        await expect(actionsButton).toBeVisible({ timeout: 10000 });
        await actionsButton.click();

        // Wait for dropdown menu and click "View Details"
        await page.waitForTimeout(500);
        const viewDetailsItem = page.getByRole('menuitem', { name: /View Details/i });
        await expect(viewDetailsItem).toBeVisible({ timeout: 10000 });
        await viewDetailsItem.click();

        // A dialog opens showing school details
        await page.waitForTimeout(500);
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Dialog should show school name and have tabs
        await expect(dialog.getByText('Test International School').first()).toBeVisible();
        await expect(dialog.getByRole('tab', { name: /Overview/i })).toBeVisible();

        // Verify the "Manage School" button exists in the dialog
        await expect(dialog.getByRole('button', { name: /Manage School/i })).toBeVisible();
    });
});
