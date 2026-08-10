@echo off
echo ============================================================
echo  Ethiopian Bingo - HTTPS Tunnel Setup
echo  This creates a public HTTPS URL for Telegram Mini App
echo ============================================================
echo.

REM ---- Option 1: Try ngrok (install from https://ngrok.com/download) ----
where ngrok >nul 2>&1
if %ERRORLEVEL% == 0 (
  echo [ngrok] Found! Starting tunnel on port 3000...
  echo.
  echo After ngrok starts, copy the https:// URL and:
  echo  1. Set WEB_APP_URL=https://xxxx.ngrok.io in backend\.env
  echo  2. Restart the backend:  cd backend ^& node src/server.js
  echo  3. In @BotFather: /setmenubutton @Demo1bingo_bot ^> Web App URL
  echo.
  ngrok http 3000
  goto :eof
)

REM ---- Option 2: Try cloudflared (install from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/) ----
where cloudflared >nul 2>&1
if %ERRORLEVEL% == 0 (
  echo [cloudflared] Found! Starting tunnel on port 3000...
  cloudflared tunnel --url http://localhost:3000
  goto :eof
)

REM ---- Neither found ----
echo Neither ngrok nor cloudflared was found on this machine.
echo.
echo To get a free HTTPS URL for your Telegram Mini App:
echo.
echo  OPTION A - ngrok (recommended):
echo    1. Download from: https://ngrok.com/download
echo    2. Run:  ngrok http 3000
echo    3. Copy the https://xxxx.ngrok.io URL
echo.
echo  OPTION B - Cloudflare Tunnel (free, no account needed):
echo    1. Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
echo    2. Run:  cloudflared tunnel --url http://localhost:3000
echo    3. Copy the https://xxxx.trycloudflare.com URL
echo.
echo  AFTER getting your HTTPS URL:
echo    1. Open backend\.env
echo    2. Change:  WEB_APP_URL=https://YOUR_HTTPS_URL_HERE
echo    3. Restart backend:  node src/server.js
echo    4. The bot will automatically use Mini App mode
echo.
pause
