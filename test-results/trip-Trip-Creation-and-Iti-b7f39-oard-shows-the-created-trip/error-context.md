# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: trip.spec.ts >> Trip Creation and Itinerary Building >> dashboard shows the created trip
- Location: __tests__\e2e\trip.spec.ts:40:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - heading "Sign Up Now!" [level=1] [ref=e3]
    - generic [ref=e5]:
      - generic [ref=e6]: "Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"prisma\"].user.findUnique()` invocation in C:\\Users\\user\\VSCode\\Orbital\\waypoint-wizards\\.next\\dev\\server\\chunks\\[root-of-the-server]__0o0mid8._.js:423:166 420 ; 421 async function createUser(data) { 422 const normalizedEmail = data.email.toLowerCase(); → 423 const existingUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"prisma\"].user.findUnique( Server has closed the connection."
      - textbox "Email" [ref=e7]: trip1782632389262@example.com
      - textbox "Name" [ref=e8]: tripuser1782632389262
      - textbox "Password" [ref=e9]: TestPassword123
      - textbox "Verify Password" [ref=e10]: TestPassword123
      - button "Sign Up" [ref=e11]
  - button "Open Next.js Dev Tools" [ref=e17] [cursor=pointer]:
    - img [ref=e18]
  - alert [ref=e21]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const unique = Date.now();
  4  | const testName = `tripuser${unique}`;
  5  | const testEmail = `trip${unique}@example.com`;
  6  | const testPassword = "TestPassword123";
  7  | 
  8  | async function signUpAndLogin(page: import("@playwright/test").Page) {
  9  |   await page.goto("/sign-up");
  10 |   await page.fill('input[placeholder="Email"]', testEmail);
  11 |   await page.fill('input[placeholder="Name"]', testName);
  12 |   await page.fill('input[placeholder="Password"]', testPassword);
  13 |   await page.fill('input[placeholder="Verify Password"]', testPassword);
  14 |   await page.click('button[type="submit"]');
> 15 |   await page.waitForURL(/\/login/);
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  16 | 
  17 |   await page.fill('input[placeholder="Email"]', testEmail);
  18 |   await page.fill('input[placeholder="Password"]', testPassword);
  19 |   await page.click('button[type="submit"]');
  20 |   await page.waitForURL(/\/dashboard/);
  21 | }
  22 | 
  23 | test.describe("Trip Creation and Itinerary Building", () => {
  24 |   test("user can create a new trip and land on the trip page", async ({ page }) => {
  25 |     await signUpAndLogin(page);
  26 | 
  27 |     // Navigate to new trip page
  28 |     await page.goto("/new-trip");
  29 | 
  30 |     // Fill in trip destination — look for any text/search input
  31 |     await page.fill(
  32 |       'input[placeholder*="estination"], input[placeholder*="earch"], input[type="text"]',
  33 |       "Tokyo, Japan"
  34 |     );
  35 | 
  36 |     await page.click('button[type="submit"]');
  37 |     await expect(page).toHaveURL(/\/trip\//, { timeout: 10000 });
  38 |   });
  39 | 
  40 |   test("dashboard shows the created trip", async ({ page }) => {
  41 |     await signUpAndLogin(page);
  42 |     await page.goto("/dashboard");
  43 | 
  44 |     // After creating a trip, the dashboard should list it
  45 |     // We just verify the dashboard renders without error
  46 |     await expect(page).toHaveURL(/\/dashboard/);
  47 |     await expect(page.locator("main, body")).toBeVisible();
  48 |   });
  49 | });
  50 | 
```