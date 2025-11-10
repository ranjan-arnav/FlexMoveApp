# Supabase Email Setup Guide (Using Built-in Auth Email)

## ✅ Simple Setup - No External Services Needed!

This guide shows you how to use Supabase's built-in email service for verification emails. No Resend, no Edge Functions needed!

---

## 📋 What You Need

1. **Supabase Service Role Key** (from your Supabase dashboard)
2. **Database Migration** (add required columns)
3. **Environment Variable** (add service role key)

---

## Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your FlexMove project
3. Go to **Settings** → **API**
4. Find **service_role** key (⚠️ This is secret - never expose it!)
5. Copy the key

---

## Step 2: Add to Environment Variables

Update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://sumahlkcapqwekoqepnm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Important**: Never commit `.env.local` to git! The service role key is a secret.

---

## Step 3: Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy this SQL and run it:

```sql
-- Add required columns for email verification
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add unique constraint on email
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;
```

---

## Step 4: Enable Email in Supabase

1. Go to **Authentication** → **Email Templates** in Supabase Dashboard
2. Make sure **Enable email confirmations** is ON
3. Customize the email template (optional):
   - Subject: "Verify Your FlexMove Account"
   - You can add your branding

---

## Step 5: Test It!

```powershell
# Restart your app
pnpm dev

# Visit http://localhost:3000
# Click "Sign Up"
# Create an account
# Check your email for verification link
```

---

## How It Works

1. **User signs up** → Account created in database
2. **Verification token generated** → Stored in database (24-hour expiry)
3. **Supabase Auth sends email** → Uses built-in email service
4. **User clicks link** → Token verified, email marked as verified
5. **User can login** → Full access granted

---

## Email Configuration (Optional)

### Default Setup (Free)
- ✅ Uses Supabase's default email service
- ✅ Sends from `noreply@mail.app.supabase.io`
- ✅ 3 emails/hour rate limit (development)
- ✅ Perfect for testing!

### Custom Domain (Production)
For production, you can configure a custom SMTP:

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your own email provider:
   - Sender email: `noreply@yourdomain.com`
   - SMTP host/port
   - Username/password

Popular options:
- **SendGrid** (free: 100 emails/day)
- **Mailgun** (free: 1,000 emails/month)
- **AWS SES** (pay as you go)

---

## Troubleshooting

### "Service role key not found"
- Make sure you added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Restart your Next.js dev server

### "Email not sent"
- Check Supabase Dashboard → Authentication → Users
- Verify email confirmations are enabled
- Check spam folder

### "Column not found"
- Run the database migration SQL
- Refresh your app

---

## Security Notes

⚠️ **Service Role Key**:
- Has admin privileges
- Can bypass Row Level Security (RLS)
- Never expose in client-side code
- Never commit to git
- Only use in server-side code (API routes)

✅ **Best Practices**:
- Store in `.env.local` (gitignored)
- Use only in API routes or server components
- Rotate keys if exposed

---

## What Changed from Previous Setup

❌ **Removed**:
- Resend API
- Edge Functions
- Complex SMTP configuration
- External email service

✅ **Added**:
- Supabase service role key
- Built-in Auth email service
- Simpler configuration

---

## Production Checklist

Before going live:

- [ ] Configure custom SMTP in Supabase (optional)
- [ ] Set up custom email domain
- [ ] Test email deliverability
- [ ] Configure email templates with branding
- [ ] Set proper rate limits
- [ ] Monitor email logs in Supabase Dashboard

---

## Cost

**Development**: FREE ✅
- Supabase default email service
- 3 emails/hour limit

**Production**: FREE to $25/month
- Supabase Pro: $25/month (unlimited emails with custom SMTP)
- Or use Supabase free tier + external SMTP (SendGrid free tier)

---

## Summary

You now have a simple email verification system using only Supabase:

1. ✅ No external services needed
2. ✅ No API keys to manage (except Supabase keys)
3. ✅ No Edge Functions to deploy
4. ✅ Works out of the box with Supabase
5. ✅ Easy to upgrade to custom SMTP later

**Just add the service role key and you're done!** 🎉
