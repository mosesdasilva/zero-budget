# Simple Budget

Simple Budget is a local-first zero-based budget app built with plain HTML, CSS, and JavaScript.

It does not use a backend server, does not connect to banks, and does not store credentials. Data is stored in the browser with `localStorage`.

## Run It

Open `index.html` in a browser.

No install step is required.

## Current Features

- Dashboard with expected income, planned spending, actual spending, remaining money, and unassigned money.
- Starter zero-based budget categories.
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

The importer supports mapping these fields:

- Date
- Payee or description
- Amount
- Debit
- Credit
- Account

If a CSV has separate debit and credit columns, the app treats debit as spending and credit as income.

## Data Notes

- Negative amounts are spending.
- Positive amounts are income or credits.
- Savings and debt categories count as planned budget allocations.
- Duplicate detection matches date, payee, amount, and account.

## Sample Data

Use `sample-data/sample-bank-export.csv` to test the import screen.

`sample-data/sample-report.md` shows the intended Markdown report format.
