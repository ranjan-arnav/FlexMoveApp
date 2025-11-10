import { sendTelegramMessage, sendNotificationWithActions, formatShipmentInfo, formatDisruptionAlert } from './telegram';
import { telegramStorage } from './telegram-storage';

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed';
  carrier?: string;
  estimatedDelivery?: string;
  currentLocation?: string;
  progress?: number;
  items?: Array<{
    name: string;
    quantity: number;
    weight: number;
  }>;
}

export interface Disruption {
  id: string;
  shipmentId: string;
  type: 'weather' | 'traffic' | 'vehicle' | 'customs' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: string;
  estimatedDelay?: string;
}

/**
 * Notify all linked users or specific users about a shipment update
 */
export async function notifyShipmentUpdate(
  shipment: Shipment,
  updateType: 'created' | 'status_changed' | 'location_updated' | 'delivered',
  specificUserIds?: string[]
) {
  try {
    let telegramIds: number[] = [];

    if (specificUserIds && specificUserIds.length > 0) {
      // Notify specific users
      telegramIds = specificUserIds
        .map(userId => {
          const userLink = telegramStorage.getUserLink(userId);
          return userLink?.notifications ? userLink.telegramId : null;
        })
        .filter((id): id is number => id !== null);
    } else {
      // Get subscribers for this shipment
      telegramIds = telegramStorage.getShipmentSubscribers(shipment.id)
        .filter(telegramId => {
          const userLink = telegramStorage.getUserLinkByTelegramId(telegramId);
          return userLink?.notifications === true;
        });
    }

    if (telegramIds.length === 0) {
      console.log('No users to notify for shipment:', shipment.id);
      return;
    }

    // Prepare message based on update type
    let emoji = '📦';
    let title = 'Shipment Update';
    let message = '';

    switch (updateType) {
      case 'created':
        emoji = '✅';
        title = 'New Shipment Created';
        message = `Your shipment ${shipment.id} has been created and is ready for pickup.`;
        break;
      case 'status_changed':
        emoji = shipment.status === 'delivered' ? '🎉' : shipment.status === 'delayed' ? '⚠️' : '🚚';
        title = 'Status Update';
        message = `Shipment ${shipment.id} status: *${shipment.status.toUpperCase()}*`;
        break;
      case 'location_updated':
        emoji = '📍';
        title = 'Location Update';
        message = `Shipment ${shipment.id} is now at: ${shipment.currentLocation || 'In transit'}`;
        break;
      case 'delivered':
        emoji = '🎉';
        title = 'Delivery Complete';
        message = `Great news! Shipment ${shipment.id} has been delivered successfully.`;
        break;
    }

    const fullMessage = `${emoji} *${title}*\n\n${message}\n\n${formatShipmentInfo(shipment)}`;

    // Send notification to all relevant users
    const promises = telegramIds.map(chatId =>
      sendNotificationWithActions(chatId, fullMessage, [
        { text: '📊 View Details', url: `${process.env.NEXT_PUBLIC_APP_URL}/track/${shipment.id}` },
        { text: '🗺️ Track', url: `${process.env.NEXT_PUBLIC_APP_URL}/map/${shipment.id}` },
      ])
    );

    await Promise.allSettled(promises);
    console.log(`Notified ${telegramIds.length} users about shipment ${shipment.id}`);
  } catch (error) {
    console.error('Error sending shipment notifications:', error);
  }
}

/**
 * Notify users about a disruption or alert
 */
export async function notifyDisruption(
  disruption: Disruption,
  shipment?: Shipment,
  specificUserIds?: string[]
) {
  try {
    let telegramIds: number[] = [];

    if (specificUserIds && specificUserIds.length > 0) {
      // Notify specific users
      telegramIds = specificUserIds
        .map(userId => {
          const userLink = telegramStorage.getUserLink(userId);
          return userLink?.notifications ? userLink.telegramId : null;
        })
        .filter((id): id is number => id !== null);
    } else {
      // Get subscribers for this shipment
      telegramIds = telegramStorage.getShipmentSubscribers(disruption.shipmentId)
        .filter(telegramId => {
          const userLink = telegramStorage.getUserLinkByTelegramId(telegramId);
          return userLink?.notifications === true;
        });
    }

    if (telegramIds.length === 0) {
      console.log('No users to notify for disruption:', disruption.id);
      return;
    }

    const message = formatDisruptionAlert(disruption);

    // Send notification with action buttons
    const promises = telegramIds.map(chatId =>
      sendNotificationWithActions(chatId, message, [
        { text: '📊 View Shipment', url: `${process.env.NEXT_PUBLIC_APP_URL}/track/${disruption.shipmentId}` },
        { text: '🆘 Get Help', url: `${process.env.NEXT_PUBLIC_APP_URL}/support` },
      ])
    );

    await Promise.allSettled(promises);
    console.log(`Notified ${telegramIds.length} users about disruption ${disruption.id}`);
  } catch (error) {
    console.error('Error sending disruption notifications:', error);
  }
}

/**
 * Subscribe a user to shipment notifications
 */
export async function subscribeUserToShipment(userId: string, shipmentId: string): Promise<boolean> {
  const userLink = telegramStorage.getUserLink(userId);
  if (!userLink) {
    return false;
  }

  telegramStorage.subscribeToShipment(userLink.telegramId, shipmentId);
  return true;
}

/**
 * Unsubscribe a user from shipment notifications
 */
export async function unsubscribeUserFromShipment(userId: string, shipmentId: string): Promise<boolean> {
  const userLink = telegramStorage.getUserLink(userId);
  if (!userLink) {
    return false;
  }

  telegramStorage.unsubscribeFromShipment(userLink.telegramId, shipmentId);
  return true;
}

/**
 * Broadcast a message to all linked users
 */
export async function broadcastToAllUsers(message: string): Promise<number> {
  try {
    const telegramIds = telegramStorage.getAllLinkedTelegramIds()
      .filter(telegramId => {
        const userLink = telegramStorage.getUserLinkByTelegramId(telegramId);
        return userLink?.notifications === true;
      });

    const promises = telegramIds.map(chatId => sendTelegramMessage(chatId, message));
    const results = await Promise.allSettled(promises);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Broadcast sent to ${successCount}/${telegramIds.length} users`);
    
    return successCount;
  } catch (error) {
    console.error('Error broadcasting message:', error);
    return 0;
  }
}

/**
 * Send a custom notification to specific users
 */
export async function sendCustomNotification(
  userIds: string[],
  message: string,
  buttons?: Array<{ text: string; url?: string; callback_data?: string }>
): Promise<number> {
  try {
    const telegramIds = userIds
      .map(userId => {
        const userLink = telegramStorage.getUserLink(userId);
        return userLink?.notifications ? userLink.telegramId : null;
      })
      .filter((id): id is number => id !== null);

    if (telegramIds.length === 0) {
      return 0;
    }

    const promises = buttons
      ? telegramIds.map(chatId => sendNotificationWithActions(chatId, message, buttons))
      : telegramIds.map(chatId => sendTelegramMessage(chatId, message));

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    return successCount;
  } catch (error) {
    console.error('Error sending custom notification:', error);
    return 0;
  }
}
