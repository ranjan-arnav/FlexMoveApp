// Simple in-memory storage for linking codes and user mappings
// In production, use a proper database like PostgreSQL, MongoDB, or Redis

interface UserLink {
  userId: string;
  telegramId: number;
  username?: string;
  firstName: string;
  linkedAt: Date;
  lastActive: Date;
  notifications: boolean;
}

interface LinkingCode {
  code: string;
  userId: string;
  userRole: 'supplier' | 'transporter' | 'customer';
  email?: string;
  expiresAt: Date;
  used: boolean;
}

class TelegramStorage {
  private userLinks: Map<string, UserLink> = new Map();
  private telegramToUser: Map<number, string> = new Map();
  private linkingCodes: Map<string, LinkingCode> = new Map();
  private userSubscriptions: Map<number, Set<string>> = new Map(); // telegram ID -> shipment IDs

  constructor() {
    // Pre-populate hardcoded linking codes that never expire
    this.linkingCodes.set('SUP100', {
      code: 'SUP100',
      userId: 'supplier-demo',
      userRole: 'supplier',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      used: false,
    });

    this.linkingCodes.set('CUS150', {
      code: 'CUS150',
      userId: 'customer-demo',
      userRole: 'customer',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      used: false,
    });

    this.linkingCodes.set('TRA200', {
      code: 'TRA200',
      userId: 'transporter-demo',
      userRole: 'transporter',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      used: false,
    });
  }

  // Generate linking code
  generateLinkingCode(userId: string, userRole: 'supplier' | 'transporter' | 'customer', email?: string): string {
    // Hardcoded linking codes for testing
    let code: string;
    if (userRole === 'supplier') {
      code = 'SUP100';
    } else if (userRole === 'customer') {
      code = 'CUS150';
    } else if (userRole === 'transporter') {
      code = 'TRA200';
    } else {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    this.linkingCodes.set(code, {
      code,
      userId,
      userRole,
      email,
      expiresAt,
      used: false,
    });

    // Clean up expired codes
    setTimeout(() => {
      this.linkingCodes.delete(code);
    }, 15 * 60 * 1000);

    return code;
  }

  // Verify and use linking code
  useLinkingCode(code: string, telegramId: number, username?: string, firstName: string = 'User'): UserLink | null {
    const linkingCode = this.linkingCodes.get(code);

    if (!linkingCode) {
      return null;
    }

    // For hardcoded demo codes, don't check if used (allow reuse)
    const isHardcodedCode = ['SUP100', 'CUS150', 'TRA200'].includes(code);
    
    if (!isHardcodedCode && linkingCode.used) {
      return null;
    }

    if (linkingCode.expiresAt < new Date()) {
      this.linkingCodes.delete(code);
      return null;
    }

    // Mark code as used (except for hardcoded codes)
    if (!isHardcodedCode) {
      linkingCode.used = true;
    }

    // Create user link
    const userLink: UserLink = {
      userId: linkingCode.userId,
      telegramId,
      username,
      firstName,
      linkedAt: new Date(),
      lastActive: new Date(),
      notifications: true,
    };

    this.userLinks.set(linkingCode.userId, userLink);
    this.telegramToUser.set(telegramId, linkingCode.userId);

    return userLink;
  }

  // Get user link by userId
  getUserLink(userId: string): UserLink | undefined {
    return this.userLinks.get(userId);
  }

  // Get user link by telegram ID
  getUserLinkByTelegramId(telegramId: number): UserLink | undefined {
    const userId = this.telegramToUser.get(telegramId);
    return userId ? this.userLinks.get(userId) : undefined;
  }

  // Unlink user
  unlinkUser(userId: string): boolean {
    const userLink = this.userLinks.get(userId);
    if (!userLink) return false;

    this.telegramToUser.delete(userLink.telegramId);
    this.userLinks.delete(userId);
    return true;
  }

  // Update last active
  updateLastActive(telegramId: number) {
    const userId = this.telegramToUser.get(telegramId);
    if (userId) {
      const userLink = this.userLinks.get(userId);
      if (userLink) {
        userLink.lastActive = new Date();
      }
    }
  }

  // Toggle notifications
  toggleNotifications(userId: string, enabled: boolean): boolean {
    const userLink = this.userLinks.get(userId);
    if (!userLink) return false;

    userLink.notifications = enabled;
    return true;
  }

  // Get all linked telegram IDs (for broadcasting)
  getAllLinkedTelegramIds(): number[] {
    return Array.from(this.telegramToUser.keys());
  }

  // Subscribe to shipment notifications
  subscribeToShipment(telegramId: number, shipmentId: string) {
    if (!this.userSubscriptions.has(telegramId)) {
      this.userSubscriptions.set(telegramId, new Set());
    }
    this.userSubscriptions.get(telegramId)!.add(shipmentId);
  }

  // Unsubscribe from shipment
  unsubscribeFromShipment(telegramId: number, shipmentId: string) {
    const subs = this.userSubscriptions.get(telegramId);
    if (subs) {
      subs.delete(shipmentId);
    }
  }

  // Get subscribed users for a shipment
  getShipmentSubscribers(shipmentId: string): number[] {
    const subscribers: number[] = [];
    for (const [telegramId, shipmentIds] of this.userSubscriptions.entries()) {
      if (shipmentIds.has(shipmentId)) {
        subscribers.push(telegramId);
      }
    }
    return subscribers;
  }

  // Check if code exists and is valid
  isCodeValid(code: string): boolean {
    const linkingCode = this.linkingCodes.get(code);
    return !!(linkingCode && !linkingCode.used && linkingCode.expiresAt > new Date());
  }

  // Get linking code info
  getLinkingCodeInfo(code: string): LinkingCode | undefined {
    return this.linkingCodes.get(code);
  }
}

// Export singleton instance
export const telegramStorage = new TelegramStorage();
