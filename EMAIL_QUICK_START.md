# Email Verification Quick Start Guide

## 🚀 5-Minute Setup

This guide will get your email verification system up and running quickly.

---

## Prerequisites

- [ ] Supabase project created
- [ ] Resend account created (free tier: 100 emails/day)
- [ ] Node.js and pnpm installed

---

## Setup Steps

### 1️⃣ Run Setup Script

```powershell
cd d:\hul2\FlexMove
.\setup-email-verification.ps1
```

The script will guide you through:
- Installing Supabase CLI
- Logging in to Supabase
- Linking your project
- Setting Resend API key
- Deploying the Edge Function

### 2️⃣ Run Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy contents from `supabase_migration_email_verification.sql`
4. Run the migration

### 3️⃣ Update Environment Variables

Update `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4️⃣ Test the System

```powershell
# Start your app
pnpm dev

# Visit http://localhost:3000
# Click "Sign Up"
# Create a test account
# Check your email for verification link
```

---

## Manual Setup (If Script Fails)

### Install Supabase CLI

```powershell
npm install -g supabase
```

### Login to Supabase

```powershell
supabase login
```

### Link Your Project

```powershell
supabase link --project-ref YOUR_PROJECT_REF
```

### Set Resend API Key

```powershell
supabase secrets set RESEND_API_KEY=re_your_api_key
```

### Deploy Edge Function

```powershell
supabase functions deploy send-email
```

---

## Testing Email Sending

### Test Edge Function Directly

```powershell
supabase functions invoke send-email --data '{
  "to": "your-email@example.com",
  "subject": "Test Email",
  "html": "<p>This is a test email</p>"
}'
```

Expected response:
```json
{
  "success": true,
  "id": "email-id-from-resend"
}
```

### Test Through App

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form:
   - Full Name: Test User
   - Email: your-email@example.com
   - Password: Test123!
   - Role: Shipper
4. Click "Create Account"
5. Check your email inbox

---

## Troubleshooting

### Edge Function Not Found

```powershell
# Check if function is deployed
supabase functions list

# Redeploy if needed
supabase functions deploy send-email
```

### Email Not Sent

```powershell
# Check Edge Function logs
supabase functions logs send-email

# Verify Resend API key
supabase secrets list
```

### Database Errors

```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('password_hash', 'email_verified', 'verification_token');
```

### Resend API Errors

Check these common issues:
- API key is correct
- API key has correct permissions
- Using correct "from" email address
- Email domain is verified (for custom domains)

---

## Architecture Overview

```
User Signs Up
    ↓
App Creates User Record
    ↓
Database Service generates verification token
    ↓
Supabase Edge Function called
    ↓
Resend API sends email
    ↓
User clicks verification link
    ↓
API verifies token
    ↓
Email marked as verified
    ↓
User can login
```

---

## Email Flow

### Signup Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { 
      background: #0070f3; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to FlexMove!</h1>
    <p>Click the button below to verify your email:</p>
    <a href="VERIFICATION_LINK" class="button">Verify Email</a>
  </div>
</body>
</html>
```

---

## Security Features

✅ **Password Hashing**: bcrypt with 10 salt rounds
✅ **Token Expiration**: 24 hours
✅ **Single-Use Tokens**: Cleared after verification
✅ **Email Verification Required**: Can't login without verification
✅ **Rate Limiting**: Resend API has built-in rate limiting
✅ **Secure Token Generation**: crypto.randomBytes(32)

---

## Free Tier Limits

### Resend (Free)
- 100 emails/day
- 3,000 emails/month
- 1 custom domain
- API access

### Supabase (Free)
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- Edge Functions included

---

## Production Checklist

Before going live:

- [ ] Add custom domain to Resend
- [ ] Verify domain in Resend
- [ ] Update NEXT_PUBLIC_APP_URL to production URL
- [ ] Set up monitoring for Edge Functions
- [ ] Test email deliverability
- [ ] Configure DMARC/SPF/DKIM records
- [ ] Set up email templates with branding
- [ ] Add unsubscribe links (if sending marketing emails)
- [ ] Test password reset flow
- [ ] Set up error monitoring

---

## Cost Estimation

### Development (Free Tier)
- Resend: Free (100 emails/day)
- Supabase: Free
- **Total: $0/month**

### Production (Paid Tiers)
- Resend Pro: $20/month (50,000 emails)
- Supabase Pro: $25/month
- **Total: $45/month**

### High Volume
- Resend Business: $85/month (100,000 emails)
- Supabase Pro: $25/month
- **Total: $110/month**

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions
- **Email Best Practices**: https://resend.com/docs/send-with-nextjs

---

## Quick Reference Commands

```powershell
# Login
supabase login

# Link project
supabase link --project-ref YOUR_REF

# Deploy function
supabase functions deploy send-email

# View logs
supabase functions logs send-email

# Set secret
supabase secrets set RESEND_API_KEY=your_key

# Test function
supabase functions invoke send-email --data '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'

# List functions
supabase functions list

# List secrets
supabase secrets list
```

---

## Next Steps

1. Complete this quick setup
2. Test email verification
3. Customize email templates
4. Add password reset functionality
5. Implement email preferences
6. Set up monitoring and alerts

---

## 📚 Additional Documentation

- `SUPABASE_EMAIL_SETUP.md` - Comprehensive setup guide
- `AUTHENTICATION_COMPLETE.md` - Authentication system overview
- `lib/email.ts` - Email service code
- `supabase/functions/send-email/index.ts` - Edge Function code

---

## Need Help?

If you encounter issues:

1. Check Edge Function logs: `supabase functions logs send-email`
2. Verify Resend API key: `supabase secrets list`
3. Test Edge Function directly (see Testing section above)
4. Check database migration ran successfully
5. Review SUPABASE_EMAIL_SETUP.md for detailed troubleshooting

---

**🎉 That's it! You're ready to send verification emails!**
