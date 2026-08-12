// Debe coincidir con un remitente validado en Brevo, si no la API rechaza el envío con 400.
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'newavesuplementos2026@gmail.com';

// Casilla real que lee el equipo. El remitente de Brevo y esta dirección son distintas,
// así que las respuestas de los clientes se redirigen acá.
const REPLY_TO = { name: 'Newave', email: process.env.ADMIN_EMAIL || 'newavesuple2026@gmail.com' };

export const sendOrderConfirmationEmail = async (order) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ BREVO_API_KEY no configurada. Simulando envío a:', order.guestInfo.email);
      return;
    }

    const itemsHtml = order.orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.image}" width="50" style="border-radius: 8px;" />
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">
          ${item.name}
          ${item.variant ? `<br><span style="font-size: 12px; color: #666; font-weight: normal;">Sabor: ${item.variant}</span>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          x${item.qty}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          $${(item.price * item.qty).toLocaleString('es-AR')}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #CAA959; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 20px; font-style: italic; margin: 0 auto 10px;">NW</div>
          <h1 style="color: #202A36; font-style: italic; text-transform: uppercase; margin: 0; font-weight: 900; font-size: 24px;">¡Gracias por tu compra a Newave!</h1>
          <p style="color: #666; margin-top: 10px; font-size: 16px;">Estamos preparando todo para que disfrutes la mejor calidad en suplementación.</p>
        </div>
        
        <h3 style="color: #202A36; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Resumen del Pedido</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 15px 10px; font-weight: bold; text-align: right;">TOTAL</td>
              <td style="padding: 15px 10px; font-weight: 900; text-align: right; color: #202A36; font-size: 18px;">$${order.totalPrice.toLocaleString('es-AR')}</td>
            </tr>
          </tfoot>
        </table>

        <h3 style="color: #202A36; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Datos de Entrega</h3>
        <div style="background: #F9F9F9; padding: 15px; border-radius: 12px; color: #555; line-height: 1.6;">
          <strong>${order.guestInfo.fullName}</strong><br>
          ${order.shippingAddress.address} ${order.shippingAddress.addressLine2 ? `(${order.shippingAddress.addressLine2})` : ''}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} CP: ${order.shippingAddress.postalCode}
        </div>

        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          <p>Si tienes alguna pregunta, responde a este correo.</p>
          <p>&copy; ${new Date().getFullYear()} Newave Store. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Newave Store',
          email: SENDER_EMAIL
        },
        to: [{ email: order.guestInfo.email, name: order.guestInfo.fullName }],
        replyTo: REPLY_TO,
        subject: '¡Tu pedido de Newave está confirmado! 🌊',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log(`✉️ Email de confirmación enviado a ${order.guestInfo.email} vía Brevo`);

  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error.message);
  }
};

export const sendNewOrderNotificationToSeller = async (order) => {
  try {
    if (!process.env.BREVO_API_KEY) return;

    const itemsHtml = order.orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name} (x${item.qty})
          ${item.variant ? `<br><span style="font-size: 12px; color: #666;">Sabor: ${item.variant}</span>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          $${(item.price * item.qty).toLocaleString('es-AR')}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px;">
        <h1 style="color: #202A36; font-weight: 900; font-size: 24px;">¡Nueva venta realizada! 🎉</h1>
        <p style="color: #666; font-size: 16px;">El cliente <strong>${order.guestInfo.fullName}</strong> acaba de realizar una compra.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td style="padding: 15px 10px; font-weight: bold; text-align: right;">TOTAL:</td>
              <td style="padding: 15px 10px; font-weight: 900; text-align: right; color: #CAA959; font-size: 18px;">$${order.totalPrice.toLocaleString('es-AR')}</td>
            </tr>
          </tfoot>
        </table>

        <h3 style="color: #202A36;">Datos del Cliente:</h3>
        <ul style="color: #555; line-height: 1.6;">
          <li>Email: ${order.guestInfo.email}</li>
          <li>Teléfono: ${order.guestInfo.phone || 'No especificado'}</li>
          <li>Dirección: ${order.shippingAddress.address} ${order.shippingAddress.addressLine2 ? `(${order.shippingAddress.addressLine2})` : ''}</li>
          <li>Localidad: ${order.shippingAddress.city}, ${order.shippingAddress.state} CP: ${order.shippingAddress.postalCode}</li>
        </ul>
        <p style="margin-top: 20px;">Ingresa al panel de administración para ver todos los detalles y gestionar el envío.</p>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Newave Store',
          email: SENDER_EMAIL
        },
        to: [{ email: process.env.ADMIN_EMAIL || 'newavesuplementos2026@gmail.com', name: 'Newave Admin' }], // Send to seller email
        subject: '¡Nueva Venta en Newave! 💰',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }
    console.log('✉️ Notificación de nueva venta enviada al vendedor');
  } catch (error) {
    console.error('❌ Error enviando notificación al vendedor:', error.message);
  }
};

