$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "data\app.db"
$dir = Join-Path $root "backups"

if (!(Test-Path $src)) {
  Write-Error "未找到数据库: $src"
  exit 1
}

if (!(Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = Join-Path $dir "app-$stamp.db"

$node = Get-Command node -ErrorAction SilentlyContinue
$backupScript = Join-Path $PSScriptRoot "sqlite-backup.cjs"
if ($node -and (Test-Path $backupScript)) {
  & $node.Source $backupScript $src $dest
  if ($LASTEXITCODE -eq 0 -and (Test-Path $dest)) {
    Write-Output "BACKUP_OK $dest"
    $files = Get-ChildItem $dir -Filter "app-*.db" | Sort-Object LastWriteTime -Descending
    if ($files.Count -gt 20) {
      $files | Select-Object -Skip 20 | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Output "PRUNED $($_.Name)"
      }
    }
    exit 0
  }
}

Write-Error "Consistent backup failed: VACUUM INTO did not succeed. Refusing unsafe file-copy fallback."
exit 1
