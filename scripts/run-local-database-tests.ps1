[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PostgresBin,
  [ValidateSet('api','e2e')]
  [string]$Suite = 'api',
  [string[]]$E2eArgs = @()
)

$ErrorActionPreference = 'Stop'
$workspace = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$binaryRoot = [System.IO.Path]::GetFullPath($PostgresBin)
foreach ($binary in @('initdb.exe', 'pg_ctl.exe', 'createdb.exe')) {
  if (!(Test-Path -LiteralPath (Join-Path $binaryRoot $binary) -PathType Leaf)) {
    throw 'Provide a complete trusted portable PostgreSQL bin directory.'
  }
}

# A unique fixture directory avoids resetting or reusing any existing cluster.
$fixtureRoot = Join-Path $workspace ('.cache\postgres-tests\' + [guid]::NewGuid().ToString('N'))
$fixtureData = Join-Path $fixtureRoot 'data'
$fixturePasswordFile = Join-Path $fixtureRoot 'fixture-password.txt'
$fixtureLog = Join-Path $fixtureRoot 'postgres.log'
New-Item -ItemType Directory -Path $fixtureRoot -Force | Out-Null
$fixturePassword = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
[System.IO.File]::WriteAllText($fixturePasswordFile, $fixturePassword, (New-Object System.Text.UTF8Encoding($false)))
$previousUrl = $env:CAR_TEST_DATABASE_URL
$previousPassword = $env:PGPASSWORD
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$fixturePort = $listener.LocalEndpoint.Port
$listener.Stop()
$resultCode = 1

function Invoke-HiddenPostgresTool {
  param([string]$Name, [string]$Arguments, [string]$LogPrefix)
  $process = Start-Process -FilePath (Join-Path $binaryRoot $Name) -ArgumentList $Arguments `
    -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $fixtureRoot ($LogPrefix + '.out')) `
    -RedirectStandardError (Join-Path $fixtureRoot ($LogPrefix + '.err'))
  # Wait for this helper, not its descendants: pg_ctl deliberately leaves a
  # running server child, so Start-Process -Wait would never return on Windows.
  $process.WaitForExit()
  $process.Refresh()
  if ($process.ExitCode -ne 0) { throw "Disposable PostgreSQL $LogPrefix failed; inspect fixture logs locally." }
}

try {
  Invoke-HiddenPostgresTool 'initdb.exe' "-D `"$fixtureData`" -U car_test --pwfile=`"$fixturePasswordFile`" --auth=scram-sha-256 --encoding=UTF8 --no-locale" 'init'
  Invoke-HiddenPostgresTool 'pg_ctl.exe' "-D `"$fixtureData`" -l `"$fixtureLog`" -o `"-h 127.0.0.1 -p $fixturePort`" -w start" 'start'
  $env:PGPASSWORD = $fixturePassword
  Invoke-HiddenPostgresTool 'createdb.exe' "-h 127.0.0.1 -p $fixturePort -U car_test car_security_test_local" 'createdb'
  $env:CAR_TEST_DATABASE_URL = 'postgresql://car_test:' + [uri]::EscapeDataString($fixturePassword) + '@127.0.0.1:' + $fixturePort + '/car_security_test_local'
  Write-Output 'Running against a fresh loopback-only PostgreSQL fixture; no system service or existing database is used.'
  Push-Location $workspace
  try {
    if ($Suite -eq 'e2e') {
      & node (Join-Path $PSScriptRoot 'run-e2e.cjs') @E2eArgs
    } else {
      & node (Join-Path $PSScriptRoot 'run-api-database-tests.cjs') --silent --json --outputFile '../../.cache/api-database-test-results.json'
    }
    $resultCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  $env:CAR_TEST_DATABASE_URL = $previousUrl
  $env:PGPASSWORD = $previousPassword
  if (Test-Path -LiteralPath (Join-Path $fixtureData 'postmaster.pid')) {
    Invoke-HiddenPostgresTool 'pg_ctl.exe' "-D `"$fixtureData`" -m fast -w stop" 'stop'
    Write-Output 'Disposable PostgreSQL process stopped.'
  }
  # Remove only this run's generated password file. Fixture logs/data stay in
  # ignored .cache for diagnostics; no recursive filesystem deletion occurs.
  if (Test-Path -LiteralPath $fixturePasswordFile) {
    Remove-Item -LiteralPath $fixturePasswordFile -Force
  }
}
exit $resultCode