export const sendOrderDispatchedEmail = async (order) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ BREVO_API_KEY no configurada. Simulando envío de DESPACHO a:', order.guestInfo.email);
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #202A36; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 20px; font-style: italic; margin: 0 auto 10px;">📦</div>
          <h1 style="color: #202A36; font-style: italic; text-transform: uppercase; margin: 0; font-weight: 900; font-size: 24px;">¡Paquete Despachado!</h1>
          <p style="color: #666; margin-top: 10px; font-size: 16px;">Acabamos de entregar tu pedido al correo. ¡Pronto llegará a tus manos!</p>
        </div>
        
        <h3 style="color: #202A36; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Datos de Entrega</h3>
        <div style="background: #F9F9F9; padding: 15px; border-radius: 12px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          <strong>${order.guestInfo.fullName}</strong><br>
          ${order.shippingAddress.address} ${order.shippingAddress.addressLine2 ? `(${order.shippingAddress.addressLine2})` : ''}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} CP: ${order.shippingAddress.postalCode}
        </div>

        <h3 style="color: #202A36; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Productos en el paquete</h3>
        <table style="width: 100%; border-collapse: collapse; background: #F9F9F9; border-radius: 12px; overflow: hidden;">
          <tbody>
            ${order.orderItems.map(item => `
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">
                  ${item.name} <span style="color: #CAA959;">(x${item.qty})</span>
                  ${item.variant ? `<br><span style="font-size: 12px; color: #888; font-weight: normal;">Sabor: ${item.variant}</span>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          <p>Gracias por confiar en nosotros.</p>
          <p>&copy; ${new Date().getFullYear()} Newave Store. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Newave Store',
          email: SENDER_EMAIL
        },
        to: [{ email: order.guestInfo.email, name: order.guestInfo.fullName }],
        replyTo: REPLY_TO,
        subject: '¡Tu pedido de Newave ya está en camino! 🚚',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log(`✉️ Email de DESPACHO enviado a ${order.guestInfo.email} vía Brevo`);

  } catch (error) {
    console.error('❌ Error enviando email de despacho:', error.message);
  }
};

export const sendOrderDeliveredEmail = async (order) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ BREVO_API_KEY no configurada. Simulando envío de ENTREGA a:', order.guestInfo.email);
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #10B981; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 20px; font-style: italic; margin: 0 auto 10px;">✓</div>
          <h1 style="color: #202A36; font-style: italic; text-transform: uppercase; margin: 0; font-weight: 900; font-size: 24px;">¡Paquete Entregado!</h1>
          <p style="color: #666; margin-top: 10px; font-size: 16px;">Tu pedido ha sido entregado exitosamente. ¡Esperamos que lo disfrutes!</p>
        </div>
        
        <h3 style="color: #202A36; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Datos de Entrega</h3>
        <div style="background: #F9F9F9; padding: 15px; border-radius: 12px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          <strong>${order.guestInfo.fullName}</strong><br>
          ${order.shippingAddress.address} ${order.shippingAddress.addressLine2 ? `(${order.shippingAddress.addressLine2})` : ''}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} CP: ${order.shippingAddress.postalCode}
        </div>

        <h3 style="color: #202A36; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Productos entregados</h3>
        <table style="width: 100%; border-collapse: collapse; background: #F9F9F9; border-radius: 12px; overflow: hidden;">
          <tbody>
            ${order.orderItems.map(item => `
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">
                  ${item.name} <span style="color: #10B981;">(x${item.qty})</span>
                  ${item.variant ? `<br><span style="font-size: 12px; color: #888; font-weight: normal;">Sabor: ${item.variant}</span>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          <p>Gracias por tu compra. ¡Te esperamos pronto en Newave!</p>
          <p>&copy; ${new Date().getFullYear()} Newave Store. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Newave Store',
          email: SENDER_EMAIL
        },
        to: [{ email: order.guestInfo.email, name: order.guestInfo.fullName }],
        replyTo: REPLY_TO,
        subject: '¡Tu paquete de Newave ha sido entregado! 🎉',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log(`✉️ Email de ENTREGA enviado a ${order.guestInfo.email} vía Brevo`);

  } catch (error) {
    console.error('❌ Error enviando email de entrega:', error.message);
  }
};

