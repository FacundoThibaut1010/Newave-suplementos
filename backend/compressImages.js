import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Jimp } from 'jimp';

dotenv.config();

const ProductSchema = new mongoose.Schema({
  name: String,
  images: [String],
  image: String,
  variants: [{ image: String, flavor: String, countInStock: Number }]
}, { strict: false });

const Product = mongoose.model('Product', ProductSchema);

const compressBase64Image = async (base64String) => {
  if (!base64String || !base64String.startsWith('data:image/')) return base64String;
  
  try {
    const buffer = Buffer.from(base64String.split(',')[1], 'base64');
    const image = await Jimp.read(buffer);
    
    if (image.bitmap.width > 800) {
      image.resize({ w: 800 });
    }
    
    const compressedBuffer = await image.getBuffer('image/jpeg', { quality: 70 });
    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Error compressing image:', err.message);
    return base64String;
  }
};

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to check.`);

    let totalSavedMB = 0;

    for (const product of products) {
      let modified = false;
      let pBeforeSize = JSON.stringify(product).length;

      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          if (product.images[i].length > 200000) { // Only compress if larger than ~200KB
            console.log(`Compressing image ${i} for product: ${product.name}`);
            product.images[i] = await compressBase64Image(product.images[i]);
            modified = true;
          }
        }
      }

      if (product.image && product.image.length > 200000) {
        console.log(`Compressing legacy image for product: ${product.name}`);
        product.image = await compressBase64Image(product.image);
        modified = true;
      }

      if (product.variants && product.variants.length > 0) {
        for (let i = 0; i < product.variants.length; i++) {
          if (product.variants[i].image && product.variants[i].image.length > 200000) {
            console.log(`Compressing variant image for product: ${product.name}`);
            product.variants[i].image = await compressBase64Image(product.variants[i].image);
            modified = true;
          }
        }
      }

      if (modified) {
        const pAfterSize = JSON.stringify(product).length;
        const savedMB = (pBeforeSize - pAfterSize) / (1024 * 1024);
        totalSavedMB += savedMB;
        console.log(`Saving ${product.name}... (Reduced by ${savedMB.toFixed(2)} MB)`);
        await product.save();
      }
    }

    console.log(`Finished compression! Total space saved: ${totalSavedMB.toFixed(2)} MB`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
