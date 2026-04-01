import { Router } from 'express';
import * as Controller from './Controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Voice
 *   description: Voice management and settings
 */

/**
 * @swagger
 * /api/voice/get-voices:
 *   get:
 *     summary: Retrieve a list of voices for eleven labs
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of voices
 */
router.get('/get-voices', Controller.getVoices);

export default router;