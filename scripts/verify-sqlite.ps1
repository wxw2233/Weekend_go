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
  return @{ StatusCode = $res.StatusCode; Json = ($text | ConvertFrom-Json); Text = $text; Headers = $res.Headers }
}

# login page
$loginPage = Invoke-WebRequest -Uri "$base/admin/login" -UseBasicParsing
"LOGIN_PAGE=$($loginPage.StatusCode)"

# bad password
try {
  Invoke-Json -Uri "$base/api/admin/login" -Method POST -Body @{ token = "wrong" } | Out-Null
  "LOGIN_BAD=FAIL"
} catch {
  "LOGIN_BAD_OK=$($_.Exception.Response.StatusCode.value__)"
}

# good login
$login = Invoke-Json -Uri "$base/api/admin/login" -Method POST -Body @{ token = $env:ADMIN_TOKEN } -WithSession
"LOGIN_OK=$($login.StatusCode)"
if ($session.Cookies.GetCookies($base) | Where-Object { $_.Name -eq "sx_admin_session" }) {
  "COOKIE_SET=YES"
} else {
  "COOKIE_SET=NO"
}

# admin list with session
$admin = Invoke-Json -Uri "$base/api/admin" -WithSession
"ADMIN_LIST=$($admin.StatusCode) subs=$($admin.Json.submissions.Count) claims=$($admin.Json.claims.Count)"

# create claim with unicode
$claimName = [char]0x6D4B + [char]0x8BD5 + [char]0x8BA4 + [char]0x9886 + [char]0x516C + [char]0x53F8
$rest = [char]0x53CC + [char]0x4F11
$claim = Invoke-Json -Uri "$base/api/claim" -Method POST -Body @{
  companyName = $claimName
  restType = $rest
  city = "Shenzhen"
  industry = "Tech"
  policySummary = "HQ dual weekend"
  evidenceNote = "handbook"
  contactName = "HR"
  contact = "hr2@example.com"
}
"CLAIM_CREATE=$($claim.StatusCode) id=$($claim.Json.id)"
$claimId = $claim.Json.id

# approve with session cookie
$patch = Invoke-Json -Uri "$base/api/admin" -Method PATCH -WithSession -Body @{
  kind = "claim"
  id = $claimId
  status = "approved"
  reviewNote = "ok"
}
"APPROVE=$($patch.StatusCode) status=$($patch.Json.item.status)"

# directory
$comp = Invoke-Json -Uri "$base/api/companies"
$found = @($comp.Json.items) | Where-Object { $_.name -eq $claimName } | Select-Object -First 1
if ($found) { "IN_DIRECTORY=OK source=$($found.source)" } else { "IN_DIRECTORY=MISSING" }

# logout
$logout = Invoke-Json -Uri "$base/api/admin/logout" -Method POST -WithSession
"LOGOUT=$($logout.StatusCode)"
try {
  Invoke-Json -Uri "$base/api/admin" -WithSession | Out-Null
  "AFTER_LOGOUT=FAIL"
} catch {
  "AFTER_LOGOUT_OK=$($_.Exception.Response.StatusCode.value__)"
}

# home still works
$home = Invoke-WebRequest -Uri "$base/" -UseBasicParsing
"HOME=$($home.StatusCode)"
