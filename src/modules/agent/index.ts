import { Router } from 'express';
import * as agentController from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent management
 */

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Get all agents
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agents
 */
router.get('/', agentController.getAgents);

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: Create an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       201:
 *         description: Agent created
 */
router.post('/', agentController.createAgent);

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Get agent details
 *     tags: [Agents]
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
 *         description: Agent details
 */
router.get('/:id', agentController.getAgent);

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     summary: Update an agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Agent updated
 */
router.put('/:id', agentController.updateAgent);

/**
 * @swagger
 * /api/agents/{id}:
 *   delete:
 *     summary: Delete an agent
 *     tags: [Agents]
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
 *         description: Agent deleted
 */
router.delete('/:id', agentController.deleteAgent);

/**
 * @swagger
 * /api/agents/{id}/execute:
 *   post:
 *     summary: Execute an agent
 *     tags: [Agents]
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
 *         description: Agent executed
 */
router.post('/:id/execute', agentController.executeAgent);

export default router;
