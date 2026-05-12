import nodemailer from 'nodemailer';

export const sendOrderConfirmationEmail = async (order) => {
  try {
    // Si no hay credenciales, saltamos el envío en local
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Credenciales de email no configuradas. Simulando envío a:', order.guestInfo.email);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail', // O el proveedor que uses
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = order.orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.image}" width="50" style="border-radius: 8px;" />
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">
          ${item.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          x${item.qty}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          $${(item.price * item.qty).toLocaleString('es-AR')}
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Newave Store" <${process.env.EMAIL_USER}>`,
      to: order.guestInfo.email,
      subject: '¡Tu pedido de Newave está confirmado! 🌊',
      html: `
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
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Email de confirmación enviado a ${order.guestInfo.email}`);

  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
};
