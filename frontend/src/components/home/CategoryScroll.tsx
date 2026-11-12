import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../store/useProductStore';

/**
 * "Descubrí tu potencial": categorías con productos a la venta.
 * - Celular: fila deslizable horizontal.
 * - Compu: tarjetas centradas y todas visibles (sin scroll horizontal, nada queda cortado).
 * Fondo negro para cortar el claro del Hero.
 */

const CARD_SIZE = 'w-[200px] h-[266px] md:w-[200px] md:h-[266px] lg:w-[220px] lg:h-[293px]';

const CategorySkeleton = () => (
  <div className={`relative rounded-3xl overflow-hidden shrink-0 bg-white/10 animate-pulse ${CARD_SIZE}`} />
);

const CategoryScroll = () => {
  const { activeCategories, loading } = useProductStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Arrastrar con el mouse solo tiene sentido cuando la fila desborda (celular / pantallas chicas)
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };
  const stopDragging = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 2;
  };

  const showSkeletons = loading && activeCategories.length === 0;
  if (!loading && activeCategories.length === 0) return null;

  return (
    <section id="categorias" className="overflow-hidden bg-[#0A0A0B] scroll-mt-[160px]">
      <div className="relative z-10 pt-14 lg:pt-16 pb-6 text-center px-6">
        <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Descubrí tu potencial</h2>
        <div className="w-14 lg:w-16 h-1 bg-[#CAA959] mx-auto mt-4 mb-4" />
        <Link to="/productos" className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-[#CAA959] transition-colors">
          Ver todos
        </Link>
      </div>

      <div className="w-full relative pb-12 lg:pb-16">
        <div
          ref={scrollRef}
          className="flex gap-4 lg:gap-5 overflow-x-auto md:overflow-visible md:flex-wrap md:justify-center px-6 pt-4 pb-6 cursor-grab active:cursor-grabbing md:cursor-default scrollbar-hide select-none md:max-w-[1200px] mx-auto"
          onMouseDown={onMouseDown}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onMouseMove={onMouseMove}
        >
          {showSkeletons
            ? Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
            : activeCategories.map((cat, i) => (
                <motion.div
                  key={cat.slug || i}
                  initial={{ opacity: 0, transform: 'translateY(12px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: i * 0.06 }}
                  className={`category-card relative rounded-3xl overflow-hidden group shrink-0 bg-zinc-900 ${CARD_SIZE}`}
                >
                  <img
                    decoding="async"
                    loading="lazy"
                    src={cat.image}
                    alt={cat.name}
                    className="category-card-img w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
                  <div className="category-card-dim absolute inset-0 bg-black/0 pointer-events-none z-20" />
                  <div className="absolute top-5 left-0 right-0 text-center pointer-events-none z-30 px-3">
                    <h4 className="category-card-title font-bold text-white tracking-tight drop-shadow-lg text-[22px] lg:text-[24px]">{cat.name}</h4>
                  </div>
                  <Link
                    to={`/productos/${cat.slug}`}
                    onClick={(e) => {
                      if (isDragging) e.preventDefault();
                    }}
                    className="absolute inset-0 z-40"
                    aria-label={`Ver ${cat.name}`}
                  />
                </motion.div>
              ))}
          <div className="shrink-0 w-px md:hidden" />
        </div>
      </div>
    </section>
  );
};

export default CategoryScroll;
