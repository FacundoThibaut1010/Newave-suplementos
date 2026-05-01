import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import apiClient from '../../api/apiClient';

const Hero = () => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        setConfig(data.hero);
      } catch (err) {
        console.error('Error fetching hero config');
      }
    };
    fetchConfig();
  }, []);

  if (!config) return null;

  return (
    <div className="pt-[120px]"> {/* Offset for TopBar (40px) + Navbar (80px) */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        {/* Full Width Slider Mockup */}
        <div className="absolute inset-0">
          <img
            src={config.image}
            alt="Hero Visual"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        <div className="relative h-full max-w-7xl mx-auto px-8 lg:px-12 flex items-center pt-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-7xl md:text-[10rem] font-black italic leading-[0.8] text-white tracking-tighter uppercase mb-8">
              {config.title.split(' ')[0]} <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '2px white' }}>
                {config.title.split(' ')[1] || ''}
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-md font-medium uppercase tracking-widest italic">
              {config.subtitle}
            </p>
            <button className="btn-accent px-12 py-5 text-lg shadow-2xl shadow-gold/40">
              {config.buttonText || 'Comprar ahora'}
            </button>
          </motion.div>
        </div>

        {/* Navigation Arrows Mockup */}
        <div className="absolute bottom-12 right-12 flex gap-4">
          <button className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <button className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Section Title below Hero */}
      <div className="py-16 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-[#202A36] uppercase italic tracking-tighter">
          Descubrí tu potencial
        </h2>
        <div className="w-20 h-1 bg-[#CAA959] mx-auto mt-4" />
      </div>
    </div>
  );
};

export default Hero;
