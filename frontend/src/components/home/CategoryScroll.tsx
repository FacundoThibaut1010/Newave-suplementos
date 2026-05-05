import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const categories = [
  { name: 'Proteínas', image: '/proteina.jpg' },
  { name: 'Pre-Entreno', image: '/pre entreno.jpg.png' },
  { name: 'Creatinas', image: '/creatina (1).jpg' },
  { name: 'Minerales', image: '/minerales.png' },
  { name: 'Colágenos', image: '/colageno.jpg' },
];

const CategoryScroll = () => {
  // Triplicamos para asegurar que haya suficiente contenido para el scroll infinito
  const displayCategories = [...categories, ...categories, ...categories, ...categories];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Scroll automático
  useEffect(() => {
    let animationId: number;
    const scroll = () => {
      if (scrollRef.current && !isHovered && !isDragging) {
        scrollRef.current.scrollLeft += 1; // Velocidad de scroll

        // Si llegamos a un cuarto del total (1 set completo), volvemos a 0 para un loop infinito invisible
        if (scrollRef.current.scrollLeft >= scrollRef.current.scrollWidth / 4) {
          scrollRef.current.scrollLeft -= scrollRef.current.scrollWidth / 4;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };
    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, isDragging]);

  // Manejo de arrastre con el mouse
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
    const walk = (x - startX) * 2; // Multiplicador de velocidad de arrastre
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  return (
    <section className="pt-6 pb-12 overflow-hidden bg-[#F8F5F0]">
      <div className="w-full relative">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pl-6 py-8 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          {displayCategories.map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="relative rounded-3xl overflow-hidden group shrink-0 bg-gray-200 shadow-sm hover:shadow-xl transition-all duration-500 min-w-[280px] h-[380px]"
            >
              <img src={cat.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" alt={cat.name} />

              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

              <div className="absolute top-6 left-0 right-0 text-center pointer-events-none">
                <h4 className="font-bold text-white tracking-tight drop-shadow-md text-[28px]">
                  {cat.name}
                </h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryScroll;
