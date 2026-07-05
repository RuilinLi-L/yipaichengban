param(
  [switch]$NoFail
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ManifestPath = Join-Path $ProjectRoot "manifest.json"
$issues = New-Object System.Collections.Generic.List[string]

function Add-Issue {
  param([string]$Message)
  $issues.Add($Message) | Out-Null
  Write-Host "  [!] $Message" -ForegroundColor Yellow
}

function Write-Ok {
  param([string]$Message)
  Write-Host "  [ok] $Message" -ForegroundColor Green
}

function Find-HBuilderX {
  $candidates = @()

  if ($env:HBUILDERX_PATH) {
    $candidates += $env:HBUILDERX_PATH
  }

  $command = Get-Command HBuilderX.exe -ErrorAction SilentlyContinue
  if ($command) {
    $candidates += $command.Source
  }

  $programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")
  $candidates += @(
    (Join-Path $env:LOCALAPPDATA "Programs\HBuilderX\HBuilderX.exe"),
    (Join-Path $env:ProgramFiles "HBuilderX\HBuilderX.exe"),
    (Join-Path $programFilesX86 "HBuilderX\HBuilderX.exe"),
    "D:\HBuilderX\HBuilderX.exe",
    "D:\Program Files\HBuilderX\HBuilderX.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  return $null
}

Write-Host "APK packaging doctor" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"

if (!(Test-Path -LiteralPath $ManifestPath)) {
  Add-Issue "manifest.json not found."
} else {
  $manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $ManifestPath | ConvertFrom-Json
  $appPlus = $manifest.'app-plus'
  $android = $appPlus.distribute.android

  if ($manifest.name) {
    Write-Ok "App name: $($manifest.name)"
  } else {
    Add-Issue "manifest.json is missing name."
  }

  if ($manifest.appid -and $manifest.appid -ne "__UNI__ZHICUN001") {
    Write-Ok "DCloud AppID: $($manifest.appid)"
  } else {
    Add-Issue "DCloud AppID is still the placeholder __UNI__ZHICUN001. Replace it with the official AppID from the DCloud console."
  }

  if ($manifest.versionName -and $manifest.versionCode) {
    Write-Ok "Version: $($manifest.versionName) ($($manifest.versionCode))"
  } else {
    Add-Issue "versionName or versionCode is missing."
  }

  if ($android.packagename -match "^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$") {
    Write-Ok "Android package: $($android.packagename)"
  } else {
    Add-Issue "Android package name is missing or invalid."
  }

  if ($android.permissions -and $android.permissions.Count -gt 0) {
    Write-Ok "Android permissions declared: $($android.permissions.Count)"
  } else {
    Add-Issue "Android permissions are not declared."
  }
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  Write-Ok "Node.js: $($node.Source)"
} else {
  Add-Issue "Node.js was not found. It is useful for running the project helper scripts."
}

$hbuilderx = Find-HBuilderX
if ($hbuilderx) {
  Write-Ok "HBuilderX: $hbuilderx"
} else {
  Add-Issue "HBuilderX was not found. Install HBuilderX or set HBUILDERX_PATH to HBuilderX.exe before packaging."
}

Write-Host ""
if ($issues.Count -eq 0) {
  Write-Host "Ready for HBuilderX Android cloud packaging." -ForegroundColor Green
  exit 0
}

Write-Host "Not ready yet. Fix the items above, then run npm run apk:doctor again." -ForegroundColor Yellow
if ($NoFail) {
  exit 0
}
exit 1
