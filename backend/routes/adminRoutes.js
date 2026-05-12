import express from 'express';
import Product from '../models/Product.js';
import StoreConfig from '../models/StoreConfig.js';
import Order from '../models/Order.js';

const router = express.Router();

// --- PRODUCT CRUD ---

// Obtener todos los productos
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// Crear producto
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(400).json({ message: 'Error de validación', error: error.message });
  }
});

// Actualizar producto
router.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error en PUT /products:', error.message);
    res.status(400).json({ message: 'No pudimos actualizar el producto', error: error.message });
  }
});

// Eliminar producto
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: '¡Producto eliminado con éxito!' });
  } catch (error) {
    console.error('❌ Error en DELETE /products:', error.message);
    res.status(400).json({ message: 'Error al eliminar el producto' });
  }
});

// --- STORE CONFIG (CMS) ---

// Obtener configuración global
router.get('/config', async (req, res) => {
  try {
    let config = await StoreConfig.findOne();
    if (!config) {
      // Si no existe, creamos una con valores por defecto cálidos
      config = await StoreConfig.create({
        heroTitle: 'Bienvenidos a mi tienda',
        heroSubtitle: 'Diseño y calidad en cada detalle',
        heroImage: '',
        promoBanner: 'Envío gratis en tu primera compra'
      });
    }
    res.json(config);
  } catch (error) {
    console.error('❌ Error en GET /config:', error.message);
    res.status(500).json({ message: 'Error al obtener la configuración' });
  }
});

// Actualizar configuración
router.put('/config', async (req, res) => {
  try {
    // El upsert: true crea el documento si no existe al intentar actualizar
    const config = await StoreConfig.findOneAndUpdate(
      {}, 
      req.body, 
      { new: true, upsert: true, runValidators: true }
    );
    res.json(config);
  } catch (error) {
    console.error('❌ Error en PUT /config:', error.message);
    res.status(400).json({ message: 'No pudimos actualizar la configuración', error: error.message });
  }
});

// --- ORDERS (VENTAS) ---
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('❌ Error en GET /orders:', error.message);
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

// Marcar orden como enviada
router.put('/orders/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error en PUT /orders/:id/deliver:', error.message);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
});

export default router;