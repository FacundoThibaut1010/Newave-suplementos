import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Sparkles, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';

const StoreSettings = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        setConfig(data);
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Identidad de Marca</h1>
          <p className="text-gray-400 font-medium tracking-tight">Personaliza la primera impresión de tu tienda.</p>
        </div>
        <button onClick={handleSave} className="btn-admin-primary px-10">
          <Save size={18} />
          Publicar Cambios
        </button>
      </div>

      <div className="grid gap-10">
        {/* Hero CMS */}
        <section className="card-premium p-10 space-y-8">
          <div className="flex items-center gap-3 text-black">
            <Sparkles size={22} strokeWidth={2.5} />
            <h3 className="text-xl font-bold tracking-tight">Configuración del Hero</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Título de Impacto</label>
                <input 
                  type="text" 
                  value={config.hero.title}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  className="input-admin w-full text-lg font-bold"
                  placeholder="Ej: Pure Essence."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Subtítulo Descriptivo</label>
                <textarea 
                  value={config.hero.subtitle}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  className="input-admin w-full h-32 resize-none leading-relaxed font-medium"
                  placeholder="Cuéntale al mundo de qué trata tu marca..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Preview de Imagen Principal</label>
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
        <section className="card-premium p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-black">
              <Megaphone size={22} strokeWidth={2.5} />
              <h3 className="text-xl font-bold tracking-tight">Barra de Anuncios</h3>
            </div>
            <button 
              onClick={() => setConfig({ ...config, announcement: { ...config.announcement, enabled: !config.announcement.enabled } })}
              className={`w-14 h-7 rounded-full transition-all relative ${config.announcement.enabled ? 'bg-black' : 'bg-gray-200'}`}
            >
              <motion.div 
                animate={{ x: config.announcement.enabled ? 32 : 4 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
          <input 
            type="text" 
            value={config.announcement.text}
            onChange={(e) => setConfig({ ...config, announcement: { ...config.announcement, text: e.target.value } })}
            placeholder="Ej: Envío gratis este fin de semana 🎉"
            className="input-admin w-full font-bold text-center italic"
          />
        </section>
      </div>
    </div>
  );
};

export default StoreSettings;
