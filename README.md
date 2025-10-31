# FlexMove - AI-Powered Supply Chain Management Platform 🚀

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-orange)](https://ai.google.dev/)

A comprehensive, modern supply chain management platform connecting **Suppliers**, **Transporters**, and **Customers** with real-time tracking, analytics, and AI-powered assistance.

---

## ✨ Key Features

### 🎭 **Multi-Role Dashboard System**
- **Supplier Dashboard** - Create shipments, manage disruptions, optimize routes
- **Transporter Dashboard** - Handle requests, track fleet, monitor performance
- **Customer Dashboard** - Track orders, rate suppliers, monitor deliveries

### 🤖 **AI-Powered Chatbot** ⭐ NEW!
- **Google Gemini 2.0 Flash** integration
- Context-aware responses based on real data
- Access to shipments, disruptions, analytics, and more
- On-device storage with localStorage
- Persistent chat history

### 📦 **Shipment Management**
- Multi-step shipment creation wizard
- Real-time tracking with interactive maps
- Status updates (Pending → In Transit → Delivered)
- ETA predictions and cost calculations
- Carbon footprint monitoring

### 🚨 **Disruption Management**
- Real-time alerts (weather, traffic, mechanical)
- AI-suggested solutions
- Alternative route recommendations
- Risk assessment and severity levels
- Customer notification system

### 📊 **Analytics & Insights**
- Performance metrics (on-time delivery, efficiency)
- Cost analysis and savings tracking
- Carbon footprint and sustainability metrics
- Industry benchmark comparisons
- Interactive charts and graphs

### 🌱 **Sustainability Focus**
- Carbon emission tracking
- EV fleet adoption monitoring
- Eco-friendly route optimization
- Green certification tracking
- Environmental impact reports

### 🗺️ **Interactive Maps**
- Live vehicle tracking
- Route visualization
- Multiple route comparison
- Weather conditions overlay
- Distance and ETA calculations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **pnpm**
- **Google Gemini API Key** (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OmRajonweb/FlexMove.git
   cd FlexMove
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   
   Edit `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to: http://localhost:3000

---

## 📚 Documentation

- **[Chatbot Setup Guide](CHATBOT_SETUP.md)** - Detailed setup instructions
- **[Implementation Details](CHATBOT_IMPLEMENTATION.md)** - Technical overview
- **[Example Questions](CHATBOT_EXAMPLES.md)** - 100+ chatbot examples

---

## 🎯 Usage

### Login Options

**Demo Login** - Try any role instantly:
- Click "Demo as Supplier"
- Click "Demo as Transporter"
- Click "Demo as Customer"

**Or** Create an account with role selection

### Using the AI Chatbot

1. **Login** to any role
2. Click the **floating chat button** (bottom-right corner)
3. Ask questions like:
   - "Show me active shipments"
   - "Any disruptions?"
   - "What's my carbon footprint?"
   - "Track shipment SH001"

See [CHATBOT_EXAMPLES.md](CHATBOT_EXAMPLES.md) for 100+ example questions!

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn UI** - Component library
- **Framer Motion** - Animations

### AI & Data
- **Google Gemini 2.0 Flash** - AI chatbot
- **localStorage** - On-device data storage
- **Recharts** - Data visualization

### Maps & Geolocation
- **Leaflet** - Interactive maps
- **Mapbox GL** - Map tiles
- **React Leaflet** - React integration

### UI Components
- **Radix UI** - Accessible primitives
- **Lucide React** - Icons
- **Sonner** - Toast notifications

---

## 📁 Project Structure

```
FlexMove/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main app (5300+ lines!)
├── components/
│   ├── ui/                      # Shadcn UI components (48 files)
│   ├── chatbot.tsx              # AI chatbot ⭐ NEW
│   ├── analytics-charts.tsx    # Analytics dashboard
│   ├── create-shipment-form.tsx # Shipment wizard
│   ├── interactive-map.tsx     # Map component
│   └── theme-provider.tsx      # Theme management
├── lib/
│   ├── gemini.ts                # Gemini AI integration ⭐ NEW
│   ├── storage.ts               # Data storage ⭐ NEW
│   └── utils.ts                 # Utilities
├── hooks/
│   ├── use-mobile.ts            # Mobile detection
│   └── use-toast.ts             # Toast notifications
├── public/
│   └── images/                  # Static assets
├── .env.local                   # Environment config ⭐ NEW
└── [config files]               # Next.js, TS, Tailwind configs
```

---

## 🎨 Features Breakdown

### For Suppliers
- ✅ Create and manage shipments
- ✅ Select customers and transporters
- ✅ Choose optimal routes
- ✅ Monitor disruptions in real-time
- ✅ Reroute shipments when needed
- ✅ Track performance metrics
- ✅ Analyze costs and savings

### For Transporters
- ✅ Accept/decline shipment requests
- ✅ Manage fleet operations
- ✅ Update shipment statuses
- ✅ Track revenue and profitability
- ✅ Monitor vehicle utilization
- ✅ View customer ratings

### For Customers
- ✅ Track active orders
- ✅ Browse and select suppliers
- ✅ Place new orders
- ✅ Rate delivery experiences
- ✅ Monitor eco-friendly choices
- ✅ View cost savings

---

## 🤖 AI Chatbot Features

### What It Can Do
- 📦 Track shipments and check statuses
- 🚨 Monitor disruption alerts
- 📊 Provide analytics and metrics
- 🏢 Information about customers/transporters/suppliers
- 🌱 Sustainability insights
- 💰 Cost analysis and optimization
- 🗺️ Route recommendations

### Data Access
- All shipment details
- Disruption alerts
- Customer information
- Transporter profiles
- Supplier data
- Analytics and KPIs
- User role context

### Smart Features
- Context-aware responses
- Persistent chat history
- Quick suggestion buttons
- Real-time data sync
- Minimizable interface

---

## 📊 Demo Data

The app includes comprehensive demo data:

- **3 Active Shipments** with different statuses
- **2 Disruptions** (weather, traffic)
- **4 Customers** across different locations
- **3 Transporters** with ratings and capabilities
- **2 Suppliers** with specialties
- **Full Analytics** (metrics, costs, carbon data)

---

## 🔐 Security

- ✅ API keys stored in `.env.local` (not committed)
- ✅ Environment variables for sensitive data
- ✅ Client-side storage for demo data only
- ✅ `.gitignore` configured properly

---

## 🐛 Known Issues

- None currently! All features working as expected.
- If you encounter issues, check [CHATBOT_SETUP.md](CHATBOT_SETUP.md)

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_key
   ```
4. Deploy!

### Other Platforms

- Netlify
- AWS Amplify
- Railway
- Render

All support Next.js and environment variables.

---

## 📈 Performance

- ⚡ Fast page loads with Next.js SSR
- 🎨 Smooth animations with Framer Motion
- 💾 Efficient local storage
- 🚀 Optimized bundle size
- 📱 Fully responsive design

---

## 🎯 Future Enhancements

Potential additions:

- 🔊 Voice input/output for chatbot
- 📄 Document upload and analysis
- 🔔 Push notifications
- 📧 Email integration
- 🌐 Multi-language support
- 📱 Mobile app (React Native)
- 🔗 Blockchain for transparency
- 🤝 Real-time collaboration
- 📊 Advanced ML predictions
- 🎥 Video calling

---

## 🤝 Contributing

This is a demo project. Feel free to fork and customize!

---

## 📄 License

MIT License - Feel free to use this project for learning and development.

---

## 👨‍💻 Developer

Created by **Om Rajon**

---

## 🙏 Acknowledgments

- **Google Gemini** for AI capabilities
- **Vercel** for Next.js framework
- **Shadcn** for beautiful UI components
- **OpenStreetMap** for map data

---

## 📞 Support

For help with the chatbot:
- Read [CHATBOT_SETUP.md](CHATBOT_SETUP.md)
- Check [CHATBOT_EXAMPLES.md](CHATBOT_EXAMPLES.md)
- Review browser console for errors

---

## ⭐ Star This Repo!

If you find this project useful, please give it a star! ⭐

---

**Built with ❤️ using Next.js, React, TypeScript, and Google Gemini AI**

🚀 **Happy Supply Chain Managing!**
