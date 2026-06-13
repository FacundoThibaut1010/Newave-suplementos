import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import cors from 'cors';
import compression from 'compression';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import path from 'path';

dotenv.config();

// Conectamos a la base de datos
connectDB();

const app = express();

// --- CONFIGURACIÓN DE CORS MULTI-ORIGEN ---
const allowedOrigins = [
  'http://localhost:5173', // Tu Tienda
  'http://localhost:5174', // Tu Admin Dashboard
  process.env.FRONTEND_URL, // URL de producción de la Tienda
  process.env.ADMIN_URL     // URL de producción del Admin
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitimos peticiones sin origen (como Postman) o si están en nuestra lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS: Este origen no tiene permiso.'));
    }
  },
  credentials: true
}));
// ------------------------------------------

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Welcome route con onda
app.get('/', (req, res) => {
  res.send('¡Hola! El servidor de tu Ecommerce está funcionando de maravilla 🚀');
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Custom Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 El servidor está encendido y escuchando en el puerto ${PORT}
  👉 Modo: ${process.env.NODE_ENV || 'development'}
  ✨ Tono humano activado: ON
  `.yellow.bold);
});