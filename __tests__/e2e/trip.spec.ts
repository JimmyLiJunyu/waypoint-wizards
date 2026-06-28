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
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Trip Creation and Itinerary Building", () => {
  test("user can create a new trip and land on the trip page", async ({ page }) => {
    await signUpAndLogin(page);
    await page.goto("/new-trip");

    // Fill destination
    await page.fill('input[placeholder="Where do you want to go?"]', "Tokyo");
    await page.waitForTimeout(300);

    // Open Start Date picker and click the first available day
    await page.getByText("Start Date").click();
    await page.locator('[role="gridcell"] button:not([disabled])').first().click();

    // Open End Date picker and click a day a week later
    await page.getByText("End Date").click();
    await page.locator('[role="gridcell"] button:not([disabled])').nth(7).click();

    // Submit (button is type="button", not type="submit")
    await page.click('button:has-text("Plan the Trip")');
    await expect(page).toHaveURL(/\/trip\//, { timeout: 15000 });
  });

  test("dashboard renders successfully after login", async ({ page }) => {
    await signUpAndLogin(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("body")).toBeVisible();
  });
});
