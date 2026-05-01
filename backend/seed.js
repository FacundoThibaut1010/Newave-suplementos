import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import Product from './models/Product.js';
import Category from './models/Category.js';

dotenv.config();

const products = [
  {
    name: 'Escultura "Oasis" Marble',
    price: 345.00,
    description: 'Pieza tallada a mano en mármol de Carrara. Una oda al minimalismo orgánico para tu salón.',
    brand: 'Studio Moderne',
    countInStock: 8,
    category: 'Esculturas',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop'],
  },
  {
    name: 'Butaca "Velvet Silence"',
    price: 1250.00,
    description: 'Diseño icónico con líneas curvas y tejido de bouclé premium. Confort táctico y visual.',
    brand: 'Studio Moderne',
    countInStock: 4,
    category: 'Mobiliario',
    images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1000&auto=format&fit=crop'],
  },
  {
    name: 'Lámpara de pie "Lumen Noir"',
    price: 480.00,
    description: 'Estructura esbelta de acero negro mate con difusor de vidrio opalino. Luz arquitectónica.',
    brand: 'Lux Studio',
    countInStock: 12,
    category: 'Iluminación',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000&auto=format&fit=crop'],
  },
  {
    name: 'Vase "Arctic Fold"',
    price: 120.00,
    description: 'Cerámica cruda con textura plegada. Una pieza que celebra la imperfección deliberada.',
    brand: 'Klay Collective',
    countInStock: 20,
    category: 'Accesorios',
    images: ['https://images.unsplash.com/photo-1581781870027-04212e231e96?q=80&w=1000&auto=format&fit=crop'],
  },
  {
    name: 'Mesa de Centro "Gravity"',
    price: 890.00,
    description: 'Vidrio templado sobre base de piedra volcánica. El equilibrio perfecto entre ligereza y peso.',
    brand: 'Studio Moderne',
    countInStock: 6,
    category: 'Mobiliario',
    images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1000&auto=format&fit=crop'],
  },
  {
    name: 'Espejo Mural "Eclipse"',
    price: 540.00,
    description: 'Borde infinito con retroiluminación cálida oculta. Crea profundidad y misterio en cualquier muro.',
    brand: 'Lux Studio',
    countInStock: 10,
    category: 'Accesorios',
    images: ['https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop'],
  },
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('--- 🌿 Conexión establecida para SEED PREMIUM ---'.cyan);

    await Product.deleteMany();
    await Category.deleteMany();

    const categories = ['Esculturas', 'Mobiliario', 'Iluminación', 'Accesorios'];
    const createdCategories = await Promise.all(
      categories.map(name => Category.create({ name, slug: name.toLowerCase(), description: `Colección de ${name} premium.` }))
    );

    const productsWithCategories = products.map((product) => {
      const category = createdCategories.find(c => c.name === product.category);
      return { ...product, category: category._id };
    });

    await Product.insertMany(productsWithCategories);

    console.log('--- 🚀✨ BASE DE DATOS ACTUALIZADA CON ÉXITO: COLECCIÓN MINIMALISTA ---'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

importData();
