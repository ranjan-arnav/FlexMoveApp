# Quick Migration Script for Email Verification
# This will help you apply the database migration

Write-Host "🗄️  FlexMove Database Migration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Migration adds these columns to 'users' table:" -ForegroundColor Yellow
Write-Host "  - password_hash (TEXT)" -ForegroundColor White
Write-Host "  - email_verified (BOOLEAN)" -ForegroundColor White
Write-Host "  - verification_token (TEXT)" -ForegroundColor White
Write-Host "  - verification_token_expires (TIMESTAMP)" -ForegroundColor White
Write-Host ""

Write-Host "🔧 How to Run Migration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Via Supabase Dashboard (Recommended)" -ForegroundColor Green
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Click 'SQL Editor' in the left sidebar" -ForegroundColor White
Write-Host "4. Click 'New Query'" -ForegroundColor White
Write-Host "5. Copy the contents of: supabase_migration_email_verification.sql" -ForegroundColor White
Write-Host "6. Paste into the SQL Editor" -ForegroundColor White
Write-Host "7. Click 'Run' button" -ForegroundColor White
Write-Host ""

$openFile = Read-Host "Open the migration file now? (y/n)"
if ($openFile -eq "y") {
    Write-Host "Opening supabase_migration_email_verification.sql..." -ForegroundColor Yellow
    notepad.exe "supabase_migration_email_verification.sql"
}

Write-Host ""
Write-Host "Option 2: Copy SQL to Clipboard" -ForegroundColor Green
$copyToClipboard = Read-Host "Copy SQL to clipboard? (y/n)"
if ($copyToClipboard -eq "y") {
    Get-Content "supabase_migration_email_verification.sql" | Set-Clipboard
    Write-Host "✅ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host "Now paste it into Supabase SQL Editor" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Option 3: Via Supabase CLI" -ForegroundColor Green
Write-Host "Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "  supabase login" -ForegroundColor Cyan
Write-Host "  supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Cyan
Write-Host "  supabase db push" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 After migration completes:" -ForegroundColor Yellow
Write-Host "1. Restart your Next.js app (Ctrl+C and pnpm dev)" -ForegroundColor White
Write-Host "2. Try signing up again" -ForegroundColor White
Write-Host "3. The error should be resolved" -ForegroundColor White
Write-Host ""

Write-Host "✅ Press Enter when migration is complete..." -ForegroundColor Green
$null = Read-Host
