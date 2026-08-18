<#
.SYNOPSIS
  MinhTTS — Script tự động khởi động Backend .NET 10 & Expose qua Cloudflare Quick Tunnel ra Internet.
#>

param (
    [switch]$AutoUpdateVercel = $false
)

$ErrorActionPreference = "Continue"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Khởi động MinhTTS Backend & Cloudflare Quick Tunnel" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Kiểm tra / Tải cloudflared.exe
$cloudflared = Join-Path $PSScriptRoot "cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    Write-Host "📥 Đang tải Cloudflare Tunnel (cloudflared.exe)..." -ForegroundColor Yellow
    curl.exe -L -o $cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
}

# 2. Khởi động Backend .NET 10
Write-Host "⚡ Đang khởi động Backend .NET 10 (http://localhost:5027)..." -ForegroundColor Green
$backendProc = Start-Process -FilePath "dotnet" `
    -ArgumentList "run --project backend/VietTTS.Api/VietTTS.Api.csproj --urls http://localhost:5027" `
    -PassThru -NoNewWindow

Start-Sleep -Seconds 3

# 3. Khởi động Cloudflare Tunnel với Log File để tự bóc tách URL
$logFile = Join-Path $PSScriptRoot "tunnel.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

Write-Host "🌐 Đang khởi tạo Cloudflare Tunnel..." -ForegroundColor Green
$tunnelProc = Start-Process -FilePath $cloudflared `
    -ArgumentList "tunnel --url http://localhost:5027 --logfile `"$logFile`"" `
    -PassThru -NoNewWindow

# Chờ đọc URL từ log
$tunnelUrl = $null
$attempts = 0
while ($attempts -lt 25 -and [string]::IsNullOrEmpty($tunnelUrl)) {
    Start-Sleep -Seconds 1
    $attempts++
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw
        if ($content -match 'https://[a-zA-Z0-9\.\-]+\.trycloudflare\.com') {
            $tunnelUrl = $Matches[0]
        }
    }
}

if ($tunnelUrl) {
    Write-Host "`n"
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "🎉 ENDPOINT EXPOSE ĐÃ SẴN SÀNG!" -ForegroundColor Green
    Write-Host "🔗 URL Public: $tunnelUrl" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "👉 App Vercel: https://frontend-one-zeta-mv3hhgnvph.vercel.app" -ForegroundColor Cyan
    Write-Host "👉 Bạn có thể dán link trên vào mục 'Cài đặt Backend' trên web app hoặc cập nhật Vercel Env." -ForegroundColor Gray
    Write-Host "👉 Nhấn Ctrl + C để dừng Backend & Tunnel khi dùng xong." -ForegroundColor Gray
    Write-Host "`n"

    # Nếu có cờ AutoUpdateVercel hoặc tự động cập nhật
    if ($AutoUpdateVercel) {
        Write-Host "🚀 Đang tự động cập nhật VITE_API_URL lên Vercel..." -ForegroundColor Cyan
        npx --yes vercel env rm VITE_API_URL production -y 2>$null
        $tunnelUrl | npx --yes vercel env add VITE_API_URL production
        npx --yes vercel deploy --prod -y
        Write-Host "✅ Đã cập nhật Vercel thành công!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Chưa đọc được URL Tunnel tự động. Hãy xem file tunnel.log hoặc thử lại." -ForegroundColor Yellow
}

try {
    # Giữ tiến trình chạy cho đến khi user bấm Ctrl+C
    while (-not $tunnelProc.HasExited -and -not $backendProc.HasExited) {
        Start-Sleep -Seconds 2
    }
}
finally {
    Write-Host "`n🛑 Đang dọn dẹp và tắt các tiến trình..." -ForegroundColor Red
    if ($tunnelProc -and -not $tunnelProc.HasExited) { Stop-Process -Id $tunnelProc.Id -Force 2>$null }
    if ($backendProc -and -not $backendProc.HasExited) { Stop-Process -Id $backendProc.Id -Force 2>$null }
    Write-Host "✅ Đã tắt xong." -ForegroundColor Green
}
