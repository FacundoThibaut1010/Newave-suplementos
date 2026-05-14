import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Sparkles, Megaphone, ArrowLeft, Image as ImageIcon, Type, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';

const StoreSettings = () => {
  const [config, setConfig] = useState<any>(null);
  const [originalConfig, setOriginalConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        setConfig(data);
        setOriginalConfig(data);
      } catch (err) {
        toast.error('No pudimos cargar la configuración actual. 🔄');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await apiClient.put('/admin/config', config);
      setOriginalConfig(config); // Update original config to the newly saved one
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

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Identidad de Marca</h1>
            <p className="text-gray-500 font-medium tracking-tight">Cambia los textos e imágenes de la pantalla principal de tu tienda (el inicio).</p>
          </div>
          <div className="flex gap-3">
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
        {/* Hero CMS */}
        <section className="card-premium p-10 space-y-8 border-2 border-transparent hover:border-gray-100 transition-colors">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 text-black mb-1">
              <Sparkles size={22} strokeWidth={2.5} className="text-[#CAA959]" />
              <h3 className="text-xl font-bold tracking-tight">Portada Principal (Inicio de la Tienda)</h3>
            </div>
            <p className="text-sm text-gray-400">Esto cambia el texto gigante y la foto que ven tus clientes apenas entran a tu página web.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-2">
                  <Type size={14} /> Título Gigante
                </label>
                <input 
                  type="text" 
                  value={config.hero.title}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  className="input-admin w-full text-lg font-black tracking-tight"
                  placeholder="Ej: Energía. Fuerza. Resultados."
                />
                <p className="text-xs text-gray-400 mt-2 ml-2 italic">Tip: La última palabra se pintará de color dorado automáticamente.</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-2">
                  <Type size={14} /> Subtítulo Descriptivo (Texto en gris abajo)
                </label>
                <textarea 
                  value={config.hero.subtitle}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  className="input-admin w-full h-32 resize-none leading-relaxed font-medium text-sm text-gray-600"
                  placeholder="Descubrí la suplementación premium..."
                />
              </div>
            </div>

            <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">
                <ImageIcon size={14} /> Foto del Producto en Portada (Lado Derecho)
              </label>
              <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner translate-y-0 group">
                <img src={config.hero.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Hero Preview" />
              </div>
              <input 
                type="text" 
                value={config.hero.image}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, image: e.target.value } })}
                className="input-admin text-[11px] font-mono"
                placeholder="URL de la imagen..."
              />
            </div>
          </div>
        </section>

        {/* Announcement CMS */}
        <section className="card-premium p-10 border-2 border-transparent hover:border-gray-100 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-black">
              <Megaphone size={22} strokeWidth={2.5} className="text-[#009EE3]" />
              <h3 className="text-xl font-bold tracking-tight">Cinta de Anuncios (Franja Negra Arriba)</h3>
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
            Si lo encendés, se dejarán de mostrar los mensajes predeterminados rotativos y quedará fijo el texto que escribas abajo (Ideal para promociones temporales).
          </p>
          
          <div className={`transition-opacity duration-300 ${!config.announcement.enabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-2">Texto del anuncio</label>
            <input 
              type="text" 
              value={config.announcement.text}
              onChange={(e) => setConfig({ ...config, announcement: { ...config.announcement, text: e.target.value } })}
              placeholder="Ej: ENVÍO GRATIS ESTE FIN DE SEMANA 🎉"
              className="input-admin w-full font-black text-center uppercase tracking-widest text-sm"
              disabled={!config.announcement.enabled}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default StoreSettings;
