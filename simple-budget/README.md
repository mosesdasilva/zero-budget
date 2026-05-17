# Simple Budget

Simple Budget is a local-first zero-based budget app built with plain HTML, CSS, and JavaScript.

It does not connect to banks and does not store credentials. When run with the local server, data is stored in `data/zero-budget.json`. When opened directly as a file, it falls back to browser `localStorage`.

## Run It

Recommended local app mode from the project root:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

Static fallback mode:

Open `index.html` in a browser. In this mode, data is stored in that browser's `localStorage`.

## Current Features

- Dashboard with expected income, planned spending, actual spending, remaining money, and unassigned money.
- Starter zero-based budget categories.
- February 2026 starter budget based on the EveryDollar dump in the project notes.
- Funds screen for sinking fund balances like Tax Fund, Emergency Fund, Savings Fund, and Tuition Fund.
- Editable category names, groups, planned amounts, and order.
- Manual transaction entry.
- Transaction search and basic filters.
- CSV paste/upload with column mapping and preview.
- Simple duplicate detection during import.
- Merchant rules using payee contains matching.
- Fee and subscription detection.
- Markdown monthly report generation and download.
- JSON backup export.

## CSV Import Format

For exports with bank routing or account number fields, run the local cleaner first:

```powershell
.\scripts\clean-bank-csv.ps1 -InputPath "C:\path\to\transactions.csv" -OutputPath ".\private-imports\month.cleaned.csv" -AccountAlias "Checking"
```

Then upload the cleaned CSV in the app's Import tab.

The importer supports mapping these fields:

- Date
- Payee or description
- Amount
- Debit
- Credit
- Account
- Category or SuggestedCategory
- Memo
- Source

If a CSV has separate debit and credit columns, the app treats debit as spending and credit as income.

## Data Notes

- Negative amounts are spending.
- Positive amounts are income or credits.
- Savings and debt categories count as planned budget allocations.
- Duplicate detection matches date, payee, amount, and account.

## Sample Data

Use `sample-data/sample-bank-export.csv` to test the import screen.

`sample-data/sample-report.md` shows the intended Markdown report format.
