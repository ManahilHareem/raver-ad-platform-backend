import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Producer
 *   description: E2E Campaign Orchestration
 */

/**
 * @swagger
 * /api/ai/producer/campaign:
 *   post:
 *     summary: Launch a full pipeline campaign
 *     tags: [AI Producer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [brief]
 *             properties:
 *               brief:
 *                 type: object
 *                 description: Producer brief (business_name, product_description, target_audience, mood, platform)
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign launched
 */
router.post('/campaign', controller.launchCampaign);

/**
 * @swagger
 * /api/ai/producer/campaigns:
 *   get:
 *     summary: List all campaigns
 *     tags: [AI Producer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get('/campaigns', controller.listCampaigns);

/**
 * @swagger
 * /api/ai/producer/campaign/{campaign_id}:
 *   get:
 *     summary: Get current status and results of a campaign
 *     tags: [AI Producer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaign_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign status
 */
router.get('/campaign/:campaign_id', controller.getCampaign);

/**
 * @swagger
 * /api/ai/producer/campaign/{session_id}/approve-step:
 *   post:
 *     summary: Approve or provide feedback on a specific production step
 *     tags: [AI Producer]
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
router.post('/campaign/:session_id/approve-step', controller.approveStep);

/**
 * @swagger
 * /api/ai/producer/campaign/{campaign_id}/approve:
 *   post:
 *     summary: Human Creative Director approval or feedback step
 *     tags: [AI Producer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaign_id
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
 *               approved:
 *                 type: boolean
 *                 default: true
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval processed
 */
router.post('/campaign/:campaign_id/approve', controller.approveCampaign);

/**
 * @swagger
 * /api/ai/producer/campaign/{campaign_id}:
 *   delete:
 *     summary: Delete a campaign from the database
 *     tags: [AI Producer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaign_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted
 */
router.delete('/campaign/:campaign_id', controller.deleteCampaign);

export default router;
