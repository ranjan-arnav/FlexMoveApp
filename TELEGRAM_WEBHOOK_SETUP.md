# Telegram Webhook Setup Guide

## 🤖 Enable Telegram Webhook

This guide will help you set up the Telegram webhook for receiving messages in real-time.

---

## Prerequisites

- Telegram Bot Token (already in `.env.local`)
- Public URL for webhook (production) OR ngrok (local development)

---

## Option 1: Production Setup (Vercel/Railway/etc.)

### Step 1: Deploy Your App

Deploy to a hosting service with a public URL:
- **Vercel** (recommended)
- **Railway**
- **Render**
- **Heroku**

### Step 2: Set Webhook URL

```bash
# Update NEXT_PUBLIC_APP_URL in production environment
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Run the setup script
node scripts/setup-telegram-webhook.js
```

---

## Option 2: Local Development with ngrok

### Step 1: Install ngrok

**Windows (using Chocolatey):**
```powershell
choco install ngrok
```

**Or download from:** https://ngrok.com/download

### Step 2: Start ngrok Tunnel

```powershell
# Start your Next.js dev server first
pnpm dev

# In another terminal, start ngrok
ngrok http 3000
```

You'll see output like:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### Step 3: Update Environment Variable

Copy the ngrok URL and update `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### Step 4: Set Webhook

```powershell
# Restart your dev server to load new URL
pnpm dev

# In another terminal, run setup script
node scripts/setup-telegram-webhook.js
```

---

## Quick Setup Script (PowerShell)

I'll create an automated setup script for you:

```powershell
.\setup-telegram-webhook-dev.ps1
```

This will:
1. Check if ngrok is installed
2. Start ngrok tunnel
3. Update environment variable
4. Set Telegram webhook
5. Test the connection

---

## Manual Webhook Setup

If you prefer to set it manually:

```bash
# Set webhook
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.com/api/telegram/webhook"}'

# Check webhook status
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

## Testing

### Test the Webhook

1. Open Telegram
2. Find your bot (search for the bot username)
3. Send `/start` command
4. You should get a welcome message

### Check Webhook Status

```powershell
node scripts/check-telegram-webhook.js
```

---

## Troubleshooting

### Webhook not receiving messages

**Check 1: Verify webhook is set**
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

**Check 2: Test the endpoint directly**
```bash
curl -X POST https://your-app.com/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"test"}}'
```

**Check 3: Check server logs**
- Look for incoming webhook requests
- Check for any errors in the API route

### ngrok tunnel closed

ngrok free tunnels expire after 2 hours. Solutions:
- Restart ngrok (get new URL, update webhook)
- Sign up for ngrok free account (longer sessions)
- Use production deployment

### SSL certificate errors

Make sure your webhook URL uses HTTPS (not HTTP). Telegram requires HTTPS for webhooks.

---

## Environment Variables

Required in `.env.local`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXT_PUBLIC_APP_URL=https://your-public-url.com
```

---

## Webhook vs Polling

**Webhook (Recommended)**:
✅ Real-time message delivery
✅ Lower server load
✅ More reliable
❌ Requires public URL

**Polling (Alternative)**:
✅ Works with localhost
✅ No public URL needed
❌ Higher latency
❌ More server load

---

## Production Checklist

Before deploying to production:

- [ ] Deploy app to hosting service
- [ ] Set production environment variables
- [ ] Run webhook setup script
- [ ] Test bot functionality
- [ ] Monitor webhook logs
- [ ] Set up error alerting

---

## Commands to Test

After setting up webhook, test these commands:

- `/start` - Welcome message
- `/help` - Show help
- `/link CODE` - Link account
- `/status` - View shipments
- `/track` - Track shipment
- `/alerts` - View alerts

---

## Next Steps

1. Set up webhook (see options above)
2. Test with Telegram bot
3. Link your account from web app
4. Start receiving notifications!

---

## Support

If you encounter issues:

1. Check webhook status: `getWebhookInfo`
2. Check server logs for errors
3. Verify bot token is correct
4. Ensure URL is public and uses HTTPS
