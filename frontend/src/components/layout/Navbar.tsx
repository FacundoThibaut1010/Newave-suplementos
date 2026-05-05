import React, { useState } from 'react';
import { ShoppingBag, Search, User, Menu, ChevronDown, ChevronUp, Home, Package, MessageSquare, X, ChevronRight } from 'lucide-react';
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
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[40]"
          />
        )}
      </AnimatePresence>

      <nav className="fixed top-10 left-0 w-full bg-black/40 backdrop-blur-2xl text-white z-[50] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] border-b border-white/10">
        <div className="mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center h-20">
            
            {/* Left: Menu */}
            <div className="flex-1 flex items-center">
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 group px-4 py-2 rounded-full transition-all duration-300 focus:outline-none"
                >
                  <div className="relative">
                    <Menu size={22} strokeWidth={2.5} className={`${isMenuOpen ? 'text-[#CAA959] rotate-90' : ''} group-hover:text-[#CAA959] transition-all duration-500`} />
                  </div>
                  <span className={`hidden md:block text-[13px] font-black uppercase tracking-[0.25em] ${isMenuOpen ? 'text-[#CAA959]' : ''} group-hover:text-[#CAA959] transition-colors`}>
                    Menú
                  </span>
                </button>

                {/* Elite Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                      className="
                        absolute top-full left-0 mt-6 w-80 
                        bg-black/90 backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] 
                        rounded-[2.5rem] border border-white/10 overflow-hidden 
                        flex flex-col z-50 p-8
                        before:absolute before:inset-0
                        before:bg-[radial-gradient(circle_at_top_right,rgba(202,169,89,0.15),transparent_60%)]
                      "
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#CAA959]">Newave Navigation</span>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full transition-colors focus:outline-none">
                          <X size={18} className="text-white/40 hover:text-[#CAA959] transition-colors" />
                        </button>
                      </div>

                      <nav className="flex flex-col gap-2 relative z-10">
                        <Link 
                          onClick={() => setIsMenuOpen(false)} 
                          to="/" 
                          className="flex items-center justify-between p-4 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Home size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Inicio</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                        </Link>

                        <a 
                          onClick={() => setIsMenuOpen(false)} 
                          href="/#categorias" 
                          className="flex items-center justify-between p-4 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Package size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Categorías</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                        </a>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setIsProductsOpen(!isProductsOpen)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl group transition-all focus:outline-none"
                          >
                            <div className="flex items-center gap-4">
                              <ShoppingBag size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                              <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Productos</span>
                            </div>
                            <motion.div animate={{ rotate: isProductsOpen ? 180 : 0 }}>
                              <ChevronDown size={14} className="text-zinc-500 group-hover:text-[#CAA959] transition-colors" />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {isProductsOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden rounded-xl mx-2 mt-1"
                              >
                                <div className="flex flex-col py-2">
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/proteinas" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Proteínas</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/creatinas" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Creatinas</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/minerales" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Minerales</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/preentreno" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Preentreno</Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <a 
                          onClick={() => setIsMenuOpen(false)} 
                          href="/#contacto" 
                          className="flex items-center justify-between p-4 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <MessageSquare size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Contacto</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                        </a>
                      </nav>

                      {/* Footer */}
                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30 relative z-10">
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase italic">NEWAVE.</span>
                        <div className="text-[9px] font-black px-2 py-1 border border-white/20 rounded uppercase tracking-tighter italic">ELITE SERIES</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-2xl lg:text-3xl font-black tracking-[0.2em] italic group-hover:text-[#CAA959] transition-all duration-500">NEWAVE.</span>
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-2 lg:gap-4">
              <button className="flex items-center gap-2 group p-3 rounded-full transition-all focus:outline-none">
                <Search size={20} strokeWidth={2.5} className="group-hover:text-[#CAA959] transition-all duration-300" />
              </button>
              
              <button className="p-3 rounded-full transition-all group focus:outline-none">
                <User size={20} strokeWidth={2.5} className="group-hover:text-[#CAA959] transition-all duration-300" />
              </button>

              <button 
                onClick={openCart}
                className="group relative flex items-center justify-center p-3 rounded-full transition-all focus:outline-none"
              >
                <ShoppingBag size={22} strokeWidth={2.5} className="group-hover:text-[#CAA959] transition-all duration-300" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1 right-1 bg-[#CAA959] text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-[0_0_15px_rgba(202,169,89,0.5)]"
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
    </>
  );
};

export default Navbar;
