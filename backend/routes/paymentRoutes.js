import express from 'express';
import {
  getPaymentConfig,
  processCardPayment,
  handleWebhook
} from '../controllers/paymentBrickController.js';

const router = express.Router();

// Configuración pública y política activa
router.get('/config', getPaymentConfig);

// Cobro directo con tarjeta (Card Payment Brick)
router.post('/card', processCardPayment);

// Webhook unificado de Mercado Pago
router.post('/webhook', handleWebhook);

export default router;

