import express from 'express';
const router = express.Router();
import { addOrderItems } from '../controllers/orderController.js';
import { createPreference, mercadoPagoWebhook, verifyPaymentFallback } from '../controllers/paymentController.js';

router.post('/', addOrderItems);
router.post('/create_preference', createPreference);
router.post('/webhook', mercadoPagoWebhook);
router.post('/verify', verifyPaymentFallback);

export default router;
