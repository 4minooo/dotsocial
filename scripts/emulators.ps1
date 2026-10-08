param([switch]$Test)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskJava = Get-ChildItem -LiteralPath (Join-Path $taskRoot '.tools\java21') -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if ($taskJava) { $env:JAVA_HOME = $taskJava.FullName; $env:PATH = (Join-Path $taskJava.FullName 'bin') + ';' + $env:PATH }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java 21 이상을 설치한 후 다시 실행해 주세요.' }
Set-Location -LiteralPath $taskRoot
if ($Test) { & npx.cmd firebase emulators:exec --only auth,database --project demo-dot-social 'npm run test:rules' }
else { & npx.cmd firebase emulators:start --only auth,database --project demo-dot-social }
exit $LASTEXITCODE
