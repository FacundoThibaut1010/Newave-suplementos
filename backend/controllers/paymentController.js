import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderConfirmationEmail, sendNewOrderNotificationToSeller } from '../utils/emailService.js';
import correoArgentinoService from '../services/correoArgentinoService.js';
import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno AHORA para asegurar que el token exista

// Inicializar cliente
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-000000',
});

// @desc    Crear preferencia de pago y guardar orden inicial
// @route   POST /api/orders/create_preference
// @desc    Crear preferencia de pago y guardar orden inicial
// @route   POST /api/orders/create_preference
// @access  Public (Guest) o Private
export const createPreference = async (req, res) => {
  try {
    const { orderItems, guestInfo, shippingAddress, shippingPrice, shippingOption, user } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    // 1. Validar productos en la Base de Datos, verificar que estén ACTIVOS y calcular precios reales
    const verifiedOrderItems = [];
    const itemsForShipping = [];
    let calculatedSubtotal = 0;

    for (const item of orderItems) {
      const rawId = item.product || item.id || item._id;
      const productId = typeof rawId === 'string' && rawId.includes('-') ? rawId.split('-')[0] : rawId;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: `El producto "${item.name}" ya no existe en el catálogo.` });
      }

      if (product.isActive === false) {
        return res.status(400).json({
          message: `El producto "${product.name}" está inactivo y no se puede comprar.`
        });
      }

      const qty = Math.max(1, Number(item.qty || item.quantity) || 1);

      // Verificar stock
      if (item.variant && product.variants?.length > 0) {
        const v = product.variants.find((vr) => vr.flavor === item.variant);
        if (v && v.countInStock < qty) {
          return res.status(400).json({ message: `Stock insuficiente para ${product.name} (${item.variant}). Disponibles: ${v.countInStock}` });
        }
      } else if (product.countInStock < qty) {
        return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Disponibles: ${product.countInStock}` });
      }

      const realPrice = Number(product.price);
      calculatedSubtotal += realPrice * qty;

      verifiedOrderItems.push({
        name: product.name,
        qty,
        image: item.image || product.images?.[0] || '',
        price: realPrice,
        product: product._id,
        variant: item.variant || ''
      });

      itemsForShipping.push({
        quantity: qty,
        weight: product.weightInGrams || 500,
        height: product.height || 15,
        width: product.width || 15,
        length: product.length || 15
      });
    }

    // 2. Validar y recalcular el costo de envío con Correo Argentino en el Backend (no confiar en el frontend)
    let finalShippingPrice = 0;
    let shippingLabel = 'Envío';

    if (shippingOption && (shippingOption.deliveredType === 'S' || String(shippingOption.productName).toLowerCase().includes('retiro') || String(shippingOption.productName).toLowerCase().includes('sucursal'))) {
      // Retiro en sucursal / local oficial: $0 (Gratis)
      finalShippingPrice = 0;
      shippingLabel = 'Retiro en Sucursal (Gratis)';
    } else if (shippingAddress?.postalCode) {
      try {
        const rates = await correoArgentinoService.quoteRates(shippingAddress.postalCode, itemsForShipping);
        
        // Buscar la tarifa seleccionada por el cliente (por tipo de entrega o precio)
        if (shippingOption) {
          const matched = rates.find(
            (r) => r.deliveredType === shippingOption.deliveredType && r.productType === shippingOption.productType
          ) || rates.find((r) => r.deliveredType === shippingOption.deliveredType);

          if (matched) {
            finalShippingPrice = matched.price;
            shippingLabel = `${matched.productName} (A Domicilio)`;
          } else {
            finalShippingPrice = rates[0]?.price || Number(shippingPrice) || 0;
            shippingLabel = rates[0]?.productName || 'Correo Argentino';
          }
        } else if (shippingPrice && Number(shippingPrice) > 0) {
          // Si mandó un precio, verificar si coincide con alguna opción oficial de Correo
          const matchedPrice = rates.find((r) => Math.abs(r.price - Number(shippingPrice)) < 5);
          finalShippingPrice = matchedPrice ? matchedPrice.price : rates[0]?.price || Number(shippingPrice);
          shippingLabel = matchedPrice?.productName || 'Correo Argentino';
        } else {
          finalShippingPrice = rates[0]?.price || 0;
          shippingLabel = rates[0]?.productName || 'Correo Argentino';
        }
      } catch (shipErr) {
        console.warn('⚠️ No se pudo recalcular envío con Correo Argentino, usando respaldo:', shipErr.message);
        finalShippingPrice = Number(shippingPrice) || (process.env.CORREO_ENVIO_RESPALDO ? Number(process.env.CORREO_ENVIO_RESPALDO) : 0);
        shippingLabel = 'Envío Estándar (Tarifa plana)';
      }
    }

    const calculatedTotalPrice = calculatedSubtotal + finalShippingPrice;

    // 3. Guardar la orden en la BD con estado "isPaid: false"
    const order = new Order({
      user,
      orderItems: verifiedOrderItems,
      guestInfo,
      shippingAddress,
      paymentMethod: 'Mercado Pago',
      shippingPrice: finalShippingPrice,
      totalPrice: calculatedTotalPrice,
      isPaid: false,
    });

    const createdOrder = await order.save();

    // 4. Crear preferencia en Mercado Pago
    const preference = new Preference(client);

    const items = verifiedOrderItems.map((item) => ({
      id: String(item.product),
      title: item.name + (item.variant ? ` (${item.variant})` : ''),
      quantity: Number(item.qty),
      unit_price: Number(item.price),
      currency_id: 'ARS',
      picture_url: item.image,
    }));

    // Si hay costo de envío calculado, se añade como ítem de Mercado Pago
    if (finalShippingPrice > 0) {
      items.push({
        id: 'shipping_cost',
        title: `Costo de Envío: ${shippingLabel}`,
        quantity: 1,
        unit_price: Number(finalShippingPrice),
        currency_id: 'ARS'
      });
    }

    const response = await preference.create({
      body: {
        items,
        payer: {
          name: guestInfo.fullName,
          email: guestInfo.email,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/checkout/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/checkout`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/checkout`,
        },
        ...((process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) && { auto_return: 'approved' }),
        external_reference: String(createdOrder._id),
        ...(process.env.WEBHOOK_URL && { notification_url: `${process.env.WEBHOOK_URL}/api/orders/webhook` })
      }
    });

    createdOrder.paymentResult = {
      mercadoPagoPreferenceId: response.id
    };
    await createdOrder.save();

    res.json({
      id: response.id,
      init_point: response.init_point,
      shippingPrice: finalShippingPrice,
      totalPrice: calculatedTotalPrice
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
        if (item.variant && product.variants && product.variants.length > 0) {
          // Descontar del sabor específico
          const variantIndex = product.variants.findIndex(v => v.flavor === item.variant);
          if (variantIndex !== -1) {
            product.variants[variantIndex].countInStock = Math.max(0, product.variants[variantIndex].countInStock - item.qty);
          }
        } else {
          // Descontar del stock general si no hay variante
          product.countInStock = Math.max(0, product.countInStock - item.qty);
        }
        await product.save();
      }
    }

    // 🌟 Enviar email al cliente 🌟
    if (order.guestInfo && order.guestInfo.email) {
      await sendOrderConfirmationEmail(order);
    }

    // 🌟 Enviar email al vendedor 🌟
    await sendNewOrderNotificationToSeller(order);
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
