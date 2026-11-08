import mongoose from 'mongoose';
import Product from '../models/Product.js';
import correoArgentinoService from '../services/correoArgentinoService.js';

// @desc    Obtener cotizaciones de envío de Correo Argentino
// @route   POST /api/shipping/quote
// @access  Public
export const getShippingQuote = async (req, res, next) => {
  try {
    const { postalCodeDestination, items, cartItems } = req.body;
    const rawItems = items || cartItems;

    if (!postalCodeDestination) {
      return res.status(400).json({ message: 'El código postal de destino es requerido.' });
    }

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ message: 'Se requieren productos en el carrito para cotizar el envío.' });
    }

    // Normalizar lista de productos y cantidades solicitadas
    const requestedItems = rawItems
      .map((item) => {
        const rawId = item.id || item.productId || item.product || item._id;
        const productId = typeof rawId === 'string' && rawId.includes('-') ? rawId.split('-')[0] : rawId;
        const quantity = Math.max(1, Number(item.quantity || item.qty) || 1);
        return {
          productId: productId ? String(productId).trim() : null,
          quantity,
          name: item.name || 'Producto',
        };
      })
      .filter((i) => Boolean(i.productId));

    if (requestedItems.length === 0) {
      return res.status(400).json({ message: 'No se encontraron productos válidos para cotizar.' });
    }

    // Buscar productos válidos en la base de datos
    const validObjectIds = requestedItems
      .map((i) => i.productId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const dbProducts = validObjectIds.length > 0 ? await Product.find({ _id: { $in: validObjectIds } }) : [];
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    const itemsWithDimensions = [];

    for (const reqItem of requestedItems) {
      const product = reqItem.productId ? productMap.get(reqItem.productId) : null;

      // Usar dimensiones del producto de la DB o valores por defecto para no romper la cotización
      itemsWithDimensions.push({
        name: product?.name || reqItem.name || 'Suplemento Newave',
        quantity: reqItem.quantity,
        weight: Number(product?.weightInGrams) || 500,
        height: Number(product?.height) || 15,
        width: Number(product?.width) || 15,
        length: Number(product?.length) || 15,
      });
    }

    // Cotizar con el servicio oficial de Correo Argentino
    const rates = await correoArgentinoService.quoteRates(postalCodeDestination, itemsWithDimensions);

    res.status(200).json({
      success: true,
      rates,
    });
  } catch (error) {
    console.error('Error en getShippingQuote:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cotizar tarifas de envío con Correo Argentino.'
    });
  }
};

