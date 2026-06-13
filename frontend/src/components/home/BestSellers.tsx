import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';

const BestSellers = () => {
  const bestSellers = useStoreConfigStore((state) => state.bestSellers);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = React.useState(false);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5);
      setCanScrollUp(scrollTop > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
      setCanScrollLeft(scrollLeft > 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [bestSellers]);

  if (bestSellers.length === 0) {
    return null;
  }

  return (
    <section id="mas-vendidos" className="py-16 bg-[#F4F4F4] border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col items-center md:items-start mb-8 text-center md:text-left">
          <h3 className="text-3xl font-black text-[#202A36] uppercase italic tracking-tighter">Más Vendidos</h3>
          <p className="text-[10px] font-black text-[#CAA959] uppercase tracking-[0.2em] mt-2">
            Los favoritos de nuestros clientes
          </p>
        </div>

        <div className="relative max-w-5xl lg:max-w-6xl mx-auto">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex flex-col md:flex-row gap-6 md:gap-8 h-[600px] md:h-auto pb-8 overflow-y-auto md:overflow-y-hidden overflow-x-hidden md:overflow-x-auto snap-y md:snap-x snap-mandatory scrollbar-hide select-none"
          >
            {bestSellers.map((product, idx) => (
              <div
                key={`${product._id}-${idx}`}
                className="w-[70vw] sm:w-[50vw] md:w-[320px] mx-auto md:mx-0 shrink-0 h-[450px] md:h-full snap-center"
              >
                <ProductCard
                  id={product._id}
                  {...product}
                  category={product.category || 'Destacado'}
                  image={
                    product.images?.[0] ||
                    product.image ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'
                  }
                  images={product.images}
                  hidePrice={true}
                />
              </div>
            ))}
          </div>

          {canScrollUp && (
            <button
              onClick={() => scrollRef.current?.scrollBy({ top: -450, behavior: 'smooth' })}
              className="md:hidden absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all z-10"
            >
              <ChevronUp size={24} />
            </button>
          )}

          {canScrollDown && (
            <button
              onClick={() => scrollRef.current?.scrollBy({ top: 450, behavior: 'smooth' })}
              className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all z-10"
            >
              <ChevronDown size={24} />
            </button>
          )}

          {canScrollLeft && (
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 lg:-translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 lg:translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all z-10"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
