import express from 'express';
import Product from '../models/Product.js';
import StoreConfig from '../models/StoreConfig.js';
import Order from '../models/Order.js';
import { sendOrderDispatchedEmail, sendOrderDeliveredEmail } from '../utils/emailService.js';

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
        promoBanner: 'Envío gratis en tu primera compra',
        categories: [
          { name: 'Proteínas', slug: 'Proteína', image: '/proteina.jpg' },
          { name: 'Pre Entreno', slug: 'Pre Entreno', image: '/pre entreno.jpg.png' },
          { name: 'Creatinas', slug: 'Creatina', image: '/creatina (1).jpg' },
          { name: 'Minerales', slug: 'Minerales', image: '/minerales.png' },
          { name: 'Colágenos', slug: 'Colágeno', image: '/colageno.jpg' },
          { name: 'Comestibles', slug: 'Comestibles', image: '/BarrasProteicas.jpg' },
          { name: 'Shakers', slug: 'Shakers', image: '/Shaker.png' },
          { name: 'Vitaminas', slug: 'Vitaminas', image: '/vitaminas.jpg' }
        ]
      });
    } else if (!config.categories || config.categories.length === 0) {
      config.categories = [
        { name: 'Proteínas', slug: 'Proteína', image: '/proteina.jpg' },
        { name: 'Pre Entreno', slug: 'Pre Entreno', image: '/pre entreno.jpg.png' },
        { name: 'Creatinas', slug: 'Creatina', image: '/creatina (1).jpg' },
        { name: 'Minerales', slug: 'Minerales', image: '/minerales.png' },
        { name: 'Colágenos', slug: 'Colágeno', image: '/colageno.jpg' },
        { name: 'Comestibles', slug: 'Comestibles', image: '/BarrasProteicas.jpg' },
        { name: 'Shakers', slug: 'Shakers', image: '/Shaker.png' },
        { name: 'Vitaminas', slug: 'Vitaminas', image: '/vitaminas.jpg' }
      ];
      await config.save();
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

// Marcar orden como despachada (Entregada al correo)
router.put('/orders/:id/dispatch', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDispatched = true;
      order.dispatchedAt = Date.now();
      const updatedOrder = await order.save();

      // Enviar email al cliente avisando que fue despachado
      if (order.guestInfo && order.guestInfo.email) {
        await sendOrderDispatchedEmail(order);
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error en PUT /orders/:id/dispatch:', error.message);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
});

// Marcar orden como entregada (El cliente la recibió)
router.put('/orders/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      const updatedOrder = await order.save();

      // Enviar email de paquete entregado al cliente
      if (order.guestInfo && order.guestInfo.email) {
        await sendOrderDeliveredEmail(order);
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error en PUT /orders/:id/deliver:', error.message);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
});

// Deshacer entrega (Regresar al historial de despachados)
router.put('/orders/:id/undeliver', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = false;
      order.deliveredAt = null;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error en PUT /orders/:id/undeliver:', error.message);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
});

// Eliminar orden (Para pruebas y limpieza)
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (order) {
      res.json({ message: 'Orden eliminada con éxito' });
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error en DELETE /orders/:id:', error.message);
    res.status(500).json({ message: 'Error al eliminar la orden' });
  }
});

// --- DASHBOARD STATS ---

router.get('/dashboard', async (req, res) => {
  try {
    // 1. Alertas de Stock (Productos o Sabores con menos de 5 unidades)
    const allProducts = await Product.find({}, 'name countInStock image images variants');
    const lowStockProducts = [];

    allProducts.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(v => {
            if (v.countInStock < 5) {
              lowStockProducts.push({
                _id: `${product._id}-${v.flavor}`,
                name: `${product.name} - ${v.flavor}`,
                countInStock: v.countInStock,
                image: v.image || (product.images && product.images[0]) || product.image
              });
            }
        });
      } else {
        // Revisar producto general
        if (product.countInStock < 5) {
          lowStockProducts.push({
            _id: product._id,
            name: product.name,
            countInStock: product.countInStock,
            image: product.image || (product.images && product.images[0])
          });
        }
      }
    });

    // Ordenar de menor a mayor stock
    lowStockProducts.sort((a, b) => a.countInStock - b.countInStock);

    // 2. Alertas de Órdenes Sin Despachar (Pagadas, pero isDispatched es false)
    const pendingOrdersCount = await Order.countDocuments({ isPaid: true, isDispatched: false });

    // 3. Finanzas: Ganancias de los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Primer día de hace 6 meses

    const orders = await Order.find({
      isPaid: true,
      paidAt: { $gte: sixMonthsAgo }
    }).select('totalPrice paidAt');

    const monthlyData = {};
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Inicializar los últimos 6 meses con 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyData[key] = 0;
    }

    // Sumar ganancias
    orders.forEach(order => {
      if (order.paidAt) {
        const d = new Date(order.paidAt);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += order.totalPrice;
        }
      }
    });

    // Formatear para recharts: [{ name: 'Ene', total: 50000 }]
    const financialChart = Object.keys(monthlyData).map(key => ({
      name: key.split(' ')[0], // Solo el mes
      total: monthlyData[key]
    }));

    // Calcular ganancia total y ventas totales de este mes
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const thisMonthOrders = await Order.find({ isPaid: true, paidAt: { $gte: startOfThisMonth } });
    const thisMonthRevenue = thisMonthOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    res.json({
      lowStockProducts,
      pendingOrdersCount,
      financialChart,
      thisMonthRevenue,
      thisMonthSales: thisMonthOrders.length
    });

  } catch (error) {
    console.error('❌ Error en GET /dashboard:', error.message);
    res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
  }
});

export default router;