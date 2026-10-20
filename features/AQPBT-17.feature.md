# AQPBT-17 — Gherkin (sidebar Go Premium coming-soon feedback)

```gherkin
Feature: Sidebar Go Premium upsell — coming-soon feedback

  As a signed-in parent or guardian
  I want to activate Go Premium in the sidebar
  So that I know premium is not available yet and what to expect when it launches

  # Happy paths

  Scenario: AC1 — Signed-in Go Premium stays on the dashboard and shows coming soon
    Given I am signed in as the main test family
    When I open "/app"
    Then the button "Go Premium" is visible
    When I activate "Go Premium"
    Then the URL path stays "/app"
    And the status feedback "Premium — coming soon! ✨" is visible

  # Negative

  Scenario: AC2 — Logged-out visit to the dashboard redirects and hides Go Premium
    Given I have no signed-in session
    When I open "/app"
    Then the URL path is "/login"
    And the button "Go Premium" is not visible

  # Edge cases

  # No edge scenario is an acceptance criterion. Observed second-click behavior and other routes are listed in the gaps comment.
```

<!--
Ambiguities / gaps (AQPBT-17 + Confluence page 325320705, space AQPBT):

Acceptance criteria:
- AC1: signed in as the main test family, open /app, button Go Premium visible; activate it; URL path stays /app; status feedback "Premium — coming soon! ✨" visible.
- AC2: no signed-in session, open /app; URL path is /login; button Go Premium is not visible.

Test coverage (existing spec, not rewritten):
- AC1 — tests/aqpbt-17-go-premium.spec.ts "AC1 — signed-in Go Premium shows coming soon on the dashboard @sanity". DashboardPage.goto(), header.goPremiumButton visible, header.openGoPremium(), URL AppRoute.Dashboard, header.premiumComingSoonStatus visible. Passed on the last run.
- AC2 — tests/aqpbt-17-go-premium.spec.ts "AC2 — logged-out dashboard redirects to login without Go Premium @regression". Empty storageState so the saved session is not reused. URL AppRoute.Login, Go Premium not visible. Passed on the last run.
- One tag per test: @sanity on AC1, @regression on AC2. The ticket names both tags; the constitution allows only one tag on each test().
- No API cleanup. Read-only flows.

Gaps in the requirements:
- Confluence business rule 4 also shows heading "Welcome back" on the logged-out redirect. Jira AC2 does not. The spec does not assert that heading.
- Coming-soon feedback on signed-in routes other than /app is unspecified. The AC covers only /app.
- Whether the status dismisses on its own is unspecified.
- A second click leaving the same status visible was observed on the feature page and is not an AC.
- Purchase, pricing, benefits copy, Discover, and Family B are out of scope.
- The status node has role="status" and the message as text content. It has no accessible name (no aria-label or aria-labelledby). A getByRole name match does not find it.

Automation notes (from the ticket and the live status node):
- POM: DashboardPage holds HeaderComponent. premiumComingSoonStatus is page.getByRole("status").filter({ hasText: /^Premium — coming soon! ✨$/ }). The dash is U+2014. The mark is U+2728.
- Spec path named by the ticket: tests/aqpbt-17-go-premium.spec.ts.
-->
