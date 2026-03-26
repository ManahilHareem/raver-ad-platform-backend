import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI Image Lead
 *   description: AI Image generation and enhancement
 */

/**
 * @swagger
 * /api/ai/image-lead/generate:
 *   post:
 *     summary: Generate base and scene images
 *     tags: [AI Image Lead]
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
 *               scenes:
 *                 type: array
 *                 description: List of scene dicts with id and visual_prompt
 *               aspect_ratio:
 *                 type: string
 *                 default: "16:9"
 *               uploaded_image_url:
 *                 type: string
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Images generated
 */
router.post('/generate', controller.generateImages);

/**
 * @swagger
 * /api/ai/image-lead/enhance:
 *   post:
 *     summary: Enhance an image
 *     tags: [AI Image Lead]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image_url]
 *             properties:
 *               image_url:
 *                 type: string
 *               session_id:
 *                 type: string
 *               brightness:
 *                 type: number
 *                 default: 1.0
 *               saturation:
 *                 type: number
 *                 default: 1.0
 *               sharpness:
 *                 type: number
 *                 default: 1.0
 *               contrast:
 *                 type: number
 *                 default: 1.0
 *     responses:
 *       200:
 *         description: Image enhanced
 */
router.post('/enhance', controller.enhanceImage);

/**
 * @swagger
 * /api/ai/image-lead/vault/{session_id}:
 *   get:
 *     summary: Get all stored images for a session
 *     tags: [AI Image Lead]
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

export default router;
