# Block 04 — Evidence

## P16 — Login heading probe (Playwright + POM)

### Verification prompt (exact)

```
Write a test that the login page shows its heading.
Do not run tests or commit yet.
```

### Probe artifact

File created for the probe: `tests/login.spec.ts` (untracked; removed after evidence capture — see disposition below).

### LoginPage usage in the probe

**Import**

```typescript
import { LoginPage } from '../pages';
```

**Instantiation**

```typescript
const loginPage = new LoginPage(page);
```

**Heading assertion** (web-first; locator owned by `LoginPage.heading` → `getByRole('heading', { name: 'Welcome back' })`)

```typescript
await expect(loginPage.heading).toBeVisible();
```

**Full probe spec (as generated)**

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';
import { AppRoute } from '../test-data/routes';

test.use({ storageState: { cookies: [], origins: [] } });

test('login page shows welcome heading @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  await expect(page).toHaveURL(AppRoute.Login);
  await expect(loginPage.heading).toBeVisible();
});
```

### POM skill invocation

When asked whether `.cursor/skills/pom-conventions/SKILL.md` was read during probe generation, the agent reported **no** explicit `Read` of that skill file in the tool log (only an automatic “may be relevant” hint after reading `pages/login.page.ts`). **Automatic skill invocation is not confirmed** for this run.

### Disposition

- `tests/login.spec.ts`: **deleted** — `git status` showed `??` (untracked probe from this chat), not a tracked repo file.
- Probe was not run and not committed.
