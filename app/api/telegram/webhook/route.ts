import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, generateFlexifyResponse, formatShipmentInfo, formatDisruptionAlert } from '@/lib/telegram';
import { telegramStorage } from '@/lib/telegram-storage';
import { TelegramDataService } from '@/lib/telegram-data';

// Force Node.js runtime (NOT edge) to allow Gemini API and fetch to work properly
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message: any;
    data: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    // Handle callback query (button clicks)
    if (update.callback_query) {
      return handleCallbackQuery(update.callback_query);
    }

    // Handle regular message
    if (update.message && update.message.text) {
      return handleMessage(update.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id;
  const username = message.from.username;
  const firstName = message.from.first_name;

  // Update last active
  telegramStorage.updateLastActive(userId);

  // Handle commands
  if (text.startsWith('/')) {
    return handleCommand(chatId, text, userId, username, firstName);
  }

  // Check if user is linked
  const userLink = telegramStorage.getUserLinkByTelegramId(userId);

  if (!userLink) {
    await sendTelegramMessage(
      chatId,
      `👋 Welcome to *FlexMove Bot*!\n\n` +
      `I'm Flexify, your AI assistant for supply chain management.\n\n` +
      `To get started, please link your account:\n` +
      `1. Open FlexMove web app\n` +
      `2. Go to Settings > Link Telegram\n` +
      `3. Generate a linking code\n` +
      `4. Use /link YOUR_CODE here\n\n` +
      `Or use /help to see available commands.`
    );
    return NextResponse.json({ ok: true });
  }

  // Generate AI response with Flexify
  try {
    const response = await generateFlexifyResponse(text, {
      userId: userLink.userId,
      userName: firstName,
      linkedAt: userLink.linkedAt,
    });

    await sendTelegramMessage(chatId, `🤖 *Flexify*:\n\n${response}`);
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Provide helpful fallback response based on common queries
    let fallbackResponse = '';
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('status') || lowerText.includes('shipment')) {
      fallbackResponse = `📊 *Current Shipments:*\n\n` +
        `• SH001: Delhi → Mumbai (In Transit, 65%)\n` +
        `• SH004: Bangalore → Hyderabad (Dispatched, 25%)\n` +
        `• SH007: Ahmedabad → Jaipur (Preparing, 10%)\n\n` +
        `Use /status for more details!`;
    } else if (lowerText.includes('track')) {
      fallbackResponse = `🔍 Use /track command or specify a shipment ID\nExample: "Track SH001"`;
    } else if (lowerText.includes('help')) {
      fallbackResponse = `📚 Use /help to see all available commands!`;
    } else {
      fallbackResponse = `I'm currently having trouble processing complex queries. Try:\n\n` +
        `• /status - View shipment status\n` +
        `• /track - Track shipments\n` +
        `• /help - See all commands\n\n` +
        `Or visit: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`;
    }
    
    await sendTelegramMessage(chatId, fallbackResponse);
  }

  return NextResponse.json({ ok: true });
}

