@echo off
echo ================================
echo Set Resend API Key
echo ================================
echo.
echo Get your free API key from: https://resend.com
echo.
set /p RESEND_KEY="Enter your Resend API key (starts with re_): "
echo.
echo Setting secret...
npx supabase secrets set RESEND_API_KEY=%RESEND_KEY%
echo.
echo Done! Now deploying Edge Function...
npx supabase functions deploy send-email
echo.
echo ================================
echo Deployment Complete!
echo ================================
pause
