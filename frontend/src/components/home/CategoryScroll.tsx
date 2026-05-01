import React from 'react';
import { motion } from 'framer-motion';

const categories = [
  { name: 'Proteínas', image: 'https://images.unsplash.com/photo-1593079831268-3381b0ad4a7a?auto=format&fit=crop&q=80&w=800' },
  { name: 'Creatinas', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=800' },
  { name: 'Pre-Entreno', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800' },
  { name: 'Aminoácidos', image: 'https://images.unsplash.com/photo-1541534741688-6078c64b52d3?auto=format&fit=crop&q=80&w=800' },
  { name: 'Accesorios', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2aac61?auto=format&fit=crop&q=80&w=800' },
];

const CategoryScroll = () => {
  return (
    <section className="py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 flex justify-between items-end">
        <h3 className="text-xl font-black text-[#202A36] uppercase italic tracking-tighter">Categorías</h3>
        <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1">Ver todas</button>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-8 px-6 lg:px-[calc((100vw-1280px)/2+24px)] no-scrollbar">
        {categories.map((cat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className="min-w-[280px] h-[380px] relative rounded-[2rem] overflow-hidden group cursor-pointer shrink-0"
          >
            <img src={cat.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={cat.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{cat.name}</h4>
              <div className="w-0 group-hover:w-full h-1 bg-[#CAA959] transition-all duration-500 mt-2" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryScroll;
