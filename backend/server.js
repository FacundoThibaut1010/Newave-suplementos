import 'dotenv/config';
import express from 'express';
import colors from 'colors';
import cors from 'cors';
import compression from 'compression';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { serveImage } from './utils/imageUrls.js';
import path from 'path';

// Conectamos a la base de datos
connectDB();

const app = express();

// --- CONFIGURACIÓN DE CORS MULTI-ORIGEN ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitimos peticiones sin origen (como Postman) o si coinciden con localhost o lista permitida
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || /^http:\/\/localhost:\d+$/.test(origin)) {
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
app.use('/api/shipping', shippingRoutes);
app.use('/api/payments', paymentRoutes);
// Imágenes de productos/config servidas como archivos cacheables (antes viajaban en base64 dentro del JSON)
app.get('/api/images/:kind/:id/:path', (req, res, next) => serveImage(req, res).catch(next));

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