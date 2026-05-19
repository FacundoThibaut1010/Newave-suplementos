import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import apiClient from '../../api/apiClient';

const BestSellers = () => {
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/admin/config');
        if (data && data.bestSellers && data.bestSellers.length > 0) {
          setBestSellers(data.bestSellers);
        }
      } catch (err) {
        console.error('Error fetching best sellers:', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    let animationId: number;
    let scrollDirection = 1;

    const scrollStep = () => {
      const scrollContainer = scrollRef.current;
      if (scrollContainer && !isInteracting) {
        if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1) {
          scrollDirection = -1; // Reverse
        } else if (scrollContainer.scrollTop <= 0) {
          scrollDirection = 1; // Forward
        }
        scrollContainer.scrollTop += scrollDirection * 1;
      }
      animationId = requestAnimationFrame(scrollStep);
    };

    if (bestSellers.length > 0) {
      animationId = requestAnimationFrame(scrollStep);
    }
    
    return () => cancelAnimationFrame(animationId);
  }, [bestSellers, isInteracting]);

  if (bestSellers.length === 0) {
    return null;
  }

  return (
    <section id="mas-vendidos" className="py-16 bg-[#F4F4F4] border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col items-center md:items-start mb-8 text-center md:text-left">
          <h3 className="text-3xl font-black text-[#202A36] uppercase italic tracking-tighter">Más Vendidos</h3>
          <p className="text-[10px] font-black text-[#CAA959] uppercase tracking-[0.2em] mt-2">Los favoritos de nuestros clientes</p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => {
              setIsInteracting(false);
              setIsDragging(false);
            }}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            onMouseDown={(e) => {
              setIsInteracting(true);
              setIsDragging(true);
              setStartY(e.pageY - (scrollRef.current?.offsetTop || 0));
              setScrollTop(scrollRef.current?.scrollTop || 0);
            }}
            onMouseUp={() => {
              setIsInteracting(false);
              setIsDragging(false);
            }}
            onMouseMove={(e) => {
              if (!isDragging || !scrollRef.current) return;
              e.preventDefault();
              const y = e.pageY - scrollRef.current.offsetTop;
              const walk = (y - startY) * 1.5;
              scrollRef.current.scrollTop = scrollTop - walk;
            }}
            className={`grid grid-cols-2 gap-4 md:gap-8 pb-8 md:pb-4 h-[600px] overflow-hidden md:overflow-y-auto scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {(bestSellers.length % 2 !== 0 ? [...bestSellers, { ...bestSellers[0], _id: bestSellers[0]._id + '_dup' }] : bestSellers).map((product) => (
              <div key={product._id} className="w-full shrink-0 h-full">
                <ProductCard
                  id={product._id}
                  {...product}
                  category={product.category || 'Destacado'}
                  image={product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'}
                  images={product.images}
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default BestSellers;
