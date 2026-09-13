$ErrorActionPreference = "Stop"
$utf8 = [System.Text.Encoding]::UTF8
$base = "http://localhost:3000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$loginParams = @{
  Uri = "$base/api/auth/login"
  Method = "POST"
  UseBasicParsing = $true
  WebSession = $session
  ContentType = "application/json; charset=utf-8"
  Body = $utf8.GetBytes((@{ username = $env:TEST_USER; password = $env:TEST_PASS } | ConvertTo-Json -Compress))
}
$loginRes = Invoke-WebRequest @loginParams
$loginJson = $utf8.GetString($loginRes.RawContentStream.ToArray()) | ConvertFrom-Json
"LOGIN=$($loginRes.StatusCode) user=$($loginJson.user.username)"

$meRes = Invoke-WebRequest -Uri "$base/api/auth/me" -UseBasicParsing -WebSession $session
$meJson = $utf8.GetString($meRes.RawContentStream.ToArray()) | ConvertFrom-Json
"ME=$($meJson.user.username)"

$adminRes = Invoke-WebRequest -Uri "$base/api/admin" -UseBasicParsing -WebSession $session
"ADMIN_API=$($adminRes.StatusCode)"
