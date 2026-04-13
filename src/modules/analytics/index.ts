import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Platform-wide performance metrics
 */

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get platform analytics summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consolidated dummy analytics data
 */
router.get('/', controller.getPlatformAnalytics);

export default router;
