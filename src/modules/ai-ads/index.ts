import { Router } from 'express';
import * as adsController from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Ads
 *   description: AI Video Ad Generation
 */

/**
 * @swagger
 * /api/ai/ads/generate-campaign:
 *   post:
 *     summary: Generate a full ad campaign (Scrape → Storyboard → Parallel Generation → Stitching)
 *     tags: [AI Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *                 description: Optional if website_url is provided
 *               product_description:
 *                 type: string
 *                 description: Optional if website_url is provided
 *               target_audience:
 *                 type: string
 *               website_url:
 *                 type: string
 *               mood:
 *                 type: string
 *                 default: cinematic
 *               platform:
 *                 type: string
 *                 enum: [instagram, youtube, tiktok, linkedin, web]
 *                 default: instagram
 *               image_url:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 default: 5
 *               aspect_ratio:
 *                 type: string
 *               fps:
 *                 type: integer
 *                 enum: [25, 50]
 *                 default: 25
 *               camera_motion:
 *                 type: string
 *                 enum: [static, dolly_in, dolly_out, dolly_left, dolly_right, jib_up, jib_down, focus_shift]
 *               generate_audio:
 *                 type: boolean
 *                 default: true
 *               audio_prompt:
 *                 type: string
 *               generate_voiceover:
 *                 type: boolean
 *                 default: true
 *               voice:
 *                 type: string
 *                 enum: [oversea_male1, uk_man2, uk_boy1, calm_story1, genshin_vindi2]
 *                 default: oversea_male1
 *               voice_speed:
 *                 type: number
 *                 minimum: 0.8
 *                 maximum: 2.0
 *                 default: 1.0
 *               logo_url:
 *                 type: string
 *               use_fal:
 *                 type: boolean
 *                 default: false
 *               model_name:
 *                 type: string
 *                 default: ltx-video
 *     responses:
 *       200:
 *         description: Full ad campaign generated
 */
router.post('/generate-campaign', adsController.generateCampaign);

/**
 * @swagger
 * /api/ai/ads/generate-variations:
 *   post:
 *     summary: Generate ad variations
 *     tags: [AI Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdRequest'
 *     responses:
 *       200:
 *         description: Ad variations generated
 */
router.post('/generate-variations', adsController.generateVariations);

/**
 * @swagger
 * /api/ai/ads/generate-multiple-fal:
 *   post:
 *     summary: Generate multiple videos using Fal.ai directly
 *     tags: [AI Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdRequest'
 *     responses:
 *       200:
 *         description: Multiple Fal videos generated
 */
router.post('/generate-multiple-fal', adsController.generateMultipleFal);

/**
 * @swagger
 * /api/ai/ads/generate-audio:
 *   post:
 *     summary: Generate audio for an ad using Fal.ai
 *     tags: [AI Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdRequest'
 *     responses:
 *       200:
 *         description: Audio generated
 */
router.post('/generate-audio', adsController.generateAudio);

/**
 * @swagger
 * /api/ai/ads/generate-previews:
 *   post:
 *     summary: Generate 3 video previews
 *     tags: [AI Ads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdRequest'
 *     responses:
 *       200:
 *         description: Preview variations generated
 */
router.post('/generate-previews', adsController.generatePreviews);

export default router;
