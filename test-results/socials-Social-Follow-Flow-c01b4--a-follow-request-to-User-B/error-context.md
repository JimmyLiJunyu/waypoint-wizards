# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: socials.spec.ts >> Social Follow Flow >> User A can send a follow request to User B
- Location: __tests__\e2e\socials.spec.ts:28:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('userA1782633483863')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('userA1782633483863')

```

```yaml
- button "Toggle Menu"
- complementary:
  - text: WayPoint Wizards
  - button
  - paragraph: userB1782633483863
  - paragraph: userb1782633483863@example.com
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - link "New Trip":
      - /url: /new-trip
    - link "Account":
      - /url: /account
    - link "Socials":
      - /url: /socials
    - link "AI Planner":
      - /url: /ai-planner
  - button "Logout"
- main:
  - main:
    - heading "Socials" [level=1]
    - paragraph: Manage your followers and find friends
    - textbox "Search users..."
    - button "Search"
    - button "Requests"
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const unique = Date.now();
  4  | const userA = { name: `userA${unique}`, email: `usera${unique}@example.com`, password: "TestPassword123" };
  5  | const userB = { name: `userB${unique}`, email: `userb${unique}@example.com`, password: "TestPassword123" };
  6  | 
  7  | async function signUp(page: import("@playwright/test").Page, user: typeof userA) {
  8  |   await page.goto("/sign-up");
  9  |   await page.fill('input[placeholder="Email"]', user.email);
  10 |   await page.fill('input[placeholder="Name"]', user.name);
  11 |   await page.fill('input[placeholder="Password"]', user.password);
  12 |   await page.waitForTimeout(150);
  13 |   await page.fill('input[placeholder="Verify Password"]', user.password);
  14 |   await page.waitForTimeout(150);
  15 |   await page.click('button[type="submit"]');
  16 |   await page.waitForURL(/\/login/, { timeout: 10000 });
  17 | }
  18 | 
  19 | async function login(page: import("@playwright/test").Page, user: typeof userA) {
  20 |   await page.goto("/login");
  21 |   await page.fill('input[placeholder="Email"]', user.email);
  22 |   await page.fill('input[placeholder="Password"]', user.password);
  23 |   await page.click('button[type="submit"]');
  24 |   await page.waitForURL(/\/dashboard/);
  25 | }
  26 | 
  27 | test.describe("Social Follow Flow", () => {
  28 |   test("User A can send a follow request to User B", async ({ browser }) => {
  29 |     const contextA = await browser.newContext();
  30 |     const contextB = await browser.newContext();
  31 |     const pageA = await contextA.newPage();
  32 |     const pageB = await contextB.newPage();
  33 | 
  34 |     await signUp(pageA, userA);
  35 |     await signUp(pageB, userB);
  36 | 
  37 |     // User A searches for User B and sends a follow request
  38 |     await login(pageA, userA);
  39 |     await pageA.goto("/socials");
  40 |     await pageA.fill('input[placeholder*="earch"], input[placeholder*="ser"]', userB.name);
  41 |     await pageA.waitForTimeout(500);
  42 |     await pageA.click('button:has-text("Follow"), button:has-text("Request")');
  43 | 
  44 |     // User B checks for the incoming follow request
  45 |     await login(pageB, userB);
  46 |     await pageB.goto("/socials");
> 47 |     await expect(pageB.getByText(userA.name)).toBeVisible({ timeout: 5000 });
     |                                               ^ Error: expect(locator).toBeVisible() failed
  48 | 
  49 |     // User B accepts the request
  50 |     await pageB.click('button:has-text("Accept")');
  51 | 
  52 |     await contextA.close();
  53 |     await contextB.close();
  54 |   });
  55 | });
  56 | 
```