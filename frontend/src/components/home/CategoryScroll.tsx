import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/useProductStore';

const CategorySkeleton = () => (
  <div className="relative rounded-3xl overflow-hidden shrink-0 bg-gray-200 animate-pulse w-[240px] md:w-[280px] h-[340px] md:h-[380px]" />
);

const CategoryScroll = () => {
  const { activeCategories, loading } = useProductStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseUp = () => setIsDragging(false);

  const onMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const showSkeletons = loading && activeCategories.length === 0;

  return (
    <section id="categorias" className="overflow-hidden bg-white scroll-mt-[160px]">
      <div className="relative z-10 pt-16 pb-8 text-center">
        <h2 className="text-2xl md:text-5xl font-black text-[#202A36] uppercase italic tracking-tighter">
          Descubrí tu potencial
        </h2>
        <div className="w-16 lg:w-20 h-1 bg-[#CAA959] mx-auto mt-4 mb-4" />
        <Link
          to="/productos"
          className="text-[10px] lg:text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-[#CAA959] transition-all"
        >
          Ver todos
        </Link>
      </div>

      <div className="w-full relative bg-white pt-0 pb-12">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto px-6 pt-6 pb-8 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          {showSkeletons
            ? Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
            : activeCategories.map((cat, i) => (
                <motion.div
                  key={cat.slug || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -10 }}
                  className="relative rounded-3xl overflow-hidden group shrink-0 bg-gray-200 shadow-sm hover:shadow-xl transition-all duration-500 w-[240px] md:w-[280px] h-[340px] md:h-[380px]"
                >
                  <img
                    src={cat.image}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    alt={cat.name}
                    loading="lazy"
                  />

                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-500 pointer-events-none z-20" />

                  <div className="absolute top-6 left-0 right-0 text-center pointer-events-none z-30">
                    <h4 className="font-bold text-white group-hover:text-[#CAA959] transition-colors duration-300 tracking-tight drop-shadow-lg text-[28px]">
                      {cat.name}
                    </h4>
                  </div>

                  <Link
                    to={`/productos/${cat.slug}`}
                    onClick={(e) => {
                      if (isDragging) e.preventDefault();
                    }}
                    className="absolute inset-0 z-40 cursor-pointer"
                  />
                </motion.div>
              ))}
          <div className="shrink-0 w-[1px]" />
        </div>
      </div>
    </section>
  );
};

export default CategoryScroll;
