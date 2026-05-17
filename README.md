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

For the local app version with a JSON data file, run:

```powershell
npm start
```

Then open `http://localhost:3000`.

On Windows, you can also double-click:

```text
Start-ZeroBudget.bat
```

That launcher starts the local server if it is not already running, then opens the app in your browser.

## Next Step

Review the first scaffold manually, then decide whether to improve the budget screen, transaction entry, or CSV import flow next.
