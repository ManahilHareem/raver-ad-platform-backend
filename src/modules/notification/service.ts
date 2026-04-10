import axios from 'axios';
import prisma from '../../db/prisma';

/**
 * Internal method to create a notification.
 * Checks user preferences before creating.
 */
export const createNotification = async (data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}) => {
  try {
    // Check user preferences and webhook settings
    const user = await (prisma as any).user.findUnique({
      where: { id: data.userId },
      select: { campaignUpdates: true, teamActivity: true, webhookUrl: true }
    }) as any;

    if (!user) return null;

    // Respect user settings for campaign-related notifications
    if (data.type.startsWith('CAMPAIGN_') && !user.campaignUpdates) {
      return null;
    }
    
    // Respect user settings for team-related notifications (optional future use)
    if (data.type.startsWith('TEAM_') && !user.teamActivity) {
      return null;
    }

    const notification = await (prisma as any).notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
        metadata: data.metadata || {}
      }
    });

    // Outbound Webhook Trigger
    if (user.webhookUrl) {
      // Fire and forget to avoid blocking main execution flow
      axios.post(user.webhookUrl, {
        event: 'notification.created',
        data: notification
      }).catch(err => {
        console.error(`Webhook delivery failed for user ${data.userId} to ${user.webhookUrl}:`, err.message);
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null; // Fail silently for service triggers to avoid breaking main flows
  }
};

/**
 * Fetch all notifications for a specific user.
 */
export const getUserNotifications = async (userId: string) => {
  try {
    return await (prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

/**
 * Fetch a single notification by ID.
 */
export const getNotificationById = async (id: string, userId: string) => {
  try {
    return await (prisma as any).notification.findFirst({
      where: { id, userId }
    });
  } catch (error) {
    console.error('Error fetching single notification:', error);
    throw new Error('Failed to fetch notification');
  }
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (id: string, userId: string) => {
  try {
    return await (prisma as any).notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to update notification');
  }
};

/**
 * Mark all unread notifications for a user as read.
 */
export const markAllAsRead = async (userId: string) => {
  try {
    return await (prisma as any).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to update notifications');
  }
};

/**
 * Delete a specific notification.
 */
export const deleteNotification = async (id: string, userId: string) => {
  try {
    return await (prisma as any).notification.deleteMany({
      where: { id, userId }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};
