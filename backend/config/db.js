import mongoose from 'mongoose';
import colors from 'colors';
import dns from 'dns';

// Solución para problemas de DNS locales (ECONNREFUSED en _mongodb._tcp)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`¡Conexión establecida con MongoDB! 🍃: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error al conectar con la base de datos: ${error.message}`.red.bold);
    process.exit(1);
  }
};

export default connectDB;
