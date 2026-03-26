import { Router } from 'express';
import * as chatController from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI Chatbot (Raver Director conversational analysis)
 */

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message to the AI Chatbot
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Unique identifier for the chat session. If not provided, a new UUID will be generated.
 *               message:
 *                 type: string
 *               website_url:
 *                 type: string
 *               tag:
 *                 type: string
 *                 description: Optional tag to categorize the session for retrieval (e.g., brand name, campaign id).
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/', chatController.chat);

/**
 * @swagger
 * /api/chat/history/{session_id}:
 *   get:
 *     summary: Get chat history for a session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history
 *   delete:
 *     summary: Clear/Delete a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted successfully
 */
router.get('/history/:session_id', chatController.getChatHistory);
router.delete('/history/:session_id', chatController.deleteChatSession);

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: List all AI sessions filtered by tag
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter sessions by this tag
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/sessions', chatController.listSessionsByTag);

export default router;
