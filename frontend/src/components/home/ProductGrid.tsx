import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import apiClient from '../../api/apiClient';
import CustomSelect from '../ui/CustomSelect';

const sortOptions = [
  { value: 'featured', label: 'Filtrar' },
  { value: 'price_asc', label: 'Menor a mayor ($)' },
  { value: 'price_desc', label: 'Mayor a menor ($)' },
  { value: 'name_asc', label: 'A - Z' },
  { value: 'name_desc', label: 'Z - A' },
];

const ProductGrid = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('featured');

  useEffect(() => {
    const fetchProducts = async () => {
      console.log('--- API: Iniciando carga de productos... 🛒 ---');
      setLoading(true);
      try {
        const { data } = await apiClient.get('/products');
        // Filtrar solo los productos marcados como 'Combo'
        const combos = data.products.filter((p: any) => p.displaySection === 'Combo');

        console.log('--- API: Éxito! Recibimos:', data.products.length, 'productos en total, de los cuales', combos.length, 'son Combos ✨ ---');
        setProducts(combos);
      } catch (err: any) {
        console.error('--- API: ¡Ups! Error al cargar productos:', err.message, '---');
        setError(err.response?.data?.friendlyMessage || 'No pudimos encontrar los productos. 🤔');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const sortedProducts = useMemo(() => {
    let result = [...products];
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
  }, [products, sortBy]);

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
    return null; // Ocultar la sección si no hay Combos
  }

  return (
    <section id="combos" className="py-16 bg-[#0A0A0B] scroll-mt-[120px]">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-8">
          <div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Combos</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Nuestros combos especiales</p>
          </div>
          <div className="flex gap-4 items-center relative z-40">
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              darkTheme
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product._id}
              id={product._id}
              {...product}
              category={product.category?.name || 'General'}
              image={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'}
              darkTheme
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
