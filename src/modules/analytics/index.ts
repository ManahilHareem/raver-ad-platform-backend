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
 *         description: Consolidated analytics data with campaign metrics
 */
router.get('/', controller.getPlatformAnalytics);

/**
 * @swagger
 * /api/analytics/deep:
 *   get:
 *     summary: Get deep analytics across all schema models
 *     description: Aggregates real data from AI sessions, campaigns, assets, quality audits, and all agent outputs.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive analytics covering campaigns, AI sessions, agent outputs, quality scores, asset storage, and content generation timeline
 */
router.get('/deep', controller.getDeepAnalytics);

export default router;
