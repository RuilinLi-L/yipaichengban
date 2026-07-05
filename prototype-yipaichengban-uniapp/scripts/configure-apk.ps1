param(
  [string]$DCloudAppId,
  [string]$PackageName,
  [string]$VersionName,
  [int]$VersionCode = 0
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ManifestPath = Join-Path $ProjectRoot "manifest.json"

if (!$DCloudAppId -and !$PackageName -and !$VersionName -and $VersionCode -eq 0) {
  Write-Host "Usage:" -ForegroundColor Cyan
  Write-Host "  npm run apk:configure -- -DCloudAppId ""__UNI__xxxxxxx"" -PackageName ""com.yipaichengban.zhicun"" -VersionName ""0.1.0"" -VersionCode 1"
  exit 0
}

if (!(Test-Path -LiteralPath $ManifestPath)) {
  throw "manifest.json not found: $ManifestPath"
}

$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $ManifestPath | ConvertFrom-Json

if ($DCloudAppId) {
  if ($DCloudAppId -notmatch "^__UNI__[A-Za-z0-9]+$") {
    throw "DCloudAppId should look like __UNI__xxxxxxx."
  }
  $manifest.appid = $DCloudAppId
}

if ($PackageName) {
  if ($PackageName -notmatch "^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$") {
    throw "PackageName should look like com.company.app."
  }
  $manifest.'app-plus'.distribute.android.packagename = $PackageName
}

if ($VersionName) {
  $manifest.versionName = $VersionName
}

if ($VersionCode -gt 0) {
  $manifest.versionCode = [string]$VersionCode
}

$json = $manifest | ConvertTo-Json -Depth 32
Set-Content -LiteralPath $ManifestPath -Value $json -Encoding UTF8

Write-Host "Updated manifest.json for Android APK packaging." -ForegroundColor Green
Write-Host "Run npm run apk:doctor to verify the packaging configuration."
