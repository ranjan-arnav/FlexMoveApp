// Telegram Bot Data Service - Provides access to application data
// This service gives the Telegram bot full access to shipments, transporters, and other platform data

export interface Shipment {
  id: string;
  from: string;
  to: string;
  status: string;
  progress: number;
  eta: string;
  lastUpdate: string;
  transporter?: string;
  vehicleType?: string;
  cargoType?: string;
  weight?: string;
}

export interface Transporter {
  id: string;
  name: string;
  rating: number;
  vehicleTypes: string[];
  location: string;
  available: boolean;
  activeShipments: number;
}

export interface Customer {
  id: string;
  name: string;
  location: string;
  activeOrders: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  productsOffered: string[];
  verified: boolean;
  activeDeals: number;
}

// Mock data service - Replace with real database queries in production
export class TelegramDataService {
  
  // Get all active shipments for a user
  static getShipments(userId: string): Shipment[] {
    // In production, query your database based on userId
    return [
      {
        id: "SH001",
        from: "Delhi",
        to: "Mumbai",
        status: "In Transit",
        progress: 65,
        eta: "18 hours",
        lastUpdate: "2 hours ago",
        transporter: "Swift Logistics",
        vehicleType: "20ft Container Truck",
        cargoType: "Electronics",
        weight: "15 tons"
      },
      {
        id: "SH002",
        from: "Mumbai",
        to: "Pune",
        status: "Delivered",
        progress: 100,
        eta: "Completed",
        lastUpdate: "1 day ago",
        transporter: "Express Cargo",
        vehicleType: "10ft Truck",
        cargoType: "Consumer Goods",
        weight: "8 tons"
      },
      {
        id: "SH003",
        from: "Kolkata",
        to: "Chennai",
        status: "In Transit",
        progress: 45,
        eta: "2 days",
        lastUpdate: "5 hours ago",
        transporter: "Coastal Freight",
        vehicleType: "Ship Container",
        cargoType: "Industrial Equipment",
        weight: "25 tons"
      },
      {
        id: "SH004",
        from: "Bangalore",
        to: "Hyderabad",
        status: "Dispatched",
        progress: 25,
        eta: "3 days",
        lastUpdate: "6 hours ago",
        transporter: "South Express",
        vehicleType: "15ft Truck",
        cargoType: "Textiles",
        weight: "12 tons"
      },
      {
        id: "SH005",
        from: "Chennai",
        to: "Bangalore",
        status: "In Transit",
        progress: 80,
        eta: "8 hours",
        lastUpdate: "1 hour ago",
        transporter: "Metro Logistics",
        vehicleType: "EV Truck",
        cargoType: "Perishables",
        weight: "5 tons"
      },
      {
        id: "SH006",
        from: "Pune",
        to: "Goa",
        status: "Preparing",
        progress: 5,
        eta: "4 days",
        lastUpdate: "3 hours ago",
        transporter: "Coastal Express",
        vehicleType: "Mini Truck",
        cargoType: "Food Products",
        weight: "3 tons"
      },
      {
        id: "SH007",
        from: "Ahmedabad",
        to: "Jaipur",
        status: "Preparing",
        progress: 10,
        eta: "5 days",
        lastUpdate: "1 day ago",
        transporter: "Gujarat Transport",
        vehicleType: "20ft Truck",
        cargoType: "Construction Materials",
        weight: "18 tons"
      }
    ];
  }

  // Get shipment by ID
  static getShipmentById(shipmentId: string): Shipment | null {
    const shipments = this.getShipments("all");
    return shipments.find(s => s.id.toLowerCase() === shipmentId.toLowerCase()) || null;
  }

