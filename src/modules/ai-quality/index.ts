import { Router } from 'express';
import * as controller from './controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// All quality lead routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: AI Quality Lead
 *   description: AI-powered quality assessment and scoring for campaign assets
 */

/**
 * @swagger
 * /api/ai/quality/candidates:
 *   get:
 *     summary: Get unified list of candidates across all agents for quality check
 *     tags: [AI Quality Lead]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grouped list of candidates (video, audio, image, copy)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     video_synthesis:
 *                       type: array
 *                       items:
 *                         type: object
 *                     audio_mix:
 *                       type: array
 *                       items:
 *                         type: object
 *                     image_scenes:
 *                       type: array
 *                       items:
 *                         type: object
 *                     copy_script:
 *                       type: array
 *                       items:
 *                         type: object
 *                     producer_render:
 *                       type: array
 *                       items:
 *                         type: object
 *                     director_session:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/candidates', controller.getCandidates);

/**
 * @swagger
 * /api/ai/quality/history:
 *   get:
 *     summary: Get history of all previous quality reports
 *     tags: [AI Quality Lead]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of previous quality scoring results
 */
router.get('/history', controller.getHistory);

/**
 * @swagger
 * /api/ai/quality/score:
 *   post:
 *     summary: Score an asset and generate a quality report
 *     tags: [AI Quality Lead]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaign_id, session_id]
 *             properties:
 *               campaign_id:
 *                 type: string
 *               session_id:
 *                 type: string
 *               brief:
 *                 type: object
 *               scene_images:
 *                 type: array
 *                 items:
 *                   type: object
 *               script:
 *                 type: string
 *               overlays:
 *                 type: array
 *                 items:
 *                   type: object
 *               voiceover_url:
 *                 type: string
 *               music_url:
 *                 type: string
 *               video_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quality score generated and persisted
 */
router.post('/score', controller.scoreAsset);

/**
 * @swagger
 * /api/ai/quality/report/{id}:
 *   get:
 *     summary: Get a specific quality report by ID
 *     tags: [AI Quality Lead]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The internal database ID or external report_id
 *     responses:
 *       200:
 *         description: Quality report details
 *       404:
 *         description: Report not found
 */
router.get('/report/:id', controller.getReport);

/**
 * @swagger
 * /api/ai/quality/report/{id}:
 *   delete:
 *     summary: Delete a specific quality report
 *     tags: [AI Quality Lead]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The internal database ID or external report_id
 *     responses:
 *       200:
 *         description: Quality report deleted
 *       404:
 *         description: Report not found
 */
router.delete('/report/:id', controller.deleteReport);

export default router;
