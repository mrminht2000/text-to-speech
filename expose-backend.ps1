<#
.SYNOPSIS
  MinhTTS — Script khoi dong trọn bộ:
  1. Python Neural Engine (VieNeu-TTS & Voice Cloning) -> Port 8000
  2. .NET 10 Web API -> Port 5027
  3. Cloudflare Quick Tunnel -> Expose ra Internet (https://*.trycloudflare.com)
#>

param (
    [switch]$AutoUpdateVercel = $false
)

$ErrorActionPreference = "Continue"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "MinhTTS Complete Local Stack & Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Kiem tra / Tai cloudflared.exe
$cloudflared = Join-Path $PSScriptRoot "cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    Write-Host "Dang tai Cloudflare Tunnel (cloudflared.exe)..." -ForegroundColor Yellow
    curl.exe -L -o $cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
}

# 2. Khoi dong Python Local AI Engine (Port 8000)
Write-Host "Dang khoi dong Python Neural Engine (http://localhost:8000)..." -ForegroundColor Green
$engineScript = Join-Path $PSScriptRoot "local_engine\main.py"
$engineProc = Start-Process -FilePath "python" -ArgumentList "`"$engineScript`"" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# 3. Khoi dong Backend .NET 10 (Port 5027)
Write-Host "Dang khoi dong Backend .NET 10 (http://localhost:5027)..." -ForegroundColor Green
$backendArgs = "run --project backend/VietTTS.Api/VietTTS.Api.csproj --urls http://localhost:5027"
$backendProc = Start-Process -FilePath "dotnet" -ArgumentList $backendArgs -PassThru -NoNewWindow

Start-Sleep -Seconds 3

# 4. Khoi dong Cloudflare Tunnel voi Log File de tu boc tach URL
$logFile = Join-Path $PSScriptRoot "tunnel.log"
if (Test-Path $logFile) {
    Remove-Item $logFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Dang khoi tao Cloudflare Tunnel..." -ForegroundColor Green
$tunnelArgs = "tunnel --url http://localhost:5027 --logfile `"$logFile`""
$tunnelProc = Start-Process -FilePath $cloudflared -ArgumentList $tunnelArgs -PassThru -NoNewWindow

# Cho doc URL tu log
$tunnelUrl = ""
$attempts = 0
while (($attempts -lt 25) -and [string]::IsNullOrEmpty($tunnelUrl)) {
    Start-Sleep -Seconds 1
    $attempts++
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\.\-]+\.trycloudflare\.com') {
            $tunnelUrl = $Matches[0]
        }
    }
}

if (-not [string]::IsNullOrEmpty($tunnelUrl)) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "ENDPOINT EXPOSE DA SAN SANG!" -ForegroundColor Green
    Write-Host "URL Public: $tunnelUrl" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "Web App (Domain chinh):   https://tts.nguyenngocminh.dev" -ForegroundColor Cyan
    Write-Host "Web App (Vercel du phong): https://frontend-one-zeta-mv3hhgnvph.vercel.app" -ForegroundColor DarkCyan
    Write-Host "Ban co the dan link tren vao muc 'Cai dat API' tren web app." -ForegroundColor Gray
    Write-Host "Nhan Ctrl + C de dung toan bo Stack khi dung xong." -ForegroundColor Gray
    Write-Host ""

    if ($AutoUpdateVercel) {
        Write-Host "Dang tu dong cap nhat VITE_API_URL len Vercel (Project: frontend)..." -ForegroundColor Cyan
        $frontendDir = Join-Path $PSScriptRoot "frontend"
        Push-Location $frontendDir
        try {
            npx --yes vercel env rm VITE_API_URL production -y 2>$null
            $tunnelUrl | npx --yes vercel env add VITE_API_URL production
            npx --yes vercel deploy --prod -y
            Write-Host "Da cap nhat Vercel thanh cong!" -ForegroundColor Green
        }
        finally {
            Pop-Location
        }
    }

} else {
    Write-Host "Chua doc duoc URL Tunnel tu dong. Hay xem file tunnel.log hoac thu lai." -ForegroundColor Yellow
}

try {
    while ((-not $tunnelProc.HasExited) -and (-not $backendProc.HasExited) -and (-not $engineProc.HasExited)) {
        Start-Sleep -Seconds 2
    }
}
finally {
    Write-Host "Dang don dep va tat cac tien trinh..." -ForegroundColor Red
    if ($tunnelProc -and (-not $tunnelProc.HasExited)) {
        Stop-Process -Id $tunnelProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($backendProc -and (-not $backendProc.HasExited)) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($engineProc -and (-not $engineProc.HasExited)) {
        Stop-Process -Id $engineProc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Da tat xong toan bo." -ForegroundColor Green
}
