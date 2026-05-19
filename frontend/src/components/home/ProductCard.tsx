import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  image: string; // for backward compatibility
  images?: string[];
  darkTheme?: boolean;
  variants?: any[];
  countInStock?: number;
}

const ProductCard = ({ id, name, price, oldPrice, category, image, images, darkTheme, variants, countInStock }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { user, setFavorites } = useAuthStore();

  const isFavorite = user?.favorites?.some((fav: any) => fav._id === id || fav === id);

  const [hoverImageIndex, setHoverImageIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isHovered && images && images.length > 2) {
      const validImages = images.filter(img => img && img.trim() !== '');
      if (validImages.length > 2) {
        interval = setInterval(() => {
          setHoverImageIndex(prev => {
            const availableIndexes = Array.from({length: validImages.length - 1}, (_, i) => i + 1).filter(idx => idx !== prev);
            if (availableIndexes.length > 0) {
              return availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
            }
            return prev;
          });
        }, 1500);
      }
    }
    return () => clearInterval(interval);
  }, [isHovered, images]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (images && images.length > 2) {
      const validImages = images.filter(img => img && img.trim() !== '');
      if (validImages.length > 2) {
        const availableIndexes = Array.from({length: validImages.length - 1}, (_, i) => i + 1).filter(idx => idx !== hoverImageIndex);
        if (availableIndexes.length > 0) {
          const randomIdx = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
          setHoverImageIndex(randomIdx);
        }
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }

    try {
      // Optimistic update
      const currentFavs = user.favorites || [];
      const isCurrentlyFav = currentFavs.some((fav: any) => fav._id === id || fav === id);

      let newFavs;
      if (isCurrentlyFav) {
        newFavs = currentFavs.filter((fav: any) => fav._id !== id && fav !== id);
      } else {
        // En frontend solo agregamos el ID temporalmente para que cambie el color rápido
        newFavs = [...currentFavs, { _id: id, name, price, category, image, images }];
      }
      setFavorites(newFavs);

      // Backend sync
      const { data } = await apiClient.post(`/users/favorites/${id}`);
      setFavorites(data); // Sync with actual populated data
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer h-full flex flex-col"
    >
      <div 
        className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[#F8F9FA] mb-6 border border-gray-100 group/image shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link to={`/producto/${id}`} className="absolute inset-0 z-10">
          {/* Default Image */}
          <img
            src={images?.length && images[0] ? images[0] : image}
            alt={name}
            className={`w-full h-full object-contain p-4 absolute inset-0 transition-opacity duration-500 ${(images && images.length > 1 && images[hoverImageIndex] && images[hoverImageIndex].trim() !== '') ? 'group-hover/image:opacity-0' : ''}`}
          />
          {/* Hover Image */}
          {(images && images.length > 1 && images[hoverImageIndex] && images[hoverImageIndex].trim() !== '') && (
            <img
              src={images[hoverImageIndex]}
              alt={`${name} alt`}
              className="w-full h-full object-contain p-4 absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Badges
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <span className="px-3 py-1 bg-[#202A36] text-white text-[9px] font-black uppercase tracking-widest rounded-full italic pointer-events-auto">
            Top Seller
          </span>
        </div> */}

        <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-16 group-hover:translate-x-0 transition-transform duration-500 z-20">
          <button
            onClick={handleToggleFavorite}
            className="p-3 bg-white rounded-full text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all shadow-xl"
          >
            <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 translate-y-24 group-hover:translate-y-0 transition-transform duration-500 z-20">
          {variants && variants.length > 0 ? (
            <Link
              to={`/producto/${id}`}
              className="w-full bg-[#202A36] text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:bg-[#202A36]/90 transition-colors"
            >
              Ver Sabores
            </Link>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                addItem({ id, name, price, image });
              }}
              className="w-full bg-[#202A36] text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:bg-[#202A36]/90 transition-colors"
            >
              <ShoppingCart size={16} />
              Añadir
            </button>
          )}
        </div>
      </div>

      <div className="px-1 text-center md:text-left flex flex-col flex-grow">
        <div className="flex flex-wrap gap-1.5 mb-2 justify-center md:justify-start">
          {category.split(/[,+\-]| y /i).filter(Boolean).map((cat, idx) => (
            <span key={idx} className="text-[9px] font-black text-[#CAA959] uppercase tracking-[0.2em] bg-[#CAA959]/10 px-2 py-0.5 rounded-full border border-[#CAA959]/20">
              {cat.trim()}
            </span>
          ))}
        </div>
        <Link to={`/producto/${id}`} className="flex-grow">
          <h3 className={`text-xl font-black italic uppercase leading-tight mb-2 group-hover:text-[#CAA959] transition-colors ${darkTheme ? 'text-white' : 'text-[#202A36]'}`}>
            {name}
          </h3>
        </Link>
        <div className="flex items-center justify-center md:justify-start gap-2 mt-auto pt-2">
          <span className="font-black text-xl text-[#CAA959] italic">${Number(price).toLocaleString('es-AR')}</span>
          {!!oldPrice && oldPrice > price && (
            <span className="text-xs text-gray-400 line-through font-bold">${Number(oldPrice).toLocaleString('es-AR')}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
