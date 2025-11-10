// Check Telegram Webhook Status
// This script checks the current webhook configuration

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function checkWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    process.exit(1);
  }

  console.log('🔍 Checking Telegram webhook status...\n');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const data = await response.json();

    if (!data.ok) {
      console.error('❌ Failed to get webhook info:', data);
      process.exit(1);
    }

    const info = data.result;

    console.log('📋 Webhook Information:');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔗 Webhook URL:');
    console.log(info.url || '❌ No webhook set\n');
    
    console.log('📊 Status:');
    console.log(`  Has Custom Certificate: ${info.has_custom_certificate}`);
    console.log(`  Pending Updates: ${info.pending_update_count}`);
    console.log(`  Max Connections: ${info.max_connections || 'Default (40)'}\n`);

    if (info.last_error_message) {
      console.log('⚠️  Last Error:');
      console.log(`  Message: ${info.last_error_message}`);
      console.log(`  Date: ${new Date(info.last_error_date * 1000).toLocaleString()}\n`);
    } else {
      console.log('✅ No recent errors\n');
    }

    if (info.last_synchronization_error_date) {
      console.log('⚠️  Last Synchronization Error:');
      console.log(`  Date: ${new Date(info.last_synchronization_error_date * 1000).toLocaleString()}\n`);
    }

    console.log('📝 Allowed Updates:');
    console.log(`  ${info.allowed_updates?.join(', ') || 'All updates'}\n`);

    if (info.ip_address) {
      console.log('🌐 IP Address:');
      console.log(`  ${info.ip_address}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════\n');
    if (info.url) {
      if (info.last_error_message) {
        console.log('⚠️  Webhook is set but has errors');
        console.log('   Check the error message above');
      } else if (info.pending_update_count > 0) {
        console.log('⚠️  Webhook is active but has pending updates');
        console.log(`   ${info.pending_update_count} messages waiting to be processed`);
      } else {
        console.log('✅ Webhook is active and working correctly!');
      }
    } else {
      console.log('❌ No webhook is configured');
      console.log('   Run: node scripts/setup-telegram-webhook.js');
    }

  } catch (error) {
    console.error('❌ Error checking webhook:', error);
    process.exit(1);
  }
}

checkWebhook();
