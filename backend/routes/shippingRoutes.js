import express from 'express';
import { getShippingQuote } from '../controllers/shippingController.js';

const router = express.Router();

// @route   POST /api/shipping/quote
// @desc    Cotizar envío con Correo Argentino
router.post('/quote', getShippingQuote);

export default router;

