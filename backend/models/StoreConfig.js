import mongoose from 'mongoose';

const storeConfigSchema = new mongoose.Schema({
  hero: {
    title: { type: String, default: 'Pure Essence.' },
    subtitle: { type: String, default: 'Piezas de autor curadas para transformar tu espacio cotidiano.' },
    image: { type: String, default: '' },
    buttonText: { type: String, default: 'Ver Catálogo' }
  },
  announcement: {
    text: { type: String, default: '' },
    messages: { type: [String], default: ['Envío premium gratuito en órdenes superiores a $150'] },
    enabled: { type: Boolean, default: true }
  },
  styles: {
    accentColor: { type: String, default: '#000000' }
  },
  categories: [{
    name: { type: String },
    slug: { type: String },
    image: { type: String }
  }]
}, { timestamps: true });

const StoreConfig = mongoose.model('StoreConfig', storeConfigSchema);
export default StoreConfig;
