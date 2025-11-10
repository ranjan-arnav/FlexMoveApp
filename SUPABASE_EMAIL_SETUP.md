# Email Verification with Supabase Edge Functions

## Overview
Email verification using Supabase Edge Functions with Resend API for sending emails. Everything stays within your Supabase infrastructure.

## Why Supabase Edge Functions?

✅ **All in one place** - Your database and email service together
✅ **No SMTP setup needed** - No Gmail app passwords or SMTP configuration
✅ **Free tier available** - Resend offers 100 emails/day, 3000/month free
✅ **Serverless** - Automatically scales with your application
✅ **Easy deployment** - Deploy with one command

## Setup Steps

### Step 1: Install Supabase CLI

```bash
# Windows (PowerShell)
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```bash
cd d:\hul2\FlexMove
supabase link --project-ref your-project-ref
```

Get your project ref from Supabase Dashboard → Project Settings → General → Reference ID

### Step 4: Sign up for Resend

1. Go to https://resend.com
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier: 100 emails/day, 3000 emails/month

### Step 5: Set Resend API Key in Supabase

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

### Step 6: Deploy the Edge Function

```bash
supabase functions deploy send-email
```

You should see:
```
✓ Deployed Function send-email
Function URL: https://your-project-ref.supabase.co/functions/v1/send-email
```

### Step 7: Test the Edge Function

```bash
# Test sending an email
supabase functions invoke send-email --data '{
  "to": "your-email@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello from FlexMove!</h1><p>This is a test email.</p>"
}'
```

### Step 8: Update Database Schema

Run the SQL migration in Supabase SQL Editor:

```sql
-- Add required columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Add unique constraint
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
```

### Step 9: Verify Setup

```bash
# Check if function is deployed
supabase functions list

# Check secrets
supabase secrets list
```

## File Structure

```
FlexMove/
├── lib/
│   ├── email.ts                 # Email service using Supabase
│   └── database.ts              # Auth functions (unchanged)
├── supabase/
│   └── functions/
│       └── send-email/
│           └── index.ts         # Edge function for sending emails
└── app/
    └── api/
        ├── verify-email/
        │   └── route.ts         # Verification endpoint
        └── resend-verification/
            └── route.ts         # Resend endpoint
```

## How It Works

### 1. User Signs Up
```
User → App → database.ts → createUser()
  → Generates verification token
  → Calls email.ts → sendVerificationEmail()
  → Calls Supabase Edge Function → send-email
  → Resend API → Sends email
```

### 2. User Receives Email
```
Email with verification link
  → User clicks link
  → /api/verify-email?token=xxx
  → database.ts → verifyEmail()
  → Updates email_verified = true
  → Redirects to signin
```

### 3. User Signs In
```
User enters credentials
  → database.ts → loginUser()
  → Validates password
  → Checks email_verified = true
  → Login successful
```

## Cost Breakdown

### Resend (Email Service)
- **Free Tier**: 100 emails/day, 3000/month
- **Pro Tier**: $20/month for 50,000 emails
- **Perfect for**: Small to medium applications

### Supabase Edge Functions
- **Free Tier**: 500,000 invocations/month
- **Pro Tier**: $25/month for 2 million invocations
- **Perfect for**: All application sizes

### Total Cost
- **Development**: $0/month (completely free)
- **Production (small)**: $0/month (within free tiers)
- **Production (medium)**: $20-25/month

## Advantages Over SMTP

### ✅ No SMTP Configuration
- No Gmail app passwords
- No port configuration
- No SSL/TLS setup
- No email provider restrictions

### ✅ Better Deliverability
- Resend handles SPF/DKIM automatically
- Better inbox placement
- Email analytics included
- Bounce handling included

### ✅ Easier Scaling
- No connection pooling needed
- Automatic retry logic
- Rate limiting handled
- No SMTP timeout issues

### ✅ All in Supabase
- Functions and database together
- Unified monitoring
- Single authentication
- Easier deployment

## Alternative Email Providers

If you don't want to use Resend, you can modify the Edge Function to use:

### SendGrid
```typescript
const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'noreply@yourdomain.com' },
    subject: subject,
    content: [{ type: 'text/html', value: html }],
  }),
})
```

### Mailgun
```typescript
const formData = new FormData()
formData.append('from', 'FlexMove <noreply@yourdomain.com>')
formData.append('to', to)
formData.append('subject', subject)
formData.append('html', html)

const res = await fetch(`https://api.mailgun.net/v3/yourdomain.com/messages`, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(`api:${MAILGUN_API_KEY}`),
  },
  body: formData,
})
```

### AWS SES
```typescript
// Requires AWS SDK for Deno
// More complex setup but very cheap at scale
```

## Troubleshooting

### Edge Function Not Deploying
```bash
# Check if logged in
supabase login

# Check if project linked
supabase link --project-ref your-project-ref

# Try deploying again
supabase functions deploy send-email --debug
```

### Email Not Sending
```bash
# Check function logs
supabase functions logs send-email

# Test function directly
supabase functions invoke send-email --data '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

### Secret Not Set
```bash
# List secrets
supabase secrets list

# Set secret again
supabase secrets set RESEND_API_KEY=your_key_here
```

### Email in Spam
1. Verify your domain in Resend dashboard
2. Add SPF/DKIM records to your domain DNS
3. Use your own domain (not @resend.dev)

## Monitoring

### View Edge Function Logs
```bash
# Real-time logs
supabase functions logs send-email --tail

# Recent logs
supabase functions logs send-email --limit 100
```

### Resend Dashboard
- Login to https://resend.com
- View sent emails
- Check delivery status
- See bounce/complaint rates

## Production Checklist

- [ ] Deploy Edge Function to production
- [ ] Set RESEND_API_KEY secret in production
- [ ] Run database migration
- [ ] Test email sending
- [ ] Verify deliverability
- [ ] Set up custom domain in Resend
- [ ] Configure SPF/DKIM records
- [ ] Test verification flow end-to-end
- [ ] Monitor Edge Function logs
- [ ] Set up error alerts

## Development vs Production

### Development
```bash
# Local development with Supabase CLI
supabase start
supabase functions serve send-email

# Test locally
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

### Production
```bash
# Deploy to production
supabase functions deploy send-email --project-ref your-production-ref

# Set production secrets
supabase secrets set RESEND_API_KEY=your_production_key --project-ref your-production-ref
```

## Common Issues

### 1. Function invocation failed
**Cause**: Edge Function not deployed or secret not set
**Solution**:
```bash
supabase functions deploy send-email
supabase secrets set RESEND_API_KEY=your_key
```

### 2. CORS error in browser
**Cause**: Edge Function needs CORS headers
**Solution**: Already included in the Edge Function code

### 3. Rate limit exceeded
**Cause**: Exceeded Resend free tier
**Solution**: Upgrade to Resend Pro or reduce email sending

### 4. Email not received
**Cause**: Email in spam or Resend domain blocked
**Solution**: Verify your own domain in Resend

## Next Steps

1. ✅ Deploy the Edge Function
2. ✅ Test email sending
3. ✅ Run database migration
4. ✅ Test signup flow
5. ✅ Test verification flow
6. ✅ Test login flow
7. ✅ Monitor logs

## Conclusion

✅ **No more SMTP configuration**
✅ **Everything in Supabase**
✅ **Easy to deploy and scale**
✅ **Free tier available**
✅ **Better deliverability**
✅ **Production ready**

Your email verification system is now fully integrated with Supabase! 🎉
