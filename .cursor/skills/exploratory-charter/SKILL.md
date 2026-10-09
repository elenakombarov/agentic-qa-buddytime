---
name: exploratory-charter
description: Turns a feature name and a risk into a session charter and a blank findings template. Use when the user asks for an exploratory charter, session charter, exploratory testing plan, or wants to structure a time-boxed exploration before or after clicking through the app. The tester supplies the thinking; this skill only enforces the format.
---

# Exploratory charter

Format only. **Never invent** risks, oracles, areas to probe, or findings. The tester supplies the thinking; this skill enforces structure and where to save the file.

## Required inputs

| Input | Rule |
|-------|------|
| **Feature** | Name of the feature or area under exploration. If missing, ask before writing anything. |
| **Risk** | What could go wrong or what matters most for this session. If missing, ask before writing anything. |

Do not proceed to create a charter until both **feature** and **risk** are provided (by the user or confirmed in the same thread).

## Optional inputs

Use only when the user supplies them. Leave blank in the output when not provided — do not guess or fill with placeholders.

- Time box
- In scope / Out of scope
- Ticket key (e.g. Jira)
- Confluence page (title, URL, or key)
- Page URL (app route or environment URL)

## Workflow

1. Confirm **feature** and **risk** (ask if either is missing).
2. Derive **feature slug** from the feature name (lowercase, hyphen-separated, safe for filenames).
3. Write one Markdown file using the charter template and findings template below.
4. Save at [`charters/<feature-slug>.md`](../../../charters/) at the repo root.

## Charter template

Use this structure. Copy user-provided values into the matching fields; leave optional fields empty when not supplied. If the user supplies a mission, put it under **Mission**; otherwise leave **Mission** blank — do not invent one.

```markdown
# Session charter — <Feature>

| Field | Value |
|-------|-------|
| Feature | <from user> |
| Risk | <from user> |
| Time box | |
| In scope | |
| Out of scope | |
| Ticket | |

## Mission



## Oracles (human)



## Areas to probe (human)



## Notes before start


```

## Findings template

Append after the charter sections in the same file.

```markdown
## Findings

| # | Type (bug / question / note) | Area | Observation | Severity | Follow-up |
|---|------------------------------|------|-------------|----------|-----------|

## Coverage

| Tried | Not tried | Charter done? |
|-------|-----------|---------------|
| | | |
```

Leave the findings table empty (header row only) unless the user explicitly provides findings to record. Do not invent rows.

## Do not (unless the user asks)

- Explore the app, run Playwright, or take snapshots for this skill
- Write or change specs, POMs, or test data
- File Jira bugs or create tickets from findings
- Fill in oracles, areas to probe, or findings on behalf of the tester

## Verify

New chat: `Write an exploratory charter for <feature>. The risk is <risk>.` A charter appears in [`charters/`](../../../charters/) with the supplied feature and risk; oracles, areas to probe, and findings remain blank for the tester. Asking without a **risk** (or without a **feature**) must prompt for the missing input before creating a file.
