import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearching(true);
        try {
          const { data } = await apiClient.get(`/products?search=${query}`);
          setResults(data.products || []);
        } catch (error) {
          console.error('Error en búsqueda', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 w-[90%] max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center gap-4">
              <Search size={24} className="text-gray-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar proteínas, creatinas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-xl md:text-3xl font-black uppercase tracking-tighter text-[#202A36] placeholder:text-gray-200 outline-none bg-transparent"
              />
              <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F4F4F4]">
              {isSearching ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={32} className="animate-spin text-[#CAA959]" />
                </div>
              ) : query.trim().length > 1 && results.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-medium">
                  No encontramos productos para "{query}"
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {results.map((product) => (
                    <Link
                      key={product._id}
                      to={`/producto/${product._id}`}
                      onClick={onClose}
                      className="bg-white p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group border border-gray-100"
                    >
                      <div className="w-16 h-16 bg-[#F8F9FA] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        <img 
                          src={product.images?.[0] || product.image} 
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm md:text-base font-black text-[#202A36] truncate uppercase tracking-tight">{product.name}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#CAA959]">{product.category}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-4">
                        <span className="font-bold text-gray-500 hidden md:block">${Number(product.price).toLocaleString('es-AR')}</span>
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-[#CAA959] group-hover:text-white transition-colors">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Search size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-medium text-sm">Empieza a escribir para buscar productos</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
