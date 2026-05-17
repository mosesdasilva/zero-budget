param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$OutputPath,

  [string]$AccountAlias = "Checking"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputPath)) {
  throw "Input CSV not found: $InputPath"
}

if (-not $OutputPath) {
  $folder = Split-Path -Parent $InputPath
  $name = [System.IO.Path]::GetFileNameWithoutExtension($InputPath)
  $OutputPath = Join-Path $folder "$name.cleaned.csv"
}

function Convert-ToAmount {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return 0
  }

  $cleaned = $Value.Trim() -replace '[$,]', ''
  $isWrappedNegative = $cleaned.StartsWith("(") -and $cleaned.EndsWith(")")
  $cleaned = $cleaned -replace '[()]', ''

  $amount = 0.0
  if (-not [double]::TryParse($cleaned, [ref]$amount)) {
    return 0
  }

  if ($isWrappedNegative) {
    return -1 * [Math]::Abs($amount)
  }

  return $amount
}

function Normalize-Date {
  param([string]$Value)

  $parsed = [datetime]::MinValue
  if ([datetime]::TryParse($Value, [ref]$parsed)) {
    return $parsed.ToString("yyyy-MM-dd")
  }

  return $Value
}

function Normalize-Text {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  return (($Value.Trim() -replace '\s+', ' ') -replace '\b\d{9,}\b', '[redacted-number]')
}

function Get-Category {
  param([string]$Payee)

  $text = $Payee.ToUpperInvariant()

  $rules = @(
    @{ Match = "PAYROLL"; Category = "Income" },
    @{ Match = "TD ZELLE RECEIVED"; Category = "Restaurants" },
    @{ Match = "MOBILE DEPOSIT"; Category = "Income" },
    @{ Match = "CHRIST FOR THE N PAYROLL"; Category = "Income" },
    @{ Match = "CHRIST FOR THE N"; Category = "Income" },
    @{ Match = "SIDE WORK"; Category = "Income" },
    @{ Match = "CFN.ORG"; Category = "Tuition Fund" },
    @{ Match = "KROGER"; Category = "Groceries" },
    @{ Match = "WALMART"; Category = "Groceries" },
    @{ Match = "WAL MART"; Category = "Groceries" },
    @{ Match = "WM SUPERCENTER"; Category = "Groceries" },
    @{ Match = "ALDI"; Category = "Groceries" },
    @{ Match = "COSTCO"; Category = "Groceries" },
    @{ Match = "TARGET"; Category = "Groceries" },
    @{ Match = "SHELL"; Category = "Gas" },
    @{ Match = "EXXON"; Category = "Gas" },
    @{ Match = "QT"; Category = "Gas" },
    @{ Match = "RACETRAC"; Category = "Gas" },
    @{ Match = "7 ELEVEN"; Category = "Gas" },
    @{ Match = "NTTA"; Category = "Gas" },
    @{ Match = "WHATABURGER"; Category = "Restaurants" },
    @{ Match = "VILLAGE BURGER"; Category = "Restaurants" },
    @{ Match = "EL RINCON TAPATIO"; Category = "Restaurants" },
    @{ Match = "HOPDODDY"; Category = "Restaurants" },
    @{ Match = "DANNYS TORTAS"; Category = "Restaurants" },
    @{ Match = "RAISING CANES"; Category = "Restaurants" },
    @{ Match = "MCDONALDS"; Category = "Restaurants" },
    @{ Match = "STARBUCKS"; Category = "Restaurants" },
    @{ Match = "VILA BRAZIL"; Category = "Restaurants" },
    @{ Match = "ASCENSION COFFEE"; Category = "Restaurants" },
    @{ Match = "SARKU JAPAN"; Category = "Restaurants" },
    @{ Match = "FOGO"; Category = "Restaurants" },
    @{ Match = "T-MOBILE"; Category = "Phone" },
    @{ Match = "NETFLIX"; Category = "Subscriptions" },
    @{ Match = "SPOTIFY"; Category = "Subscriptions" },
    @{ Match = "APPLE"; Category = "Subscriptions" },
    @{ Match = "GOOGLE"; Category = "Subscriptions" },
    @{ Match = "OPENAI"; Category = "Subscriptions" },
    @{ Match = "PAYPAL INST XFER"; Category = "Subscriptions" },
    @{ Match = "PAYPAL PURCHASE"; Category = "Subscriptions" },
    @{ Match = "STEAMGAMES"; Category = "Subscriptions" },
    @{ Match = "AMAZON PRIME"; Category = "Subscriptions" },
    @{ Match = "HULU"; Category = "Subscriptions" },
    @{ Match = "DISNEY"; Category = "Subscriptions" },
    @{ Match = "CREDIT CARD"; Category = "Credit Card" },
    @{ Match = "DISCOVER"; Category = "Discover Card" },
    @{ Match = "AMZ_STORECRD"; Category = "Amazon Store Card" },
    @{ Match = "CAR LOAN"; Category = "Car Loan" },
    @{ Match = "PROG COUNTY"; Category = "Auto Insurance" },
    @{ Match = "PROGRESSIVE"; Category = "Auto Insurance" },
    @{ Match = "INSURANCE"; Category = "Auto Insurance" },
    @{ Match = "IRS USATAXPYMT"; Category = "Tax Fund" },
    @{ Match = "GUITAR CENTER"; Category = "Miscellaneous" },
    @{ Match = "TD ZELLE SENT"; Category = "Miscellaneous" },
    @{ Match = "LAUNDRY"; Category = "Miscellaneous" },
    @{ Match = "CITY OF GRAPEVINE"; Category = "Miscellaneous" },
    @{ Match = "1445 ROSS AVE"; Category = "Miscellaneous" },
    @{ Match = "TOPGOLF"; Category = "Miscellaneous" },
    @{ Match = "DILLARDS"; Category = "Personal" },
    @{ Match = "NORDSTROM"; Category = "Personal" },
    @{ Match = "CVS PHARMACY"; Category = "Health" },
    @{ Match = "WALGREENS"; Category = "Health" },
    @{ Match = "ATM FEE"; Category = "Fees" },
    @{ Match = "OVERDRAFT"; Category = "Fees" },
    @{ Match = "MAINTENANCE FEE"; Category = "Fees" },
    @{ Match = "LATE FEE"; Category = "Fees" },
    @{ Match = "INTEREST CHARGE"; Category = "Fees" },
    @{ Match = "SERVICE CHARGE"; Category = "Fees" }
  )

  foreach ($rule in $rules) {
    if ($text.Contains($rule.Match)) {
      return $rule.Category
    }
  }

  return ""
}

