# Explore — Sidebar navigation to Calendar (ticket-less)

## Coverage snapshot

| Flow | Spec coverage | Notes |
|------|---------------|--------|
| Communities → create group form | **Partial** — `tests/aqpbt-3-communities-new.spec.ts` | Enters via `/communities/new` or list CTA; not via sidebar-only smoke |
| Login (happy path) | **Infra only** — `tests/auth.setup.ts` | No tagged UI spec |
| API cleanup | **Partial** — `tests/p10-cleanup.verification.spec.ts` | Not a user journey |
| Dashboard greeting / stats | **None** (Gherkin only) | `features/AQPBT-2.feature.md` — [AQPBT-2](https://legionqaschool.atlassian.net/browse/AQPBT-2) |
| Sidebar → **Calendar** | **Gap** | `CalendarPage` + `HeaderComponent.openCalendar()` exist; no spec |
| Sidebar → Friends, Availability, Playdates, Birthdays, Profile, Admin | **Gap** | POMs only |
| Sidebar **Discover** / **Go Premium** | **Gap** | Button, not exercised in specs |

Exploration (read-only): `browser_navigate` to `https://test.buddytime.ca/app`, `browser_snapshot`, sidebar link **Calendar** → `/calendar`, snapshot; link **Dashboard** → `/app`, snapshot. No screenshots, no form submits, no invites.

## Selected gap

**Signed-in parent opens Calendar from the sidebar while on Dashboard** — highest-value ticket-less gap because the sidebar is the primary router for every signed-in area, `/calendar` has no AQPBT story or spec, and a single smoke here validates URL, top banner, and main calendar copy without mutating data.

**Jira / AC check:** Queried AQPBT for sidebar, navigation, Calendar page, Discover, Log out, My Profile. No story covers “navigate to `/calendar` via sidebar and land on the family calendar.” [AQPBT-2](https://legionqaschool.atlassian.net/browse/AQPBT-2) is limited to greeting and summary stats on `/app` (content ACs, not sidebar routing). [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12) is playdate row calendar export, not the Calendar nav destination. Communities navigation is partially covered by [AQPBT-3](https://legionqaschool.atlassian.net/browse/AQPBT-3) — not selected.

## Gherkin test plan

```gherkin
Feature: Sidebar navigation — open Calendar from Dashboard

  As a signed-in parent
  I want to open Calendar from the sidebar while I am on the Dashboard
  So that I can view my family calendar without typing a URL

  Background:
    Given I am signed in as the main practicum family
    And I am on "/app"
    And the banner shows "Dashboard"

  Scenario: Positive — Sidebar Calendar link opens family calendar
    When I click the link "Calendar" in the navigation region
    Then the URL is "/calendar"
    And the banner shows "Calendar"
    And "Your family calendar" is visible

  Scenario: Edge — Return to Dashboard from Calendar via sidebar
    Given I clicked the link "Calendar" in the navigation region
    And the URL is "/calendar"
    When I click the link "Dashboard" in the navigation region
    Then the URL is "/app"
    And the banner shows "Dashboard"
```

## Locator hints

- Scope sidebar to `page.getByRole('complementary')` (matches `HeaderComponent.sidebar`).
- Nav links: `sidebar.getByRole('navigation').getByRole('link', { name: 'Calendar' })` and `{ name: 'Dashboard' }` — names from live snapshot (`Dashboard`, `Calendar`).
- Top banner title: `page.getByRole('banner').getByText('Calendar', { exact: true })` / `'Dashboard'` (banner `generic` text in snapshot).
- Calendar body copy: `page.getByText('Your family calendar')`.

## For test-writer

- Suggested file: [`tests/explore-sidebar-calendar-nav.spec.ts`](../tests/explore-sidebar-calendar-nav.spec.ts) (or fold into a broader `sidebar-nav.spec.ts` after review).
- Reuse [`HeaderComponent`](../pages/components/header.component.ts): `openCalendar()`, `openDashboard()`; [`CalendarPage`](../pages/calendar.page.ts) for optional `goto()` in Background vs always clicking sidebar.
- Auth: `storageState` from setup project; no per-test UI login.
- Tags: one tag per `test()` — e.g. positive `@smoke`, edge `@sanity`.
- Do not assert month grid cell values (locale/time-dependent); assert stable strings only (`Your family calendar`, banner titles, URLs).
- POM updates: optional `bannerTitle(name: string)` on `HeaderComponent` if banner locator is duplicated across specs.

## Suggested Jira story

**Title:** Sidebar navigation: open Calendar from Dashboard and return

**Story:** As a signed-in parent, I want to use the sidebar **Calendar** link from the Dashboard so that I reach my family calendar and can return to the Dashboard without using the address bar.

**Acceptance criteria (draft):**

1. From `/app`, clicking **Calendar** in the sidebar goes to `/calendar`, shows banner **Calendar**, and shows **Your family calendar**.
2. From `/calendar`, clicking **Dashboard** in the sidebar goes to `/app` and shows banner **Dashboard**.

<!--
Live exploration: test.buddytime.ca, 2026-10-09. Signed-in account sidebar showed "Lev Test" and "📍 Thornhill beta"; Calendar view showed "October 2026", weekday headers Sun–Sat, panels "This week" / "🎂 Birthdays this month". Discover and Go Premium not clicked (out of scope for this flow).
-->
