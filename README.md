# Zero Budget

Zero Budget is planned as a very small local-first zero-based budget web app.

The goal is to build it step by step as a static app using plain HTML, CSS, and JavaScript. It should run locally, store data in the browser, import bank CSV files, categorize transactions, detect fees and subscriptions, and export Markdown reports.

See [AGENTS.md](AGENTS.md) for the working project brief and implementation guide.

## Current Status

The first static app scaffold lives in `simple-budget/`:

```text
simple-budget/
  index.html
  styles.css
  app.js
  sample-data/
    sample-bank-export.csv
    sample-report.md
```

Open `simple-budget/index.html` in a browser to try the starter app.

## Next Step

Review the first scaffold manually, then decide whether to improve the budget screen, transaction entry, or CSV import flow next.
