import { Router } from 'express';
import multer from 'multer';
import * as Controller from './Controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: CustomVoice
 *   description: Custom voice cloning and management
 */

/**
 * @swagger
 * /api/v1/custom-voice/clone:
 *   post:
 *     summary: Clone Voice
 *     tags: [CustomVoice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/clone', upload.array('files'), Controller.cloneVoice);

/**
 * @swagger
 * /api/v1/custom-voice/record:
 *   post:
 *     summary: Clone Voice From Recording
 *     tags: [CustomVoice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/record', upload.array('files'), Controller.cloneVoiceFromRecording);

/**
 * @swagger
 * /api/v1/custom-voice/list:
 *   get:
 *     summary: List Voices
 *     tags: [CustomVoice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/list', Controller.listVoices);

/**
 * @swagger
 * /api/v1/custom-voice/{voice_id}:
 *   get:
 *     summary: Get Voice Details
 *     tags: [CustomVoice]
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
 *         description: Success
 */
router.get('/:voice_id', Controller.getVoiceDetails);

/**
 * @swagger
 * /api/v1/custom-voice/{voice_id}:
 *   delete:
 *     summary: Delete Custom Voice
 *     tags: [CustomVoice]
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
 *         description: Success
 */
router.delete('/:voice_id', Controller.deleteCustomVoice);

/**
 * @swagger
 * /api/v1/custom-voice/{voice_id}/test:
 *   post:
 *     summary: Test Voice
 *     tags: [CustomVoice]
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
 *         description: Success
 */
router.post('/:voice_id/test', Controller.testVoice);

export default router;