  // Get all available transporters
  static getTransporters(): Transporter[] {
    return [
      {
        id: "TR001",
        name: "Swift Logistics",
        rating: 4.8,
        vehicleTypes: ["20ft Truck", "40ft Container", "Refrigerated Truck"],
        location: "Delhi NCR",
        available: true,
        activeShipments: 12
      },
      {
        id: "TR002",
        name: "Express Cargo",
        rating: 4.6,
        vehicleTypes: ["10ft Truck", "15ft Truck", "Mini Truck"],
        location: "Mumbai",
        available: true,
        activeShipments: 8
      },
      {
        id: "TR003",
        name: "Coastal Freight",
        rating: 4.9,
        vehicleTypes: ["Ship Container", "Bulk Carrier"],
        location: "Kolkata Port",
        available: true,
        activeShipments: 5
      },
      {
        id: "TR004",
        name: "South Express",
        rating: 4.7,
        vehicleTypes: ["15ft Truck", "20ft Truck", "EV Truck"],
        location: "Bangalore",
        available: true,
        activeShipments: 15
      },
      {
        id: "TR005",
        name: "Metro Logistics",
        rating: 4.5,
        vehicleTypes: ["EV Truck", "Refrigerated Truck", "Mini Truck"],
        location: "Chennai",
        available: true,
        activeShipments: 10
      },
      {
        id: "TR006",
        name: "Coastal Express",
        rating: 4.4,
        vehicleTypes: ["Mini Truck", "10ft Truck"],
        location: "Pune",
        available: false,
        activeShipments: 20
      },
      {
        id: "TR007",
        name: "Gujarat Transport",
        rating: 4.6,
        vehicleTypes: ["20ft Truck", "40ft Container", "Flatbed"],
        location: "Ahmedabad",
        available: true,
        activeShipments: 7
      },
      {
        id: "TR008",
        name: "North Cargo Services",
        rating: 4.8,
        vehicleTypes: ["Refrigerated Truck", "20ft Truck", "EV Truck"],
        location: "Jaipur",
        available: true,
        activeShipments: 9
      },
      {
        id: "TR009",
        name: "East India Freight",
        rating: 4.3,
        vehicleTypes: ["40ft Container", "Bulk Carrier"],
        location: "Bhubaneswar",
        available: true,
        activeShipments: 6
      },
      {
        id: "TR010",
        name: "Green Fleet Logistics",
        rating: 4.9,
        vehicleTypes: ["EV Truck", "Hybrid Truck", "Mini EV"],
        location: "Hyderabad",
        available: true,
        activeShipments: 11
      }
    ];
  }

  // Get transporter by ID
  static getTransporterById(transporterId: string): Transporter | null {
    const transporters = this.getTransporters();
    return transporters.find(t => t.id.toLowerCase() === transporterId.toLowerCase()) || null;
  }

