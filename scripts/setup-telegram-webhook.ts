import { setTelegramWebhook, deleteWebhook, getBotInfo } from '@/lib/telegram';

async function setupWebhook() {
  try {
    console.log('🤖 Setting up Telegram Bot Webhook...\n');

    // Get bot info
    console.log('📝 Fetching bot information...');
    const botInfo = await getBotInfo();
    console.log(`✅ Bot Name: @${botInfo.username}`);
    console.log(`   Bot ID: ${botInfo.id}\n`);

    // Delete any existing webhook
    console.log('🗑️  Removing existing webhook...');
    await deleteWebhook();
    console.log('✅ Existing webhook deleted\n');

    // Set new webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    console.log(`🔗 Setting webhook URL: ${webhookUrl}`);
    
    const result = await setTelegramWebhook(webhookUrl);
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!\n');
      console.log('🎉 Telegram Bot is now ready to receive messages!');
      console.log('\n📱 Test your bot:');
      console.log(`   1. Open Telegram`);
      console.log(`   2. Search for @${botInfo.username}`);
      console.log(`   3. Send /start to begin\n`);
    } else {
      console.error('❌ Failed to set webhook:', result);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  setupWebhook();
}

export { setupWebhook };
