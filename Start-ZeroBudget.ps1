$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 3000
$Url = "http://localhost:$Port"

Set-Location -LiteralPath $ProjectRoot

$server = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Where-Object { $_.State -eq "Listen" } |
  Select-Object -First 1

if (-not $server) {
  Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Set-Location -LiteralPath '$ProjectRoot'; npm start"
  )

  Start-Sleep -Seconds 2
}

Start-Process $Url