  // Search transporters by filters
  static searchTransporters(filters: {
    location?: string;
    vehicleType?: string;
    minRating?: number;
    availableOnly?: boolean;
  }): Transporter[] {
    let transporters = this.getTransporters();

    if (filters.location) {
      transporters = transporters.filter(t => 
        t.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.vehicleType) {
      transporters = transporters.filter(t =>
        t.vehicleTypes.some(v => 
          v.toLowerCase().includes(filters.vehicleType!.toLowerCase())
        )
      );
    }

    if (filters.minRating) {
      transporters = transporters.filter(t => t.rating >= filters.minRating!);
    }

    if (filters.availableOnly) {
      transporters = transporters.filter(t => t.available);
    }

    return transporters;
  }

  // Get customers
  static getCustomers(): Customer[] {
    return [
      { id: "CUS001", name: "TechMart India", location: "Mumbai", activeOrders: 5 },
      { id: "CUS002", name: "Fashion Hub", location: "Delhi", activeOrders: 3 },
      { id: "CUS003", name: "Electronics Bazaar", location: "Bangalore", activeOrders: 7 },
      { id: "CUS004", name: "Food Wholesale Co", location: "Chennai", activeOrders: 4 },
      { id: "CUS005", name: "Auto Parts Ltd", location: "Pune", activeOrders: 2 }
    ];
  }

  // Get suppliers
  static getSuppliers(): Supplier[] {
    return [
      {
        id: "SUP001",
        name: "ElectroSource India",
        category: "Electronics & Components",
        location: "Mumbai",
        rating: 4.7,
        productsOffered: ["Semiconductors", "Circuit Boards", "LED Components", "Batteries"],
        verified: true,
        activeDeals: 12
      },
      {
        id: "SUP002",
        name: "Textile Masters Ltd",
        category: "Textiles & Fabrics",
        location: "Surat",
        rating: 4.8,
        productsOffered: ["Cotton Fabric", "Silk", "Polyester", "Denim"],
        verified: true,
        activeDeals: 8
      },
      {
        id: "SUP003",
        name: "Fresh Harvest Co",
        category: "Food & Perishables",
        location: "Pune",
        rating: 4.6,
        productsOffered: ["Fresh Produce", "Dairy Products", "Packaged Foods", "Organic Items"],
        verified: true,
        activeDeals: 15
      },
      {
        id: "SUP004",
        name: "AutoParts Pro",
        category: "Automotive Components",
        location: "Chennai",
        rating: 4.9,
        productsOffered: ["Engine Parts", "Brake Systems", "Electrical Components", "Tires"],
        verified: true,
        activeDeals: 10
      },
      {
        id: "SUP005",
        name: "Steel & Metal Works",
        category: "Raw Materials",
        location: "Jamshedpur",
        rating: 4.5,
        productsOffered: ["Steel Sheets", "Aluminum", "Copper Wire", "Metal Rods"],
        verified: true,
        activeDeals: 6
      },
      {
        id: "SUP006",
        name: "Pharma Source India",
        category: "Pharmaceuticals",
        location: "Hyderabad",
        rating: 4.8,
        productsOffered: ["Generic Medicines", "Active Ingredients", "Medical Supplies", "Lab Equipment"],
        verified: true,
        activeDeals: 9
      },
      {
        id: "SUP007",
        name: "Construction Materials Hub",
        category: "Building Materials",
        location: "Ahmedabad",
        rating: 4.4,
        productsOffered: ["Cement", "Bricks", "Steel Rods", "Tiles", "Paint"],
        verified: true,
        activeDeals: 11
      },
      {
        id: "SUP008",
        name: "GreenTech Supplies",
        category: "Sustainable Products",
        location: "Bangalore",
        rating: 4.9,
        productsOffered: ["Solar Panels", "EV Batteries", "Recycled Materials", "Eco Packaging"],
        verified: true,
        activeDeals: 14
      }
    ];
  }

  // Search suppliers by filters
  static searchSuppliers(filters: {
    category?: string;
    location?: string;
    minRating?: number;
    verifiedOnly?: boolean;
  }): Supplier[] {
    let suppliers = this.getSuppliers();

    if (filters.category) {
      suppliers = suppliers.filter(s =>
        s.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.location) {
      suppliers = suppliers.filter(s =>
        s.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.minRating) {
      suppliers = suppliers.filter(s => s.rating >= filters.minRating!);
    }

    if (filters.verifiedOnly) {
      suppliers = suppliers.filter(s => s.verified);
    }

    return suppliers;
  }

  // Get analytics data
  static getAnalytics(userId: string) {
    const shipments = this.getShipments(userId);
    const activeShipments = shipments.filter(s => s.status !== "Delivered");
    const completedShipments = shipments.filter(s => s.status === "Delivered");
    
    return {
      totalShipments: shipments.length,
      activeShipments: activeShipments.length,
      completedShipments: completedShipments.length,
      averageProgress: Math.round(
        shipments.reduce((acc, s) => acc + s.progress, 0) / shipments.length
      ),
      onTimeDeliveryRate: "94%",
      totalDistance: "12,450 km",
      carbonSaved: "245 kg CO2"
    };
  }

  // Format data for AI context
  static formatDataForAI(userId: string): string {
    const shipments = this.getShipments(userId);
    const transporters = this.getTransporters();
    const suppliers = this.getSuppliers();
    const customers = this.getCustomers();
    const analytics = this.getAnalytics(userId);

    return `
=== FLEXMOVE PLATFORM DATA ===

USER SHIPMENTS (Total: ${shipments.length}):
${shipments.map(s => `
• ${s.id}: ${s.from} → ${s.to}
  Status: ${s.status} (${s.progress}% complete)
  ETA: ${s.eta} | Transporter: ${s.transporter}
  Cargo: ${s.cargoType} (${s.weight})
  Vehicle: ${s.vehicleType}
  Last Update: ${s.lastUpdate}
`).join('\n')}

AVAILABLE TRANSPORTERS (Total: ${transporters.length}):
${transporters.map(t => `
• ${t.name} (${t.id})
  Rating: ${t.rating}⭐ | Location: ${t.location}
  Vehicles: ${t.vehicleTypes.join(', ')}
  Status: ${t.available ? 'Available ✅' : 'Busy ❌'}
  Active Shipments: ${t.activeShipments}
`).join('\n')}

AVAILABLE SUPPLIERS (Total: ${suppliers.length}):
${suppliers.map(s => `
• ${s.name} (${s.id})
  Category: ${s.category} | Location: ${s.location}
  Rating: ${s.rating}⭐ | Verified: ${s.verified ? '✅' : '❌'}
  Products: ${s.productsOffered.join(', ')}
  Active Deals: ${s.activeDeals}
`).join('\n')}

CUSTOMERS (Total: ${customers.length}):
${customers.map(c => `
• ${c.name} (${c.id})
  Location: ${c.location}
  Active Orders: ${c.activeOrders}
`).join('\n')}

ANALYTICS OVERVIEW:
• Total Shipments: ${analytics.totalShipments}
• Active: ${analytics.activeShipments} | Completed: ${analytics.completedShipments}
• Average Progress: ${analytics.averageProgress}%
• On-Time Delivery Rate: ${analytics.onTimeDeliveryRate}
• Total Distance: ${analytics.totalDistance}
• Carbon Saved: ${analytics.carbonSaved}

=== END OF DATA ===
`;
  }
}
