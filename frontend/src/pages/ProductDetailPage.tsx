import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Loader2, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/apiClient';
import { toast } from 'sonner';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const { user, setFavorites } = useAuthStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await apiClient.get(`/products/${id}`);
        setProduct(data);
      } catch (error) {
        toast.error('Producto no encontrado');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#CAA959]" />
      </div>
    );
  }

  if (!product) return null;

  const isFavorite = user?.favorites?.some((fav: any) => fav._id === id || fav === id);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }
    try {
      const currentFavs = user.favorites || [];
      const isCurrentlyFav = currentFavs.some((fav: any) => fav._id === id || fav === id);
      let newFavs;
      if (isCurrentlyFav) {
        newFavs = currentFavs.filter((fav: any) => fav._id !== id && fav !== id);
      } else {
        newFavs = [...currentFavs, product];
      }
      setFavorites(newFavs);
      const { data } = await apiClient.post(`/users/favorites/${id}`);
      setFavorites(data);
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || product.image || ''
      });
    }
    toast.success(`${quantity} ${quantity === 1 ? 'unidad añadida' : 'unidades añadidas'} al carrito`);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Image Section */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square md:aspect-[4/5] bg-[#F8F9FA] rounded-[2.5rem] p-8 flex items-center justify-center overflow-hidden"
            >
              <img 
                src={product.images?.[0] || product.image || ''} 
                alt={product.name} 
                className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 right-6">
                <button 
                  onClick={handleToggleFavorite}
                  className="p-4 bg-white rounded-full text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all shadow-xl"
                >
                  <Heart size={24} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />
                </button>
              </div>
            </motion.div>

            {/* Content Section */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <p className="text-xs font-black text-[#CAA959] uppercase tracking-[0.3em] mb-4">
                  {product.category}
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase leading-[1.1] text-[#202A36] mb-6">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black italic text-[#202A36]">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </span>
                  {product.countInStock > 0 ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      En Stock
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Sin Stock
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-gray-100 my-8" />

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#202A36] mb-4">Descripción</h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {product.description || 'Este producto no cuenta con descripción detallada por el momento. Disfruta de la mejor calidad que Newave te ofrece.'}
                </p>
              </div>

              <div className="h-px w-full bg-gray-100 my-8" />

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center bg-[#F8F9FA] rounded-2xl border border-gray-100 p-2 shrink-0">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-xl transition-all"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-black text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.countInStock || 10, quantity + 1))}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-xl transition-all"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button 
                  onClick={handleAddToCart}
                  disabled={product.countInStock === 0}
                  className="flex-1 bg-[#202A36] text-white py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#CAA959] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={20} />
                  Añadir al Carrito
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
