import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Insights
 *   description: Centralized analytics for AI agents
 */

/**
 * @swagger
 * /api/ai/insights/director:
 *   get:
 *     summary: Get AI Director specific insights
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Director-specific account metrics
 */
router.get('/director', controller.getDirectorInsights);

export default router;
