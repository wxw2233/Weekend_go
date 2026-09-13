$ErrorActionPreference = "Stop"
$utf8 = [System.Text.Encoding]::UTF8
$base = "http://localhost:3000"

function Invoke-Json {
  param(
    [string]$Uri,
    [string]$Method = "GET",
    [hashtable]$Headers = @{},
    $Body = $null
  )
  $params = @{
    Uri = $Uri
    Method = $Method
    UseBasicParsing = $true
    Headers = $Headers
  }
  if ($null -ne $Body) {
    if ($Body -is [string]) {
      $params.Body = $utf8.GetBytes($Body)
    } else {
      $params.Body = $utf8.GetBytes(($Body | ConvertTo-Json -Depth 5 -Compress))
    }
    $params.ContentType = "application/json; charset=utf-8"
  }
  $res = Invoke-WebRequest @params
  $text = $utf8.GetString($res.RawContentStream.ToArray())
  return @{ StatusCode = $res.StatusCode; Json = ($text | ConvertFrom-Json); Text = $text }
}

$claimName = [char]0x9752 + [char]0x79BE + [char]0x8BA4 + [char]0x8BC1 + [char]0x6D4B + [char]0x8BD5
$rest = [char]0x53CC + [char]0x4F11
$city = [char]0x53A6 + [char]0x95E8
$industry = [char]0x96F6 + [char]0x552E
$policy = [char]0x603B + [char]0x90E8 + [char]0x5168 + [char]0x5458 + $rest
$evidence = [char]0x5458 + [char]0x5DE5 + [char]0x624B + [char]0x518C + [char]0x7B2C + [char]0x7AE0
$contactName = "HR Li"
$contact = "hr@example.com"
$reviewNote = [char]0x6750 + [char]0x6599 + [char]0x9F50 + [char]0x5168

$claimBody = @{
  companyName = $claimName
  restType = $rest
  city = $city
  industry = $industry
  policySummary = $policy
  evidenceNote = $evidence
  contactName = $contactName
  contact = $contact
}

$claim = Invoke-Json -Uri "$base/api/claim" -Method POST -Body $claimBody
"CLAIM_CREATE=$($claim.StatusCode) id=$($claim.Json.id)"
$claimId = $claim.Json.id

try {
  Invoke-WebRequest -Uri "$base/api/admin" -UseBasicParsing | Out-Null
  "ADMIN_NOAUTH=FAIL"
} catch {
  "ADMIN_NOAUTH_OK=$($_.Exception.Response.StatusCode.value__)"
}

$admin = Invoke-Json -Uri "$base/api/admin" -Headers @{ Authorization = "Bearer $env:ADMIN_TOKEN" }
"ADMIN_LIST=$($admin.StatusCode) claims=$($admin.Json.claims.Count) subs=$($admin.Json.submissions.Count) claimPending=$($admin.Json.counts.claimPending)"

$patch = Invoke-Json -Uri "$base/api/admin" -Method PATCH -Headers @{ Authorization = "Bearer $env:ADMIN_TOKEN" } -Body @{
  kind = "claim"
  id = $claimId
  status = "approved"
  reviewNote = $reviewNote
}
"APPROVE=$($patch.StatusCode) status=$($patch.Json.item.status)"

$comp = Invoke-Json -Uri "$base/api/companies"
$found = @($comp.Json.items) | Where-Object { $_.name -eq $claimName } | Select-Object -First 1
if ($found) {
  "IN_DIRECTORY=OK source=$($found.source) id=$($found.id)"
} else {
  "IN_DIRECTORY=MISSING"
}

$p1 = Invoke-WebRequest -Uri "$base/admin" -UseBasicParsing
$p2 = Invoke-WebRequest -Uri "$base/claim" -UseBasicParsing
"ADMIN_PAGE=$($p1.StatusCode) CLAIM_PAGE=$($p2.StatusCode)"
