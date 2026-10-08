# AQPBT-2 — Gherkin (Dashboard greeting and summary stats on `/app`)

```gherkin
Feature: Dashboard greeting and summary stats — time-based greeting and four summary counts

  As a signed-in parent
  I want to see a time-of-day greeting with my first name and four summary counts on the Dashboard
  So that I can tell whose account I am in and get a quick snapshot of kids, circle, playdates, and birthdays this month

  Background:
    Given I am signed in as Family A

  # Happy paths

  Scenario: AC1 — Dashboard shows greeting, banner title, and wave emoji
    When I open "/app"
    Then the URL is "/app"
    And the banner title "Dashboard" is visible
    And the heading at level 2 matches the pattern "Good (morning|afternoon|evening), Yaroslav! 👋"

  Scenario: AC2 — Greeting starts with Good morning before 12:00 local time
    Given my browser local time is before 12:00 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good morning, Yaroslav!"

  Scenario: AC3 — Greeting starts with Good afternoon from 12:00 through 17:59 local time
    Given my browser local time is from 12:00 through 17:59 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good afternoon, Yaroslav!"

  Scenario: AC4 — Greeting starts with Good evening from 18:00 through 23:59 local time
    Given my browser local time is from 18:00 through 23:59 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good evening, Yaroslav!"

  Scenario: AC5 — Empty family setup shows setup subtitle under the greeting
    Given Family A has no family set up
    When I open "/app"
    Then "Start by setting up your family below." is visible below the greeting heading

  Scenario: AC6 — Summary row shows four labeled cards each at zero when data is empty
    Given I am signed in on "/app" with no kids, circle, playdates, or birthdays data
    When I view the summary row
    Then the card "My Kids" shows the value "0"
    And the card "Families in Circle" shows the value "0"
    And the card "Playdates" shows the value "0"
    And the card "Birthdays This Month" shows the value "0"

  Scenario: AC7 — Clicking each summary card keeps me on the Dashboard
    Given I am on "/app" viewing the four summary cards
    When I click the card "My Kids"
    Then the URL is "/app"
    When I click the card "Families in Circle"
    Then the URL is "/app"
    When I click the card "Playdates"
    Then the URL is "/app"
    When I click the card "Birthdays This Month"
    Then the URL is "/app"

  Scenario: AC8 — Family B sees their own first name and stats, not Family A’s
    Given I am signed in as Family B
    When I open "/app"
    Then the heading at level 2 includes "Yaroslav2"
    And the heading at level 2 does not include "Yaroslav!"
    And the card "My Kids" shows Family B’s own stats for that account
    And the card "Families in Circle" shows Family B’s own stats for that account
    And the card "Playdates" shows Family B’s own stats for that account
    And the card "Birthdays This Month" shows Family B’s own stats for that account

  # Negative

  Scenario: AC9 — Logged-out visit to Dashboard redirects to login without greeting or stats
    Given I am logged out
    When I open "/app"
    Then the URL is "/login"
    And the heading "Welcome back" is visible
    And the banner title "Dashboard" is not visible
    And no Dashboard greeting heading matching "Good (morning|afternoon|evening)," is visible
    And the card "My Kids" is not visible

  # Edge cases

  Scenario: Edge — Greeting uses first name only and ends with exclamation and wave emoji
    When I open "/app"
    Then the heading at level 2 ends with "! 👋"
    And the heading at level 2 does not include "Zulyak"

  Scenario: Edge — Greeting first name matches the first word of the sidebar account name
    Given the sidebar account name for Family A is "Yaroslav Zulyak"
    When I open "/app"
    Then the heading at level 2 includes "Yaroslav!"

  Scenario: Edge — Summary cards appear in documented order left to right
    When I open "/app"
    Then the summary cards appear in order "My Kids", "Families in Circle", "Playdates", "Birthdays This Month"

  Scenario: Edge — Local time 00:30 uses Good morning wording
    Given my browser local time is 00:30 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good morning, Yaroslav!"

  Scenario: Edge — Local time exactly 12:00 uses Good afternoon wording
    Given my browser local time is 12:00 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good afternoon, Yaroslav!"

  Scenario: Edge — Local time 17:59 uses Good afternoon wording
    Given my browser local time is 17:59 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good afternoon, Yaroslav!"

  Scenario: Edge — Local time exactly 18:00 uses Good evening wording
    Given my browser local time is 18:00 on the same calendar day
    When I open "/app"
    Then the heading at level 2 starts with "Good evening, Yaroslav!"

  Scenario: Edge — Family B greeting uses Yaroslav2 from sidebar account Yaroslav2 Zulyak2
    Given I am signed in as Family B
    And the sidebar account name for Family B is "Yaroslav2 Zulyak2"
    When I open "/app"
    Then the heading at level 2 includes "Yaroslav2!"

  Scenario: Edge — Family B empty account still shows all four stats at zero
    Given I am signed in as Family B
    And Family B has no kids, circle, playdates, or birthdays data
    When I open "/app"
    Then the card "My Kids" shows the value "0"
    And the card "Families in Circle" shows the value "0"
    And the card "Playdates" shows the value "0"
    And the card "Birthdays This Month" shows the value "0"
```

<!--
Ambiguities / gaps (AQPBT-2 + Confluence [Dashboard greeting and summary stats](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/307003393)):

- Subtitle after family setup is created: only "Start by setting up your family below." is specified; post-setup copy is unknown.
- Non-zero counts for My Kids, Families in Circle, Playdates, and Birthdays This Month are explicitly out of scope in Jira; exact count rules (upcoming vs all playdates, whose birthdays, pending circle invites) are undefined.
- Whether Profile Display name overrides the greeting first name when filled was not verified (Family B had empty Display name; greeting still used Yaroslav2).
- Whether the greeting updates at a time-of-day boundary without a full page reload is unspecified.
- Loading, empty-error, or failed-stats UI on the summary row was not observed in Confluence.
- Time-of-day ACs depend on browser local clock; mechanism for deterministic automation (clock override vs run-window scheduling) is not named in the ticket.
- AC8 "own stats" with both families at zero: automation can only assert isolation of the greeting name unless non-zero fixture data is added later (out of scope for this story).
- Guest / invited-user Dashboard access is out of scope (no signed-in guest greeting observed).
- Other `/app` widgets (email confirm, set up family, kids, playdates CTAs, sidebar beyond auth gate) are separate Feature map rows — not covered here.

Automation notes (when implementing, not part of AC):
- Family A / Family B are the accounts documented in AQPBT-2, not automatically this repo's main/alt accounts. Before automation, confirm suitable account mapping and required empty-data preconditions. Never reset existing shared data to satisfy them.
- Route: `/app`. Greeting: level-2 heading per Confluence. Stat cards: Confluence documents `.stat-card` blocks; prefer user-facing labels from the ticket.
-->
