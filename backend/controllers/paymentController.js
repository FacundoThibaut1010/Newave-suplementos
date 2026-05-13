import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno AHORA para asegurar que el token exista

// Inicializar cliente
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-000000',
});

// @desc    Crear preferencia de pago y guardar orden inicial
// @route   POST /api/orders/create_preference
// @access  Public (Guest) o Private
export const createPreference = async (req, res) => {
  try {
    const { orderItems, guestInfo, shippingAddress, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    // 1. Guardar la orden en la BD con estado "isPaid: false"
    const order = new Order({
      orderItems,
      guestInfo,
      shippingAddress,
      paymentMethod: 'Mercado Pago',
      totalPrice,
      isPaid: false,
    });
    
    const createdOrder = await order.save();

    // 2. Crear preferencia en Mercado Pago
    const preference = new Preference(client);
    
    // Convertir orderItems al formato de Mercado Pago
    const items = orderItems.map((item) => ({
      id: String(item.product),
      title: item.name,
      quantity: Number(item.qty),
      unit_price: Number(item.price),
      currency_id: 'ARS',
      picture_url: item.image,
    }));

    const response = await preference.create({
      body: {
        items,
        payer: {
          name: guestInfo.fullName,
          email: guestInfo.email,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`,
        },
        ...((process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) && { auto_return: 'approved' }),
        external_reference: String(createdOrder._id), // Para asociarlo en el webhook
        ...(process.env.WEBHOOK_URL && { notification_url: `${process.env.WEBHOOK_URL}/api/orders/webhook` })
      }
    });

    // Guardar el preferenceId por las dudas
    createdOrder.paymentResult = {
      mercadoPagoPreferenceId: response.id
    };
    await createdOrder.save();

    // 3. Devolver el init_point (URL para pagar)
    res.json({
      id: response.id,
      init_point: response.init_point
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia de Mercado Pago:', error);
    if (error.api_response) {
      console.error('API Response details:', JSON.stringify(error.api_response, null, 2));
    }
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    res.status(500).json({ message: 'Hubo un error al generar el pago', error: error.message || error.toString() });
  }
};

// Helper function to process an approved order
const processApprovedOrder = async (orderId, paymentInfo) => {
  const order = await Order.findById(orderId);
          
  if (order && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      mercadoPagoPaymentId: paymentInfo.id,
      status: paymentInfo.status,
      email_address: paymentInfo.payer?.email,
      payment_method_id: paymentInfo.payment_method_id,
      payment_type_id: paymentInfo.payment_type_id
    };
    
    await order.save();
    console.log(`✅ Orden ${orderId} pagada correctamente.`);

    // 🌟 Descontar stock 🌟
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock = Math.max(0, product.countInStock - item.qty);
        await product.save();
      }
    }
    
    // 🌟 Enviar email al cliente 🌟
    if (order.guestInfo && order.guestInfo.email) {
      await sendOrderConfirmationEmail(order);
    }
  }
};

// @desc    Recibir notificaciones de MP (Webhook)
// @route   POST /api/orders/webhook
// @access  Public
export const mercadoPagoWebhook = async (req, res) => {
  try {
    const { query } = req;
    
    const topic = query.topic || query.type;
    
    if (topic === 'payment') {
      const paymentId = query['data.id'] || query.id;
      
      const paymentClient = new Payment(client);
      const paymentInfo = await paymentClient.get({ id: paymentId });
      
      if (paymentInfo.status === 'approved') {
        const orderId = paymentInfo.external_reference;
        if (orderId) {
          await processApprovedOrder(orderId, paymentInfo);
        }
      }
    }
    
    res.status(200).send('Webhook OK');
  } catch (error) {
    console.error('Error en Webhook de Mercado Pago:', error);
    res.status(500).send('Error');
  }
};

// @desc    Verificar pago manualmente (Fallback para local/sin webhooks)
// @route   POST /api/orders/verify
// @access  Public
export const verifyPaymentFallback = async (req, res) => {
  try {
    const { payment_id, external_reference } = req.body;
    
    if (!payment_id || !external_reference || external_reference === 'null') {
      return res.status(400).json({ message: 'Faltan parámetros' });
    }

    const paymentClient = new Payment(client);
    const paymentInfo = await paymentClient.get({ id: payment_id });
    
    if (paymentInfo.status === 'approved') {
      await processApprovedOrder(external_reference, paymentInfo);
      return res.json({ message: 'Pago verificado exitosamente' });
    } else {
      return res.status(400).json({ message: 'El pago no está aprobado' });
    }
  } catch (error) {
    console.error('Error verificando pago (Fallback):', error);
    res.status(500).json({ message: 'Error verificando pago' });
  }
};