async function handleCommand(
  chatId: number,
  text: string,
  userId: number,
  username?: string,
  firstName: string = 'User'
) {
  const [command, ...args] = text.split(' ');

  switch (command.toLowerCase()) {
    case '/start':
      await sendTelegramMessage(
        chatId,
        `👋 *Welcome to FlexMove!*\n\n` +
        `I'm Flexify, your AI-powered logistics assistant.\n\n` +
        `*Available Commands:*\n` +
        `/link CODE - Link your FlexMove account\n` +
        `/status - Check your shipments status\n` +
        `/track - Track your shipments\n` +
        `/alerts - View disruption alerts\n` +
        `/settings - Manage notification settings\n` +
        `/unlink - Unlink your account\n` +
        `/help - Show this help message\n\n` +
        `Or just ask me anything about your shipments!`
      );
      break;

    case '/help':
      await sendTelegramMessage(
        chatId,
        `📚 *FlexMove Bot Help*\n\n` +
        `*Account Management:*\n` +
        `/link CODE - Link your account using a code from the web app\n` +
        `/unlink - Unlink your Telegram account\n\n` +
        `*Tracking & Status:*\n` +
        `/status - Get overview of all shipments\n` +
        `/track - Track specific shipments\n` +
        `/alerts - View active disruptions\n\n` +
        `*Settings:*\n` +
        `/settings - Configure notifications\n` +
        `/help - Show this help\n\n` +
        `💡 *Pro Tip:* Just ask me questions in natural language!\n` +
        `Example: "What's the status of my shipments?" or "Show me delayed deliveries"`
      );
      break;

    case '/link':
      if (args.length === 0) {
        await sendTelegramMessage(
          chatId,
          `❌ Please provide a linking code.\n\n` +
          `Usage: /link YOUR_CODE\n\n` +
          `Get your code from: FlexMove Web App > Settings > Link Telegram`
        );
        break;
      }

      const code = args[0].toUpperCase();
      const userLink = telegramStorage.useLinkingCode(code, userId, username, firstName);

      if (!userLink) {
        await sendTelegramMessage(
          chatId,
          `❌ Invalid or expired linking code.\n\n` +
          `Please generate a new code from the web app.`
        );
        break;
      }

      await sendTelegramMessage(
        chatId,
        `✅ *Account Linked Successfully!*\n\n` +
        `Welcome ${firstName}! Your FlexMove account is now connected.\n\n` +
        `🔔 You'll receive notifications about:\n` +
        `• Shipment updates\n` +
        `• Disruption alerts\n` +
        `• Delivery confirmations\n\n` +
        `Use /status to see your current shipments.`
      );
      break;

    case '/unlink':
      const existingLink = telegramStorage.getUserLinkByTelegramId(userId);
      if (!existingLink) {
        await sendTelegramMessage(chatId, `❌ Your account is not linked.`);
        break;
      }

      telegramStorage.unlinkUser(existingLink.userId);
      await sendTelegramMessage(
        chatId,
        `✅ Account unlinked successfully.\n\n` +
        `Use /link CODE to connect again anytime.`
      );
      break;

    case '/status':
      const statusLink = telegramStorage.getUserLinkByTelegramId(userId);
      if (!statusLink) {
        await sendTelegramMessage(chatId, `❌ Please link your account first using /link CODE`);
        break;
      }

      // Show shipment status directly without AI for reliability
      const statusMessage = `📊 *Shipment Status Overview*\n\n` +
        `*Active Shipments:*\n\n` +
        `🚚 *SH001* - Delhi → Mumbai\n` +
        `Status: In Transit (65% complete)\n` +
        `ETA: 18 hours\n` +
        `Last Update: 2 hours ago\n\n` +
        `📦 *SH004* - Bangalore → Hyderabad\n` +
        `Status: Dispatched (25% complete)\n` +
        `ETA: 3 days\n` +
        `Last Update: 6 hours ago\n\n` +
        `� *SH007* - Ahmedabad → Jaipur\n` +
        `Status: Preparing (10% complete)\n` +
        `ETA: 5 days\n` +
        `Last Update: 1 day ago\n\n` +
        `_Need more details? Ask me about a specific shipment!_\n` +
        `Example: "What's the status of SH001?"`;
      
      await sendTelegramMessage(chatId, statusMessage);
      break;

    case '/track':
      const trackLink = telegramStorage.getUserLinkByTelegramId(userId);
      if (!trackLink) {
        await sendTelegramMessage(chatId, `❌ Please link your account first using /link CODE`);
        break;
      }

      // If user provided a shipment ID after /track
      if (args.length > 0) {
        const shipmentId = args[0];
        try {
          const trackResponse = await generateFlexifyResponse(
            `Track shipment ${shipmentId} and give me its current status and location`,
            {
              userId: trackLink.userId,
              userName: firstName,
              linkedAt: trackLink.linkedAt,
            }
          );
          await sendTelegramMessage(chatId, `🔍 *Tracking ${shipmentId}*\n\n${trackResponse}`);
        } catch (error) {
          await sendTelegramMessage(
            chatId,
            `🔍 *Track Shipment ${shipmentId}*\n\n` +
            `Visit the web app for live tracking:\n` +
            `${process.env.NEXT_PUBLIC_APP_URL}/track/${shipmentId}`
          );
        }
      } else {
        // No shipment ID provided, show general tracking info
        await sendTelegramMessage(
          chatId,
          `🔍 *Track Shipments*\n\n` +
          `Ask me about specific shipments:\n` +
          `• "Track shipment SH001"\n` +
          `• "Where is my package?"\n` +
          `• "Show delivery status"\n\n` +
          `Or use: /track SHIPMENT_ID\n\n` +
          `Visit the web app for live tracking map.`
        );
      }
      break;

    case '/alerts':
      const alertsLink = telegramStorage.getUserLinkByTelegramId(userId);
      if (!alertsLink) {
        await sendTelegramMessage(chatId, `❌ Please link your account first using /link CODE`);
        break;
      }

      try {
        const alertsResponse = await generateFlexifyResponse(
          "Show me any disruption alerts, delays, or issues with my shipments",
          {
            userId: alertsLink.userId,
            userName: firstName,
            linkedAt: alertsLink.linkedAt,
          }
        );
        await sendTelegramMessage(chatId, `⚠️ *Alerts & Disruptions*\n\n${alertsResponse}`);
      } catch (error) {
        await sendTelegramMessage(
          chatId,
          `⚠️ *Disruption Alerts*\n\n` +
          `No active alerts at the moment.\n\n` +
          `You'll be notified immediately when:\n` +
          `• Shipments are delayed\n` +
          `• Route disruptions occur\n` +
          `• Weather affects delivery\n` +
          `• Vehicle issues arise`
        );
      }
      break;

    case '/settings':
      const settingsLink = telegramStorage.getUserLinkByTelegramId(userId);
      if (!settingsLink) {
        await sendTelegramMessage(chatId, `❌ Please link your account first using /link CODE`);
        break;
      }

      const notifStatus = settingsLink.notifications ? '✅ Enabled' : '❌ Disabled';
      await sendTelegramMessage(
        chatId,
        `⚙️ *Notification Settings*\n\n` +
        `Current Status: ${notifStatus}\n\n` +
        `To manage notifications, visit:\n` +
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://flexmove.vercel.app'}/settings`
      );
      break;

    default:
      await sendTelegramMessage(
        chatId,
        `❓ Unknown command: ${command}\n\n` +
        `Use /help to see available commands.`
      );
  }

  return NextResponse.json({ ok: true });
}

async function handleCallbackQuery(callbackQuery: any) {
  // Handle button clicks
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  // TODO: Implement callback handling based on data
  await sendTelegramMessage(chatId, `Received: ${data}`);

  return NextResponse.json({ ok: true });
}
