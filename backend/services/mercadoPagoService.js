import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderConfirmationEmail, sendNewOrderNotificationToSeller } from '../utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

// Obtener credenciales de Mercado Pago
const getAccessToken = () => {
  return process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';
};

export const getClient = () => {
  const token = getAccessToken();
  if (!token) {
    console.warn('⚠️ MP_ACCESS_TOKEN / MERCADOPAGO_ACCESS_TOKEN no configurado.');
  }
  return new MercadoPagoConfig({ accessToken: token });
};

/**
 * Traduce los status_detail de Mercado Pago a mensajes claros para el comprador
 */
export const getFriendlyStatusMessage = (status, statusDetail) => {
  if (status === 'approved') {
    return {
      title: '¡Pago Aprobado!',
      description: 'Tu pago fue procesado con éxito. Ya estamos preparando tu pedido.'
    };
  }

  if (status === 'in_process' || status === 'pending') {
    return {
      title: 'Pago en Revisión',
      description: 'Mercado Pago está procesando tu pago. Te avisaremos por email en cuanto se confirme.'
    };
  }

  // Rechazos
  switch (statusDetail) {
    case 'cc_rejected_bad_filled_card_number':
      return {
        title: 'Número de tarjeta incorrecto',
        description: 'Revisá el número de tarjeta ingresado y volvé a intentarlo.'
      };
    case 'cc_rejected_bad_filled_date':
      return {
        title: 'Fecha de vencimiento incorrecta',
        description: 'Revisá el mes y año de vencimiento de tu tarjeta.'
      };
    case 'cc_rejected_bad_filled_security_code':
      return {
        title: 'Código de seguridad incorrecto',
        description: 'Revisá el código de 3 o 4 dígitos al dorso de la tarjeta.'
      };
    case 'cc_rejected_insufficient_amount':
      return {
        title: 'Fondos insuficientes',
        description: 'Tu tarjeta no tiene fondos o límite suficiente para completar esta compra.'
      };
    case 'cc_rejected_call_for_authorize':
      return {
        title: 'Autorización requerida',
        description: 'Debes comunicarte con el banco emisor de tu tarjeta para autorizar el pago.'
      };
    case 'cc_rejected_card_disabled':
      return {
        title: 'Tarjeta no habilitada',
        description: 'Llamá a tu banco para habilitar la tarjeta o probá con otro medio de pago.'
      };
    case 'cc_rejected_duplicated_payment':
      return {
        title: 'Pago duplicado',
        description: 'Ya realizaste un pago por este mismo importe recientemente.'
      };
    case 'cc_rejected_high_risk':
      return {
        title: 'Pago rechazado por prevención',
        description: 'Mercado Pago rechazó el pago por políticas de seguridad. Te sugerimos pagar con otro medio.'
      };
    case 'cc_rejected_max_attempts':
      return {
        title: 'Límite de intentos superado',
        description: 'Superaste la cantidad de intentos permitidos. Probá con otra tarjeta.'
      };
    default:
      return {
        title: 'Pago rechazado',
        description: 'No pudimos procesar el cobro con la tarjeta seleccionada. Podés intentar nuevamente o usar otro medio.'
      };
  }
};

/**
 * Crea un pago con tarjeta usando la API POST /v1/payments de Mercado Pago (Card Payment Brick)
 */
export const createCardPayment = async ({
  transaction_amount,
  token,
  installments = 1,
  payment_method_id,
  issuer_id,
  payer,
  orderId,
  description = 'Compra en Newave Suplementos',
  idempotencyKey
}) => {
  const client = getClient();
  const payment = new Payment(client);

  const paymentData = {
    transaction_amount: Number(transaction_amount),
    token,
    description,
    installments: Number(installments) || 1,
    payment_method_id,
    ...(issuer_id && { issuer_id: String(issuer_id) }),
    payer: {
      email: payer?.email,
      ...(payer?.identification && {
        identification: {
          type: payer.identification.type,
          number: String(payer.identification.number)
        }
      })
    },
    external_reference: String(orderId),
    statement_descriptor: 'NEWAVE',
    ...(process.env.WEBHOOK_URL && {
      notification_url: `${process.env.WEBHOOK_URL}/api/payments/webhook`
    })
  };

  const requestOptions = {
    idempotencyKey: idempotencyKey || crypto.randomUUID()
  };

  return await payment.create({
    body: paymentData,
    requestOptions
  });
};

/**
 * Consulta el estado real de un pago en Mercado Pago (GET /v1/payments/{id})
 */
export const getPayment = async (paymentId) => {
  const client = getClient();
  const payment = new Payment(client);
  return await payment.get({ id: String(paymentId) });
};

