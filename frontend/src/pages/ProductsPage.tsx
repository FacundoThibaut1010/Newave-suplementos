import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/home/ProductCard';
import apiClient from '../api/apiClient';

const ProductsPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'Todas');
  const [sortBy, setSortBy] = useState<string>('featured');

  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory('Todas');
    }
  }, [category]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/products');
        setProducts(data.products);
      } catch (err: any) {
        setError(err.response?.data?.friendlyMessage || 'Error al cargar los productos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'Todas') {
      result = result.filter(p => p.category === selectedCategory);
    }

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
  }, [products, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="pt-32 pb-16 min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#202A36]/20 border-t-[#202A36] rounded-full mb-4"
        />
        <p className="text-gray-500 font-medium">Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-16 min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-[#202A36] uppercase italic tracking-tighter">
              {selectedCategory === 'Todas' ? 'Catálogo' : selectedCategory}
            </h1>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
              {filteredAndSortedProducts.length} Resultados
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-[#202A36] px-4 py-2 rounded-full outline-none focus:border-[#CAA959] transition-colors appearance-none pr-8 cursor-pointer relative"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            >
              <option value="Todas">Todas</option>
              <option value="Proteína">Proteína</option>
              <option value="Creatina">Creatina</option>
              <option value="Minerales">Minerales</option>
              <option value="Colágeno">Colágeno</option>
              <option value="Pre-Entreno">Pre-Entreno</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-[#202A36] px-4 py-2 rounded-full outline-none focus:border-[#CAA959] transition-colors appearance-none pr-8 cursor-pointer relative"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
            >
              <option value="featured">Destacados</option>
              <option value="price_asc">Menor a mayor ($)</option>
              <option value="price_desc">Mayor a menor ($)</option>
              <option value="name_asc">A - Z</option>
              <option value="name_desc">Z - A</option>
            </select>
          </div>
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 text-lg">Aún no hay productos disponibles en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 mt-12">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                {...product}
                category={product.category?.name || 'General'}
                image={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
