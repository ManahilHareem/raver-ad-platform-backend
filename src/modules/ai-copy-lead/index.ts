import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Copy Lead
 *   description: AI Copywriting, scripts, and captions
 */

/**
 * @swagger
 * /api/ai/copy-lead/script:
 *   post:
 *     summary: Generate a full voiceover script
 *     tags: [AI Copy Lead]
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
 *               scenes:
 *                 type: array
 *               tone:
 *                 type: string
 *                 default: elegant
 *               duration_per_scene:
 *                 type: integer
 *                 minimum: 3
 *                 maximum: 15
 *                 default: 5
 *     responses:
 *       200:
 *         description: Script generated
 */
router.post('/script', controller.generateScript);

/**
 * @swagger
 * /api/ai/copy-lead/captions:
 *   post:
 *     summary: Generate platform-specific social media captions
 *     tags: [AI Copy Lead]
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
 *               platform:
 *                 type: string
 *                 enum: [instagram, tiktok, youtube, linkedin, twitter, web]
 *                 default: instagram
 *               campaign_context:
 *                 type: string
 *               tone:
 *                 type: string
 *                 default: elegant
 *     responses:
 *       200:
 *         description: Captions generated
 */
router.post('/captions', controller.generateCaptions);

/**
 * @swagger
 * /api/ai/copy-lead/overlays:
 *   post:
 *     summary: Generate short on-screen text overlays
 *     tags: [AI Copy Lead]
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
 *               scenes:
 *                 type: array
 *               tone:
 *                 type: string
 *                 default: elegant
 *     responses:
 *       200:
 *         description: Overlays generated
 */
router.post('/overlays', controller.generateOverlays);

/**
 * @swagger
 * /api/ai/copy-lead/cta:
 *   post:
 *     summary: Generate a call-to-action
 *     tags: [AI Copy Lead]
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
 *               platform:
 *                 type: string
 *                 default: instagram
 *               tone:
 *                 type: string
 *                 default: elegant
 *     responses:
 *       200:
 *         description: CTA generated
 */
router.post('/cta', controller.generateCta);

/**
 * @swagger
 * /api/ai/copy-lead/hashtags:
 *   post:
 *     summary: Generate platform-specific hashtags
 *     tags: [AI Copy Lead]
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
 *               platform:
 *                 type: string
 *                 default: instagram
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *     responses:
 *       200:
 *         description: Hashtags generated
 */
router.post('/hashtags', controller.generateHashtags);

/**
 * @swagger
 * /api/ai/copy-lead/produce:
 *   post:
 *     summary: Produce a full copy package (Script + Captions + Overlays + CTAs + Hashtags)
 *     tags: [AI Copy Lead]
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
 *               scenes:
 *                 type: array
 *               platforms:
 *                 type: array
 *               tone:
 *                 type: string
 *                 default: elegant
 *               duration_per_scene:
 *                 type: integer
 *                 minimum: 3
 *                 maximum: 15
 *                 default: 5
 *     responses:
 *       200:
 *         description: Copy package produced
 */
router.post('/produce', controller.produceCopy);

/**
 * @swagger
 * /api/ai/copy-lead/results:
 *   get:
 *     summary: Get all copy lead results for the authenticated user
 *     tags: [AI Copy Lead]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of copy lead results
 */
router.get('/results', controller.getResults);

/**
 * @swagger
 * /api/ai/copy-lead/vault/{session_id}:
 *   get:
 *     summary: Get specific session vault from proxy
 *     tags: [AI Copy Lead]
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
 *         description: Vault contents
 */
router.get('/vault/:session_id', controller.getVault);

/**
 * @swagger
 * /api/ai/copy-lead/session/{session_id}:
 *   delete:
 *     summary: Delete a copy synthesis result session
 *     tags: [AI Copy Lead]
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
 *         description: Result deleted
 */
router.delete('/session/:session_id', controller.deleteResult);

export default router;
