<#
.SYNOPSIS
  MinhTTS — Script khởi động Backend .NET 10 và Expose qua Cloudflare Tunnel miễn phí ra Internet.
#>

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "🚀 Khởi động MinhTTS Backend & Cloudflare Quick Tunnel" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan


# 1. Kiểm tra file cloudflared.exe
$cloudflared = Join-Path $PSScriptRoot "cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    Write-Host "📥 Đang tải Cloudflare Tunnel (cloudflared.exe)..." -ForegroundColor Yellow
    curl.exe -L -o $cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
}

# 2. Khởi động Backend .NET 10 trong Background
Write-Host "⚡ Đang khởi động Backend .NET 10 (http://localhost:5027)..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --project backend/VietTTS.Api/VietTTS.Api.csproj --urls http://localhost:5027" -PassThru -NoNewWindow

Start-Sleep -Seconds 3

# 3. Khởi động Cloudflare Tunnel
Write-Host "🌐 Đang tạo HTTPS Public URL qua Cloudflare Tunnel..." -ForegroundColor Green
Write-Host "👉 Hãy copy URL 'https://xxxx.trycloudflare.com' hiển thị bên dưới" -ForegroundColor Yellow
Write-Host "👉 Sau đó mở app Vercel https://frontend-one-zeta-mv3hhgnvph.vercel.app -> Bấm 'Cài đặt Backend' và dán URL vào." -ForegroundColor Yellow
Write-Host "-----------------------------------------------------" -ForegroundColor Gray

try {
    & $cloudflared tunnel --url http://localhost:5027
}
finally {
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host "🛑 Đang tắt Backend..." -ForegroundColor Red
        Stop-Process -Id $backendProcess.Id -Force
    }
}
