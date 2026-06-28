import { test, expect } from "@playwright/test";

// Each test gets a unique timestamp so sign-ups don't collide with each other.
const unique = Date.now();
const testName = `testuser${unique}`;
const testEmail = `test${unique}@example.com`;
const testPassword = "TestPassword123";

test.describe("Authentication", () => {
  test("user can sign up and land on the dashboard", async ({ page }) => {
    await page.goto("/sign-up");
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("user can log in with correct credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login shows an error for wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Stay on login page, error message visible
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});
