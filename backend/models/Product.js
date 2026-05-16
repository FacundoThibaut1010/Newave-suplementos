import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      default: '', // Ya no es obligatorio para evitar errores 400
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
    },
    oldPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String, // Cambiado a String para mayor flexibilidad en el Dashboard
      default: 'General',
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    brand: {
      type: String,
      default: 'Propia', // Valor por defecto para cumplir con el modelo
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    variants: [
      {
        flavor: { type: String, required: true },
        image: { type: String, default: '' },
        countInStock: { type: Number, required: true, default: 0 }
      }
    ],
    // ... (campos de rating y reviews se mantienen igual)
    displaySection: {
      type: String,
      enum: ['Producto', 'Combo'],
      default: 'Producto',
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;