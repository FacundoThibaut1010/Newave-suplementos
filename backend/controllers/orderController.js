import Order from '../models/Order.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Needs Auth, but keeping basic for now)
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('¡Tu carrito parece estar vacío! Añade algo rico antes de comprar 🛒');
  } else {
    try {
      const order = new Order({
        orderItems,
        // user: req.user._id, // Will add later with Auth
        user: "661b3f3b9b3e1a001fb1e2c1", // Placeholder ID for now
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createdOrder = await order.save();

      res.status(201).json({
        message: '¡Felicidades! Tu orden ha sido creada con éxito. ¡Pronto estará en camino! 🚚💨',
        order: createdOrder
      });
    } catch (error) {
      res.status(500);
      throw new Error('No pudimos procesar tu orden en este momento. ¡No te preocupes, inténtalo de nuevo! 🛠️');
    }
  }
};
