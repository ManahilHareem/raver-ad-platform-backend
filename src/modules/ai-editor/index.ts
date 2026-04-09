import { Router } from 'express';
import * as controller from './controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Apply authentication to all editor routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: AI Editor
 *   description: AI Video rendering and assembly
 */

/**
 * @swagger
 * /api/ai/editor/render:
 *   post:
 *     summary: Render a campaign in a specific format
 *     tags: [AI Editor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scenes]
 *             properties:
 *               scenes:
 *                 type: array
 *                 description: List of scene objects with image_url, audio_url, etc.
 *               format:
 *                 type: string
 *                 enum: ["9:16", "1:1", "16:9"]
 *                 default: "9:16"
 *               voiceover_url:
 *                 type: string
 *               music_url:
 *                 type: string
 *               music_volume:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.2
 *               business_name:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               transition:
 *                 type: string
 *                 enum: [fade, dissolve, slideright, slideleft, wipeleft, wiperight, none]
 *                 default: fade
 *               transition_duration:
 *                 type: number
 *                 default: 1.0
 *               session_id:
 *                 type: string
 *               animate_scenes:
 *                 type: boolean
 *                 default: false
 *               video_model:
 *                 type: string
 *                 enum: [ltx-video, hunyuan-video]
 *                 default: ltx-video
 *     responses:
 *       200:
 *         description: Video render started
 */
router.post('/render', controller.renderCampaign);

/**
 * @swagger
 * /api/ai/editor/export:
 *   post:
 *     summary: Render all 3 formats (9:16, 1:1, 16:9) in parallel
 *     tags: [AI Editor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scenes]
 *             properties:
 *               scenes:
 *                 type: array
 *               voiceover_url:
 *                 type: string
 *               music_url:
 *                 type: string
 *               music_volume:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.2
 *               business_name:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               transition:
 *                 type: string
 *                 enum: [fade, dissolve, slideright, slideleft, wipeleft, wiperight, none]
 *                 default: fade
 *               transition_duration:
 *                 type: number
 *                 default: 1.0
 *               session_id:
 *                 type: string
 *               animate_scenes:
 *                 type: boolean
 *                 default: false
 *               video_model:
 *                 type: string
 *                 enum: [ltx-video, hunyuan-video]
 *                 default: ltx-video
 *     responses:
 *       200:
 *         description: Multi-format export started
 */
router.post('/export', controller.exportFormats);

/**
 * @swagger
 * /api/ai/editor/renders/{session_id}:
 *   get:
 *     summary: List all rendered videos for a session
 *     tags: [AI Editor]
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
 *         description: List of renders
 */
router.get('/renders/:session_id', controller.getRenders);

/**
 * @swagger
 * /api/ai/editor/results:
 *   get:
 *     summary: Get all rendered videos for the current user
 *     tags: [AI Editor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of editor results
 */
router.get('/results', controller.getAllResults);

/**
 * @swagger
 * /api/ai/editor/results/{id}:
 *   delete:
 *     summary: Delete a rendered video result
 *     tags: [AI Editor]
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
 *         description: Result deleted
 */
router.delete('/results/:id', controller.deleteResult);

export default router;
