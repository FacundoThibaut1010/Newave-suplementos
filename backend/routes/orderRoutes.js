import express from 'express';
const router = express.Router();
import { addOrderItems } from '../controllers/orderController.js';
import { createPreference, verifyPaymentFallback } from '../controllers/paymentController.js';
import { handleWebhook } from '../controllers/paymentBrickController.js';

router.post('/', addOrderItems);
router.post('/create_preference', createPreference);
router.post('/webhook', handleWebhook);
router.post('/verify', verifyPaymentFallback);

export default router;
