$ErrorActionPreference = "Stop"
$utf8 = [System.Text.Encoding]::UTF8
$base = "http://localhost:3000"

function Login-As([string]$username, [string]$password) {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $params = @{
    Uri = "$base/api/auth/login"
    Method = "POST"
    UseBasicParsing = $true
    WebSession = $session
    ContentType = "application/json; charset=utf-8"
    Body = $utf8.GetBytes((@{ username = $username; password = $password } | ConvertTo-Json -Compress))
  }
  $res = Invoke-WebRequest @params
  $json = $utf8.GetString($res.RawContentStream.ToArray()) | ConvertFrom-Json
  return @{ Session = $session; User = $json.user; Status = $res.StatusCode }
}

function Get-Status([string]$Uri, $Session) {
  try {
    $res = Invoke-WebRequest -Uri $Uri -UseBasicParsing -WebSession $Session
    return $res.StatusCode
  } catch {
    return $_.Exception.Response.StatusCode.value__
  }
}

# admin user
$admin = Login-As $env:TEST_USER $env:TEST_PASS
"ADMIN_LOGIN=$($admin.Status) role=$($admin.User.role)"
"ADMIN_API=$(Get-Status "$base/api/admin" $admin.Session)"

# regular user
$regName = "norm_" + (Get-Random -Maximum 99999)
$regSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$regParams = @{
  Uri = "$base/api/auth/register"
  Method = "POST"
  UseBasicParsing = $true
  WebSession = $regSession
  ContentType = "application/json; charset=utf-8"
  Body = $utf8.GetBytes((@{ username = $regName; password = "secret123" } | ConvertTo-Json -Compress))
}
$regRes = Invoke-WebRequest @regParams
$regJson = $utf8.GetString($regRes.RawContentStream.ToArray()) | ConvertFrom-Json
"REG_LOGIN=$($regRes.StatusCode) role=$($regJson.user.role)"
"REG_API=$(Get-Status "$base/api/admin" $regSession)"

# anonymous
try {
  Invoke-WebRequest -Uri "$base/api/admin" -UseBasicParsing | Out-Null
  "ANON=FAIL"
} catch {
  "ANON_OK=$($_.Exception.Response.StatusCode.value__)"
}
