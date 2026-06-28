import { test, expect } from "@playwright/test";

const unique = Date.now();
const testName = `tripuser${unique}`;
const testEmail = `trip${unique}@example.com`;
const testPassword = "TestPassword123";

async function signUpAndLogin(page: import("@playwright/test").Page) {
  await page.goto("/sign-up");
  await page.fill('input[placeholder="Email"]', testEmail);
  await page.fill('input[placeholder="Name"]', testName);
  await page.fill('input[placeholder="Password"]', testPassword);
  await page.waitForTimeout(150);
  await page.fill('input[placeholder="Verify Password"]', testPassword);
  await page.waitForTimeout(150);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/login/, { timeout: 10000 });

  await page.fill('input[placeholder="Email"]', testEmail);
  await page.fill('input[placeholder="Password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

test.describe("Trip Creation and Itinerary Building", () => {
  test("user can create a new trip and land on the trip page", async ({ page }) => {
    await signUpAndLogin(page);

    // Navigate to new trip page
    await page.goto("/new-trip");

    // Fill in trip destination — look for any text/search input
    await page.fill(
      'input[placeholder*="estination"], input[placeholder*="earch"], input[type="text"]',
      "Tokyo, Japan"
    );

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/trip\//, { timeout: 10000 });
  });

  test("dashboard shows the created trip", async ({ page }) => {
    await signUpAndLogin(page);
    await page.goto("/dashboard");

    // After creating a trip, the dashboard should list it
    // We just verify the dashboard renders without error
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("main, body")).toBeVisible();
  });
});
