import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const ProductForm = ({ onClose, onSuccess, initialData }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: initialData?.price ? Number(initialData.price).toLocaleString('es-AR') : '',
    countInStock: initialData?.countInStock || '',
    description: initialData?.description || '',
    image: initialData?.images?.[0] || '',
    category: initialData?.category || '',
    displaySection: initialData?.displaySection || 'Producto'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.name || !formData.price || !formData.image) {
    toast.error('Por favor completa los campos principales ✨');
    return;
  }

  if (formData.displaySection === 'Producto' && !formData.category) {
    toast.error('Por favor selecciona una categoría para este producto 🏷️');
    return;
  }

  setIsSubmitting(true);
  try {
    // Construimos el payload exacto para el Backend
    const payload = {
      name: formData.name,
      price: Number(String(formData.price).replace(/\./g, '')),
      countInStock: Number(formData.countInStock) || 0,
      description: formData.description || 'Nueva pieza de la colección.',
      images: [formData.image], // El modelo espera un array
      brand: 'Genérica',
      category: formData.displaySection === 'Combo' ? 'General' : formData.category,
      displaySection: formData.displaySection
    };

    if (initialData) {
      await apiClient.put(`/admin/products/${initialData._id}`, payload);
      toast.success('¡Excelente! Cambios guardados.');
    } else {
      await apiClient.post('/admin/products', payload);
      toast.success('¡Hecho! El producto ya está en línea.');
    }
    
    onSuccess();
    onClose();
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Error al conectar 🔄';
    toast.error(errorMsg);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">
              {initialData ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Gestión de Inventario</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nombre</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-admin w-full"
                placeholder="Ej: Silla Gravity"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Precio ($)</label>
                <input 
                  type="text" 
                  value={formData.price}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const formatted = rawValue ? Number(rawValue).toLocaleString('es-AR') : '';
                    setFormData({...formData, price: formatted});
                  }}
                  className="input-admin w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Stock</label>
                <input 
                  type="number" 
                  value={formData.countInStock}
                  onChange={(e) => setFormData({...formData, countInStock: e.target.value})}
                  className="input-admin w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Imagen (URL)</label>
              <input 
                type="text" 
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                className="input-admin w-full text-xs"
                placeholder="Pega la URL aquí..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Categoría</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="input-admin w-full"
                  disabled={formData.displaySection !== 'Producto'}
                >
                  <option value="" disabled>Selecciona...</option>
                  <option value="Proteína">Proteína</option>
                  <option value="Creatina">Creatina</option>
                  <option value="Minerales">Minerales</option>
                  <option value="Colágeno">Colágeno</option>
                  <option value="Pre-Entreno">Pre-Entreno</option>
                </select>
                {formData.displaySection !== 'Producto' && (
                  <p className="text-[9px] text-gray-400 mt-1 ml-1">No aplica a combos.</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Sección de Exhibición</label>
                <select
                  value={formData.displaySection}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({...formData, displaySection: val, category: val === 'Combo' ? 'General' : formData.category});
                  }}
                  className="input-admin w-full"
                >
                  <option value="Producto">Producto</option>
                  <option value="Combo">Combo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Descripción</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="input-admin w-full h-[154px] resize-none py-4 leading-relaxed"
                placeholder="Describe los materiales, dimensiones y el alma de esta pieza..."
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Vista Previa</label>
              <div className="aspect-[16/9] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                {formData.image ? (
                  <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <ImageIcon size={32} strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-admin-primary justify-center shadow-black/10 py-5 text-lg"
            >
              {isSubmitting ? 'Guardando...' : (
                <>
                  <Save size={20} />
                  {initialData ? 'Guardar Cambios' : 'Lanzar Producto'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductForm;
