$ErrorActionPreference = "Stop"
$utf8 = [System.Text.Encoding]::UTF8
$base = "http://localhost:3000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Invoke-Json {
  param(
    [string]$Uri,
    [string]$Method = "GET",
    $Body = $null,
    [switch]$WithSession
  )
  $params = @{
    Uri = $Uri
    Method = $Method
    UseBasicParsing = $true
  }
  if ($WithSession) { $params.WebSession = $session }
  if ($null -ne $Body) {
    $params.Body = $utf8.GetBytes(($Body | ConvertTo-Json -Depth 5 -Compress))
    $params.ContentType = "application/json; charset=utf-8"
  }
  $res = Invoke-WebRequest @params
  $text = $utf8.GetString($res.RawContentStream.ToArray())
  return @{ StatusCode = $res.StatusCode; Json = ($text | ConvertFrom-Json); Text = $text }
}

$loginPage = Invoke-WebRequest -Uri "$base/login" -UseBasicParsing
"LOGIN_PAGE=$($loginPage.StatusCode)"

$user = "tester_" + (Get-Random -Maximum 99999)
$reg = Invoke-Json -Uri "$base/api/auth/register" -Method POST -WithSession -Body @{
  username = $user
  password = "secret123"
}
"REGISTER=$($reg.StatusCode) user=$($reg.Json.user.username)"

$me = Invoke-Json -Uri "$base/api/auth/me" -WithSession
"ME=$($me.StatusCode) user=$($me.Json.user.username)"

try {
  Invoke-Json -Uri "$base/api/auth/register" -Method POST -Body @{
    username = $user
    password = "secret123"
  } | Out-Null
  "DUP=FAIL"
} catch {
  "DUP_OK=$($_.Exception.Response.StatusCode.value__)"
}

$session2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginParams = @{
  Uri = "$base/api/auth/login"
  Method = "POST"
  UseBasicParsing = $true
  WebSession = $session2
  ContentType = "application/json; charset=utf-8"
  Body = $utf8.GetBytes((@{ username = $user; password = "secret123" } | ConvertTo-Json -Compress))
}
$loginRes = Invoke-WebRequest @loginParams
$loginJson = $utf8.GetString($loginRes.RawContentStream.ToArray()) | ConvertFrom-Json
"LOGIN=$($loginRes.StatusCode) user=$($loginJson.user.username)"

try {
  Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -UseBasicParsing -ContentType "application/json" -Body ($utf8.GetBytes('{"username":"bad","password":"x"}')) | Out-Null
  "BAD_LOGIN=FAIL"
} catch {
  "BAD_LOGIN_OK=$($_.Exception.Response.StatusCode.value__)"
}

$admin = Invoke-Json -Uri "$base/api/admin" -WithSession
"ADMIN_WITH_USER=$($admin.StatusCode)"

try {
  Invoke-WebRequest -Uri "$base/api/admin" -UseBasicParsing | Out-Null
  "ADMIN_ANON=FAIL"
} catch {
  "ADMIN_ANON_OK=$($_.Exception.Response.StatusCode.value__)"
}

$logout = Invoke-Json -Uri "$base/api/auth/logout" -Method POST -WithSession
"LOGOUT=$($logout.StatusCode)"
$me2 = Invoke-Json -Uri "$base/api/auth/me" -WithSession
"ME_AFTER_LOGOUT=$($me2.Json.user)"
