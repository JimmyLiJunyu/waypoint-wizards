# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> user can log in with correct credentials and land on dashboard
- Location: __tests__\e2e\auth.spec.ts:19:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/login"

```

```yaml
- main:
  - heading "Welcome Back!" [level=1]
  - textbox "Email": test1782632364840@example.com
  - textbox "Password": TestPassword123
  - button "Logging in..." [disabled]
  - link "Sign up here":
    - /url: /sign-up
    - heading "Sign up here" [level=4]
- alert
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
  8  | test.describe("Authentication", () => {
  9  |   test("user can sign up and be redirected to login", async ({ page }) => {
  10 |     await page.goto("/sign-up");
  11 |     await page.fill('input[placeholder="Email"]', testEmail);
  12 |     await page.fill('input[placeholder="Name"]', testName);
  13 |     await page.fill('input[placeholder="Password"]', testPassword);
  14 |     await page.fill('input[placeholder="Verify Password"]', testPassword);
  15 |     await page.click('button[type="submit"]');
  16 |     await expect(page).toHaveURL(/\/login/);
  17 |   });
  18 | 
  19 |   test("user can log in with correct credentials and land on dashboard", async ({ page }) => {
  20 |     await page.goto("/login");
  21 |     await page.fill('input[placeholder="Email"]', testEmail);
  22 |     await page.fill('input[placeholder="Password"]', testPassword);
  23 |     await page.click('button[type="submit"]');
> 24 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  25 |   });
  26 | 
  27 |   test("login shows an error for wrong password", async ({ page }) => {
  28 |     await page.goto("/login");
  29 |     await page.fill('input[placeholder="Email"]', testEmail);
  30 |     await page.fill('input[placeholder="Password"]', "wrongpassword");
  31 |     await page.click('button[type="submit"]');
  32 |     await expect(page).toHaveURL(/\/login/);
  33 |     await expect(page.getByText(/invalid/i)).toBeVisible();
  34 |   });
  35 | });
  36 | 
```