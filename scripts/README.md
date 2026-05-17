# Local Import Scripts

These scripts run locally on your machine. They are meant to clean bank exports before importing them into the static web app.

## Clean A Bank CSV

Drop raw bank CSV files in:

```text
private-imports/inbox/
```

That folder is ignored by Git.

From the project root:

```powershell
.\scripts\clean-bank-csv.ps1 -InputPath "C:\path\to\transactions.csv" -OutputPath ".\private-imports\february.cleaned.csv" -AccountAlias "Checking"
```

The cleaner removes these columns from the output:

- `Bank RTN`
- `Account Number`
- `Check Number`
- `Account Running Balance`

The cleaned CSV keeps only app-friendly fields:

- `Date`
- `Payee`
- `Memo`
- `Amount`
- `Debit`
- `Credit`
- `Account`
- `SuggestedCategory`
- `Flags`
- `Source`

Files in `private-imports/` and `*.cleaned.csv` are ignored by Git so personal bank data does not get pushed to GitHub.
