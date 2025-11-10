// Local testing script for Telegram bot
// Run with: node scripts/test-bot-locally.js

const TELEGRAM_BOT_TOKEN = '8259277068:AAG49kzzlcNBYAX9c05OXBlngNjm9XCK6mw';
const API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function testBotLocally() {
  console.log('🤖 Testing Telegram Bot Locally\n');

  try {
    // 1. Get bot info
    console.log('1️⃣ Fetching bot info...');
    const botInfoResponse = await fetch(`${API_URL}/getMe`);
    const botInfo = await botInfoResponse.json();
    
    if (botInfo.ok) {
      console.log(`   ✅ Bot Username: @${botInfo.result.username}`);
      console.log(`   ✅ Bot ID: ${botInfo.result.id}\n`);
    } else {
      console.log('   ❌ Failed to fetch bot info\n');
      return;
    }

    // 2. Check current webhook
    console.log('2️⃣ Checking current webhook...');
    const webhookResponse = await fetch(`${API_URL}/getWebhookInfo`);
    const webhookInfo = await webhookResponse.json();
    
    if (webhookInfo.ok) {
      if (webhookInfo.result.url) {
        console.log(`   ℹ️  Current webhook: ${webhookInfo.result.url}`);
        console.log(`   ℹ️  Pending updates: ${webhookInfo.result.pending_update_count}\n`);
      } else {
        console.log('   ℹ️  No webhook set (using polling mode)\n');
      }
    }

    // 3. Delete webhook (to use polling for local testing)
    console.log('3️⃣ Removing webhook for local testing...');
    const deleteResponse = await fetch(`${API_URL}/deleteWebhook`);
    const deleteResult = await deleteResponse.json();
    
    if (deleteResult.ok) {
      console.log('   ✅ Webhook removed successfully\n');
    }

    // 4. Get updates (polling)
    console.log('4️⃣ Listening for messages (polling mode)...');
    console.log('   💡 Send /start to the bot in Telegram to test!\n');
    
    let offset = 0;
    let running = true;

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      running = false;
      console.log('\n\n👋 Stopping bot...');
      process.exit(0);
    });

    while (running) {
      try {
        const updatesResponse = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=30`);
        const updatesData = await updatesResponse.json();

        if (updatesData.ok && updatesData.result.length > 0) {
          for (const update of updatesData.result) {
            offset = update.update_id + 1;

            if (update.message) {
              const chatId = update.message.chat.id;
              const text = update.message.text;
              const firstName = update.message.from.first_name;

              console.log(`\n📨 Message from ${firstName} (${chatId}): ${text}`);

              // Simulate webhook call to local API
              try {
                const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(update),
                });

                if (webhookResponse.ok) {
                  console.log('   ✅ Message processed by local API');
                  const result = await webhookResponse.json();
                  console.log('   📤 Response:', JSON.stringify(result, null, 2));
                } else {
                  const error = await webhookResponse.text();
                  console.log('   ❌ Failed to process message:', webhookResponse.status);
                  console.log('   📋 Error:', error);
                }
              } catch (webhookError) {
                console.log('   ❌ Failed to connect to local API:', webhookError.message);
                console.log('   💡 Make sure Next.js server is running on http://localhost:3000');
              }
            }
          }
        }
      } catch (error) {
        console.error('   ⚠️  Polling error:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the test
testBotLocally();
