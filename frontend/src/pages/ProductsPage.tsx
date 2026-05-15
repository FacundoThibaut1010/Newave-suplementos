import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import apiClient from '../api/apiClient';
import CustomSelect from '../components/ui/CustomSelect';

const categoryOptions = [
  { value: 'Todas', label: 'Todos' },
  { value: 'Proteína', label: 'Proteína' },
  { value: 'Creatina', label: 'Creatina' },
  { value: 'Minerales', label: 'Minerales' },
  { value: 'Colágeno', label: 'Colágeno' },
  { value: 'Pre-Entreno', label: 'Pre-Entreno' },
];

const sortOptions = [
  { value: 'featured', label: 'Filtrar' },
  { value: 'price_asc', label: 'Menor a mayor ($)' },
  { value: 'price_desc', label: 'Mayor a menor ($)' },
  { value: 'name_asc', label: 'A - Z' },
  { value: 'name_desc', label: 'Z - A' },
];

const ProductsPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'Todas');
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
  }, [products, selectedCategory, sortBy]);

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
    <div className="pt-40 md:pt-32 pb-24 bg-[#0A0A0B] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center text-center md:text-left gap-6 border-b border-white/10 pb-8">
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
              {selectedCategory === 'Todas' ? 'Catálogo' : selectedCategory}
            </h1>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
              {filteredAndSortedProducts.length} Resultados
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 items-center relative z-40">
            <div className="w-full sm:w-auto">
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
                darkTheme
              />
            </div>
            <div className="w-full sm:w-auto">
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                darkTheme
              />
            </div>
          </div>
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 text-lg">Aún no hay productos disponibles en esta categoría.</p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={(e) => {
                const target = e.currentTarget;
                setCanScrollRight(target.scrollLeft + target.clientWidth < target.scrollWidth - 5);
              }}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-8 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-16 mt-12 md:overflow-x-visible md:pb-0 scrollbar-hide"
            >
              {filteredAndSortedProducts.map((product) => (
                <div key={product._id} className="min-w-[85vw] sm:min-w-[60vw] md:min-w-0 snap-center shrink-0 h-full">
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
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
