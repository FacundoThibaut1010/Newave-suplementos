import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import apiClient from '../../api/apiClient';
import heroImage from '../../assets/hero-newave3.svg';

const Hero = () => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        setConfig(data.hero);
      } catch (err) {
        console.error('Error fetching hero config');
        // Fallback config if API fails
        setConfig({
          title: 'TU MEJOR VERSIÓN',
          subtitle: 'ALCANZÁ TUS OBJETIVOS CON LA MEJOR SUPLEMENTACIÓN',
          buttonText: 'Explorar Tienda'
        });
      }
    };
    fetchConfig();
  }, []);

  if (!config) return null;

  return (
    <div className="pt-[120px] bg-[#F8F5F0]"> {/* Match bakery cream background */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Newave Hero"
            className="w-full h-full object-cover object-center md:object-right transition-transform duration-1000 hover:scale-105"
          />
          {/* Subtle gradient to help text readability on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8F5F0]/80 via-transparent to-transparent md:bg-none" />
        </div>
        
        <div className="relative z-10 h-full w-full px-8 md:px-16 lg:px-24 flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] text-[#3D1E14] tracking-tight mb-8">
              Tu mejor versión.<br />
              Entrená al límite.
            </h1>
            <p className="text-lg md:text-xl text-[#3D1E14]/70 mb-10 max-w-lg font-medium leading-relaxed">
              Alcanzá tus objetivos con la suplementación de élite que tu cuerpo necesita para rendir al máximo en cada entrenamiento.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-[#3D1E14] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#3D1E14]/90 transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
                Comprar suplementos
              </button>
            </div>
          </motion.div>
        </div>

        {/* Subtle Decorative Element */}
        <div className="absolute bottom-12 left-12 hidden md:flex items-center gap-4 text-[#3D1E14]/30">
          <div className="w-12 h-[1px] bg-current" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Newave Bakery</span>
        </div>
      </section>

      {/* Section Title below Hero */}
      <div id="categorias" className="pt-16 pb-0 text-center scroll-mt-[140px]">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#202A36] uppercase italic tracking-tighter">
          Descubrí tu potencial
        </h2>
        <div className="w-20 h-1 bg-[#CAA959] mx-auto mt-4 mb-4" />
        <button className="text-sm font-black uppercase tracking-widest text-gray-500 hover:text-[#CAA959] transition-all">
          Ver todas
        </button>
      </div>
    </div>
  );
};

export default Hero;
