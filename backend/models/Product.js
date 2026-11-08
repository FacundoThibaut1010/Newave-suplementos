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
    weight: {
      type: String,
      default: '',
    },
    // --- Campos de logística y dimensiones (Correo Argentino) ---
    weightInGrams: {
      type: Number,
      min: [1, 'El peso mínimo es 1g'],
      max: [50000, 'El peso máximo es 50.000g (50kg)'],
      default: 500,
    },
    height: {
      type: Number,
      min: [1, 'La altura mínima es 1cm'],
      max: [200, 'La altura máxima es 200cm'],
      default: 15,
    },
    width: {
      type: Number,
      min: [1, 'El ancho mínimo es 1cm'],
      max: [200, 'El ancho máximo es 200cm'],
      default: 15,
    },
    length: {
      type: Number,
      min: [1, 'El largo mínimo es 1cm'],
      max: [200, 'El largo máximo es 200cm'],
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hasCustomDimensions: {
      type: Boolean,
      default: false,
    },
    servings: {
      type: String,
      default: '',
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
        flavor: { type: String, default: '' },
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

productSchema.pre('save', function () {
  // Calcular stock total sumando variantes o countInStock
  const totalStock = (this.variants && this.variants.length > 0)
    ? this.variants.reduce((acc, v) => acc + (Number(v.countInStock) || 0), 0)
    : (Number(this.countInStock) || 0);

  // Si no hay stock disponible, desactivar automáticamente
  if (totalStock <= 0) {
    this.isActive = false;
  }

  // Validaciones para activar el producto
  if (this.isActive) {
    if (totalStock <= 0) {
      throw new Error('No es posible activar un producto con stock 0');
    }
    if (!this.price || this.price <= 0) {
      throw new Error('El precio debe ser mayor a 0 para activar el producto');
    }
    if (!this.weightInGrams || this.weightInGrams < 1 || this.weightInGrams > 50000) {
      throw new Error('El peso debe estar entre 1g y 50.000g para poder activar el producto');
    }
    if (!this.height || this.height < 1 || this.height > 200 ||
        !this.width || this.width < 1 || this.width > 200 ||
        !this.length || this.length < 1 || this.length > 200) {
      throw new Error('Cada lado debe medir entre 1cm y 200cm para poder activar el producto');
    }
    if ((this.height + this.width + this.length) > 300) {
      throw new Error('La sumatoria de los lados (alto + ancho + largo) no puede superar los 300cm (normativa Correo Argentino)');
    }
  }
});

productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;