function Get-Flags {
  param([string]$Payee)

  $text = $Payee.ToUpperInvariant()
  $flags = New-Object System.Collections.Generic.List[string]

  if ($text -match 'ATM FEE|OVERDRAFT|MAINTENANCE FEE|LATE FEE|INTEREST CHARGE|SERVICE CHARGE') {
    $flags.Add("fee")
  }

  if ($text -match 'NETFLIX|SPOTIFY|APPLE|GOOGLE|AMAZON PRIME|HULU|DISNEY') {
    $flags.Add("subscription")
  }

  return ($flags -join ";")
}

$rows = Import-Csv -LiteralPath $InputPath

$cleanRows = foreach ($row in $rows) {
  $debit = Convert-ToAmount $row.Debit
  $credit = Convert-ToAmount $row.Credit
  $amount = 0

  if ($credit -ne 0) {
    $amount = [Math]::Abs($credit)
  } elseif ($debit -ne 0) {
    $amount = -1 * [Math]::Abs($debit)
  }

  $payee = Normalize-Text $row.Description

  [pscustomobject]@{
    Date = Normalize-Date $row.Date
    Payee = $payee
    Memo = Normalize-Text $row.'Transaction Type'
    Amount = "{0:F2}" -f $amount
    Debit = if ($debit -ne 0) { "{0:F2}" -f [Math]::Abs($debit) } else { "" }
    Credit = if ($credit -ne 0) { "{0:F2}" -f [Math]::Abs($credit) } else { "" }
    Account = $AccountAlias
    SuggestedCategory = Get-Category $payee
    Flags = Get-Flags $payee
    Source = "clean-bank-csv"
  }
}

$outputFolder = Split-Path -Parent $OutputPath
if ($outputFolder -and -not (Test-Path -LiteralPath $outputFolder)) {
  New-Item -ItemType Directory -Path $outputFolder | Out-Null
}

$cleanRows | Export-Csv -LiteralPath $OutputPath -NoTypeInformation

$categorySummary = $cleanRows |
  Group-Object SuggestedCategory |
  Sort-Object Name |
  ForEach-Object {
    [pscustomobject]@{
      Category = if ($_.Name) { $_.Name } else { "Uncategorized" }
      Count = $_.Count
      Total = "{0:F2}" -f (($_.Group | Measure-Object -Property Amount -Sum).Sum)
    }
  }

Write-Host "Cleaned CSV written to: $OutputPath"
Write-Host "Rows cleaned: $($cleanRows.Count)"
Write-Host "Sensitive columns removed: Bank RTN, Account Number, Check Number, Account Running Balance"
Write-Host ""
Write-Host "Category summary:"
$categorySummary | Format-Table -AutoSize
