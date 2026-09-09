# Probe RFH HMS APIs for all seeded roles. Writes status-only report (no tokens).
$ErrorActionPreference = 'Continue'
$base = 'http://localhost:5000/api'
$report = @()

function Login($email, $password) {
  try {
    $r = Invoke-RestMethod -Uri "$base/login" -Method POST -ContentType 'application/json' -Body (@{ email = $email; password = $password } | ConvertTo-Json)
    return @{ ok = $true; token = $r.token; role = $r.role; error = $null }
  } catch {
    $msg = $_.Exception.Message
    try { $msg = $_.ErrorDetails.Message } catch {}
    return @{ ok = $false; token = $null; role = $null; error = $msg }
  }
}

function Probe($label, $token, $method, $path, $body = $null) {
  $headers = @{ Authorization = "Bearer $token" }
  try {
    $params = @{
      Uri = "$base$path"
      Method = $method
      Headers = $headers
      TimeoutSec = 20
    }
    if ($body -ne $null) {
      $params.ContentType = 'application/json'
      $params.Body = ($body | ConvertTo-Json -Depth 6)
    }
    $resp = Invoke-WebRequest @params -UseBasicParsing
    return "$label`t$($resp.StatusCode)`tOK"
  } catch {
    $code = 'ERR'
    $detail = $_.Exception.Message
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $detail = $reader.ReadToEnd()
      } catch {}
    }
    $detail = ($detail -replace '\s+', ' ').Substring(0, [Math]::Min(180, ($detail -replace '\s+', ' ').Length))
    return "$label`t$code`t$detail"
  }
}

$accounts = @(
  @{ name = 'admin'; email = 'admin@rfh.gov.za'; password = 'Admin123!' },
  @{ name = 'super_admin'; email = 'superadmin@rfh.gov.za'; password = 'SuperAdmin123!' },
  @{ name = 'doctor'; email = 'demo.doctor@rfh.gov.za'; password = 'Doctor123!' },
  @{ name = 'doctor_alt'; email = 'doctor@rfh.gov.za'; password = 'Doctor123!' },
  @{ name = 'patient'; email = 'demo.patient@rfh.gov.za'; password = 'Patient123!' }
)

$report += '=== LOGINS ==='
$tokens = @{}
foreach ($a in $accounts) {
  $l = Login $a.email $a.password
  if ($l.ok) {
    $report += "LOGIN $($a.name)`tOK`trole=$($l.role)"
    $tokens[$a.name] = $l.token
  } else {
    $report += "LOGIN $($a.name)`tFAIL`t$($l.error)"
  }
}

if ($tokens.ContainsKey('admin')) {
  $t = $tokens.admin
  $report += '=== ADMIN ==='
  $report += Probe 'admin.profile' $t 'GET' '/admin/profile'
  $report += Probe 'admin.doctors' $t 'GET' '/admin/doctors'
  $report += Probe 'admin.doctor-catalog' $t 'GET' '/admin/doctor-catalog'
  $report += Probe 'admin.total-doctors' $t 'GET' '/admin/total-doctors'
  $report += Probe 'admin.total-patients' $t 'GET' '/admin/total-patients'
  $report += Probe 'admin.doctor-overview' $t 'GET' '/admin/doctor-overview'
  $report += Probe 'hr.vacancies' $t 'GET' '/hr/vacancies'
  $report += Probe 'hr.staffing' $t 'GET' '/hr/staffing/summary'
  $report += Probe 'hr.pmds' $t 'GET' '/hr/pmds/summary'
  $report += Probe 'pharmacy.medicines' $t 'GET' '/pharmacy/medicines'
  $report += Probe 'queue.today' $t 'GET' '/queue/today'
  $report += Probe 'appointments' $t 'GET' '/appointments'
  $report += Probe 'patients.records' $t 'GET' '/patient/records'
  $report += Probe 'finance.summary' $t 'GET' '/finance/summary'
  $report += Probe 'complaints' $t 'GET' '/complaints'
  $report += Probe 'sms' $t 'GET' '/sms'
  $report += Probe 'theatres' $t 'GET' '/theatres'
  $report += Probe 'waitlist' $t 'GET' '/clinical/waitlist'
  $report += Probe 'monitoring.kpis' $t 'GET' '/monitoring/kpis'
  $report += Probe 'audit' $t 'GET' '/audit/recent'
  $report += Probe 'reporting.exports' $t 'GET' '/reporting/exports/mapping'
  $report += Probe 'cms.hero.all' $t 'GET' '/cms/hero/all'
}

