$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "Preparing Android APK packaging..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "check-apk-env.ps1")

Write-Host ""
Write-Host "Next steps in HBuilderX:" -ForegroundColor Cyan
Write-Host "  1. Sign in to your DCloud account."
Write-Host "  2. Open manifest.json and confirm the official AppID."
Write-Host "  3. Choose Release / Native App cloud packaging."
Write-Host "  4. Choose Android, confirm package name and signing settings, then start packaging."
Write-Host "  5. Download the generated APK from the HBuilderX packaging result."
Write-Host ""
Write-Host "Opening project..."
& (Join-Path $PSScriptRoot "open-hbuilderx.ps1")
