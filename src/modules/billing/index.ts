import { Router } from 'express';
import * as billingController from './controller'; // Resync TS server

const router = Router();

router.get('/subscription', billingController.getSubscription);
router.post('/payment-methods', billingController.addPaymentMethod);

export default router;
