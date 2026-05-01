# Zero Budget Codex Guide

This project is a very simple local-first zero-based budget web app. Keep it small, readable, and easy to change with Codex.

## Product Goal

Build a lightweight local alternative to Actual Budget, EveryDollar, and YNAB for monthly zero-based budgeting.

The app should help a user:

- Plan a monthly zero-based budget.
- Import bank or credit card CSV exports.
- Categorize transactions.
- Detect likely fees and subscriptions.
- Remember simple merchant rules.
- Export CSV data and Markdown monthly reports.

## Non-Goals

Do not turn this into a full finance platform.

- No backend server.
- No bank connections.
- No credential storage.
- No cloud sync.
- No user accounts.
- No heavy framework unless there is a clear reason.
- No complex build system unless explicitly requested.

## Technical Direction

Prefer a static app using:

- `index.html`
- `styles.css`
- `app.js`
- Browser storage with `localStorage` first, IndexedDB only if needed later.

The app should run by opening `index.html` directly in a browser. A local dev server may be used for testing, but should not be required.

Keep JavaScript plain and organized into obvious sections:

- Constants and starter data.
- Storage helpers.
- Budget calculations.
- CSV parsing and export.
- Import mapping and duplicate detection.
- Merchant rules and detection.
- Markdown report generation.
- UI rendering and event handlers.

## Project Structure

Target structure:

```text
simple-budget/
  index.html
  styles.css
  app.js
  README.md
  sample-data/
    sample-bank-export.csv
    sample-report.md
```

If the project remains directly in the repository root instead of `simple-budget/`, keep the same file names and `sample-data/` folder.

## Budget Model

Use a monthly zero-based budget.

Each month has:

- Expected income.
- Budget categories.
- Planned amount per category.
- Actual spending per category.
- Remaining amount per category.
- Unassigned money.

The goal is:

```text
income - planned spending - savings/debt goals = 0
```

Savings and debt categories count as planned allocations.

Starter category groups:

- Giving
- Housing
- Food
- Transportation
- Insurance
- Debt
- Savings
- Personal
- Subscriptions
- Fees

Users should be able to add, edit, delete, and reorder categories.

## Transaction Model

Normalize transactions to this shape:

```js
{
  id: "string",
  date: "YYYY-MM-DD",
  payee: "string",
  memo: "string",
  amount: -42.50,
  category: "Groceries",
  account: "Checking",
  source: "manual | csv",
  status: "cleared | pending | reviewed"
}
```

Convention:

- Negative amounts are spending.
- Positive amounts are income or credits.

CSV import should support mapping:

- Date
- Description/payee
- Amount
- Debit
- Credit
- Account

Duplicate detection should be simple and explainable. A good first pass is matching normalized date, payee, amount, and account.

## Rules And Detection

Merchant rules are simple contains rules:

```js
{
  id: "string",
  matchText: "KROGER",
  category: "Groceries"
}
```

Starter examples:

- Payee contains `KROGER` -> `Groceries`
- Payee contains `SHELL` -> `Gas`
- Payee contains `NETFLIX` -> `Subscriptions`

Likely fee detection should flag payees or memos containing terms such as:

- ATM fee
- Overdraft fee
- Maintenance fee
- Late fee
- Interest charge
- Service charge

Likely subscription detection should flag terms such as:

- Netflix
- Spotify
- Apple
- Google
- Amazon Prime
- Hulu
- Disney

Uncategorized transactions should be very visible.

## UI Requirements

The first screen is the budget dashboard, not a marketing page.

Use tabs or sidebar navigation:

- Dashboard
- Budget
- Transactions
- Import
- Rules
- Reports
- Settings

Dashboard should show:

- Income
- Planned spending
- Actual spending
- Remaining money
- Unassigned money
- Overspent categories
- Uncategorized transactions
- Fees found this month

Budget screen category rows:

- Category name
- Group
- Planned
- Actual
- Remaining

Transactions screen:

- Search
- Filters
- Category editing
- Delete transaction

Import screen:

- Paste CSV text or upload CSV file.
- Preview rows before importing.
- Column mapping.
- Duplicate warnings.

Rules screen:

- Add, edit, delete merchant rules.
- Test a rule against existing transactions.

Reports screen:

- Generate a Markdown monthly review.
- Allow copying or downloading the report.

## Markdown Report Format

The monthly report should include:

- Month
- Income summary
- Planned vs actual spending
- Zero-based status
- Overspent categories
- Fees found
- Subscriptions found
- Uncategorized transactions
- Suggested merchant rules
- Notes section

## Implementation Principles

- Keep every feature understandable from the source code.
- Prefer direct data structures over abstractions.
- Avoid dependencies unless they remove clear complexity.
- Keep UI plain, practical, and dense enough for budgeting work.
- Use accessible form labels and ordinary controls.
- Do not add branding, landing pages, animations, or marketing copy.
- Test by opening the app locally and using the sample CSV.

## Suggested Step Plan

1. Create the static project scaffold and sample files.
2. Build the storage model and starter data.
3. Build the dashboard and budget screen.
4. Add manual transaction entry and transaction list editing.
5. Add CSV paste/upload, column mapping, preview, and import.
6. Add duplicate detection and merchant rules.
7. Add fee/subscription detection.
8. Add CSV export and Markdown report export.
9. Polish README instructions and run through sample data manually.

