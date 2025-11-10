# FlexMove Email Verification Setup Script
# Run this script to set up email verification with Supabase

Write-Host "🚀 FlexMove Email Verification Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "📋 Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = supabase --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Supabase CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Setup Steps:" -ForegroundColor Cyan
Write-Host "1. Login to Supabase" -ForegroundColor White
Write-Host "2. Link your project" -ForegroundColor White
Write-Host "3. Set Resend API key" -ForegroundColor White
Write-Host "4. Deploy Edge Function" -ForegroundColor White
Write-Host "5. Run database migration" -ForegroundColor White
Write-Host ""

# Step 1: Login
Write-Host "🔐 Step 1: Login to Supabase" -ForegroundColor Cyan
$login = Read-Host "Have you logged in to Supabase? (y/n)"
if ($login -eq "n") {
    Write-Host "Running: supabase login" -ForegroundColor Yellow
    supabase login
}

Write-Host ""

# Step 2: Link project
Write-Host "🔗 Step 2: Link your Supabase project" -ForegroundColor Cyan
$projectRef = Read-Host "Enter your Supabase project reference ID"
if ($projectRef) {
    Write-Host "Running: supabase link --project-ref $projectRef" -ForegroundColor Yellow
    supabase link --project-ref $projectRef
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Project linked successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 3: Resend API Key
Write-Host "🔑 Step 3: Set up Resend API key" -ForegroundColor Cyan
Write-Host "Get your API key from: https://resend.com" -ForegroundColor Yellow
$resendKey = Read-Host "Enter your Resend API key (or press Enter to skip)"
if ($resendKey) {
    Write-Host "Running: supabase secrets set RESEND_API_KEY=***" -ForegroundColor Yellow
    supabase secrets set RESEND_API_KEY=$resendKey
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Resend API key set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set Resend API key" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 4: Deploy Edge Function
Write-Host "📤 Step 4: Deploy send-email Edge Function" -ForegroundColor Cyan
$deploy = Read-Host "Deploy the Edge Function now? (y/n)"
if ($deploy -eq "y") {
    Write-Host "Running: supabase functions deploy send-email" -ForegroundColor Yellow
    supabase functions deploy send-email
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Edge Function deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy Edge Function" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 5: Database Migration
Write-Host "🗄️  Step 5: Run database migration" -ForegroundColor Cyan
Write-Host "You need to run the SQL migration in Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open: https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor White
Write-Host "2. Copy contents from: supabase_migration_email_verification.sql" -ForegroundColor White
Write-Host "3. Paste and run in SQL Editor" -ForegroundColor White
Write-Host ""
$migration = Read-Host "Press Enter when migration is complete..."

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test email sending with: supabase functions invoke send-email --data '{\"to\":\"test@example.com\",\"subject\":\"Test\",\"html\":\"<p>Test</p>\"}'" -ForegroundColor White
Write-Host "2. Start your app: pnpm dev" -ForegroundColor White
Write-Host "3. Test signup flow" -ForegroundColor White
Write-Host "4. Check email delivery" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- SUPABASE_EMAIL_SETUP.md - Complete setup guide" -ForegroundColor White
Write-Host "- AUTHENTICATION_COMPLETE.md - Authentication overview" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green
