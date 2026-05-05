import React, { useState } from 'react';
import { ShoppingBag, Search, User, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useUIStore((state) => state.openCart);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  return (
    <nav className="fixed top-10 w-full bg-[#202A36] text-white z-[50] shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Menu */}
          <div className="flex-1 flex items-center">
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 group"
              >
                <Menu size={24} strokeWidth={2} className={`${isMenuOpen ? 'text-[#CAA959]' : ''} group-hover:text-[#CAA959] transition-colors`} />
                <span className={`hidden md:block text-[10px] font-black uppercase tracking-[0.2em] ${isMenuOpen ? 'text-[#CAA959]' : ''} group-hover:text-[#CAA959] transition-colors`}>
                  Menú
                </span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-6 w-64 bg-[#202A36] shadow-2xl rounded-xl border border-white/5 overflow-hidden flex flex-col z-50"
                  >
                    <Link 
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        if (window.location.pathname === '/') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }} 
                      to="/" 
                      className="px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-[#CAA959] border-b border-white/5 transition-colors"
                    >
                      Casa
                    </Link>
                    <a 
                      onClick={() => setIsMenuOpen(false)} 
                      href="/#categorias" 
                      className="px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-[#CAA959] border-b border-white/5 transition-colors block"
                    >
                      Categorías
                    </a>
                    
                    <div>
                      <button 
                        onClick={() => setIsProductsOpen(!isProductsOpen)}
                        className="w-full flex items-center justify-between px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-[#CAA959] border-b border-white/5 transition-colors"
                      >
                        Productos
                        {isProductsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <AnimatePresence>
                        {isProductsOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-black/20"
                          >
                            <div className="flex flex-col py-2">
                              <Link onClick={() => setIsMenuOpen(false)} to="/productos/proteinas" className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-gray-400">Proteínas</Link>
                              <Link onClick={() => setIsMenuOpen(false)} to="/productos/creatinas" className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-gray-400">Creatinas</Link>
                              <Link onClick={() => setIsMenuOpen(false)} to="/productos/minerales" className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-gray-400">Minerales</Link>
                              <Link onClick={() => setIsMenuOpen(false)} to="/productos/preentreno" className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-gray-400">Preentreno</Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <a 
                      onClick={() => setIsMenuOpen(false)} 
                      href="/#contacto" 
                      className="px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-[#CAA959] transition-colors block"
                    >
                      Contacto
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-[0.15em] italic">NEWAVE.</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end gap-6 md:gap-8">
            <button className="flex items-center gap-2 group">
              <Search size={22} strokeWidth={2} className="group-hover:text-[#CAA959] transition-colors" />
              <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-[#CAA959] transition-colors">Buscar</span>
            </button>
            
            <button className="group">
              <User size={22} strokeWidth={2} className="group-hover:text-[#CAA959] transition-colors" />
            </button>

            <button 
              onClick={openCart}
              className="group relative flex items-center justify-center"
            >
              <ShoppingBag size={24} strokeWidth={2} className="group-hover:text-[#CAA959] transition-colors" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-[#CAA959] text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
