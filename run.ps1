#!/usr/bin/env pwsh
# CaptureKit launcher for Windows (PowerShell).
# Forwards all arguments to scripts/run.mjs. See: ./run.ps1 --help
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error '[run] Node.js is required but was not found on PATH. Install Node 22.13+, 24.x, or 26+.'
  exit 1
}

& node (Join-Path $scriptDir 'scripts/run.mjs') @args
exit $LASTEXITCODE
