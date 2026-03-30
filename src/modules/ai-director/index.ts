import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Director
 *   description: Conversational Video Director
 */

/**
 * @swagger
 * /api/ai/director/chat:
 *   post:
 *     summary: Send a message to the Raver Director AI
 *     tags: [AI Director]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, message]
 *             properties:
 *               session_id:
 *                 type: string
 *               message:
 *                 type: string
 *               professional_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Director response
 */
router.post('/chat', controller.chat);

/**
 * @swagger
 * /api/ai/director/sessions:
 *   get:
 *     summary: List all Director sessions
 *     tags: [AI Director]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/sessions', controller.listSessions);

/**
 * @swagger
 * /api/ai/director/session/{session_id}:
 *   get:
 *     summary: Get conversation history for a session
 *     tags: [AI Director]
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
 *         description: Session history
 */
router.get('/session/:session_id', controller.getSession);

/**
 * @swagger
 * /api/ai/director/session/{session_id}/update:
 *   get:
 *     summary: Poll Director for the latest campaign status update
 *     tags: [AI Director]
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
 *         description: Latest update
 */
router.get('/session/:session_id/update', controller.getUpdate);

/**
 * @swagger
 * /api/ai/director/session/{session_id}:
 *   delete:
 *     summary: Delete an AI Director session
 *     tags: [AI Director]
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
router.delete('/session/:session_id', controller.deleteSession);

export default router;

