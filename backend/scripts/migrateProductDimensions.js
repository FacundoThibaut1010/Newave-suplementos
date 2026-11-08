import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Product from '../models/Product.js';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const parseWeight = (weightStr) => {
  if (!weightStr) return 500;
  if (typeof weightStr === 'number') return weightStr;

  try {
    const cleanStr = weightStr.toString().toLowerCase().replace(',', '.').trim();
    const match = cleanStr.match(/[\d.]+/);
    if (!match) return 500;

    const val = parseFloat(match[0]);
    if (isNaN(val)) return 500;

    if (cleanStr.includes('kg') || cleanStr.includes('kilo')) {
      return Math.round(val * 1000);
    }
    return Math.round(val);
  } catch (error) {
    return 500;
  }
};

const runMigration = async () => {
  try {
    console.log('🍃 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión establecida.');

    const products = await Product.find({});
    console.log(`📦 Encontrados ${products.length} productos para revisar/migrar.`);

    let updatedCount = 0;

    for (const product of products) {
      let needsSave = false;

      // Calcular stock total
      const totalStock = (product.variants && product.variants.length > 0)
        ? product.variants.reduce((acc, v) => acc + (Number(v.countInStock) || 0), 0)
        : (Number(product.countInStock) || 0);

      if (product.weightInGrams === undefined || product.weightInGrams === null) {
        const parsed = parseWeight(product.weight);
        product.weightInGrams = Math.min(50000, Math.max(1, parsed));
        needsSave = true;
      }

      if (!product.height) {
        product.height = 15;
        needsSave = true;
      }
      if (!product.width) {
        product.width = 15;
        needsSave = true;
      }
      if (!product.length) {
        product.length = 15;
        needsSave = true;
      }

      if (product.hasCustomDimensions === undefined) {
        product.hasCustomDimensions = false;
        needsSave = true;
      }

      // Si no tiene stock, debe estar inactivo
      if (totalStock <= 0) {
        if (product.isActive !== false) {
          product.isActive = false;
          needsSave = true;
        }
      } else {
        if (product.isActive === undefined) {
          product.isActive = true;
          needsSave = true;
        }
      }

      if (needsSave) {
        await product.save();
        updatedCount++;
      }
    }

    console.log(`✨ Migración completada exitosamente. Productos actualizados: ${updatedCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

runMigration();