if ($tokens.ContainsKey('super_admin')) {
  $t = $tokens.super_admin
  $report += '=== SUPER_ADMIN ==='
  $report += Probe 'cms.hero.all' $t 'GET' '/cms/hero/all'
  $report += Probe 'cms.hero.public' $t 'GET' '/cms/hero'
}

$docKey = if ($tokens.ContainsKey('doctor')) { 'doctor' } elseif ($tokens.ContainsKey('doctor_alt')) { 'doctor_alt' } else { $null }
if ($docKey) {
  $t = $tokens[$docKey]
  $report += "=== DOCTOR ($docKey) ==="
  $report += Probe 'doctor.profile' $t 'GET' '/doctor/profile'
  $report += Probe 'doctor.dashboard' $t 'GET' '/doctor/dashboard'
  $report += Probe 'doctor.queue' $t 'GET' '/doctor/queue'
  $report += Probe 'doctor.appointments' $t 'GET' '/doctor/appointments'
  $report += Probe 'doctor.patients' $t 'GET' '/doctor/patients-with-appointments'
  $report += Probe 'doctor.orders' $t 'GET' '/doctor/orders'
  $report += Probe 'doctor.referrals' $t 'GET' '/doctor/referrals'
  $report += Probe 'doctor.schedule.avail' $t 'GET' '/doctor/schedule/availability'
  $report += Probe 'doctor.schedule.week' $t 'GET' '/doctor/schedule/week'
  $report += Probe 'doctor.governance' $t 'GET' '/doctor/governance'
  $report += Probe 'doctor.templates' $t 'GET' '/doctor/consult/templates'
  $report += Probe 'doctor.prescriptions' $t 'GET' '/doctor/prescriptions'
  $report += Probe 'emr.notes' $t 'GET' '/emr/notes'
}

if ($tokens.ContainsKey('patient')) {
  $t = $tokens.patient
  $report += '=== PATIENT ==='
  $report += Probe 'patient.dashboard' $t 'GET' '/patient/dashboard'
  $report += Probe 'patient.profile' $t 'GET' '/patient/profile'
  $report += Probe 'patient.appointments' $t 'GET' '/patient/appointments'
  $report += Probe 'patient.my-appointments' $t 'GET' '/patient/my-appointments'
  $report += Probe 'patient.medications' $t 'GET' '/patient/medications'
  $report += Probe 'patient.meds.summary' $t 'GET' '/patient/medications/summary'
  $report += Probe 'patient.health.summary' $t 'GET' '/patient/health/summary'
  $report += Probe 'patient.health.notes' $t 'GET' '/patient/health/notes'
  $report += Probe 'patient.health.labs' $t 'GET' '/patient/health/labs'
  $report += Probe 'patient.notifications' $t 'GET' '/patient/notifications'
  $report += Probe 'patient.feedback' $t 'GET' '/patient/feedback'
  $report += Probe 'patient.education' $t 'GET' '/patient/education'
  $report += Probe 'patient.queue-status' $t 'GET' '/patient/queue-status'
  $report += Probe 'patient.care-team' $t 'GET' '/patient/care-team'
  $report += Probe 'patient.prescriptions' $t 'GET' '/patient/prescriptions'
  $report += Probe 'doctor.all.public' $t 'GET' '/doctor/all'
  $report += Probe 'cms.hero' $t 'GET' '/cms/hero'
}

$out = Join-Path $PSScriptRoot 'probe-report.txt'
if (-not $PSScriptRoot) { $out = 'c:\Users\Siyabonga\Desktop\hospital-manangement-\probe-report.txt' }
$report | Set-Content -Path $out -Encoding UTF8
Write-Output "Wrote $out"
Write-Output ($report -join "`n")
