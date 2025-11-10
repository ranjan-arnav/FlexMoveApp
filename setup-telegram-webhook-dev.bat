@echo off
echo ================================
echo Telegram Webhook Setup
echo ================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok is not installed
    echo.
    echo Please install ngrok:
    echo 1. Download from: https://ngrok.com/download
    echo 2. Or use: choco install ngrok
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok is installed
echo.

REM Check if dev server is running
echo Checking if Next.js dev server is running...
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Next.js dev server is not running
    echo.
    echo Please start it first:
    echo   pnpm dev
    echo.
    pause
    exit /b 1
)

echo ✅ Dev server is running
echo.

REM Ask user to start ngrok
echo Step 1: Start ngrok tunnel
echo --------------------------
echo.
echo Please open a new terminal and run:
echo   ngrok http 3000
echo.
echo Then copy the HTTPS Forwarding URL (e.g., https://abc123.ngrok.io)
echo.
set /p NGROK_URL="Paste your ngrok HTTPS URL here: "

REM Validate URL
if "%NGROK_URL%"=="" (
    echo ❌ URL cannot be empty
    pause
    exit /b 1
)

echo.
echo ✅ Using URL: %NGROK_URL%
echo.

REM Update .env.local
echo Step 2: Updating .env.local
echo ---------------------------
echo.

REM Check if NEXT_PUBLIC_APP_URL exists in .env.local
findstr /C:"NEXT_PUBLIC_APP_URL" .env.local >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    REM Replace existing URL
    powershell -Command "(Get-Content .env.local) -replace '^NEXT_PUBLIC_APP_URL=.*', 'NEXT_PUBLIC_APP_URL=%NGROK_URL%' | Set-Content .env.local"
) else (
    REM Append new URL
    echo NEXT_PUBLIC_APP_URL=%NGROK_URL%>> .env.local
)

echo ✅ .env.local updated
echo.

REM Restart dev server
echo Step 3: Restart Dev Server
echo --------------------------
echo.
echo Please restart your dev server (Ctrl+C then 'pnpm dev')
echo This is needed to load the new URL.
echo.
pause

REM Set webhook
echo Step 4: Setting Telegram Webhook
echo ---------------------------------
echo.

node scripts/setup-telegram-webhook.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to set webhook
    pause
    exit /b 1
)

echo.
echo ================================
echo ✅ Webhook Setup Complete!
echo ================================
echo.
echo Your Telegram bot is now active!
echo.
echo Test it:
echo 1. Open Telegram
echo 2. Find your bot
echo 3. Send: /start
echo.
echo 📚 Full guide: TELEGRAM_WEBHOOK_SETUP.md
echo.
pause
