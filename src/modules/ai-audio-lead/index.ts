import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Audio Lead
 *   description: AI Background music and voiceover generation
 */

/**
 * @swagger
 * /api/ai/audio-lead/music:
 *   post:
 *     summary: Generate background music for an ad
 *     tags: [AI Audio Lead]
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
 *                 description: Campaign brief dict
 *               tone:
 *                 type: string
 *                 description: elegant, bold editorial, soft glam, fresh natural, luxury spa, cinematic, energetic, professional, calm
 *                 default: elegant
 *               duration:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 60
 *                 default: 20
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Music generated
 */
router.post('/music', controller.generateMusic);

/**
 * @swagger
 * /api/ai/audio-lead/voiceover:
 *   post:
 *     summary: Generate a voiceover
 *     tags: [AI Audio Lead]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [script]
 *             properties:
 *               script:
 *                 type: string
 *               voice:
 *                 type: string
 *                 enum: [oversea_male1, uk_man2, uk_boy1, calm_story1, genshin_vindi2]
 *                 default: oversea_male1
 *               voice_speed:
 *                 type: number
 *                 minimum: 0.8
 *                 maximum: 2.0
 *                 default: 1.0
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Voiceover generated
 */
router.post('/voiceover', controller.generateVoiceover);

/**
 * @swagger
 * /api/ai/audio-lead/produce:
 *   post:
 *     summary: Generate a full audio package (Music + Voiceover)
 *     tags: [AI Audio Lead]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [brief, script]
 *             properties:
 *               brief:
 *                 type: object
 *               script:
 *                 type: string
 *               tone:
 *                 type: string
 *                 default: elegant
 *               music_duration:
 *                 type: integer
 *                 default: 30
 *               voice:
 *                 type: string
 *                 enum: [oversea_male1, uk_man2, uk_boy1, calm_story1, genshin_vindi2]
 *                 default: oversea_male1
 *               voice_speed:
 *                 type: number
 *                 default: 1.0
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Audio package produced
 */
router.post('/produce', controller.produceAudio);

/**
 * @swagger
 * /api/ai/audio-lead/mix:
 *   post:
 *     summary: Mix voiceover and music into a single file
 *     tags: [AI Audio Lead]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [voiceover_url, music_url]
 *             properties:
 *               voiceover_url:
 *                 type: string
 *               music_url:
 *                 type: string
 *               session_id:
 *                 type: string
 *               music_volume:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.2
 *     responses:
 *       200:
 *         description: Audio mixed successfully
 */
router.post('/mix', controller.mixAudio);

/**
 * @swagger
 * /api/ai/audio-lead/vault/{session_id}:
 *   get:
 *     summary: List all audio files stored for a session
 *     tags: [AI Audio Lead]
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
 *         description: Audio vault contents
 */
router.get('/vault/:session_id', controller.getVault);

export default router;
