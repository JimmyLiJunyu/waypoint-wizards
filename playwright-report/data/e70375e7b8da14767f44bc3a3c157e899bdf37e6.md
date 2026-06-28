# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> user can log in with correct credentials and land on dashboard
- Location: __tests__\e2e\auth.spec.ts:27:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
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
      - generic [ref=e6]: Email already registered
      - textbox "Email" [ref=e7]: test1782633483850@example.com
      - textbox "Name" [ref=e8]: testuser1782633483850
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
  4  | const testName = `testuser${unique}`;
  5  | const testEmail = `test${unique}@example.com`;
  6  | const testPassword = "TestPassword123";
  7  | 
  8  | // Helper: fills the sign-up form and waits for redirect to /login.
  9  | async function signUp(page: import("@playwright/test").Page) {
  10 |   await page.goto("/sign-up");
  11 |   await page.fill('input[placeholder="Email"]', testEmail);
  12 |   await page.fill('input[placeholder="Name"]', testName);
  13 |   await page.fill('input[placeholder="Password"]', testPassword);
  14 |   await page.waitForTimeout(150);
  15 |   await page.fill('input[placeholder="Verify Password"]', testPassword);
  16 |   await page.waitForTimeout(150);
  17 |   await page.click('button[type="submit"]');
> 18 |   await page.waitForURL(/\/login/, { timeout: 10000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  19 | }
  20 | 
  21 | test.describe("Authentication", () => {
  22 |   test("user can sign up and be redirected to login", async ({ page }) => {
  23 |     await signUp(page);
  24 |     await expect(page).toHaveURL(/\/login/);
  25 |   });
  26 | 
  27 |   test("user can log in with correct credentials and land on dashboard", async ({ page }) => {
  28 |     await signUp(page);
  29 |     await page.fill('input[placeholder="Email"]', testEmail);
  30 |     await page.fill('input[placeholder="Password"]', testPassword);
  31 |     await page.click('button[type="submit"]');
  32 |     await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  33 |   });
  34 | 
  35 |   test("login shows an error for wrong password", async ({ page }) => {
  36 |     await page.goto("/login");
  37 |     await page.fill('input[placeholder="Email"]', testEmail);
  38 |     await page.fill('input[placeholder="Password"]', "wrongpassword");
  39 |     await page.click('button[type="submit"]');
  40 |     await expect(page).toHaveURL(/\/login/);
  41 |     await expect(page.locator(".bg-red-50")).toBeVisible();
  42 |   });
  43 | });
```