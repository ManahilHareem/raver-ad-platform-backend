import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Retrieve only unread notifications
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of notifications to return
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', controller.getNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a specific notification and mark it as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested notification
 *       404:
 *         description: Notification not found
 */
router.get('/:id', controller.getNotification);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', controller.markAllRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', controller.markRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /api/notifications/webhook:
 *   post:
 *     summary: Webhook to create a notification when an event occurs
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to notify
 *               type:
 *                 type: string
 *                 example: 'SYSTEM_EVENT'
 *               title:
 *                 type: string
 *                 example: 'Event Occurred'
 *               message:
 *                 type: string
 *                 example: 'Something happened successfully.'
 *               link:
 *                 type: string
 *                 example: 'https://adplatform.raver.ai/agents/director?sessionId=123'
 *               metadata:
 *                 type: object
 *                 description: Additional JSON metadata
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Missing required fields or failed to create
 */
router.post('/webhook', controller.webhookTrigger);

export default router;
