import { Router } from 'express';
import * as assetController from './controller'; // Resync TS server

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Asset management and uploads
 */

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get('/', assetController.getAssets);

/**
 * @swagger
 * /api/assets/upload:
 *   post:
 *     summary: Get a pre-signed URL for S3 upload
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *               fileSize:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pre-signed URL generated
 */
router.post('/upload', assetController.uploadAsset);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get specific asset
 *     tags: [Assets]
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
 *         description: Asset info
 */
router.get('/:id', assetController.getAsset);

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete specific asset
 *     tags: [Assets]
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
 *         description: Asset deleted
 */
router.delete('/:id', assetController.deleteAsset);

export default router;
