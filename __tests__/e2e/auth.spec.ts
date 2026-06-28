import { test, expect } from "@playwright/test";

const unique = Date.now();
const testName = `testuser${unique}`;
const testEmail = `test${unique}@example.com`;
const testPassword = "TestPassword123";

async function signUp(page: import("@playwright/test").Page) {
  await page.goto("/sign-up");
  await page.fill('input[placeholder="Email"]', testEmail);
  await page.fill('input[placeholder="Name"]', testName);
  await page.fill('input[placeholder="Password"]', testPassword);
  await page.waitForTimeout(150);
  await page.fill('input[placeholder="Verify Password"]', testPassword);
  await page.waitForTimeout(150);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

test.describe("Authentication", () => {
  test("user can sign up and be redirected to login", async ({ page }) => {
    await signUp(page);
    await expect(page).toHaveURL(/\/login/);
  });

  // User was created in the test above — just log in directly here.
  test("user can log in with correct credentials and land on dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder="Password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test("login shows an error for wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="Email"]', testEmail);
    await page.fill('input[placeholder="Password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(".bg-red-50")).toBeVisible();
  });
});
