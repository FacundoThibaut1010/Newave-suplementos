import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import apiClient from '../../api/apiClient';
import heroProducts from '../../assets/productos-hero.svg';

const Hero = () => {
  const [config, setConfig] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        setConfig(data.hero);
      } catch (err) {
        console.error('Error fetching hero config');
        setConfig({
          title: 'ENERGÍA. FUERZA. RESULTADOS.',
          subtitle: 'Dominá tu rendimiento con suplementación de élite diseñada para superar cada límite.',
          buttonText: 'Comprar ahora'
        });
      }
    };
    fetchConfig();
  }, []);

  if (!config) return null;

  return (
    <div className="relative pt-[220px] lg:pt-[120px] min-h-[100vh] lg:min-h-[90vh] flex flex-col justify-between overflow-hidden bg-[#0A0A0B]">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[100%] lg:w-[80%] h-[140%] bg-radial-gradient from-[#CAA959]/10 via-transparent to-transparent blur-[80px] lg:blur-[120px]"
        />
      </div>

      <div className="relative z-10 flex-grow w-full max-w-[1600px] mx-auto px-6 md:px-16 lg:px-24 flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center justify-center lg:justify-start">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-3xl text-center lg:text-left relative py-8 lg:py-0 z-20 lg:z-0"
        >
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
            <div className="h-[2px] w-8 lg:w-12 bg-[#CAA959]" />
            <span className="text-[#CAA959] text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] drop-shadow-md">Strength & Performance</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] text-white tracking-tighter uppercase mb-6 lg:mb-8 drop-shadow-2xl">
            Energía.<br />
            Fuerza.<br />
            <span className="text-transparent tracking-normal font-bold" style={{ WebkitTextStroke: isMobile ? '1.5px #CAA959' : '1.5px #CAA959', paintOrder: 'stroke fill', fontFamily: 'Inter, sans-serif' }}>Resultados.</span>
          </h1>

          <p className="text-base md:text-xl text-white lg:text-zinc-400 mb-8 lg:mb-12 max-w-xl mx-auto lg:mx-0 font-semibold lg:font-medium leading-relaxed drop-shadow-lg">
            {config.subtitle || 'Descubrí la suplementación premium diseñada para quienes buscan superar cada límite.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-6">
            <button className="w-full sm:w-auto group relative bg-[#CAA959] text-black px-10 lg:px-12 py-4 lg:py-5 rounded-sm text-base lg:text-lg font-black uppercase italic tracking-tighter hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(202,169,89,0.4)]">
              <span className="flex items-center justify-center gap-3">
                {config.buttonText || 'Comprar ahora'}
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </span>
            </button>

            <button className="w-full sm:w-auto group px-10 lg:px-12 py-4 lg:py-5 border-2 border-white text-white rounded-sm text-base lg:text-lg font-black uppercase italic tracking-tighter hover:bg-white hover:text-black transition-all duration-300">
              Ver Catálogo
            </button>
          </div>

          <div className="mt-10 lg:mt-16 flex items-center justify-center lg:justify-start gap-8 border-t border-white/10 pt-8">
            <div className="flex flex-col">
              <span className="text-white text-2xl lg:text-2xl font-black italic">+50K</span>
              <span className="text-zinc-400 lg:text-zinc-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">Atletas</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-white text-2xl lg:text-2xl font-black italic">100%</span>
              <span className="text-zinc-400 lg:text-zinc-500 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">Pureza</span>
            </div>
          </div>
        </motion.div>

        {/* Products Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1.4 }}
          whileHover={!isMobile ? { scale: 1.5, rotate: 2 } : {}}
          transition={{ duration: 1.5, ease: "easeOut", scale: { duration: 0.4 } }}
          className="absolute lg:relative inset-0 lg:inset-auto w-full h-full flex justify-center items-center lg:justify-end cursor-pointer z-0 lg:z-20"
        >
          <div className="relative w-full max-w-[600px] lg:max-w-[1400px] h-[120%] lg:h-[200%] flex items-center justify-center lg:justify-end -translate-y-24 lg:translate-x-20 lg:-translate-y-12 drop-shadow-[0_0_100px_rgba(202,169,89,0.15)] lg:drop-shadow-[0_0_180px_rgba(202,169,89,0.3)] opacity-40 lg:opacity-100">
            <img
              src={heroProducts}
              alt="Newave Performance Products"
              className="w-auto h-full max-h-none object-contain lg:object-right"
            />
          </div>

          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-radial-gradient from-[#CAA959]/5 via-transparent to-transparent blur-3xl opacity-50" />
        </motion.div>
      </div>

      {/* Section Title below Hero - Integrated into same dark flow */}
      <div className="relative z-10 py-12 lg:py-16 text-center bg-gradient-to-t from-[#0A0A0B] to-transparent">
        <h2 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
          Descubrí tu potencial
        </h2>
        <div className="w-16 lg:w-20 h-1 bg-[#CAA959] mx-auto mt-4 mb-4" />
        <button className="text-[10px] lg:text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-[#CAA959] transition-all">
          Ver todas
        </button>
      </div>

      {/* Side Label */}
      <div className="absolute left-10 bottom-48 hidden xl:flex items-center gap-4 origin-left -rotate-90 pointer-events-none">
        <span className="text-zinc-800 text-[10px] font-black uppercase tracking-[1em]">NEWAVE ELITE SERIES</span>
        <div className="h-[1px] w-24 bg-zinc-900" />
      </div>
    </div>
  );
};

export default Hero;
