# Telegram Bot Integration Guide

## Overview

FlexMove's Telegram bot integration allows users to:
- **Link their account** with a secure 6-character code (15-minute expiry)
- **Chat with Flexify AI** directly in Telegram
- **Receive real-time notifications** for shipment updates and disruptions
- **Track shipments** on the go without opening the web app

## Bot Details

- **Bot Username**: `@FlexMove_bot`
- **Bot Name**: FlexMove Assistant
- **Features**: AI chat, notifications, shipment tracking

## Architecture

### Components

```
lib/
├── telegram.ts                 # Core bot functions (send messages, AI responses)
├── telegram-storage.ts         # In-memory storage (linking codes, user mappings)
└── telegram-notifications.ts   # Notification system (shipment updates, alerts)

app/api/telegram/
├── webhook/route.ts           # Handles incoming bot messages & commands
└── link/route.ts              # API for generating/managing linking codes

components/
└── telegram-link.tsx          # React component for linking UI

scripts/
└── setup-telegram-webhook.ts  # Webhook initialization script
```

### Data Flow

1. **User Linking**:
   ```
   Web App → Generate Code → User enters /link CODE in Telegram → Bot validates → Account linked
   ```

2. **Notifications**:
   ```
   Shipment Update → Check subscribers → Send notification to linked Telegram IDs
   ```

3. **AI Chat**:
   ```
   User message → Check if linked → Generate Flexify response → Send reply
   ```

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8259277068:AAG49kzzlcNBYAX9c05OXBlngNjm9XCK6mw

# Application URL (for webhooks and button links)
NEXT_PUBLIC_APP_URL=https://flexmove.vercel.app

# NextAuth Secret (for session management)
NEXTAUTH_SECRET=your-secret-here-change-in-production
```

### 2. Install Dependencies

All required dependencies are already installed:
- `@google/generative-ai` - For Flexify AI responses
- `next` - For API routes and webhooks

### 3. Set Up Webhook

**Option A: Using the script (recommended)**

```bash
pnpm ts-node scripts/setup-telegram-webhook.ts
```

**Option B: Manual setup**

Call the webhook API after deployment:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${NEXT_PUBLIC_APP_URL}/api/telegram/webhook\"}"
```

### 4. Deploy to Production

```bash
# Build the application
pnpm build

# Deploy (example for Vercel)
vercel --prod

# After deployment, set up the webhook
pnpm ts-node scripts/setup-telegram-webhook.ts
```

## User Guide

### Linking Your Account

1. **Open FlexMove web app** and go to your profile/settings
2. **Click "Link Telegram"** in the Telegram section
3. **Generate a linking code** (6 characters, expires in 15 minutes)
4. **Open Telegram** and search for `@FlexMove_bot`
5. **Send**: `/link YOUR_CODE`
6. **Confirmation**: Bot will confirm successful linking

### Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and command list |
| `/link CODE` | Link your FlexMove account |
| `/status` | View your shipment status overview |
| `/track` | Track specific shipments |
| `/alerts` | View active disruption alerts |
| `/settings` | Manage notification preferences |
| `/unlink` | Unlink your Telegram account |
| `/help` | Show command help |

### AI Chat Examples

Just ask Flexify anything in natural language:

- "What's the status of my shipments?"
- "Show me delayed deliveries"
- "Track shipment SH001"
- "Where is my package?"
- "Are there any disruptions?"

## Developer Guide

### Adding Linking UI to Dashboard

Import and use the `TelegramLink` component:

```tsx
import { TelegramLink } from "@/components/telegram-link";

function SettingsPage() {
  return (
    <div>
      <h2>Account Settings</h2>
      
      {/* Telegram linking section */}
      <TelegramLink 
        userId={currentUser.id} 
        userName={currentUser.name}
      />
    </div>
  );
}
```

### Sending Notifications

Use the notification helpers in your backend code:

```typescript
import { notifyShipmentUpdate, notifyDisruption } from '@/lib/telegram-notifications';

// Example: Notify about shipment status change
await notifyShipmentUpdate(
  shipment,
  'status_changed',
  [userId1, userId2] // Optional: specific users
);

// Example: Notify about disruption
await notifyDisruption(
  disruption,
  shipment,
  [userId1, userId2] // Optional: specific users
);

// Example: Broadcast to all linked users
import { broadcastToAllUsers } from '@/lib/telegram-notifications';
await broadcastToAllUsers('System maintenance in 1 hour');
```

### Subscribing Users to Shipments

```typescript
import { subscribeUserToShipment } from '@/lib/telegram-notifications';

// Subscribe user to specific shipment notifications
await subscribeUserToShipment(userId, shipmentId);
```

### Testing Locally

1. **Use ngrok for local development**:
   ```bash
   ngrok http 3000
   ```

