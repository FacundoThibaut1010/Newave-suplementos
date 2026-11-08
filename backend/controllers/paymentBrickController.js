import Order from '../models/Order.js';
import Product from '../models/Product.js';
import correoArgentinoService from '../services/correoArgentinoService.js';
import {
  createCardPayment,
  getPayment,
  verifyWebhookSignature,
  processApprovedOrder,
  getFriendlyStatusMessage
} from '../services/mercadoPagoService.js';
import {
  getPaymentPolicy,
  validatePaymentPolicy,
  getBrickPolicyConfig
} from '../config/paymentPolicy.js';

/**
 * @desc    Obtener configuración pública de pagos y política activa
 * @route   GET /api/payments/config
 * @access  Public
 */
export const getPaymentConfig = async (req, res) => {
  try {
    const policy = getPaymentPolicy();
    const brickConfig = getBrickPolicyConfig(policy);
    const publicKey = process.env.MP_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY || '';

    res.json({
      publicKey,
      policy,
      brickConfig
    });
  } catch (error) {
    console.error('Error obteniendo configuración de pagos:', error);
    res.status(500).json({ message: 'Error al obtener configuración de pagos' });
  }
};

/**
 * @desc    Procesar pago con tarjeta (Card Payment Brick)
 * @route   POST /api/payments/card
 * @access  Public
 */
export const processCardPayment = async (req, res) => {
  try {
    const {
      orderItems,
      guestInfo,
      shippingAddress,
      shippingOption,
      cardPaymentData,
      idempotencyKey,
      user
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    if (!cardPaymentData || !cardPaymentData.token) {
      return res.status(400).json({ message: 'No se recibió el token de la tarjeta.' });
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
          return res.status(400).json({
            message: `Stock insuficiente para ${product.name} (${item.variant}). Disponibles: ${v.countInStock}`
          });
        }
      } else if (product.countInStock < qty) {
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}. Disponibles: ${product.countInStock}`
        });
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

    // 2. Validar y recalcular el costo de envío en el Servidor (nunca confiar en el cliente)
    let finalShippingPrice = 0;

    const isPickup =
      shippingOption &&
      (shippingOption.deliveredType === 'S' ||
        String(shippingOption.productName).toLowerCase().includes('retiro') ||
        String(shippingOption.productName).toLowerCase().includes('sucursal'));

    if (isPickup) {
      finalShippingPrice = 0;
    } else if (shippingAddress?.postalCode) {
      try {
        const rates = await correoArgentinoService.quoteRates(shippingAddress.postalCode, itemsForShipping);

        if (shippingOption) {
          const matched =
            rates.find(
              (r) => r.deliveredType === shippingOption.deliveredType && r.productType === shippingOption.productType
            ) || rates.find((r) => r.deliveredType === shippingOption.deliveredType);

          finalShippingPrice = matched ? matched.price : rates[0]?.price || 0;
        } else {
          finalShippingPrice = rates[0]?.price || 0;
        }
      } catch (shipErr) {
        console.warn('⚠️ No se pudo recalcular envío con Correo Argentino, usando respaldo:', shipErr.message);
        finalShippingPrice = process.env.CORREO_ENVIO_RESPALDO ? Number(process.env.CORREO_ENVIO_RESPALDO) : 0;
      }
    }

    const finalTransactionAmount = calculatedSubtotal + finalShippingPrice;

    // 3. Validar POLÍTICA DE PAGO en el Backend
    const currentPolicy = getPaymentPolicy();
    const policyValidation = validatePaymentPolicy(currentPolicy, {
      installments: cardPaymentData.installments,
      payment_type_id: cardPaymentData.payment_type_id
    });

    if (!policyValidation.valid) {
      return res.status(400).json({
        message: policyValidation.message,
        policy: currentPolicy
      });
    }

    // 4. Crear la orden en la BD con estado isPaid: false
    const order = new Order({
      user: user || undefined,
      orderItems: verifiedOrderItems,
      guestInfo,
      shippingAddress,
      paymentMethod: 'Tarjeta (Card Payment Brick)',
      shippingPrice: finalShippingPrice,
      totalPrice: finalTransactionAmount,
      isPaid: false
    });

    const savedOrder = await order.save();

    // 5. Enviar el cobro a POST /v1/payments de Mercado Pago
    let paymentResponse;
    try {
      paymentResponse = await createCardPayment({
        transaction_amount: finalTransactionAmount,
        token: cardPaymentData.token,
        installments: cardPaymentData.installments || 1,
        payment_method_id: cardPaymentData.payment_method_id,
        issuer_id: cardPaymentData.issuer_id,
        payer: {
          email: cardPaymentData.payer?.email || guestInfo?.email,
          identification: cardPaymentData.payer?.identification
        },
        orderId: savedOrder._id,
        description: `Pedido #${savedOrder._id.toString().slice(-6).toUpperCase()} - Newave`,
        idempotencyKey
      });
    } catch (mpError) {
      console.error('❌ Error de Mercado Pago API al procesar tarjeta:', mpError.message || mpError);
      
      const apiResponse = mpError.api_response || mpError.response;
      const statusDetail = apiResponse?.data?.status_detail || 'unknown_error';
      const friendly = getFriendlyStatusMessage('rejected', statusDetail);

      // Guardar el rechazo en la orden
      savedOrder.paymentResult = {
        status: 'rejected',
        status_detail: statusDetail,
        payment_method_id: cardPaymentData.payment_method_id
      };
      await savedOrder.save();

      return res.status(400).json({
        status: 'rejected',
        status_detail: statusDetail,
        friendlyMessage: friendly,
        orderId: savedOrder._id,
        message: friendly.description
      });
    }

    const { status, status_detail, id: paymentId } = paymentResponse;

    // Actualizar orden con los datos de Mercado Pago
    savedOrder.paymentResult = {
      mercadoPagoPaymentId: String(paymentId),
      status,
      status_detail,
      payment_method_id: paymentResponse.payment_method_id,
      payment_type_id: paymentResponse.payment_type_id,
      installments: paymentResponse.installments
    };

    // Si fue aprobado en el momento, procesar la orden inmediatamente
    if (status === 'approved') {
      await processApprovedOrder(savedOrder._id, paymentResponse);
    } else {
      await savedOrder.save();
    }

    const friendly = getFriendlyStatusMessage(status, status_detail);

    // Responder al frontend
    res.json({
      status,
      status_detail,
      paymentId,
      orderId: savedOrder._id,
      friendlyMessage: friendly,
      totalPrice: finalTransactionAmount
    });

  } catch (error) {
    console.error('❌ Error inesperado procesando pago con tarjeta:', error);
    res.status(500).json({
      message: 'Error al procesar el pago con tarjeta. Por favor intenta nuevamente.',
      error: error.message
    });
  }
};

