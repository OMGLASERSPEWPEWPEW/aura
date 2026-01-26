# Enable Authenticated E2E Tests

**Goal:** Get the 105 skipped E2E tests running by setting up a test user.

---

## Current Status
- 199 tests pass (unauthenticated)
- 105 tests skip (need login credentials)
- 2 tests fail (unrelated bug)

---

## TODO List

### Step 1: Create Test User in Supabase
- [ ] Go to https://app.supabase.com
- [ ] Select the Aura project
- [ ] Click **Authentication** > **Users**
- [ ] Click **Add user** > **Create new user**
- [ ] Enter:
  - Email: `e2e-test@aura.test` (or any email)
  - Password: (make it strong, save it somewhere)
  - Check **Auto Confirm User**
- [ ] Click **Create user**

### Step 2: Add Environment Variables
- [ ] Open `.env` file in project root
- [ ] Add these lines at the bottom:
  ```
  TEST_USER_EMAIL=e2e-test@aura.test
  TEST_USER_PASSWORD=your_password_here
  ```
- [ ] Save the file

### Step 3: Run Tests
- [ ] Run `npm run test:e2e`
- [ ] Look for: "Authentication successful, state saved"
- [ ] Verify tests that were skipped are now running

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Tests still skip | Check env vars are set: `echo $TEST_USER_EMAIL` |
| Auth fails | Try logging in manually at localhost:5173/login |
| Invalid credentials | Verify user exists in Supabase dashboard |

---

## Key Files

| File | What it does |
|------|--------------|
| `.env` | Where you add credentials |
| `e2e/auth.setup.ts` | Logs in and saves session |
| `e2e/.auth/user.json` | Saved login state (auto-created) |