2. **Update environment variable**:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
   ```

3. **Set webhook**:
   ```bash
   pnpm ts-node scripts/setup-telegram-webhook.ts
   ```

4. **Test the bot** in Telegram

## Storage & Persistence

### Current Implementation (Development)

- **In-memory storage** using Maps
- Data is lost on server restart
- Suitable for development and testing

### Production Recommendations

Replace `telegram-storage.ts` with a proper database:

**Option 1: PostgreSQL**
```sql
CREATE TABLE user_links (
  user_id VARCHAR PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username VARCHAR,
  first_name VARCHAR,
  linked_at TIMESTAMP,
  last_active TIMESTAMP,
  notifications BOOLEAN
);

CREATE TABLE linking_codes (
  code VARCHAR(6) PRIMARY KEY,
  user_id VARCHAR,
  user_role VARCHAR,
  email VARCHAR,
  expires_at TIMESTAMP,
  used BOOLEAN
);

CREATE TABLE shipment_subscriptions (
  telegram_id BIGINT,
  shipment_id VARCHAR,
  PRIMARY KEY (telegram_id, shipment_id)
);
```

**Option 2: Redis**
```typescript
// Example with Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Store linking code
await redis.setex(`linking:${code}`, 900, JSON.stringify(linkingCode)); // 15 min TTL
```

**Option 3: MongoDB**
```typescript
// Example with MongoDB
const UserLink = mongoose.model('UserLink', {
  userId: { type: String, required: true, unique: true },
  telegramId: { type: Number, required: true, unique: true },
  username: String,
  firstName: String,
  linkedAt: Date,
  lastActive: Date,
  notifications: Boolean,
});
```

## Security Considerations

### 1. Webhook Validation

Add secret token validation (recommended for production):

```typescript
// In webhook route
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const token = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  
  if (token !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Process update...
}
```

### 2. Rate Limiting

Implement rate limiting for API routes:

```typescript
// Example with Upstash Rate Limit
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

const { success } = await ratelimit.limit(chatId.toString());
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 3. User Authentication

Ensure only authenticated users can generate linking codes:

```typescript
// In /api/telegram/link route
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Generate code...
}
```

## Troubleshooting

### Bot Not Responding

1. **Check webhook status**:
   ```bash
   curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
   ```

2. **Verify environment variables** are set correctly

3. **Check bot token** is valid:
   ```bash
   curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe
   ```

### Notifications Not Sending

1. **Check user is linked**: 
   ```typescript
   const userLink = telegramStorage.getUserLink(userId);
   console.log('User link:', userLink);
   ```

2. **Verify notifications are enabled**:
   ```typescript
   console.log('Notifications:', userLink?.notifications);
   ```

3. **Check Telegram API response** for errors in logs

### Linking Code Not Working

1. **Check code expiration** (15 minutes)
2. **Verify code hasn't been used** already
3. **Ensure user isn't already linked**

## API Reference

### POST /api/telegram/webhook

Receives updates from Telegram Bot API.

**Headers**: None required (add secret token in production)

**Body**: Telegram Update object

**Response**: `{ ok: true }`

---

### POST /api/telegram/link

Generate a new linking code.

**Body**:
```json
{
  "userId": "user123",
  "userName": "customer"
}
```

**Response**:
```json
{
  "code": "ABC123",
  "expiresAt": "2025-06-10T12:30:00Z",
  "expiresIn": 900
}
```

---

### GET /api/telegram/link?userId=user123

Check link status or verify linking code.

**Query Params**:
- `userId` (required): User ID to check
- `code` (optional): Linking code to verify

**Response** (linked):
```json
{
  "linked": true,
  "telegramId": 123456789,
  "telegramUsername": "john_doe",
  "telegramFirstName": "John",
  "linkedAt": "2025-06-10T12:00:00Z",
  "lastActive": "2025-06-10T14:30:00Z",
  "notifications": true
}
```

**Response** (not linked):
```json
{
  "linked": false
}
```

---

### DELETE /api/telegram/link?userId=user123

Unlink Telegram account.

**Query Params**:
- `userId` (required): User ID to unlink

**Response**:
```json
{
  "success": true
}
```

## Future Enhancements

- [ ] **Rich media support**: Send images, documents, location updates
- [ ] **Inline keyboards**: Interactive buttons for quick actions
- [ ] **Group chat support**: Allow teams to receive notifications
- [ ] **Voice messages**: Audio updates for drivers
- [ ] **Photo verification**: Delivery confirmation with photos
- [ ] **QR code linking**: Scan to link instead of typing code
- [ ] **Multi-language support**: Localized bot responses
- [ ] **Analytics dashboard**: Track bot usage and engagement

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review Telegram Bot API docs: https://core.telegram.org/bots/api
- Contact support: support@flexmove.com

---

**Made with ❤️ by the FlexMove Team**
