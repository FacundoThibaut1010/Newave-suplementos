import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ListFilter } from 'lucide-react';
import ProductCard from './ProductCard';
import CustomSelect from '../ui/CustomSelect';
import { useProductStore } from '../../store/useProductStore';
import ProductCardSkeleton from './ProductCardSkeleton';

const sortOptions = [
  { value: 'featured', label: 'Ordenar' },
  { value: 'price_asc', label: 'Menor a mayor ($)' },
  { value: 'price_desc', label: 'Mayor a menor ($)' },
  { value: 'name_asc', label: 'A - Z' },
  { value: 'name_desc', label: 'Z - A' },
];

const ProductGrid = () => {
  const { products: storeProducts, loading: storeLoading, error: storeError } = useProductStore();
  const [combos, setCombos] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('featured');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [combos]);

  useEffect(() => {
    if (storeProducts.length > 0) {
      const comboProducts = storeProducts.filter((p: any) => p.displaySection === 'Combo');
      setCombos(comboProducts);
    }
  }, [storeProducts]);

  const sortedProducts = useMemo(() => {
    let result = [...combos];
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    return result;
  }, [combos, sortBy]);

  if (storeLoading && storeProducts.length === 0) {
    return (
      <section id="combos" className="py-16 bg-[#0A0A0B] scroll-mt-[120px]">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 mb-8">
            <div className="w-full flex flex-col items-center md:items-start">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Combos</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Nuestros combos especiales</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} darkTheme />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (storeError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <p className="text-red-500 font-bold">{storeError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline font-bold">Reintentar</button>
      </div>
    );
  }

  if (!storeLoading && combos.length === 0) {
    return null; // Ocultar la sección si no hay Combos
  }

  return (
    <section id="combos" className="py-16 bg-[#0A0A0B] scroll-mt-[120px]">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6 mb-8">
          <div className="w-full flex flex-col items-center md:items-start">
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Combos</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Nuestros combos especiales</p>
          </div>
          <div className="flex gap-4 items-center justify-center relative z-40 w-full md:w-auto">
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              darkTheme
              icon={<ListFilter size={16} />}
            />
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={(e) => {
              const target = e.currentTarget;
              setCanScrollRight(target.scrollLeft + target.clientWidth < target.scrollWidth - 5);
            }}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-8 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-16 md:overflow-x-visible md:pb-0 scrollbar-hide"
          >
            {sortedProducts.map((product) => (
              <div key={product._id} className="w-[85vw] max-w-[320px] sm:w-[60vw] md:w-auto shrink-0 h-full">
                <ProductCard
                  id={product._id}
                  {...product}
                  category={product.category || 'General'}
                  image={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'}
                  images={product.images}
                  darkTheme
                />
              </div>
            ))}
          </div>
          {canScrollRight && (
            <div className="absolute -right-6 top-[35%] -translate-y-1/2 pointer-events-none md:hidden flex justify-end items-center z-10">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-[#CAA959]"
              >
                <ChevronRight size={36} strokeWidth={2.5} />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
