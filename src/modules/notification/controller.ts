import { Request, Response } from 'express';
import * as notificationService from './service';

/**
 * Get all notifications for the authenticated user.
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const notifications = await notificationService.getUserNotifications(authReq.user.id);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error in getNotifications controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications' });
  }
};

/**
 * Get a specific notification by ID and automatically mark it as read.
 */
export const getNotification = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    if (!authReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await notificationService.getNotificationById(id as string, authReq.user.id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Automatically mark as read when opened/fetched
    if (!notification.isRead) {
      await notificationService.markAsRead(id as string, authReq.user.id);
      notification.isRead = true; // Update local object to reflect new state
    }

    res.json({ success: true, data: notification });
  } catch (error: any) {
    console.error('Error in getNotification controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch notification' });
  }
};

/**
 * Mark a specific notification as read.
 */
export const markRead = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    if (!authReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    await notificationService.markAsRead(id as string, authReq.user.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Error in markRead controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update notification' });
  }
};

/**
 * Mark all unread notifications for the user as read.
 */
export const markAllRead = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (!authReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    await notificationService.markAllAsRead(authReq.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Error in markAllRead controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update notifications' });
  }
};

/**
 * Delete a specific notification.
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    if (!authReq.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    await notificationService.deleteNotification(id as string, authReq.user.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Error in remove notification controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete notification' });
  }
};

/**
 * Webhook to trigger a notification from external or internal services.
 */
export const webhookTrigger = async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, link, metadata } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, type, title, message' 
      });
    }

    const notification = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      link,
      metadata
    });

    if (!notification) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create notification. User preferences may have blocked it or invalid user ID.'
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Notification created via webhook', 
      data: notification 
    });
  } catch (error: any) {
    console.error('Error in webhookTrigger controller:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process webhook' 
    });
  }
};
