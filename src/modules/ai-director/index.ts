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
 * /api/ai/director/regenerate-chat:
 *   post:
 *     summary: Regenerate a campaign with optional overrides
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
 *               musicPrompt:
 *                 type: string
 *               voice_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Regeneration triggered
 */
router.post('/regenerate-chat', controller.regenerateChat);

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
 * /api/ai/director/session/{session_id}/db-update:
 *   get:
 *     summary: Get session status directly from local database
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
 *         description: Local session data
 */
router.get('/session/:session_id/db-update', controller.getDbUpdate);

/**
 * @swagger
 * /api/ai/director/session/{session_id}/approve:
 *   patch:
 *     summary: Approve an AI Director session result locally
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
 *         description: Session approved successfully
 */
router.patch('/session/:session_id/approve', controller.approveSession);

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

/**
 * @swagger
 * /api/ai/director/session/{session_id}/approve-step:
 *   post:
 *     summary: Approve or provide feedback on a specific production step
 *     tags: [AI Director]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               step_name:
 *                 type: string
 *               action:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Step approval processed
 */
router.post('/session/:session_id/approve-step', controller.approveStep);

export default router;
