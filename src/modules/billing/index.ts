import { Router } from 'express';
import * as billingController from './controller'; // Resync TS server

const router = Router();

router.get('/subscription', billingController.getSubscription);
router.post('/payment-methods', billingController.addPaymentMethod);
router.put('/payment-methods/:id', billingController.updatePaymentMethod);
router.get('/payment-methods', billingController.getPaymentMethods);

export default router;
