import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import generateToken from '../utils/generateToken.js';
import { protect } from '../middleware/authMiddleware.js';
import admin from '../config/firebaseAdmin.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

const verificationCodes = new Map();

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

// @route   POST /api/users/send-verification-code
// @desc    Send 4-digit code to email
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe con este correo' });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    verificationCodes.set(email, { code, expires: Date.now() + 15 * 60000 });

    await sendVerificationEmail(email, code);

    res.json({ message: 'Código enviado con éxito' });
  } catch (error) {
    console.error('Error sending code:', error);
    res.status(500).json({ message: 'Error al enviar el código de verificación' });
  }
});

// @route   POST /api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, verificationCode } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe con este correo' });
    }

    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'Por favor, solicita un código de verificación primero' });
    }
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'El código expiró. Por favor, solicita uno nuevo' });
    }
    if (storedData.code !== verificationCode) {
      return res.status(400).json({ message: 'El código de verificación es incorrecto' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Éxito, borrar código de memoria
      verificationCodes.delete(email);
      // Enviar correo de bienvenida de forma asíncrona (sin bloquear la respuesta)
      sendWelcomeEmail(user);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dni: user.dni,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        favorites: user.favorites,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// @route   POST /api/users/login
// @desc    Auth user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('favorites');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dni: user.dni,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        favorites: user.favorites,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
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

    // Buscar si el usuario ya existe en MongoDB
    let user = await User.findOne({ email });

    // Si no existe, lo creamos automáticamente (sin contraseña, ya que usa Google)
    let isNewUser = false;
    if (!user) {
      user = await User.create({
        name: name || 'Usuario de Google',
        email,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Contraseña aleatoria imposible
      });
      isNewUser = true;
    }

    user = await User.findById(user._id).populate('favorites');

    if (isNewUser) {
      sendWelcomeEmail(user);
    }

    // Generar nuestro propio JWT para la sesión en nuestra app
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dni: user.dni,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      favorites: user.favorites,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('Error en Google Login:', error);
    res.status(401).json({ message: 'Token de Google inválido o expirado' });
  }
});

// @route   POST /api/users/forgot-password
// @desc    Send password reset code to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con ese correo' });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    verificationCodes.set(email + '_reset', { code, expires: Date.now() + 15 * 60000 });

    await sendPasswordResetEmail(email, code);

    res.json({ message: 'Código de recuperación enviado con éxito' });
  } catch (error) {
    console.error('Error sending reset code:', error);
    res.status(500).json({ message: 'Error al enviar el código de recuperación' });
  }
});

// @route   POST /api/users/reset-password
// @desc    Reset password using verification code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const storedData = verificationCodes.get(email + '_reset');
    if (!storedData) {
      return res.status(400).json({ message: 'Por favor, solicita un código de recuperación primero' });
    }
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email + '_reset');
      return res.status(400).json({ message: 'El código expiró. Por favor, solicita uno nuevo' });
    }
    if (storedData.code !== code) {
      return res.status(400).json({ message: 'El código de verificación es incorrecto' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.password = newPassword;
    await user.save();

    verificationCodes.delete(email + '_reset');

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.dni = req.body.dni || user.dni;
      user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
      
      if (req.body.address) {
        user.address = {
          street: req.body.address.street || user.address?.street,
          city: req.body.address.city || user.address?.city,
          state: req.body.address.state || user.address?.state,
          zipCode: req.body.address.zipCode || user.address?.zipCode,
          country: req.body.address.country || user.address?.country,
        };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      const populatedUser = await User.findById(updatedUser._id).populate('favorites');

      res.json({
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        phone: populatedUser.phone,
        dni: populatedUser.dni,
        dateOfBirth: populatedUser.dateOfBirth,
        address: populatedUser.address,
        favorites: populatedUser.favorites,
        token: generateToken(populatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
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
