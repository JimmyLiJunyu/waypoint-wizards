# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: trip.spec.ts >> Trip Creation and Itinerary Building >> dashboard shows the created trip
- Location: __tests__\e2e\trip.spec.ts:42:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main, body')
Expected: visible
Error: strict mode violation: locator('main, body') resolved to 3 elements:
    1) <body class="h-full overflow-hidden flex flex-col">…</body> aka locator('body')
    2) <main class="w-full h-full overflow-hidden">…</main> aka getByRole('main').first()
    3) <main class="min-h-screen bg-[#F9F9F9] p-8">…</main> aka getByRole('main').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main, body')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "Toggle Menu" [ref=e3]:
      - img [ref=e4]
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: WayPoint Wizards
        - button [ref=e8]:
          - img [ref=e9]
      - generic [ref=e12]:
        - img [ref=e14]
        - generic [ref=e17]:
          - paragraph [ref=e18]: tripuser1782633545510
          - paragraph [ref=e19]: trip1782633545510@example.com
      - navigation [ref=e20]:
        - link "Dashboard" [ref=e21] [cursor=pointer]:
          - /url: /dashboard
        - link "New Trip" [ref=e22] [cursor=pointer]:
          - /url: /new-trip
        - link "Account" [ref=e23] [cursor=pointer]:
          - /url: /account
        - link "Socials" [ref=e24] [cursor=pointer]:
          - /url: /socials
        - link "AI Planner" [ref=e25] [cursor=pointer]:
          - /url: /ai-planner
      - button "Logout" [ref=e27]:
        - img [ref=e28]
        - text: Logout
    - main [ref=e32]:
      - main [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]:
              - heading "My Trips" [level=1] [ref=e37]
              - paragraph [ref=e38]: Here are your trips
            - link "+ Plan New Trip" [ref=e39] [cursor=pointer]:
              - /url: /new-trip
              - button "+ Plan New Trip" [ref=e40]
          - paragraph [ref=e42]: Loading...
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49]
  - alert [ref=e52]
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
  13 |   await page.waitForTimeout(150);
  14 |   await page.fill('input[placeholder="Verify Password"]', testPassword);
  15 |   await page.waitForTimeout(150);
  16 |   await page.click('button[type="submit"]');
  17 |   await page.waitForURL(/\/login/, { timeout: 10000 });
  18 | 
  19 |   await page.fill('input[placeholder="Email"]', testEmail);
  20 |   await page.fill('input[placeholder="Password"]', testPassword);
  21 |   await page.click('button[type="submit"]');
  22 |   await page.waitForURL(/\/dashboard/);
  23 | }
  24 | 
  25 | test.describe("Trip Creation and Itinerary Building", () => {
  26 |   test("user can create a new trip and land on the trip page", async ({ page }) => {
  27 |     await signUpAndLogin(page);
  28 | 
  29 |     // Navigate to new trip page
  30 |     await page.goto("/new-trip");
  31 | 
  32 |     // Fill in trip destination — look for any text/search input
  33 |     await page.fill(
  34 |       'input[placeholder*="estination"], input[placeholder*="earch"], input[type="text"]',
  35 |       "Tokyo, Japan"
  36 |     );
  37 | 
  38 |     await page.click('button[type="submit"]');
  39 |     await expect(page).toHaveURL(/\/trip\//, { timeout: 10000 });
  40 |   });
  41 | 
  42 |   test("dashboard shows the created trip", async ({ page }) => {
  43 |     await signUpAndLogin(page);
  44 |     await page.goto("/dashboard");
  45 | 
  46 |     // After creating a trip, the dashboard should list it
  47 |     // We just verify the dashboard renders without error
  48 |     await expect(page).toHaveURL(/\/dashboard/);
> 49 |     await expect(page.locator("main, body")).toBeVisible();
     |                                              ^ Error: expect(locator).toBeVisible() failed
  50 |   });
  51 | });
  52 | 
```