/**
 * @desc    Webhook unificado para Mercado Pago (Checkout Pro y Card Payment Brick)
 * @route   POST /api/payments/webhook
 * @access  Public
 */
export const handleWebhook = async (req, res) => {
  try {
    const { headers, query, body } = req;

    // 1. Validar firma del webhook si está configurada MP_WEBHOOK_SECRET
    const isValidSignature = verifyWebhookSignature({ headers, query, rawBody: body });
    if (!isValidSignature) {
      console.warn('⚠️ Webhook rechazado: firma inválida');
      return res.status(401).send('Firma inválida');
    }

    const topic = query.topic || query.type || body?.type || body?.action;
    const paymentId = query['data.id'] || query.id || body?.data?.id;

    if ((topic === 'payment' || topic === 'payment.created' || topic === 'payment.updated') && paymentId) {
      // 2. Consultar el estado REAL a la API oficial de Mercado Pago (nunca confiar solo en el body)
      const paymentInfo = await getPayment(paymentId);

      if (paymentInfo && paymentInfo.status === 'approved') {
        const orderId = paymentInfo.external_reference;
        if (orderId) {
          await processApprovedOrder(orderId, paymentInfo);
        }
      }
    }

    // Responder 200 rápido a Mercado Pago
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error procesando Webhook de Mercado Pago:', error.message);
    res.status(200).send('Error registrado'); // Devolvemos 200 para evitar loops infinitos de reintentos
  }
};

