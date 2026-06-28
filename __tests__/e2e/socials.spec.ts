import { test, expect } from "@playwright/test";

const unique = Date.now();
const userA = { name: `userA${unique}`, email: `usera${unique}@example.com`, password: "TestPassword123" };
const userB = { name: `userB${unique}`, email: `userb${unique}@example.com`, password: "TestPassword123" };

async function signUp(page: import("@playwright/test").Page, user: typeof userA) {
  await page.goto("/sign-up");
  await page.fill('input[placeholder="Email"]', user.email);
  await page.fill('input[placeholder="Name"]', user.name);
  await page.fill('input[placeholder="Password"]', user.password);
  await page.waitForTimeout(150);
  await page.fill('input[placeholder="Verify Password"]', user.password);
  await page.waitForTimeout(150);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

async function login(page: import("@playwright/test").Page, user: typeof userA) {
  await page.goto("/login");
  await page.fill('input[placeholder="Email"]', user.email);
  await page.fill('input[placeholder="Password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

test.describe("Social Follow Flow", () => {
  test("User A can send a follow request to User B", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signUp(pageA, userA);
    await signUp(pageB, userB);

    // User A searches for User B and sends a follow request
    await login(pageA, userA);
    await pageA.goto("/socials");
    await pageA.fill('input[placeholder*="earch"], input[placeholder*="ser"]', userB.name);
    await pageA.waitForTimeout(500);
    await pageA.click('button:has-text("Follow"), button:has-text("Request")');

    // User B checks for the incoming follow request
    await login(pageB, userB);
    await pageB.goto("/socials");
    await expect(pageB.getByText(userA.name)).toBeVisible({ timeout: 5000 });

    // User B accepts the request
    await pageB.click('button:has-text("Accept")');

    await contextA.close();
    await contextB.close();
  });
});
