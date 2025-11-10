@echo off
echo ================================
echo FlexMove Email Setup (Supabase)
echo ================================
echo.
echo This will help you set up email verification using Supabase's built-in service.
echo.
echo Step 1: Get Your Service Role Key
echo --------------------------------
echo 1. Go to: https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to Settings -^> API
echo 4. Copy the 'service_role' key (keep it secret!)
echo.
pause
echo.
echo Step 2: Update .env.local
echo -------------------------
echo.
set /p SERVICE_KEY="Paste your Supabase Service Role Key here: "
echo.
echo SUPABASE_SERVICE_ROLE_KEY=%SERVICE_KEY%>> .env.local
echo.
echo ✅ Service role key added to .env.local
echo.
echo Step 3: Run Database Migration
echo ------------------------------
echo.
echo 1. Go to: https://supabase.com/dashboard
echo 2. Click SQL Editor
echo 3. Copy the SQL from: supabase_migration_email_verification.sql
echo 4. Paste and run it
echo.
pause
echo.
echo Step 4: Enable Email in Supabase
echo --------------------------------
echo.
echo 1. Go to Authentication -^> Email Templates
echo 2. Make sure "Enable email confirmations" is ON
echo.
pause
echo.
echo ================================
echo ✅ Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Restart your dev server (Ctrl+C then 'pnpm dev')
echo 2. Test signup at http://localhost:3000
echo 3. Check your email for verification link
echo.
echo 📚 Full guide: SUPABASE_EMAIL_SIMPLE.md
echo.
pause
