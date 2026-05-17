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
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const { user, setFavorites } = useAuthStore();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const { data } = await apiClient.get(`/products/${id}`);
        setProduct(data.product);
        if (data.product.variants && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
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
    const currentStock = selectedVariant ? selectedVariant.countInStock : product.countInStock;
    if (currentStock === 0) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: selectedVariant ? `${product._id}-${selectedVariant.flavor}` : product._id,
        name: selectedVariant ? `${product.name} - ${selectedVariant.flavor}` : product.name,
        price: product.price,
        image: (selectedVariant && selectedVariant.image) ? selectedVariant.image : (product.images?.[0] || product.image || '')
      });
    }
    toast.success(`${quantity} ${quantity === 1 ? 'unidad añadida' : 'unidades añadidas'} al carrito`);
  };

  const displayImages = selectedVariant && selectedVariant.image ? [selectedVariant.image] : (product.images && product.images.length > 0 ? product.images : [product.image]);
  const currentStock = selectedVariant ? selectedVariant.countInStock : product.countInStock;

  return (
    <div className="min-h-screen bg-[#F4F4F4] pt-40 md:pt-48 pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-5 sm:p-8 md:p-12 shadow-sm border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-20 items-center">
            
            {/* Image Section */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative w-full max-w-md mx-auto"
            >
              <div className="relative aspect-square md:aspect-[4/5] bg-[#F8F9FA] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 flex items-center justify-center overflow-hidden group/carousel">
                <div 
                  ref={scrollRef}
                  className={`flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide relative z-10 select-none ${displayImages.length > 1 ? (isDragging ? 'cursor-grabbing pointer-events-auto' : 'cursor-grab pointer-events-auto') : 'pointer-events-none'}`}
                  onMouseDown={(e) => {
                    if (displayImages.length <= 1) return;
                    setIsDragging(true);
                    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
                    setScrollLeft(scrollRef.current?.scrollLeft || 0);
                  }}
                  onMouseLeave={() => setIsDragging(false)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseMove={(e) => {
                    if (!isDragging || !scrollRef.current) return;
                    e.preventDefault();
                    const x = e.pageX - scrollRef.current.offsetLeft;
                    const walk = (x - startX) * 1.5;
                    scrollRef.current.scrollLeft = scrollLeft - walk;
                  }}
                >
                  {displayImages.map((img: string, idx: number) => (
                    <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center">
                      <img 
                        src={img || ''} 
                        alt={`${product.name} ${idx + 1}`} 
                        draggable={false}
                        className="w-full h-full object-contain drop-shadow-2xl pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Status Indicator */}
                {(displayImages.length > 1) && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
                    {displayImages.map((_: any, idx: number) => (
                      <div key={idx} className="w-2 h-2 rounded-full bg-[#CAA959]/50 shadow-md" />
                    ))}
                  </div>
                )}
              <div className="absolute top-6 right-6 z-30">
                <button 
                  onClick={handleToggleFavorite}
                  className="p-4 bg-white rounded-full text-[#202A36] hover:bg-[#CAA959] hover:text-white transition-all shadow-xl"
                >
                  <Heart size={24} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />
                </button>
              </div>
              </div>
            </motion.div>

            {/* Content Section */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(product.category || 'General').split(/[,+\-]| y /i).filter(Boolean).map((cat: string, idx: number) => (
                    <span key={idx} className="text-[10px] font-black text-[#CAA959] uppercase tracking-[0.3em] bg-[#CAA959]/10 px-3 py-1 rounded-full border border-[#CAA959]/20">
                      {cat.trim()}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic uppercase leading-[1.1] text-[#202A36] mb-6 break-words">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-[#202A36] break-words">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </span>
                  {!!product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-lg md:text-xl text-gray-400 line-through font-bold">
                      ${Number(product.oldPrice).toLocaleString('es-AR')}
                    </span>
                  )}
                  {currentStock > 0 ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      En Stock ({currentStock})
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      Sin Stock
                    </span>
                  )}
                </div>
              </div>

              {product.variants && product.variants.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#202A36] mb-3">Elige un sabor:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedVariant(v);
                          setQuantity(1);
                          if (scrollRef.current) scrollRef.current.scrollLeft = 0;
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedVariant?.flavor === v.flavor ? 'border-[#CAA959] bg-[#CAA959]/10 text-[#CAA959]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {v.flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px w-full bg-gray-100 my-8" />

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#202A36] mb-4">Descripción</h3>
                <p className="text-gray-500 leading-relaxed font-medium whitespace-pre-line">
                  {product.description || 'Este producto no cuenta con descripción detallada por el momento. Disfruta de la mejor calidad que Newave te ofrece.'}
                </p>
              </div>

              <div className="h-px w-full bg-gray-100 my-8" />

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-[#F8F9FA] rounded-[1rem] md:rounded-2xl border border-gray-100 p-2 shrink-0 sm:min-w-[140px]">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-xl transition-all text-2xl leading-none pb-1"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-black text-lg text-black">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(currentStock || 10, quantity + 1))}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-xl transition-all text-2xl leading-none pb-1"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button 
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className="flex-1 bg-[#202A36] text-white py-4 px-4 sm:px-8 rounded-[1rem] md:rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm hover:bg-[#CAA959] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
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
