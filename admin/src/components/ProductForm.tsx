import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';
import { useAdminStore } from '../store/useAdminStore';
import AdminSelect from './AdminSelect';
import AdminMultiSelect from './AdminMultiSelect';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

// Bloque numerado con título y explicación. Definido FUERA del formulario: si estuviera adentro,
// React lo recrearía en cada tecla y los campos perderían el foco.
const Section = ({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
    <div className="flex items-start gap-3 mb-5">
      <span className="w-8 h-8 rounded-full bg-[#111214] text-white text-sm font-black flex items-center justify-center shrink-0">{n}</span>
      <div>
        <h3 className="text-lg font-black text-[#111214] leading-tight">{title}</h3>
        <p className="text-[13px] text-gray-500 font-medium mt-0.5">{hint}</p>
      </div>
    </div>
    {children}
  </section>
);


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
    weightInGrams: initialData?.weightInGrams ?? 500,
    height: initialData?.height ?? 15,
    width: initialData?.width ?? 15,
    length: initialData?.length ?? 15,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    servings: initialData?.servings || '',
    displaySection: initialData?.displaySection || 'Producto',
    variants: initialData?.variants || []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<{value: string, label: string}[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Usa la configuración que el panel ya cargó; solo la pide si todavía no está
        const cached = useAdminStore.getState().config;
        const data = cached || (await apiClient.get('/admin/config')).data;
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
              const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
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

    const totalStock = (formData.variants && formData.variants.length > 0)
      ? formData.variants.reduce((acc: number, v: any) => acc + (Number(v.countInStock) || 0), 0)
      : (Number(formData.countInStock) || 0);

    const weightGrams = Number(formData.weightInGrams) || 0;
    const heightCm = Number(formData.height) || 0;
    const widthCm = Number(formData.width) || 0;
    const lengthCm = Number(formData.length) || 0;
    const sumSides = heightCm + widthCm + lengthCm;

    if (formData.isActive) {
      if (totalStock <= 0) {
        toast.error('No se puede activar el producto sin stock disponible.');
        return;
      }
      if (weightGrams < 1 || weightGrams > 50000) {
        toast.error('El peso debe estar entre 1g y 50.000g para poder activar el producto.');
        return;
      }
      if (heightCm < 1 || heightCm > 200 || widthCm < 1 || widthCm > 200 || lengthCm < 1 || lengthCm > 200) {
        toast.error('Cada dimensión (alto, ancho, largo) debe medir entre 1cm y 200cm.');
        return;
      }
      if (sumSides > 300) {
        toast.error(`La sumatoria de los lados (${sumSides}cm) no puede superar 300cm (normativa Correo Argentino).`);
        return;
      }
    }

    setIsSubmitting(true);
    let success = false;
    try {
      // Construimos el payload exacto para el Backend
      const payload = {
        name: formData.name,
        price: Number(String(formData.price).replace(/\D/g, '')),
        oldPrice: formData.oldPrice ? Number(String(formData.oldPrice).replace(/\D/g, '')) : 0,
        countInStock: Number(formData.countInStock) || 0,
        description: formData.description || 'Nueva pieza de la colección.',
        weight: formData.weight,
        weightInGrams: weightGrams,
        height: heightCm,
        width: widthCm,
        length: lengthCm,
        isActive: formData.isActive,
        hasCustomDimensions: true,
        servings: formData.servings,
        images: validImages, // El modelo espera un array
        brand: 'Genérica',
        category: formData.displaySection === 'Combo' ? formData.category : (formData.category || 'Proteína'),
        displaySection: formData.displaySection,
        variants: (formData.variants || []).filter((v: any) => v && typeof v.flavor === 'string' && v.flavor.trim() !== '')
      };

      if (initialData) {
        await apiClient.put(`/admin/products/${initialData._id}`, payload);
        toast.success('¡Excelente! Cambios guardados.');
      } else {
        await apiClient.post('/admin/products', payload);
        toast.success('¡Hecho! El producto ya está en línea.');
      }

      success = true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al conectar 🔄';
      toast.error(errorMsg);
      setIsSubmitting(false);
    }

    if (success) {
      onSuccess();
      onClose();
    }
  };

  // ---------- Datos derivados para guiar al usuario ----------
  const validImages = formData.images.filter((url: string) => url && url.trim() !== '');
  const hasVariants = formData.variants.length > 0;
  const stockTotal = hasVariants
    ? formData.variants.reduce((acc: number, v: any) => acc + (Number(v.countInStock) || 0), 0)
    : Number(formData.countInStock) || 0;
  const priceNum = Number(String(formData.price).replace(/\D/g, '')) || 0;
  const oldPriceNum = Number(String(formData.oldPrice).replace(/\D/g, '')) || 0;
  const discount = oldPriceNum > priceNum && priceNum > 0 ? Math.round((1 - priceNum / oldPriceNum) * 100) : 0;
  const sumSides = (Number(formData.height) || 0) + (Number(formData.width) || 0) + (Number(formData.length) || 0);

  const checklist = [
    { label: 'Nombre', ok: !!formData.name.trim() },
    { label: 'Categoría', ok: formData.displaySection === 'Combo' || !!formData.category },
    { label: 'Al menos una foto', ok: validImages.length > 0 },
    { label: 'Precio', ok: priceNum > 0 },
    { label: 'Stock disponible', ok: stockTotal > 0 },
  ];
  const missing = checklist.filter((c) => !c.ok).length;

  const inputCls =
    'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-[#111214] placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-[#111214] focus:ring-4 focus:ring-[#111214]/5 transition-shadow';
  const labelCls = 'block text-[13px] font-bold text-[#111214] mb-1.5';
  const hintCls = 'text-xs text-gray-500 mt-1.5 leading-snug';

  const priceInput = (key: 'price' | 'oldPrice') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, [key]: raw ? Number(raw).toLocaleString('es-AR') : '' });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, transform: 'translateY(16px) scale(0.98)' }}
        animate={{ opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }}
        exit={{ opacity: 0, transform: 'translateY(10px) scale(0.98)', transition: { duration: 0.15 } }}
        className="relative w-full max-w-6xl h-full md:h-[calc(100vh-3rem)] bg-[#F6F7F9] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Encabezado fijo */}
        <div className="flex items-center justify-between gap-4 px-5 md:px-8 py-4 md:py-5 bg-white border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-black text-[#111214] tracking-tight truncate">
              {initialData ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Completá los pasos en orden. Lo marcado con <span className="text-red-500 font-bold">*</span> es obligatorio.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="pf-icon-btn p-2.5 rounded-full shrink-0">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 p-4 md:p-8">
              {/* ---------- Columna principal: pasos ---------- */}
              <div className="space-y-5 min-w-0">
                <Section n={1} title="Datos básicos" hint="Cómo se llama y dónde aparece en la tienda.">
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Nombre del producto <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputCls}
                        placeholder="Ej: Star Nutrition Platinum Whey Protein 2 Lbs"
                      />
                      <p className={hintCls}>Usá la marca, el producto y el tamaño: es lo que el cliente busca.</p>
                    </div>

                    <div>
                      <span className={labelCls}>Tipo</span>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                        {[
                          { value: 'Producto', label: 'Producto', desc: 'Un artículo suelto' },
                          { value: 'Combo', label: 'Combo', desc: 'Varios productos juntos' },
                        ].map((opt) => {
                          const active = formData.displaySection === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  displaySection: opt.value,
                                  category: opt.value === 'Combo' ? '' : formData.category || categoryOptions[0]?.value || '',
                                })
                              }
                              className={`pf-seg rounded-lg px-3 py-2.5 text-left ${active ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                            >
                              <span className={`block text-sm font-black ${active ? 'text-[#111214]' : 'text-gray-500'}`}>{opt.label}</span>
                              <span className="block text-[11px] text-gray-400 font-medium">{opt.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative z-[70]">
                      <label className={labelCls}>
                        {formData.displaySection === 'Combo' ? 'Qué incluye el combo' : 'Categoría'}{' '}
                        {formData.displaySection === 'Producto' && <span className="text-red-500">*</span>}
                      </label>
                      {formData.displaySection === 'Producto' ? (
                        <AdminSelect value={formData.category} onChange={(val) => setFormData({ ...formData, category: val })} options={categoryOptions} />
                      ) : (
                        <AdminMultiSelect
                          value={formData.category === 'General' ? '' : formData.category}
                          onChange={(val) => setFormData({ ...formData, category: val })}
                          options={categoryOptions}
                          placeholder="Elegí las categorías que incluye…"
                        />
                      )}
                      <p className={hintCls}>Define en qué sección del catálogo aparece. Las categorías se crean en "Identidad".</p>
                    </div>

                    <div>
                      <label className={labelCls}>Descripción</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`${inputCls} h-32 resize-y leading-relaxed`}
                        placeholder="Para qué sirve, cómo se toma, qué contiene… Podés usar varios párrafos."
                      />
                    </div>
                  </div>
                </Section>

                <Section n={2} title="Fotos" hint="Hasta 4. La primera es la que se ve en el catálogo. Fondo blanco o transparente queda mejor.">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.images.map((img: string, index: number) => (
                      <div key={index} className="relative aspect-square">
                        {img ? (
                          <div className="pf-tile group relative w-full h-full rounded-2xl border border-gray-200 bg-[#F8F9FA] overflow-hidden">
                            <img src={img} alt="" className="w-full h-full object-contain p-2 cursor-zoom-in" onClick={() => setFullScreenImage(img)} />
                            {index === 0 && (
                              <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest bg-[#111214] text-white px-2 py-1 rounded-md">
                                Principal
                              </span>
                            )}
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              <label className="pf-mini-btn cursor-pointer w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center text-gray-500" title="Cambiar foto">
                                {uploadingImageIndex === index ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(index, e)} />
                              </label>
                              <button
                                type="button"
                                onClick={() => (formData.images.length > 1 ? removeImageField(index) : handleImageChange(index, ''))}
                                className="pf-mini-btn w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center text-gray-500 hover:text-red-500"
                                title="Quitar foto"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="pf-drop w-full h-full rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-400 text-center p-2">
                            {uploadingImageIndex === index ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                            <span className="text-xs font-bold">{index === 0 ? 'Subí la foto principal' : 'Subir foto'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(index, e)} />
                          </label>
                        )}
                      </div>
                    ))}
                    {formData.images.length < 4 && formData.images.every((img: string) => img) && (
                      <button
                        type="button"
                        onClick={addImageField}
                        className="pf-drop aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-1 text-gray-400"
                      >
                        <span className="text-2xl leading-none">+</span>
                        <span className="text-xs font-bold">Agregar otra</span>
                      </button>
                    )}
                  </div>

                  <details className="mt-4 group">
                    <summary className="text-xs font-bold text-gray-400 cursor-pointer hover:text-[#111214] select-none">¿Tenés la foto en internet? Pegá el link</summary>
                    <div className="space-y-2 mt-3">
                      {formData.images.map((img: string, index: number) => (
                        <input
                          key={index}
                          type="text"
                          value={img}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          className={`${inputCls} text-xs`}
                          placeholder={`Link de la foto ${index + 1}`}
                        />
                      ))}
                    </div>
                  </details>
                </Section>

                <Section n={3} title="Precio" hint="En pesos, sin puntos ni signos: se formatea solo.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Precio de venta <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                        <input type="text" inputMode="numeric" value={formData.price} onChange={priceInput('price')} className={`${inputCls} pl-8`} placeholder="60.000" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Precio anterior <span className="text-gray-400 font-medium">(opcional)</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                        <input type="text" inputMode="numeric" value={formData.oldPrice} onChange={priceInput('oldPrice')} className={`${inputCls} pl-8`} placeholder="70.000" />
                      </div>
                      <p className={hintCls}>
                        {discount > 0 ? <span className="text-emerald-600 font-bold">Se va a mostrar tachado: {discount}% OFF</span> : 'Si lo completás, aparece tachado como oferta.'}
                      </p>
                    </div>
                  </div>
                </Section>

                <Section n={4} title="Stock y sabores" hint="¿Cuántas unidades tenés? Si viene en sabores, cargá el stock de cada uno.">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-4">
                    {[
                      { key: false, label: 'Sin sabores', desc: 'Un solo stock' },
                      { key: true, label: 'Con sabores', desc: 'Stock por sabor' },
                    ].map((opt) => {
                      const active = hasVariants === opt.key;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            if (opt.key && !hasVariants) addVariant();
                            if (!opt.key && hasVariants) {
                              if (window.confirm('¿Quitar todos los sabores? Vas a cargar un solo stock general.')) setFormData({ ...formData, variants: [] });
                            }
                          }}
                          className={`pf-seg rounded-lg px-3 py-2.5 text-left ${active ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                        >
                          <span className={`block text-sm font-black ${active ? 'text-[#111214]' : 'text-gray-500'}`}>{opt.label}</span>
                          <span className="block text-[11px] text-gray-400 font-medium">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!hasVariants ? (
                    <div className="max-w-xs">
                      <label className={labelCls}>Unidades disponibles <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="0"
                        value={formData.countInStock}
                        onChange={(e) => setFormData({ ...formData, countInStock: e.target.value })}
                        className={inputCls}
                        placeholder="Ej: 10"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="hidden sm:grid grid-cols-[48px_minmax(0,1fr)_120px_36px] gap-3 px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Foto</span>
                        <span>Sabor</span>
                        <span>Unidades</span>
                        <span />
                      </div>
                      {formData.variants.map((variant: any, index: number) => (
                        <div key={index} className="grid grid-cols-[48px_minmax(0,1fr)_96px_36px] sm:grid-cols-[48px_minmax(0,1fr)_120px_36px] gap-3 items-center p-2 rounded-xl bg-[#F8F9FA]">
                          <label className="pf-drop relative w-12 h-12 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center cursor-pointer overflow-hidden" title="Foto de este sabor (opcional)">
                            {uploadingImageIndex === `variant_${index}` ? (
                              <Loader2 size={14} className="animate-spin text-gray-400" />
                            ) : variant.image ? (
                              <img src={variant.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(`variant_${index}` as unknown as number, e)} />
                          </label>
                          <input
                            type="text"
                            value={variant.flavor || ''}
                            onChange={(e) => updateVariant(index, 'flavor', e.target.value)}
                            placeholder="Ej: Vainilla"
                            className={`${inputCls} py-2.5`}
                          />
                          <input
                            type="number"
                            min="0"
                            value={variant.countInStock}
                            onChange={(e) => updateVariant(index, 'countInStock', e.target.value)}
                            placeholder="0"
                            className={`${inputCls} py-2.5 text-center tabular-nums ${Number(variant.countInStock) <= 0 ? 'text-red-500' : Number(variant.countInStock) <= 5 ? 'text-amber-600' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            aria-label="Quitar sabor"
                            className="pf-icon-btn w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addVariant} className="pf-add w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-bold text-gray-500">
                        + Agregar sabor
                      </button>
                      <p className={hintCls}>
                        Total: <span className="font-bold text-[#111214]">{stockTotal} unidades</span>. La foto de cada sabor es opcional; si no la cargás se usa la principal.
                      </p>
                    </div>
                  )}
                </Section>

                <Section n={5} title="Presentación" hint="Lo que figura en la etiqueta del envase. Se muestra en la ficha del producto.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Contenido / gramaje</label>
                      <input type="text" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className={inputCls} placeholder="Ej: 1 kg" />
                    </div>
                    <div>
                      <label className={labelCls}>Porciones / servicios</label>
                      <input type="text" value={formData.servings} onChange={(e) => setFormData({ ...formData, servings: e.target.value })} className={inputCls} placeholder="Ej: 30" />
                    </div>
                  </div>
                </Section>

                <Section n={6} title="Envío (Correo Argentino)" hint="Peso y medidas de la caja ya armada. Se usan para calcular el costo de envío.">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'weightInGrams', label: 'Peso', unit: 'g', max: 50000, ph: '500' },
                      { key: 'height', label: 'Alto', unit: 'cm', max: 200, ph: '15' },
                      { key: 'width', label: 'Ancho', unit: 'cm', max: 200, ph: '15' },
                      { key: 'length', label: 'Largo', unit: 'cm', max: 200, ph: '15' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className={labelCls}>{f.label}</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={f.max}
                            value={(formData as any)[f.key]}
                            onChange={(e) => setFormData({ ...formData, [f.key]: Number(e.target.value) })}
                            className={`${inputCls} pr-10`}
                            placeholder={f.ph}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{f.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={`${hintCls} ${sumSides > 300 ? 'text-red-500 font-bold' : ''}`}>
                    {sumSides > 300
                      ? `Alto + ancho + largo suman ${sumSides} cm: Correo Argentino acepta hasta 300 cm.`
                      : 'Peso hasta 50 kg; cada lado hasta 200 cm y los tres lados sumados hasta 300 cm.'}
                  </p>
                </Section>
              </div>

              {/* ---------- Columna lateral: vista previa + qué falta ---------- */}
              <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Así se ve en la tienda</p>
                  <div
                    className={`aspect-[4/3] rounded-2xl bg-[#F8F9FA] border border-gray-100 flex items-center justify-center overflow-hidden ${validImages[0] ? 'cursor-zoom-in' : ''}`}
                    onClick={() => validImages[0] && setFullScreenImage(validImages[0])}
                  >
                    {validImages[0] ? (
                      <img src={validImages[0]} alt="" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <ImageIcon size={32} strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sin foto todavía</span>
                      </div>
                    )}
                  </div>
                  <span className="inline-block mt-3 text-[9px] font-black uppercase tracking-widest text-[#1C86C8] bg-[#1C86C8]/10 px-2 py-1 rounded-full">
                    {formData.displaySection === 'Combo' ? 'Combo' : formData.category || 'Sin categoría'}
                  </span>
                  <p className="mt-2 font-black italic uppercase text-[#111214] leading-tight line-clamp-2">{formData.name || 'Nombre del producto'}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-black italic text-[#1C86C8]">{priceNum ? `$${priceNum.toLocaleString('es-AR')}` : '$ —'}</span>
                    {discount > 0 && <span className="text-xs font-bold text-gray-400 line-through">${oldPriceNum.toLocaleString('es-AR')}</span>}
                  </div>
                  <p className="mt-1 text-xs font-bold text-gray-500">
                    {stockTotal > 0 ? `${stockTotal} unidades${hasVariants ? ` en ${formData.variants.length} sabores` : ''}` : 'Sin stock'}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#111214]">Visible en la tienda</p>
                      <p className="text-[11px] text-gray-400 font-medium">{formData.isActive ? 'Los clientes lo ven y lo pueden comprar.' : 'Oculto: nadie lo ve en la tienda.'}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isActive}
                      onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                      {missing === 0 ? 'Listo para publicar' : `Te falta completar ${missing}`}
                    </p>
                    <ul className="space-y-1.5">
                      {checklist.map((c) => (
                        <li key={c.label} className={`flex items-center gap-2 text-xs font-bold ${c.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${c.ok ? 'bg-emerald-500 text-white' : 'border border-gray-300'}`}>
                            {c.ok ? '✓' : ''}
                          </span>
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* Pie fijo: siempre a mano */}
          <div className="flex items-center justify-between gap-3 px-5 md:px-8 py-4 bg-white border-t border-gray-100 shrink-0">
            <button type="button" onClick={onClose} className="pf-ghost px-5 py-3 rounded-full text-sm font-bold text-gray-500">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-admin-primary justify-center px-8">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Guardando…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={18} />
                  {initialData ? 'Guardar cambios' : 'Publicar producto'}
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullScreenImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <button onClick={() => setFullScreenImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
              <X size={24} />
            </button>
            <img src={fullScreenImage} className="max-w-full max-h-[85vh] object-contain select-none" alt="Vista ampliada" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductForm;
