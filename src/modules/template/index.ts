import { Router } from 'express';
import * as templateController from './controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: Video templates
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/', templateController.getTemplates);

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create a newly customized template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               schema:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template created
 */
router.post('/', templateController.createTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get template details
 *     tags: [Templates]
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
 *         description: Template found
 */
router.get('/:id', templateController.getTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Update template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Template updated
 */
router.put('/:id', templateController.updateTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Delete template
 *     tags: [Templates]
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
 *         description: Template deleted
 */
router.delete('/:id', templateController.deleteTemplate);

export default router;