/**
 * Valida la firma del webhook de Mercado Pago (x-signature)
 * Basado en la documentación oficial: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export const verifyWebhookSignature = ({ headers, query, rawBody }) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Si no está configurada la clave en local o test, permitimos continuar registrando un aviso
    console.warn('⚠️ MP_WEBHOOK_SECRET no configurada. Saltando verificación de firma en entorno no estricto.');
    return true;
  }

  const xSignature = headers['x-signature'];
  const xRequestId = headers['x-request-id'];

  if (!xSignature || !xRequestId) {
    console.warn('⚠️ Webhook recibido sin headers x-signature o x-request-id');
    return false;
  }

  try {
    // Extraer ts y v1 de x-signature: "ts=...,v1=..."
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
      const [key, val] = part.trim().split('=');
      if (key === 'ts') ts = val;
      if (key === 'v1') hash = val;
    }

    if (!ts || !hash) return false;

    // Obtener data.id de query
    const dataId = query['data.id'] || query.id || '';

    // Manifest format según doc oficial: "id:[data.id];request-id:[x-request-id];ts:[ts];"
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hash));
  } catch (err) {
    console.error('❌ Error validando firma del webhook:', err.message);
    return false;
  }
};

/**
 * Procesa una orden aprobada de forma IDEMPOTENTE:
 * 1. Marca la orden como pagada y guarda detalles del pago.
 * 2. Descuenta el stock y si llega a 0, desactiva automáticamente el producto (isActive = false).
 * 3. Envía los emails de confirmación al cliente y notificación al vendedor.
 * 4. Deja preparado el hook para la integración futura de MiCorreo (POST /shipping/import).
 */
export const processApprovedOrder = async (orderId, paymentInfo) => {
  if (!orderId) return null;

  const order = await Order.findById(orderId);
  if (!order) {
    console.warn(`⚠️ Orden ${orderId} no encontrada para procesar aprobación.`);
    return null;
  }

  // Idempotencia: si ya está pagada, no volver a descontar stock ni reenviar correos
  if (order.isPaid) {
    console.log(`ℹ️ Orden ${orderId} ya se encontraba marcada como pagada (idempotente).`);
    return order;
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    ...order.paymentResult,
    mercadoPagoPaymentId: String(paymentInfo.id),
    status: paymentInfo.status,
    status_detail: paymentInfo.status_detail,
    email_address: paymentInfo.payer?.email || order.guestInfo?.email,
    payment_method_id: paymentInfo.payment_method_id,
    payment_type_id: paymentInfo.payment_type_id,
    installments: paymentInfo.installments || 1
  };

  await order.save();
  console.log(`✅ Orden ${orderId} aprobada y marcada como pagada.`);

  // 1. Descontar stock y desactivar automáticamente si stock === 0
  for (const item of order.orderItems) {
    try {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.variant && product.variants && product.variants.length > 0) {
          const vIndex = product.variants.findIndex((v) => v.flavor === item.variant);
          if (vIndex !== -1) {
            product.variants[vIndex].countInStock = Math.max(
              0,
              product.variants[vIndex].countInStock - item.qty
            );
          }
        } else {
          product.countInStock = Math.max(0, product.countInStock - item.qty);
        }

        // Calcular stock total actualizado
        const totalStock = (product.variants && product.variants.length > 0)
          ? product.variants.reduce((acc, v) => acc + (Number(v.countInStock) || 0), 0)
          : Number(product.countInStock || 0);

        // Si el stock llega a 0, desactivar automáticamente el producto
        if (totalStock <= 0) {
          product.isActive = false;
          console.log(`⚠️ Producto ${product.name} se quedó sin stock y fue desactivado automáticamente.`);
        }

        await product.save();
      }
    } catch (stockErr) {
      console.error(`❌ Error actualizando stock para producto ${item.product}:`, stockErr.message);
    }
  }

  // 2. Enviar emails
  try {
    if (order.guestInfo?.email) {
      await sendOrderConfirmationEmail(order);
    }
    await sendNewOrderNotificationToSeller(order);
  } catch (emailErr) {
    console.error('❌ Error enviando emails de confirmación:', emailErr.message);
  }

  // 3. PRÓXIMO PASO (PREPARADO): Importar envío en MiCorreo al confirmarse el pago
  // if (order.shippingPrice > 0 && order.shippingOption?.deliveredType !== 'S') {
  //   try {
  //     await correoArgentinoService.importShipping({ orderId: order._id, ... });
  //   } catch (importErr) {
  //     console.error('Error importando envío en MiCorreo:', importErr);
  //   }
  // }

  return order;
};

