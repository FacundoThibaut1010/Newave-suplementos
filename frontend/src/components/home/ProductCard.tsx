import React from 'react';
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
  category: string;
  image: string;
  darkTheme?: boolean;
}

const ProductCard = ({ id, name, price, category, image, darkTheme }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { user, setFavorites } = useAuthStore();

  const isFavorite = user?.favorites?.some((fav: any) => fav._id === id || fav === id);

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
        newFavs = [...currentFavs, { _id: id, name, price, category, image }];
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
      <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden bg-[#F8F9FA] mb-6 border border-gray-100">
        <Link to={`/producto/${id}`}>
          <motion.img
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            src={image}
            alt={name}
            className="w-full h-full object-cover p-4"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-[#202A36] text-white text-[9px] font-black uppercase tracking-widest rounded-full italic">
            Top Seller
          </span>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-16 group-hover:translate-x-0 transition-transform duration-500">
          <button 
            onClick={handleToggleFavorite}
            className="p-3 bg-white rounded-full text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all shadow-xl"
          >
            <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 translate-y-24 group-hover:translate-y-0 transition-transform duration-500">
          <button 
            onClick={() => addItem({ id, name, price, image })}
            className="w-full bg-[#202A36] text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2 hover:bg-[#202A36]/90 transition-colors"
          >
            <ShoppingCart size={16} />
            Añadir
          </button>
        </div>
      </div>

      <div className="px-1 text-center md:text-left flex flex-col flex-grow">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
          {category}
        </p>
        <Link to={`/producto/${id}`} className="flex-grow">
          <h3 className={`text-xl font-black italic uppercase leading-tight mb-2 group-hover:text-[#CAA959] transition-colors line-clamp-2 ${darkTheme ? 'text-white' : 'text-[#202A36]'}`}>
            {name}
          </h3>
        </Link>
        <div className="flex items-center justify-center md:justify-start gap-2 mt-auto pt-2">
          <span className="font-black text-xl text-[#CAA959] italic">${Number(price).toLocaleString('es-AR')}</span>
          <span className="text-xs text-gray-400 line-through font-bold">${Math.round(price * 1.2).toLocaleString('es-AR')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
