import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ListFilter, ArrowUpDown } from 'lucide-react';
import ProductCard from '../components/home/ProductCard';
import ProductCardSkeleton from '../components/home/ProductCardSkeleton';
import CustomSelect from '../components/ui/CustomSelect';
import { useProductStore } from '../store/useProductStore';

// Options will be fetched dynamically

const sortOptions = [
  { value: 'featured', label: 'Ordenar' },
  { value: 'price_asc', label: 'Menor a mayor ($)' },
  { value: 'price_desc', label: 'Mayor a menor ($)' },
  { value: 'name_asc', label: 'A - Z' },
  { value: 'name_desc', label: 'Z - A' },
];

const ProductsPage = () => {
  const { category } = useParams();
  const { products, categories: categoryOptions, loading, error, fetchProducts, hasFetched } = useProductStore();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'Todas');
  const [sortBy, setSortBy] = useState<string>('featured');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setCurrentPage(1); // Reset page on category change
  }, [category]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'Todas') {
      const targetLower = selectedCategory.toLowerCase();
      result = result.filter(p => {
        if (!p.category) return false;
        const catLower = p.category.toLowerCase();
        return catLower === targetLower || catLower.includes(targetLower) || targetLower.includes(catLower);
      });
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

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  if (loading && !hasFetched) {
    return (
      <div className="pt-40 md:pt-32 pb-24 bg-[#0A0A0B] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center text-center md:text-left gap-6 border-b border-white/10 pb-8">
            <div className="flex flex-col items-center md:items-start w-full md:w-auto">
              <div className="h-10 md:h-12 w-48 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-32 bg-white/5 rounded mt-3 animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 items-center">
              <div className="h-11 w-full sm:w-44 bg-white/10 rounded animate-pulse" />
              <div className="h-11 w-full sm:w-44 bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-x-8 md:gap-y-16 mt-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} darkTheme />
            ))}
          </div>
        </div>
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
              {selectedCategory === 'Todas' ? 'Catálogo' : categoryOptions.find(c => c.value === selectedCategory)?.label || selectedCategory}
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
                icon={<ListFilter size={16} />}
              />
            </div>
            <div className="w-full sm:w-auto">
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                darkTheme
                icon={<ArrowUpDown size={16} />}
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
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-x-8 md:gap-y-16 mt-12"
            >
              {paginatedProducts.map((product) => (
                <div key={product._id} className="w-full h-full">
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-16 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo(0, 0);
                    }}
                    className={`w-10 h-10 rounded-full font-black text-sm transition-all ${currentPage === page ? 'bg-[#CAA959] text-white shadow-lg scale-110' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
