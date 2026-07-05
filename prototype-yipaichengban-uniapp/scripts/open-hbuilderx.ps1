$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

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

$hbuilderx = Find-HBuilderX
if (!$hbuilderx) {
  Write-Host "HBuilderX was not found." -ForegroundColor Yellow
  Write-Host "Install HBuilderX, or set HBUILDERX_PATH to the full path of HBuilderX.exe."
  Write-Host "Example:"
  Write-Host "  `$env:HBUILDERX_PATH = ""C:\Program Files\HBuilderX\HBuilderX.exe"""
  exit 1
}

Write-Host "Opening uni-app project in HBuilderX:" -ForegroundColor Cyan
Write-Host "  $ProjectRoot"
Start-Process -FilePath $hbuilderx -ArgumentList "`"$ProjectRoot`""
