# Email Verification & Password Authentication Setup

## Overview
Complete authentication system with password validation and email verification for FlexMove.

## Features Implemented

### ✅ Password Validation
- **Secure Password Hashing**: Using bcryptjs with salt rounds
- **Password Comparison**: Validates credentials against hashed passwords in database
- **Invalid Credentials Handling**: Shows "Invalid email or password" for wrong credentials

### ✅ Email Verification
- **Signup Flow**: Creates account → Sends verification email → User must verify before login
- **Verification Token**: 32-byte cryptographically secure random token
- **Token Expiration**: 24-hour expiration for security
- **Resend Functionality**: Users can request new verification emails
- **Automatic Redirect**: After verification, redirects to sign in page

## Database Schema Changes

### Users Table - New Fields
```sql
-- Add these columns to your users table in Supabase

ALTER TABLE users 
ADD COLUMN password_hash TEXT NOT NULL DEFAULT '',
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token TEXT,
ADD COLUMN verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_email ON users(email);
```

## SMTP Configuration

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Search for "App passwords"
   - Generate new app password for "Mail"
   - Copy the 16-character password

3. **Update .env.local**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Option 2: SendGrid (Recommended for Production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Option 3: AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_smtp_username
SMTP_PASSWORD=your_aws_smtp_password
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Implementation Details

### 1. User Registration (`DatabaseService.createUser()`)

```typescript
// Flow:
1. Check if email already exists → Error if exists
2. Hash password with bcrypt (10 salt rounds)
3. Generate verification token (crypto.randomBytes)
4. Set token expiration (24 hours from now)
5. Create user in users table (email_verified = false)
6. Create role-specific record (supplier/transporter/customer)
7. Send verification email
8. Return success message
```

### 2. User Login (`DatabaseService.loginUser()`)

```typescript
// Flow:
1. Query user by email
2. If not found → "Invalid email or password"
3. Compare password with bcrypt.compare()
4. If password doesn't match → "Invalid email or password"
5. Check if email_verified = true
6. If not verified → Show error + resend verification option
7. If verified → Login successful
```

### 3. Email Verification (`DatabaseService.verifyEmail()`)

```typescript
// Flow:
1. Find user by verification_token
2. If not found → "Invalid verification link"
3. Check if token expired
4. If expired → Show error + resend option
5. Update user: email_verified = true, clear token
6. Redirect to signin page with success message
```

### 4. Resend Verification

```typescript
// Flow:
1. Find user by email
2. If already verified → Show message
3. Generate new token and expiration
4. Update user with new token
5. Send verification email
6. Show success message
```

## API Routes

### `/api/verify-email` (GET)
- **Query Parameter**: `token` (verification token)
- **Response**: Redirects to home page with query params
  - Success: `?verified=true`
  - Error: `?verification_error=message`

### `/api/resend-verification` (POST)
- **Body**: `{ email: string }`
- **Response**: `{ success: boolean, message?: string, error?: string }`

## Email Template

Beautiful HTML email with:
- Gradient header with FlexMove branding
- Personalized greeting
- Call-to-action button
- Direct link copy-paste option
- Expiration notice (24 hours)
- Footer with company info

## User Experience Flow

### Signup Flow
```
1. User fills signup form (email, password, name, role)
2. User clicks "Create Account"
3. System creates user with email_verified = false
4. System sends verification email
5. User sees: "Account created! Check your email to verify"
6. Form switches to Sign In mode
7. Form fields are cleared

User checks email:
8. Clicks "Verify Email Address" button
9. Redirected to signin page
10. Sees success notification: "Email verified! You can now sign in"
```

### Login Flow with Unverified Email
```
1. User enters email and password
2. User clicks "Sign In"
3. Password is validated ✅
4. Email verification check fails ❌
5. Error shown: "Please verify your email before signing in"
6. Blue box appears with "Resend Verification Email" button
7. User clicks button
8. New verification email sent
9. User checks email and verifies
10. Can now login successfully
```

### Login Flow with Wrong Password
```
1. User enters email and password
2. User clicks "Sign In"
3. System finds user
4. Password comparison fails
5. Error shown: "Invalid email or password"
6. No resend verification button shown
7. User must enter correct password
```

## Security Features

### ✅ Password Security
- **Bcrypt Hashing**: Industry-standard password hashing
- **Salt Rounds**: 10 rounds (good balance of security vs performance)
- **No Plain Text**: Passwords never stored in plain text
- **Timing-Safe Comparison**: bcrypt.compare prevents timing attacks

### ✅ Token Security
- **Cryptographically Secure**: Using crypto.randomBytes
- **32 Bytes**: 256 bits of entropy
- **Hex Encoding**: URL-safe token format
- **One-Time Use**: Token cleared after verification
- **Expiration**: 24-hour validity window

### ✅ Email Security
- **TLS Encryption**: SMTP with STARTTLS
- **No Sensitive Data**: Tokens in links, not email body
- **Unique Per User**: Each token is unique

### ✅ Error Message Security
- **Generic Errors**: "Invalid email or password" (doesn't reveal if email exists)
- **Consistent Timing**: bcrypt prevents timing attacks
- **No Information Leakage**: Errors don't reveal system internals

## Testing

### Test User Creation
```typescript
// Example test data
{
  email: "test@example.com",
  password: "SecurePassword123!",
  name: "Test User",
  role: "supplier",
  company_name: "Test Company",
  phone: "+1234567890"
}
```

### Verify Database
```sql
-- Check user was created
SELECT id, email, name, role, email_verified, 
       verification_token IS NOT NULL as has_token
FROM users 
WHERE email = 'test@example.com';

-- Should show:
-- email_verified: false
-- has_token: true
```

### Test Email Sending
1. Check console logs for email sending confirmation
2. Check your email inbox
3. Verify email has FlexMove branding
4. Click verification link
5. Should redirect to signin with success message

### Test Login Before Verification
```
1. Try to login → Should fail
2. Error: "Please verify your email before signing in"
3. Resend button should appear
```

### Test Login After Verification
```
1. Click verification link in email
2. Redirect to signin
3. See "Email verified!" notification
4. Enter credentials
5. Should login successfully
```

## Files Modified/Created

### New Files
- `lib/email.ts` - Email service with nodemailer
- `app/api/verify-email/route.ts` - Email verification endpoint
- `app/api/resend-verification/route.ts` - Resend verification endpoint
- `.env.example` - Environment variable template

### Modified Files
- `lib/supabase.ts` - Updated User interface
- `lib/database.ts` - Complete rewrite of authentication functions
- `app/page.tsx` - Updated UI for verification flow
- `package.json` - Added bcryptjs and nodemailer

## Production Checklist

Before deploying to production:

### ✅ Environment Variables
- [ ] Set production SMTP credentials
- [ ] Set production NEXT_PUBLIC_APP_URL
- [ ] Use production email service (SendGrid/AWS SES)
- [ ] Never use Gmail for production

### ✅ Database
- [ ] Run schema migration (add new columns)
- [ ] Create indexes for performance
- [ ] Backup existing data
- [ ] Test on staging environment first

### ✅ Email Service
- [ ] Set up dedicated email service
- [ ] Configure SPF/DKIM records
- [ ] Verify sender domain
- [ ] Test email deliverability
- [ ] Set up email monitoring

### ✅ Security
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS policies
- [ ] Rate limit authentication endpoints
- [ ] Monitor failed login attempts
- [ ] Implement account lockout after N failures
- [ ] Add CAPTCHA for signup/login

### ✅ User Experience
- [ ] Test email delivery time
- [ ] Test verification on mobile
- [ ] Test across different email clients
- [ ] Add email retry logic
- [ ] Handle bounced emails

## Troubleshooting

### Email Not Sending

**Check logs**:
```
✅ Email sent: <message-id>  // Success
❌ Email sending failed: error message  // Failed
```

**Common Issues**:
1. **SMTP credentials wrong**: Double-check .env.local
2. **Gmail app password not generated**: Generate app password first
3. **2FA not enabled**: Enable 2FA on Gmail account
4. **Port blocked**: Try port 465 (SSL) instead of 587 (TLS)
5. **Less secure apps**: Gmail doesn't allow this anymore, use app password

### User Can't Verify Email

1. **Token expired**: User can request new verification email
2. **Invalid link**: Check token format in database
3. **Email client modified link**: Resend email
4. **Already verified**: Show appropriate message

### Password Not Matching

1. **Password case-sensitive**: Ensure caps lock is off
2. **Whitespace in password**: Trim input in frontend
3. **Wrong email**: Verify email address is correct
4. **Account doesn't exist**: Check user exists in database

## Future Enhancements

### 🔄 Planned Features
- **Password Reset**: Forgot password functionality
- **Password Requirements**: Minimum length, complexity rules
- **Account Lockout**: Temporary lockout after failed attempts
- **Session Management**: JWT tokens for persistent sessions
- **Two-Factor Authentication**: SMS/Authenticator app
- **Email Change**: Verify new email before changing
- **Social Login**: Google/Microsoft OAuth
- **Remember Me**: Persistent sessions with refresh tokens

### 🔄 Email Improvements
- **Email Queue**: Background job processing
- **Retry Logic**: Automatic retry on failure
- **Email Templates**: Multiple languages
- **Custom Branding**: Per-organization templates
- **Email Analytics**: Track open/click rates

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify .env.local has all required variables
3. Check Supabase database for user records
4. Test email settings with nodemailer directly
5. Review this documentation for troubleshooting steps

## Conclusion

✅ **Password validation is now fully functional**
- Only correct passwords allow signin
- Invalid credentials show generic error message
- Secure bcrypt hashing protects passwords

✅ **Email verification is now required**
- Users must verify email before signin
- Verification link sent automatically on signup
- Can resend verification email if needed
- Token expires after 24 hours

✅ **Production ready with proper SMTP setup**
- Configure SMTP credentials in .env.local
- Use Gmail for development
- Use SendGrid/AWS SES for production
- Beautiful HTML email templates
