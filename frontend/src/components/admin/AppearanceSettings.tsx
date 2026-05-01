import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';

const AppearanceSettings = () => {
  const [config, setConfig] = useState<any>({
    hero: { title: '', subtitle: '', image: '', buttonText: '' },
    announcement: { text: '', enabled: true }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        setConfig(data);
      } catch (err) {
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await apiClient.put('/admin/config', config);
      toast.success('¡Hecho! La identidad de tu tienda ha sido actualizada');
    } catch (err) {
      toast.error('Hubo un problema al guardar');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Identidad Visual</h1>
          <p className="text-gray-400 font-medium">Personaliza el mensaje y estética de tu marca.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-3xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 transition-transform"
        >
          <Save size={18} />
          Guardar Cambios
        </button>
      </div>

      <div className="grid gap-8">
        {/* Hero Section CMS */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-premium space-y-8 border border-gray-50">
          <div className="flex items-center gap-3 text-black mb-4">
            <Sparkles size={20} />
            <h3 className="text-xl font-bold tracking-tight">Estrategia de Hero</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Título Principal</label>
                <input 
                  type="text" 
                  value={config.hero.title}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  className="w-full px-6 py-4 bg-[#F4F4F5] border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Subtítulo</label>
                <textarea 
                  value={config.hero.subtitle}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  className="w-full px-6 py-4 bg-[#F4F4F5] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black/5 h-32"
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Previsualización de Imagen</label>
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 relative group">
                {config.hero.image ? (
                  <img src={config.hero.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <ImageIcon size={40} strokeWidth={1} />
                    <p className="text-[10px] uppercase font-bold tracking-tighter mt-2">Sin imagen seleccionada</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="px-6 py-3 bg-white rounded-full text-xs font-bold text-black shadow-xl">Cambiar Imagen</button>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="URL de imagen (Cloudinary/Unsplash)"
                value={config.hero.image}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, image: e.target.value } })}
                className="w-full px-6 py-4 bg-[#F4F4F5] border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-black/5"
              />
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold tracking-tight">Banner de Anuncio</h3>
            <button 
              onClick={() => setConfig({ ...config, announcement: { ...config.announcement, enabled: !config.announcement.enabled } })}
              className={`w-12 h-6 rounded-full transition-colors relative ${config.announcement.enabled ? 'bg-black' : 'bg-gray-200'}`}
            >
              <motion.div 
                animate={{ x: config.announcement.enabled ? 26 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
          <input 
            type="text" 
            value={config.announcement.text}
            onChange={(e) => setConfig({ ...config, announcement: { ...config.announcement, text: e.target.value } })}
            placeholder="Escribe el anuncio aquí..."
            className="w-full px-6 py-4 bg-[#F4F4F5] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
