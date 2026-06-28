# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: socials.spec.ts >> Social Follow Flow >> User A can send a follow request to User B
- Location: __tests__\e2e\socials.spec.ts:26:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - heading "Sign Up Now!" [level=1] [ref=e3]
    - generic [ref=e5]:
      - generic [ref=e6]: "Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"prisma\"].user.findUnique()` invocation in C:\\Users\\user\\VSCode\\Orbital\\waypoint-wizards\\.next\\dev\\server\\chunks\\[root-of-the-server]__0o0mid8._.js:423:166 420 ; 421 async function createUser(data) { 422 const normalizedEmail = data.email.toLowerCase(); → 423 const existingUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__[\"prisma\"].user.findUnique( Server has closed the connection."
      - textbox "Email" [ref=e7]: usera1782632358794@example.com
      - textbox "Name" [ref=e8]: userA1782632358794
      - textbox "Password" [ref=e9]: TestPassword123
      - textbox "Verify Password" [ref=e10]: TestPassword123
      - button "Sign Up" [ref=e11]
  - button "Open Next.js Dev Tools" [ref=e17] [cursor=pointer]:
    - img [ref=e18]
  - alert [ref=e21]
```