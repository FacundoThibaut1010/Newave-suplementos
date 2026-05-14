import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/home/ProductCard';

const FavoritesPage = () => {
  const { user } = useAuthStore();
  const favorites = user?.favorites || [];

  return (
    <div className="min-h-screen bg-[#F4F4F4] pt-40 md:pt-48 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <Heart size={32} className="text-[#ef4444]" fill="#ef4444" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-[#202A36]">
              Mis Favoritos
            </h1>
            <p className="text-gray-500 font-medium mt-2">
              Productos que has guardado para comprar más tarde
            </p>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
            <Heart size={64} className="mx-auto text-gray-200 mb-6" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-400 mb-4">Inicia sesión</h2>
            <p className="text-gray-500 font-medium max-w-md mx-auto">
              Debes iniciar sesión para poder guardar y ver tus productos favoritos.
            </p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
            <Heart size={64} className="mx-auto text-gray-200 mb-6" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-400 mb-4">Aún no hay favoritos</h2>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">
              Explora la tienda y marca con un corazón los productos que más te gusten.
            </p>
            <Link to="/productos" className="px-8 py-4 bg-[#202A36] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#CAA959] transition-colors inline-block shadow-xl">
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {favorites.map((product: any) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                price={product.price}
                category={product.category}
                image={product.images ? product.images[0] : product.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
