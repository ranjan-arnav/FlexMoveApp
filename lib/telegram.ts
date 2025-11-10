// Telegram Bot Helper Functions
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TelegramDataService } from "./telegram-data";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

export interface LinkingCode {
  code: string;
  userId: string;
  telegramId?: number;
  expiresAt: Date;
  used: boolean;
}

// Send message to Telegram
export async function sendTelegramMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

// Send notification with inline keyboard
export async function sendNotificationWithActions(
  chatId: number,
  text: string,
  buttons: Array<{ text: string; url?: string; callback_data?: string }>
) {
  try {
    const keyboard = {
      inline_keyboard: [buttons.map(btn => ({
        text: btn.text,
        url: btn.url,
        callback_data: btn.callback_data,
      }))],
    };

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Generate AI response using Gemini with full platform data access
export async function generateFlexifyResponse(userMessage: string, context?: any) {
  try {
    // Use NEXT_PUBLIC_GEMINI_API_KEY since it's defined in .env.local
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('Gemini API key not found');
      return "I'm currently unable to process your request. Please check back later.";
    }

    // Get real platform data
    const userId = context?.userId || 'all';
    const platformData = TelegramDataService.formatDataForAI(userId);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
      }
    });

    const systemPrompt = `You are Flexify, the intelligent AI assistant for FlexMove - India's leading supply chain and logistics management platform.

YOU HAVE FULL ACCESS TO THE FOLLOWING REAL-TIME DATA:

${platformData}

Your Capabilities:
✅ Access to ALL shipments, transporters, customers, and analytics
✅ Real-time tracking information for every shipment
✅ Complete transporter directory with ratings, locations, and availability
✅ Analytics and performance metrics
✅ Carbon footprint and sustainability data

Communication Style:
- Professional yet conversational
- Use emojis for visual clarity (📦 🚚 ⚠️ ✅ 📊 ⭐)
- Provide SPECIFIC data from the platform (IDs, names, numbers)
- When asked about shipments, quote the actual shipment IDs and details
- When asked about transporters, provide real transporter names and info
- Always reference actual data from above, never make up information

Current User: ${context?.userName || 'User'} (${userId})
User linked since: ${context?.linkedAt ? new Date(context.linkedAt).toLocaleDateString() : 'Recently'}

IMPORTANT: Use the data above to answer questions. You have complete access to all platform information.`;

    const prompt = `${systemPrompt}\n\nUser Question: ${userMessage}\n\nFlexify:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Flexify AI response generated successfully with platform data');
    return text;
  } catch (error: any) {
    console.error('❌ Error generating AI response:', error.message || error);
    return "I'm having trouble connecting to my AI service right now. Please try asking again in a moment, or use the web app at " + (process.env.NEXT_PUBLIC_APP_URL || 'https://flexmove.vercel.app');
  }
}

// Set webhook for Telegram bot
export async function setTelegramWebhook(webhookUrl: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error setting webhook:', error);
    throw error;
  }
}

// Delete webhook (for polling mode)
export async function deleteWebhook() {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting webhook:', error);
    throw error;
  }
}

// Get bot info
export async function getBotInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    return await response.json();
  } catch (error) {
    console.error('Error getting bot info:', error);
    throw error;
  }
}

// Format shipment info for Telegram
export function formatShipmentInfo(shipment: any): string {
  return `
📦 *Shipment ${shipment.id}*

🏢 Customer: ${shipment.customer}
🚚 Transporter: ${shipment.transporter}
📍 Route: ${shipment.route}
📊 Status: ${shipment.status.replace('-', ' ').toUpperCase()}
⏰ ETA: ${shipment.eta}
💰 Cost: ₹${shipment.cost.toLocaleString('en-IN')}
🌱 Carbon: ${shipment.carbonFootprint}kg CO₂
${shipment.progress ? `\n📈 Progress: ${shipment.progress}%` : ''}
  `.trim();
}

// Format disruption alert for Telegram
export function formatDisruptionAlert(disruption: any): string {
  const severityEmoji = {
    low: '⚠️',
    medium: '🔶',
    high: '🚨',
  };

  return `
${severityEmoji[disruption.severity as keyof typeof severityEmoji]} *${disruption.type}*

📦 Shipment: ${disruption.shipmentId}
📍 Location: ${disruption.location}
⏱️ Delay: ${disruption.delay}
⚡ Status: ${disruption.status.toUpperCase()}

${disruption.description}

*Suggested Actions:*
${disruption.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}
  `.trim();
}
