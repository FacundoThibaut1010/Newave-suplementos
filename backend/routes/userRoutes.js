import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import generateToken from '../utils/generateToken.js';
import { protect } from '../middleware/authMiddleware.js';
import admin from '../config/firebaseAdmin.js';

const router = express.Router();

// @route   GET /api/users/orders
// @desc    Get logged in user orders
router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, isPaid: true }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener compras' });
  }
});

// @route   POST /api/users/google-login
// @desc    Auth user with Google token
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!admin.apps.length) {
       return res.status(500).json({ message: 'Firebase Admin no está configurado en el servidor' });
    }

    // Verificar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decodedToken;

    // Solo permitir @gmail.com si es un requerimiento estricto (opcional, Firebase ya valida cuentas reales de Google, pero lo forzaremos)
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Solo se permiten correos de @gmail.com' });
    }

    // Buscar si el usuario ya existe en MongoDB
    let user = await User.findOne({ email });

    // Si no existe, lo creamos automáticamente (sin contraseña, ya que usa Google)
    if (!user) {
      user = await User.create({
        name: name || 'Usuario de Google',
        email,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Contraseña aleatoria imposible
      });
    }

    user = await User.findById(user._id).populate('favorites');

    // Generar nuestro propio JWT para la sesión en nuestra app
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      favorites: user.favorites,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('Error en Google Login:', error);
    res.status(401).json({ message: 'Token de Google inválido o expirado' });
  }
});

// @route   GET /api/users/favorites
// @desc    Get user's favorite products
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener favoritos' });
  }
});

// @route   POST /api/users/favorites/:id
// @desc    Toggle product in user's favorites
router.post('/favorites/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isFavorited = user.favorites.includes(productId);

    if (isFavorited) {
      user.favorites = user.favorites.filter((id) => id.toString() !== productId);
    } else {
      user.favorites.push(productId);
    }

    await user.save();
    
    // Devolvemos la lista actualizada (poblada)
    const updatedUser = await User.findById(req.user._id).populate('favorites');
    res.json(updatedUser.favorites);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Error al actualizar favoritos' });
  }
});

export default router;
