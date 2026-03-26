import { Router } from 'express';
import * as billingController from './controller'; // Resync TS server

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing and subscription
 */

/**
 * @swagger
 * /api/billing/subscription:
 *   get:
 *     summary: Get user subscription
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription info
 */
router.get('/subscription', billingController.getSubscription);

/**
 * @swagger
 * /api/billing/payment-methods:
 *   post:
 *     summary: Add payment method
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               last4:
 *                 type: string
 *               expiry:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment method added
 */
router.post('/payment-methods', billingController.addPaymentMethod);

/**
 * @swagger
 * /api/billing/payment-methods/{id}:
 *   put:
 *     summary: Update payment method
 *     tags: [Billing]
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
 *         description: Payment method updated
 */
router.put('/payment-methods/:id', billingController.updatePaymentMethod);

/**
 * @swagger
 * /api/billing/payment-methods:
 *   get:
 *     summary: Get payment methods
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get('/payment-methods', billingController.getPaymentMethods);

export default router;
