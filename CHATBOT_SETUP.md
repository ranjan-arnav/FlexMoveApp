# 🤖 FlexMove AI Chatbot Setup Guide

This guide will help you set up the AI-powered chatbot feature in FlexMove using Google Gemini API.

## Features

✨ **What the Chatbot Can Do:**

- 📦 Track shipments and check their status
- 🚨 Monitor disruption alerts and get solutions
- 📊 Provide analytics and performance metrics
- 🏢 Answer questions about customers, transporters, and suppliers
- 🌱 Offer sustainability and carbon footprint insights
- 💰 Explain costs, routes, and delivery estimates
- 🧠 Access all demo data stored in browser localStorage
- 💬 Maintain chat history across sessions

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Google Gemini API Key** (free tier available)

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy your API key (it looks like: `AIzaSyC...`)

## Step 2: Configure Environment Variables

1. In the root of your FlexMove project, you should see a `.env.local` file
2. Open `.env.local` and add your API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

**Example:**
```env
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
```

⚠️ **Important:** Never commit your `.env.local` file to Git! It's already in `.gitignore`.

## Step 3: Install Dependencies

Run the following command in your terminal:

```bash
npm install
```

This will install the `@google/generative-ai` package and all other dependencies.

## Step 4: Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test the Chatbot

1. **Login** to any role (Supplier/Transporter/Customer)
2. Look for the **floating chatbot button** in the bottom-right corner (blue/purple gradient with a message icon)
3. Click to open the chatbot
4. Try asking questions like:
   - "Show me active shipments"
   - "Are there any disruptions?"
   - "What's my carbon footprint?"
   - "Track shipment SH001"
   - "Who are my transporters?"

## How It Works

### On-Device Storage

The chatbot uses **localStorage** to store all demo data:

- **Shipments** - All shipment information
- **Disruptions** - Active alerts and issues
- **Customers** - Customer data
- **Transporters** - Transporter profiles
- **Suppliers** - Supplier information
- **Analytics** - Performance metrics
- **Chat History** - Your conversation with the AI

### AI Context

When you ask a question, the chatbot:

1. Retrieves all relevant data from localStorage
2. Formats it as context for Gemini
3. Sends your question + context to the API
4. Returns an intelligent, context-aware response

### Features in Action

**🎯 Smart Suggestions**
- Quick action buttons appear when starting a new chat
- "Show active shipments", "Any disruptions?", etc.

**💾 Chat History**
- All conversations are saved in localStorage
- Persists across browser refreshes
- Clear history anytime with the trash icon

**🔄 Real-time Data Access**
- Chatbot sees all shipments you create
- Accesses disruption alerts as they occur
- Uses your current role context

**📱 Responsive Design**
- Minimize/maximize the chat window
- Mobile-friendly interface
- Smooth animations

## Troubleshooting

### Issue: "I'm having trouble connecting right now"

**Solution:** 
- Make sure your API key is correctly set in `.env.local`
- Restart the development server after adding the API key
- Check that your API key is valid and not expired

### Issue: Chatbot button doesn't appear

**Solution:**
- Make sure you're logged in (not on the login screen)
- Check browser console for errors
- Refresh the page

### Issue: "Cannot find module @google/generative-ai"

**Solution:**
```bash
npm install @google/generative-ai
```

### Issue: Chat responses are slow

**Solution:**
- This is normal for the free tier of Gemini API
- Consider upgrading to a paid plan for faster responses
- The model `gemini-2.0-flash-exp` is optimized for speed

## API Usage & Limits

**Free Tier Limits (Google Gemini):**
- 60 requests per minute
- 1,500 requests per day
- Suitable for development and demo purposes

**Rate Limiting:**
- If you hit the limit, wait a minute and try again
- The chatbot will show an error message

## Security Notes

🔒 **API Key Security:**
- Never share your API key publicly
- Don't commit `.env.local` to version control
- Use environment variables for production deployments
- Consider using API key restrictions in Google Cloud Console

## Customization

### Change the AI Model

Edit `lib/gemini.ts`:

```typescript
export const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp", // Change this
  generationConfig: {
    temperature: 0.9, // Adjust creativity (0-1)
    maxOutputTokens: 2048, // Max response length
  },
});
```

### Modify System Context

Edit `lib/storage.ts` in the `getContextForGemini()` function to:
- Add more data to context
- Change AI personality
- Add custom instructions

### Customize UI

Edit `components/chatbot.tsx`:
- Change colors and styling
- Modify button position
- Add custom features

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Add environment variable in your hosting dashboard:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
   ```

2. Ensure `.env.local` is in `.gitignore`

3. Consider using API key restrictions:
   - Restrict by HTTP referrer (your domain only)
   - Restrict by API (Generative Language API only)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your API key is correct
3. Ensure you're using Node.js v18+
4. Try clearing localStorage: `localStorage.clear()`
5. Restart the development server

## Demo Data

The chatbot has access to all this demo data:

- **3 Shipments** (SH001, SH002, SH003)
- **2 Disruptions** (Weather, Traffic)
- **4 Customers** (TechCorp, Global Retail, etc.)
- **3 Transporters** (FastTrack, Ocean Express, Green Transport)
- **2 Suppliers** with ratings and specialties
- **Analytics** (metrics, carbon footprint, costs)

Ask questions about any of these to see the AI in action!

## Next Steps

🚀 **Enhance Your Chatbot:**
- Add voice input/output
- Integrate with real backend API
- Add file upload for documents
- Create chat categories/tags
- Export chat history
- Multi-language support

---

**Powered by Google Gemini 2.0 Flash** 🌟

Enjoy your AI-powered supply chain assistant!
