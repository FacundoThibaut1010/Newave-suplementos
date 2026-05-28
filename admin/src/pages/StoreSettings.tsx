import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Sparkles, Megaphone, ArrowLeft, Image as ImageIcon, Type, RotateCcw, Package, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';
import { useAdminStore } from '../store/useAdminStore';

const StoreSettings = () => {
  const { products, config: storeConfig, loadingProducts, loadingConfig, fetchProducts, fetchConfig } = useAdminStore();
  const [config, setConfig] = useState<any>(null);
  const [originalConfig, setOriginalConfig] = useState<any>(null);
  const loading = loadingProducts || loadingConfig || !config;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    announcements: false,
    categories: false,
    bestSellers: false
  });
  const navigate = useNavigate();

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    fetchProducts();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (storeConfig) {
      setConfig(storeConfig);
      setOriginalConfig(storeConfig);
    }
  }, [storeConfig]);

  const handleSave = async () => {
    try {
      await apiClient.put('/admin/config', config);
      setOriginalConfig(config); // Update original config to the newly saved one
      fetchConfig(true); // force refresh store config
      toast.success('¡Excelente! Tu tienda acaba de actualizarse con los nuevos cambios.');
    } catch (err) {
      toast.error('Hubo un problema al guardar los cambios.');
    }
  };

  if (loading || !config) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Encabezado con Volver Atrás */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors w-fit text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Volver Atrás
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-black tracking-tighter mb-2">Identidad de Marca</h1>
            <p className="text-gray-500 font-medium tracking-tight">Personaliza los anuncios rotativos y las categorías de tu tienda.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {JSON.stringify(config) !== JSON.stringify(originalConfig) && (
              <button 
                onClick={() => {
                  setConfig(originalConfig);
                  toast.success('Cambios descartados. Se restauró a la versión anterior.');
                }} 
                className="py-3 px-6 border-2 border-gray-200 text-gray-500 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Descartar Cambios
              </button>
            )}
            <button onClick={handleSave} className="btn-admin-primary px-10 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Save size={18} />
              Publicar Cambios
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-10">


        {/* Announcement CMS */}
        <section className="card-premium border-2 border-transparent hover:border-gray-100 transition-colors">
          <div 
            className="p-6 md:p-8 flex items-center justify-between cursor-pointer select-none"
            onClick={() => toggleSection('announcements')}
          >
            <div className="flex items-center gap-3 text-black">
              <Megaphone size={22} strokeWidth={2.5} className="text-[#009EE3]" />
              <h3 className="text-xl font-bold tracking-tight">Cinta de Anuncios (Franja Negra Arriba)</h3>
            </div>
            <motion.div animate={{ rotate: openSections.announcements ? 180 : 0 }}>
              <ChevronDown size={24} className="text-gray-400" />
            </motion.div>
          </div>
          
          <div className={`grid transition-all duration-300 ease-in-out ${openSections.announcements ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="px-6 pb-6 md:px-8 md:pb-8 border-t border-gray-50 pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 md:gap-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700">Estado de la cinta</span>
                  </div>
                  <button 
                    onClick={() => setConfig({ ...config, announcement: { ...config.announcement, enabled: !config.announcement.enabled } })}
                    className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${config.announcement.enabled ? 'bg-black' : 'bg-gray-300'}`}
                    title={config.announcement.enabled ? 'Desactivar anuncio fijo' : 'Activar anuncio fijo'}
                  >
                    <motion.div 
                      animate={{ x: config.announcement.enabled ? 32 : 4 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-8">
                  Si lo apagas, solo se verán los anuncios por defecto del sistema. Si lo enciendes, se mostrarán los anuncios por defecto <strong>junto con</strong> todos los que agregues aquí abajo.
                </p>
                
                <div className={`transition-opacity duration-300 ${!config.announcement.enabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Textos Rotativos del Anuncio</label>
                    <button
                      type="button"
                      onClick={() => {
                        const msgs = config.announcement.messages || (config.announcement.text ? [config.announcement.text] : []);
                        setConfig({ ...config, announcement: { ...config.announcement, messages: [...msgs, 'NUEVO ANUNCIO'] } });
                      }}
                      className="text-[10px] text-[#009EE3] font-bold uppercase tracking-widest hover:underline"
                    >
                      + Agregar Anuncio
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(config.announcement.messages || (config.announcement.text ? [config.announcement.text] : [])).map((msg: string, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={msg}
                          onChange={(e) => {
                            const msgs = [...(config.announcement.messages || [config.announcement.text])];
                            msgs[idx] = e.target.value;
                            setConfig({ ...config, announcement: { ...config.announcement, messages: msgs } });
                          }}
                          placeholder="Ej: ENVÍO GRATIS ESTE FIN DE SEMANA 🎉"
                          className="input-admin w-full font-black text-center uppercase tracking-widest text-sm"
                          disabled={!config.announcement.enabled}
                        />
                        <button 
                          onClick={() => {
                            const msgs = [...(config.announcement.messages || [config.announcement.text])];
                            msgs.splice(idx, 1);
                            setConfig({ ...config, announcement: { ...config.announcement, messages: msgs } });
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-xl shrink-0"
                          title="Eliminar Anuncio"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories CMS */}
        <section className="card-premium border-2 border-transparent hover:border-gray-100 transition-colors">
          <div 
            className="p-6 md:p-8 flex items-center justify-between cursor-pointer select-none"
            onClick={() => toggleSection('categories')}
          >
            <div className="flex items-center gap-3 text-black">
              <Package size={22} strokeWidth={2.5} className="text-[#CAA959]" />
              <h3 className="text-xl font-bold tracking-tight">Categorías (Imágenes y Nombres)</h3>
            </div>
            <motion.div animate={{ rotate: openSections.categories ? 180 : 0 }}>
              <ChevronDown size={24} className="text-gray-400" />
            </motion.div>
          </div>
          
          <div className={`grid transition-all duration-300 ease-in-out ${openSections.categories ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="px-6 pb-6 md:px-8 md:pb-8 border-t border-gray-50 pt-6">
                <p className="text-sm text-gray-400 mb-8">
                  Aquí puedes personalizar cómo se ven las categorías en tu página principal. Nota: Las categorías solo aparecerán en la web (menú, filtros, etc.) si tienes al menos un producto cargado con esa categoría.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {config.categories?.map((cat: any, index: number) => (
                    <div key={index} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Nombre</label>
                        <input 
                          type="text" 
                          value={cat.name}
                          onChange={(e) => {
                            const newCategories = [...config.categories];
                            newCategories[index].name = e.target.value;
                            setConfig({ ...config, categories: newCategories });
                          }}
                          className="input-admin w-full text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Slug (Identificador)</label>
                        <input 
                          type="text" 
                          value={cat.slug}
                          onChange={(e) => {
                            const newCategories = [...config.categories];
                            newCategories[index].slug = e.target.value;
                            setConfig({ ...config, categories: newCategories });
                          }}
                          className="input-admin w-full text-sm font-mono text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">Imagen URL</label>
                        <input 
                          type="text" 
                          value={cat.image}
                          onChange={(e) => {
                            const newCategories = [...config.categories];
                            newCategories[index].image = e.target.value;
                            setConfig({ ...config, categories: newCategories });
                          }}
                          className="input-admin w-full text-[11px] font-mono"
                          placeholder="https://..."
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newCategories = config.categories.filter((_: any, i: number) => i !== index);
                          setConfig({ ...config, categories: newCategories });
                        }}
                        className="w-full mt-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Eliminar Categoría
                      </button>
                    </div>
                  ))}
                  
                  {/* Add new category button */}
                  <div 
                    onClick={() => {
                      const newCategories = [...(config.categories || []), { name: 'Nueva Categoría', slug: 'nueva', image: '' }];
                      setConfig({ ...config, categories: newCategories });
                    }}
                    className="bg-gray-50/50 p-4 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors min-h-[300px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400 mb-3">
                      <span className="text-2xl leading-none">+</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500">Agregar Categoría</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best Sellers CMS */}
        <section className="card-premium border-2 border-transparent hover:border-gray-100 transition-colors">
          <div 
            className="p-6 md:p-8 flex items-center justify-between cursor-pointer select-none"
            onClick={() => toggleSection('bestSellers')}
          >
            <div className="flex items-center gap-3 text-black">
              <Sparkles size={22} strokeWidth={2.5} className="text-[#CAA959]" />
              <h3 className="text-xl font-bold tracking-tight">Más Vendidos (Carrusel de Inicio)</h3>
            </div>
            <motion.div animate={{ rotate: openSections.bestSellers ? 180 : 0 }}>
              <ChevronDown size={24} className="text-gray-400" />
            </motion.div>
          </div>
          
          <div className={`grid transition-all duration-300 ease-in-out ${openSections.bestSellers ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="px-6 pb-6 md:px-8 md:pb-8 border-t border-gray-50 pt-6">
                <p className="text-sm text-gray-400 mb-8">
                  Selecciona los productos que quieres destacar en el carrusel de "Más Vendidos" en la página principal. Si no seleccionas ninguno, la sección no se mostrará.
                </p>

                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Seleccionar Productos</label>
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {products.map((p) => {
                      const isSelected = config.bestSellers?.some((b: any) => (b._id || b) === p._id);
                      return (
                        <div 
                          key={p._id}
                          onClick={() => {
                            const newBestSellers = isSelected 
                              ? config.bestSellers.filter((b: any) => (b._id || b) !== p._id)
                              : [...(config.bestSellers || []), p._id];
                            setConfig({ ...config, bestSellers: newBestSellers });
                          }}
                          className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-white border-[#202A36] shadow-sm' : 'border-transparent hover:bg-gray-100'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 ${isSelected ? 'bg-[#202A36] border-[#202A36]' : 'border-gray-300'}`}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <img src={p.images?.[0] || p.image} alt={p.name} className="w-10 h-10 object-contain rounded-lg bg-white border border-gray-100 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#202A36]' : 'text-gray-600'}`}>{p.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase">{p.category || 'General'}</p>
                          </div>
                        </div>
                      );
                    })}
                    {products.length === 0 && (
                      <p className="text-sm text-gray-400 font-medium py-4 text-center">No hay productos cargados en el inventario.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StoreSettings;

