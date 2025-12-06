<#
  setup-windows-node.ps1
  - Installs Node.js LTS on Windows (tries winget, falls back to official MSI)
  - Updates PATH for current session if installation path is detected
  - Runs `npm install --no-optional` in the repo folder
  - Optionally starts the server when called with -StartServer

Usage:
  Open PowerShell as Administrator (recommended) and run:
    .\setup-windows-node.ps1 -StartServer

Note: script will attempt to elevate only for MSI install.
#>

param(
  [switch]$StartServer
)

function Write-Log($msg){ Write-Host "[setup] $msg" -ForegroundColor Cyan }
function Write-Err($msg){ Write-Host "[error] $msg" -ForegroundColor Red }

$repoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not $repoDir){ $repoDir = 'C:\Website' }

Write-Log "Repo directory: $repoDir"

function Test-NodeInstalled {
  try{
    $v = & node -v 2>$null
    if($LASTEXITCODE -eq 0 -and $v){ return $true }
  }catch{}
  return $false
}

if(Test-NodeInstalled){
  Write-Log "Node already installed: $(node -v)"
} else {
  Write-Log "Node not found. Attempting installation..."

  if(Get-Command winget -ErrorAction SilentlyContinue){
    Write-Log "Found winget — installing OpenJS.NodeJS.LTS"
    try{
      winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements -h
    }catch{
      Write-Err "winget install failed or requires interaction. Will fallback to MSI download."
    }
  }

  if(-not (Test-NodeInstalled)){
    Write-Log "Downloading latest LTS MSI from nodejs.org"
    try{
      $idx = Invoke-WebRequest -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing -TimeoutSec 30 | ConvertFrom-Json
      $lts = $idx | Where-Object { $_.lts } | Select-Object -First 1
      if(-not $lts){ throw 'No LTS entry found in index.json' }
      $ver = $lts.version
      $msiName = "node-$ver-x64.msi"
      $msiUrl = "https://nodejs.org/dist/$ver/$msiName"
      $out = Join-Path $env:TEMP $msiName
      Write-Log "Downloading $msiUrl to $out"
      Invoke-WebRequest -Uri $msiUrl -OutFile $out -UseBasicParsing -TimeoutSec 120
      Write-Log "Running MSI installer (may prompt for elevation)"
      Start-Process msiexec -ArgumentList "/i `"$out`" /quiet /norestart" -Verb RunAs -Wait
    }catch{
      Write-Err "Failed to download or install MSI: $_"
    }
  }

  # If still not installed, try to add default path
  if(-not (Test-NodeInstalled)){
    $nodeDefault = 'C:\Program Files\nodejs'
    if(Test-Path (Join-Path $nodeDefault 'node.exe')){
      Write-Log "Found node.exe in $nodeDefault — adding to PATH for this session"
      $env:PATH = $env:PATH + ";$nodeDefault"
      [Environment]::SetEnvironmentVariable('PATH', $env:PATH, 'User')
    }
  }

  if(Test-NodeInstalled){ Write-Log "Node installed: $(node -v)" } else { Write-Err "Node installation failed or not available in PATH."; exit 2 }
}

# move to repo and install dependencies (skip optional native builds)
Set-Location $repoDir
if(Get-Command npm -ErrorAction SilentlyContinue){
  Write-Log "Running npm install --no-optional"
  try{
    npm install --no-optional
  }catch{
    Write-Err "npm install failed: $_"
    exit 3
  }
} else {
  Write-Err "npm not found after installation. Please re-open PowerShell and retry."
  exit 4
}

if($StartServer){
  Write-Log "Starting server (npm start). Use Ctrl+C to stop."
  try{
    npm start
  }catch{
    Write-Err "Failed to start server: $_"
    exit 5
  }
} else {
  Write-Log "Done. To start server: 'npm start' or run this script with -StartServer"
}