export const sendWelcomeEmail = async (user) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ BREVO_API_KEY no configurada. Simulando envío de Bienvenida a:', user.email);
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #CAA959; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 20px; font-style: italic; margin: 0 auto 10px;">NW</div>
          <h1 style="color: #202A36; font-style: italic; text-transform: uppercase; margin: 0; font-weight: 900; font-size: 24px;">¡Bienvenido a Newave!</h1>
          <p style="color: #666; margin-top: 10px; font-size: 16px;">¡Hola ${user.name}! Gracias por registrarte en Newave Suplementos.</p>
        </div>
        
        <div style="background: #F9F9F9; padding: 20px; border-radius: 12px; color: #555; line-height: 1.6; margin-bottom: 20px; text-align: center;">
          <p>Estamos emocionados de acompañarte en tu progreso.</p>
          <p>En nuestra tienda encontrarás la mejor calidad de suplementación deportiva para potenciar tus entrenamientos y alcanzar tus metas.</p>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          <p>Si tienes alguna pregunta, responde a este correo o contáctanos por nuestras redes.</p>
          <p>&copy; ${new Date().getFullYear()} Newave Store. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Newave Store',
          email: SENDER_EMAIL
        },
        to: [{ email: user.email, name: user.name }],
        replyTo: REPLY_TO,
        subject: '¡Bienvenido a Newave Suplementos! 💪',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log(`✉️ Email de Bienvenida enviado a ${user.email} vía Brevo`);

  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error.message);
  }
};

export const sendVerificationEmail = async (email, code) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ BREVO_API_KEY no configurada. Código simulado para', email, ':', code);
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #CAA959; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 20px; font-style: italic; margin: 0 auto 10px;">NW</div>
          <h1 style="color: #202A36; font-style: italic; text-transform: uppercase; margin: 0; font-weight: 900; font-size: 24px;">Verifica tu correo</h1>
          <p style="color: #666; margin-top: 10px; font-size: 16px;">Usa este código de 4 dígitos para completar tu registro en Newave.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #CAA959;">${code}</span>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Newave Store. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Newave Store', email: SENDER_EMAIL },
        to: [{ email: email, name: 'Nuevo Usuario' }],
        replyTo: REPLY_TO,
        subject: 'Código de verificación - Newave',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) throw new Error(await response.text());
    console.log(`✉️ Email de verificación enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error.message);
    throw new Error('No se pudo enviar el correo de verificación');
  }
};

export const sendPasswordResetEmail = async (email, code) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('⚠️ BREVO_API_KEY no configurada. Código de reseteo simulado para', email, ':', code);
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #CAA959; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; color: #fff; font-weight: 900; font-size: 20px; font-style: italic; margin: 0 auto 10px;">NW</div>
          <h1 style="color: #202A36; font-style: italic; text-transform: uppercase; margin: 0; font-weight: 900; font-size: 24px;">Recuperar Contraseña</h1>
          <p style="color: #666; margin-top: 10px; font-size: 16px;">Usa este código de 4 dígitos para restablecer tu contraseña en Newave.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #CAA959;">${code}</span>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #aaa; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Newave Store. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Newave Store', email: SENDER_EMAIL },
        to: [{ email: email, name: 'Usuario' }],
        replyTo: REPLY_TO,
        subject: 'Recuperar Contraseña - Newave',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) throw new Error(await response.text());
    console.log(`✉️ Email de recuperación enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error.message);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
};

