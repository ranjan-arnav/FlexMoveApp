// On-device storage using localStorage
export interface StorageData {
  shipments: any[];
  disruptions: any[];
  customers: any[];
  transporters: any[];
  suppliers: any[];
  analytics: any;
  userRole: string | null;
  chatHistory: ChatMessage[];
  conversationContext: ConversationContext;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: any; // Store context like shipment IDs, entities mentioned
}

export interface ConversationContext {
  lastShipmentId?: string;
  lastCustomerId?: string;
  lastTransporterId?: string;
  lastSupplierId?: string;
  lastDisruptionId?: string;
  lastTopic?: string;
  entities: string[]; // Track all mentioned entities
}

const STORAGE_KEY = "flexmove_data";

export const storage = {
  // Get all data
  getAll(): StorageData {
    if (typeof window === "undefined") return this.getDefaultData();
    
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return this.getDefaultData();
    
    try {
      return JSON.parse(data);
    } catch {
      return this.getDefaultData();
    }
  },

  // Save all data
  saveAll(data: StorageData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Get specific key
  get<K extends keyof StorageData>(key: K): StorageData[K] {
    const data = this.getAll();
    return data[key];
  },

  // Update specific key
  update<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
    const data = this.getAll();
    data[key] = value;
    this.saveAll(data);
  },

  // Add shipment
  addShipment(shipment: any): void {
    const data = this.getAll();
    data.shipments.push(shipment);
    this.saveAll(data);
  },

  // Add disruption
  addDisruption(disruption: any): void {
    const data = this.getAll();
    data.disruptions.push(disruption);
    this.saveAll(data);
  },

  // Add chat message
  addChatMessage(message: ChatMessage): void {
    const data = this.getAll();
    data.chatHistory.push(message);
    this.saveAll(data);
  },

  // Get chat history
  getChatHistory(): ChatMessage[] {
    return this.get("chatHistory");
  },

  // Clear chat history
  clearChatHistory(): void {
    this.update("chatHistory", []);
    this.update("conversationContext", {
      entities: []
    });
  },

  // Update conversation context
  updateConversationContext(update: Partial<ConversationContext>): void {
    const current = this.get("conversationContext");
    this.update("conversationContext", { ...current, ...update });
  },

  // Get conversation context
  getConversationContext(): ConversationContext {
    return this.get("conversationContext");
  },

  // Extract entities from message
  extractEntities(message: string): string[] {
    const entities: string[] = [];
    const data = this.getAll();
    
    // Extract shipment IDs
    const shipmentMatch = message.match(/SH\d+/gi);
    if (shipmentMatch) entities.push(...shipmentMatch);
    
    // Extract customer names
    data.customers.forEach(c => {
      if (message.toLowerCase().includes(c.name.toLowerCase())) {
        entities.push(c.id);
      }
    });
    
    // Extract transporter names
    data.transporters.forEach(t => {
      if (message.toLowerCase().includes(t.name.toLowerCase())) {
        entities.push(t.id);
      }
    });
    
    return entities;
  },

  // Get context for Gemini
  getContextForGemini(userRole: string | null): string {
    const data = this.getAll();
    const conversationCtx = this.get("conversationContext");
    const recentHistory = data.chatHistory.slice(-5); // Last 5 messages
    
    return `
You are FlexMove AI Assistant, a helpful chatbot for a supply chain management platform.

Current User Role: ${userRole || "Not logged in"}

=== CONVERSATION CONTEXT ===
${conversationCtx.lastShipmentId ? `Last Discussed Shipment: ${conversationCtx.lastShipmentId}` : ''}
${conversationCtx.lastCustomerId ? `Last Discussed Customer: ${conversationCtx.lastCustomerId}` : ''}
${conversationCtx.lastTransporterId ? `Last Discussed Transporter: ${conversationCtx.lastTransporterId}` : ''}
${conversationCtx.lastTopic ? `Last Topic: ${conversationCtx.lastTopic}` : ''}
Recently Mentioned: ${conversationCtx.entities.join(', ') || 'None'}

Recent Conversation:
${recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

=== SYSTEM DATA ===

SHIPMENTS (${data.shipments.length} total):
${JSON.stringify(data.shipments, null, 2)}

DISRUPTIONS (${data.disruptions.length} total):
${JSON.stringify(data.disruptions, null, 2)}

CUSTOMERS:
${JSON.stringify(data.customers, null, 2)}

TRANSPORTERS:
${JSON.stringify(data.transporters, null, 2)}

SUPPLIERS:
${JSON.stringify(data.suppliers, null, 2)}

ANALYTICS DATA:
${JSON.stringify(data.analytics, null, 2)}

=== CAPABILITIES ===
You can help users with:
- Tracking shipments and their status
- Checking disruption alerts and suggesting solutions
- Providing analytics and performance metrics
- Answering questions about customers, transporters, and suppliers
- Offering insights on carbon footprint and sustainability
- Explaining costs, routes, and delivery estimates
- General supply chain management guidance

=== INSTRUCTIONS ===
- Be conversational and friendly
- Use the data above to answer questions accurately
- **IMPORTANT**: Remember context from recent conversation. If user asks "what about delivery?" after discussing SH001, assume they mean SH001's delivery
- If asked about specific shipments, use the IDs and details provided
- When user refers to "it", "that", "the shipment" etc., use the conversation context to determine what they're referring to
- Provide actionable insights when possible
- If you don't have specific data, be honest but helpful
- Format responses clearly with bullet points or lists when appropriate
- Track entities mentioned (shipment IDs, customer names, etc.) for context continuity
`;
  },

  // Initialize with default demo data
  getDefaultData(): StorageData {
    return {
      shipments: [
        {
          id: "SH001",
          customer: "TechCorp Inc.",
          transporter: "FastTrack Logistics",
          mode: "truck",
          route: "New York → Los Angeles",
          status: "in-transit",
          eta: "2 days",
          cost: 1200,
          carbonFootprint: 85,
          riskLevel: "low",
          disruptionProbability: 5,
          origin: "New York, NY",
          destination: "Los Angeles, CA",
          weight: 500,
          priority: "high",
          progress: 65
        },
        {
          id: "SH002",
          customer: "Global Retail",
          transporter: "Ocean Express",
          mode: "ship",
          route: "Los Angeles → Shanghai",
          status: "delivered",
          eta: "Completed",
          cost: 3500,
          carbonFootprint: 220,
          riskLevel: "medium",
          disruptionProbability: 15,
          origin: "Los Angeles, CA",
          destination: "Shanghai, China",
          weight: 2000,
          priority: "medium",
          progress: 100
        },
        {
          id: "SH003",
          customer: "Manufacturing Co.",
          transporter: "Green Transport",
          mode: "ev",
          route: "Chicago → Miami",
          status: "pending",
          eta: "5 days",
          cost: 800,
          carbonFootprint: 45,
          riskLevel: "low",
          disruptionProbability: 8,
          origin: "Chicago, IL",
          destination: "Miami, FL",
          weight: 350,
          priority: "low",
          progress: 10
        },
        {
          id: "SH004",
          customer: "Global Retail",
          transporter: "Ocean Express",
          mode: "ship",
          route: "Chicago → Miami",
          status: "dispatched",
          eta: "3 days",
          cost: 2450,
          carbonFootprint: 120,
          riskLevel: "low",
          disruptionProbability: 10,
          origin: "Chicago, IL",
          destination: "Miami, FL",
          weight: 1200,
          priority: "medium",
          progress: 25,
          vehicle: "SHP-002",
          lastUpdate: "6 hours ago"
        },
        {
          id: "SH007",
          customer: "Manufacturing Co.",
          transporter: "Green Transport",
          mode: "truck",
          route: "Seattle → Denver",
          status: "preparing",
          eta: "5 days",
          cost: 950,
          carbonFootprint: 65,
          riskLevel: "low",
          disruptionProbability: 5,
          origin: "Seattle, WA",
          destination: "Denver, CO",
          weight: 450,
          priority: "low",
          progress: 10,
          vehicle: "TRK-003",
          lastUpdate: "1 day ago"
        }
      ],
      disruptions: [
        {
          id: "DISP-001",
          shipmentId: "SH001",
          type: "Severe Weather Alert",
          description: "Heavy snowstorm causing delays on I-80 in Wyoming",
          delay: "12-24 hours",
          status: "active",
          severity: "high",
          location: "I-80, WY",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          suggestions: ["Reroute via I-40", "Delay delivery", "Contact customer"]
        },
        {
          id: "DISP-002",
          shipmentId: "SH001",
          type: "Traffic Congestion",
          description: "Heavy traffic on Route 66",
          delay: "2-4 hours",
          status: "monitoring",
          severity: "medium",
          location: "Route 66, AZ",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          suggestions: ["Monitor situation", "Use alternate highway"]
        }
      ],
      customers: [
        { id: "C001", name: "TechCorp Inc.", location: "New York, NY", email: "contact@techcorp.com", phone: "+1-555-0101", activeShipments: 5 },
        { id: "C002", name: "Global Retail", location: "Los Angeles, CA", email: "orders@globalretail.com", phone: "+1-555-0102", activeShipments: 3 },
        { id: "C003", name: "Manufacturing Co.", location: "Chicago, IL", email: "logistics@mfgco.com", phone: "+1-555-0103", activeShipments: 2 },
        { id: "C004", name: "Logistics Plus", location: "Miami, FL", email: "info@logisticsplus.com", phone: "+1-555-0104", activeShipments: 4 }
      ],
      transporters: [
        {
          id: "T001",
          name: "FastTrack Logistics",
          rating: 4.8,
          modes: ["truck", "air"],
          evFleet: true,
          activeVehicles: 45,
          totalDeliveries: 1247,
          onTimeRate: 95
        },
        {
          id: "T002",
          name: "Ocean Express",
          rating: 4.6,
          modes: ["ship", "truck"],
          evFleet: false,
          activeVehicles: 12,
          totalDeliveries: 892,
          onTimeRate: 92
        },
        {
          id: "T003",
          name: "Green Transport",
          rating: 4.9,
          modes: ["truck", "ev"],
          evFleet: true,
          activeVehicles: 38,
          totalDeliveries: 634,
          onTimeRate: 98
        }
      ],
      suppliers: [
        {
          id: "S001",
          name: "TechCorp Inc.",
          rating: 4.8,
          specialties: ["Electronics", "Software", "Hardware"],
          location: "New York, NY",
          deliveryTime: "2-3 days",
          minOrder: 500,
          ecoFriendly: true,
          certifications: ["ISO 9001", "Green Certified"],
          totalOrders: 1247,
          onTimeRate: 96
        },
        {
          id: "S002",
          name: "Global Retail",
          rating: 4.6,
          specialties: ["Consumer Goods", "Fashion", "Home & Garden"],
          location: "Los Angeles, CA",
          deliveryTime: "3-5 days",
          minOrder: 300,
          ecoFriendly: false,
          certifications: ["ISO 9001"],
          totalOrders: 892,
          onTimeRate: 92
        }
      ],
      analytics: {
        totalShipments: 24,
        onTimeDeliveryRate: 94.2,
        carbonFootprint: 2.4,
        costSavings: 12450,
        evAdoption: 25,
        routeEfficiency: 87,
        customerSatisfaction: 4.7
      },
      userRole: null,
      chatHistory: [],
      conversationContext: {
        entities: []
      }
    };
  },

  // Clear all data
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },

  // Initialize storage with demo data if empty
  initialize(): void {
    if (typeof window === "undefined") return;
    
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      this.saveAll(this.getDefaultData());
    }
  }
};
