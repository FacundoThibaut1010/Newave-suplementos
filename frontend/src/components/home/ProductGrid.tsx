import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import apiClient from '../../api/apiClient';

const ProductGrid = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      console.log('--- API: Iniciando carga de productos... 🛒 ---');
      setLoading(true);
      try {
        const { data } = await apiClient.get('/products');
        console.log('--- API: Éxito! Recibimos:', data.products.length, 'productos ✨ ---');
        setProducts(data.products);
      } catch (err: any) {
        console.error('--- API: ¡Ups! Error al cargar productos:', err.message, '---');
        setError(err.response?.data?.friendlyMessage || 'No pudimos encontrar los productos. 🤔');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full mx-auto mb-4"
        />
        <p className="text-gray-500 font-medium">Buscando las mejores cosas para ti... ✨</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <p className="text-red-500 font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline font-bold">Reintentar</button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="text-5xl mb-6">📦</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Uy! Nuestra estantería está vacía por ahora</h3>
        <p className="text-gray-500">Estamos trabajando para traer cosas hermosas pronto. ¡Vuelve en un ratito! ☀️</p>
      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div>
            <h3 className="text-3xl font-black text-[#202A36] uppercase italic tracking-tighter">Los más elegidos</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Nuestros productos destacados</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2 border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#202A36] hover:text-white transition-all">Filtrar</button>
            <button className="px-6 py-2 border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#202A36] hover:text-white transition-all">Ordenar por</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product) => (
            <ProductCard 
              key={product._id} 
              id={product._id} 
              {...product} 
              category={product.category?.name || 'General'}
              image={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
