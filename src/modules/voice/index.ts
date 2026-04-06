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

/**
 * @swagger
 * /api/voice/get-voice/{voice_id}:
 *   get:
 *     summary: Retrieve details of a specific voice from Eleven Labs
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: voice_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voice details
 */
router.get('/get-voice/:voice_id', Controller.getVoiceById);

export default router;