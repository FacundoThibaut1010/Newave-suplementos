import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';
import AdminSelect from './AdminSelect';
import AdminMultiSelect from './AdminMultiSelect';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const displaySectionOptions = [
  { value: 'Producto', label: 'Producto' },
  { value: 'Combo', label: 'Combo' }
];

const ProductForm = ({ onClose, onSuccess, initialData }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: initialData?.price ? Number(initialData.price).toLocaleString('es-AR') : '',
    oldPrice: initialData?.oldPrice ? Number(initialData.oldPrice).toLocaleString('es-AR') : '',
    countInStock: initialData?.countInStock || '',
    description: initialData?.description || '',
    images: initialData?.images?.length ? initialData.images : (initialData?.image ? [initialData.image] : ['']),
    category: initialData?.category || '',
    weight: initialData?.weight || '',
    servings: initialData?.servings || '',
    displaySection: initialData?.displaySection || 'Producto',
    variants: initialData?.variants || []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<{value: string, label: string}[]>([]);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        if (data.categories) {
          const opts = data.categories.map((c: any) => ({ value: c.name, label: c.name }));
          setCategoryOptions(opts);
          if (!formData.category && opts.length > 0) {
            setFormData(prev => ({ ...prev, category: opts[0].value }));
          }
        }
      } catch (err) {}
    };
    fetchConfig();
  }, []);

  const handleFileUpload = async (index: number | string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndex(index);
    try {
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              let width = img.width;
              let height = img.height;
              
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              resolve(compressedBase64);
            };
          };
        });
      };

      compressImage(file).then((base64String) => {
        
        if (typeof index === 'string' && index.startsWith('variant_')) {
          const varIndex = parseInt(index.split('_')[1]);
          const newVariants = [...formData.variants];
          newVariants[varIndex] = { ...newVariants[varIndex], image: base64String };
          setFormData({ ...formData, variants: newVariants });
        } else {
          handleImageChange(index as number, base64String);
        }
        setUploadingImageIndex(null);
        toast.success('Imagen cargada correctamente 📸');
      });
    } catch (err: any) {
      toast.error('Error al procesar la imagen');
      setUploadingImageIndex(null);
    } finally {
      // Reset input value
      e.target.value = '';
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    if (formData.images.length < 4) {
      setFormData({ ...formData, images: [...formData.images, ''] });
    }
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { flavor: '', countInStock: 0, image: '' }]
    });
  };

  const removeVariant = (index: number) => {
    const newVariants = formData.variants.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validImages = formData.images.filter((url: string) => url.trim() !== '');

    if (!formData.name || !formData.price || validImages.length === 0) {
      toast.error('Por favor completa los campos principales y añade al menos una imagen ✨');
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
        oldPrice: formData.oldPrice ? Number(String(formData.oldPrice).replace(/\./g, '')) : 0,
        countInStock: Number(formData.countInStock) || 0,
        description: formData.description || 'Nueva pieza de la colección.',
        weight: formData.weight,
        servings: formData.servings,
        images: validImages, // El modelo espera un array
        brand: 'Genérica',
        category: formData.displaySection === 'Combo' ? formData.category : (formData.category || 'Proteína'),
        displaySection: formData.displaySection,
        variants: formData.variants.filter((v: any) => v.flavor.trim() !== '')
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
    <div className="fixed inset-0 z-[150] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 pb-32 my-10 md:my-auto"
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="Ej: Silla Gravity"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Precio ($)</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const formatted = rawValue ? Number(rawValue).toLocaleString('es-AR') : '';
                    setFormData({ ...formData, price: formatted });
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Precio Anterior</label>
                <input
                  type="text"
                  value={formData.oldPrice}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    const formatted = rawValue ? Number(rawValue).toLocaleString('es-AR') : '';
                    setFormData({ ...formData, oldPrice: formatted });
                  }}
                  placeholder="Ej: 50.000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              {(!formData.variants || formData.variants.length === 0) && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Stock General</label>
                  <input
                    type="number"
                    value={formData.countInStock}
                    onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col justify-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 min-h-[20px] flex items-end">Gramaje / Peso</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="Ej: 1 kg"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 min-h-[20px] flex items-end">Servicios </label>
                <input
                  type="text"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="Ej: 30 servicios"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Imágenes - Máximo 4</label>
                {formData.images.length < 4 && (
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-[10px] text-[#CAA959] font-bold uppercase tracking-widest hover:underline"
                  >
                    + Agregar otra
                  </button>
                )}
              </div>

              {formData.images.map((img: string, index: number) => (
                <div key={index} className="flex gap-2 relative group">
                  <input
                    type="text"
                    value={img}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-20 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder={`URL de la imagen ${index + 1}...`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <label className="cursor-pointer p-1 text-gray-400 hover:text-[#CAA959] transition-colors" title="Subir desde PC">
                      {uploadingImageIndex === index ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(index, e)}
                      />
                    </label>
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar imagen"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Variantes (Sabores) */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Variantes / Sabores (Opcional)</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-[10px] text-[#CAA959] font-bold uppercase tracking-widest hover:underline"
                >
                  + Agregar Sabor
                </button>
              </div>

              {formData.variants.map((variant: any, index: number) => (
                <div key={index} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-xl relative group">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_80px_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={variant.flavor || ''}
                      onChange={(e) => updateVariant(index, 'flavor', e.target.value)}
                      placeholder="Sabor (Opcional)"
                      className="col-span-2 md:col-span-1 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-black"
                    />
                    <div className="flex w-full">
                      <input
                        type="number"
                        value={variant.countInStock}
                        onChange={(e) => updateVariant(index, 'countInStock', e.target.value)}
                        placeholder="Stock"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-black text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center bg-gray-50 md:bg-transparent rounded-lg md:rounded-none border border-gray-200 md:border-transparent h-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={variant.image}
                      onChange={(e) => updateVariant(index, 'image', e.target.value)}
                      placeholder="URL Imagen Específica (Opcional)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-xs font-bold text-black"
                    />
                    <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-gray-400 hover:text-[#CAA959]">
                      {uploadingImageIndex === `variant_${index}` ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(`variant_${index}` as unknown as number, e)}
                      />
                    </label>
                  </div>
                </div>
              ))}
              {formData.variants.length > 0 && (
                <p className="text-[9px] text-gray-400 italic">Si usas sabores, el stock general se ignorará.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative z-[70]">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Categoría / Contenido</label>
                {formData.displaySection === 'Producto' ? (
                  <AdminSelect
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={categoryOptions}
                  />
                ) : (
                  <AdminMultiSelect
                    value={formData.category === 'General' ? '' : formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    options={categoryOptions}
                    placeholder="Elige los productos..."
                  />
                )}
              </div>
              <div className="relative z-[60]">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Sección de Exhibición</label>
                <AdminSelect
                  value={formData.displaySection}
                  onChange={(val) => {
                    setFormData({
                      ...formData,
                      displaySection: val,
                      category: val === 'Combo' ? '' : (categoryOptions[0]?.value || 'Proteína')
                    });
                  }}
                  options={displaySectionOptions}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-[154px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold !text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none leading-relaxed"
                placeholder="Describe los materiales, dimensiones y el alma de esta pieza..."
              />
            </div>

            <div className="pt-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Vista Previa</label>
              <div className="aspect-[16/9] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                {formData.images[0] ? (
                  <img src={formData.images[0]} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <ImageIcon size={32} strokeWidth={1} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sin imagen</span>
                  </div>
                )}
              </div>
              {formData.images.filter((img: string) => img.trim() !== '').length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {formData.images.filter((img: string) => img.trim() !== '').slice(1).map((img: string, idx: number) => (
                    <img key={idx} src={img} className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" alt={`Thumb ${idx}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 pt-4">
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
