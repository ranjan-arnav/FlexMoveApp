// Set Telegram Webhook
// This script sets up the webhook URL for your Telegram bot

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL + '/api/telegram/webhook';

async function setWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    process.exit(1);
  }

  if (!WEBHOOK_URL || WEBHOOK_URL.includes('localhost')) {
    console.error('❌ Invalid webhook URL. Please use a public URL (ngrok, Railway, Vercel, etc.)');
    console.log('Current URL:', WEBHOOK_URL);
    process.exit(1);
  }

  console.log('🔧 Setting up Telegram webhook...');
  console.log('Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...');
  console.log('Webhook URL:', WEBHOOK_URL);

  try {
    // Set webhook
    const setResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ['message', 'callback_query']
        })
      }
    );

    const setResult = await setResponse.json();
    
    if (setResult.ok) {
      console.log('✅ Webhook set successfully!');
    } else {
      console.error('❌ Failed to set webhook:', setResult);
      process.exit(1);
    }

    // Get webhook info to verify
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const info = await infoResponse.json();

    console.log('\n📋 Webhook Info:');
    console.log('URL:', info.result.url);
    console.log('Pending Updates:', info.result.pending_update_count);
    console.log('Last Error:', info.result.last_error_message || 'None');
    console.log('Last Error Date:', info.result.last_error_date ? new Date(info.result.last_error_date * 1000).toLocaleString() : 'N/A');

    console.log('\n🎉 Telegram webhook is now active!');
    console.log('Test by sending a message to your bot on Telegram.');

  } catch (error) {
    console.error('❌ Error setting webhook:', error);
    process.exit(1);
  }
}

setWebhook();
