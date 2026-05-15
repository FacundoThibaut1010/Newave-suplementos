import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, User, Menu, ChevronDown, Home, Package, MessageSquare, X, ChevronRight, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import AuthModal from '../auth/AuthModal';
import SearchModal from './SearchModal';

const Navbar = () => {
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useUIStore((state) => state.openCart);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [hasCombos, setHasCombos] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const checkCombos = async () => {
      try {
        const { data } = await apiClient.get('/products');
        const combos = data.products.filter((p: any) => p.displaySection === 'Combo');
        setHasCombos(combos.length > 0);
      } catch (err) {
        console.error('Error fetching combos for navbar', err);
      }
    };
    checkCombos();
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('overflow-hidden');
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [isMenuOpen]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    setIsMenuOpen(false);
    if (window.location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      
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

      <nav className="fixed top-12 md:top-10 left-0 w-full bg-black/40 backdrop-blur-2xl text-white z-[50] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] border-b border-white/10">
        <div className="mx-auto px-4 lg:px-10">
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
                        absolute top-full left-0 mt-6 w-[90vw] max-w-[20rem]
                        bg-black/90 backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] 
                        rounded-[2.5rem] border border-white/10 overflow-hidden 
                        flex flex-col z-50 p-6
                        before:absolute before:inset-0
                        before:bg-[radial-gradient(circle_at_top_right,rgba(202,169,89,0.15),transparent_60%)]
                      "
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#CAA959]">Newave Navigation</span>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full transition-colors focus:outline-none">
                          <X size={18} className="text-white/40 hover:text-[#CAA959] transition-colors" />
                        </button>
                      </div>

                      <nav className="flex flex-col gap-1 relative z-10 flex-1">
                        <Link
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (window.location.pathname === '/') {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          to="/"
                          className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Home size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Inicio</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                        </Link>

                        <a
                          onClick={(e) => handleScrollTo(e, 'categorias')}
                          href="/#categorias"
                          className="flex items-center justify-between p-3 rounded-2xl group transition-all"
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
                            className="w-full flex items-center justify-between p-3 rounded-2xl group transition-all focus:outline-none"
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
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Proteína" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Proteínas</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Creatina" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Creatinas</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Minerales" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Minerales</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Colágeno" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Colágenos</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Pre Entreno" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Pre Entreno</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Barras Proteicas" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Barras Proteicas</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos/Shakers" className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#CAA959] transition-colors text-zinc-400">Shakers</Link>
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos" className="px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#CAA959] hover:text-white transition-colors">Ver todos</Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {hasCombos && (
                          <a
                            onClick={(e) => handleScrollTo(e, 'combos')}
                            href="/#combos"
                            className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <Gift size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                              <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Combos</span>
                            </div>
                            <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                          </a>
                        )}

                        <a
                          onClick={(e) => handleScrollTo(e, 'contacto')}
                          href="/#contacto"
                          className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <MessageSquare size={20} className="text-[#CAA959] opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-[#CAA959] transition-colors">Contacto</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                        </a>
                      </nav>

                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-30 relative z-10">
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
              <button 
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-2 group p-2 md:p-3 rounded-full transition-all focus:outline-none"
              >
                <Search size={20} strokeWidth={2.5} className="group-hover:text-[#CAA959] transition-all duration-300" />
              </button>

              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => {
                    if (user) {
                      setIsUserMenuOpen(!isUserMenuOpen);
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="p-3 rounded-full transition-all group focus:outline-none flex items-center gap-2"
                >
                  <User size={20} strokeWidth={2.5} className={`${user ? 'text-[#CAA959]' : ''} group-hover:text-[#CAA959] transition-all duration-300`} />
                  {user && <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-white/80">{user.name.split(' ')[0]}</span>}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-[60]"
                    >
                      <div className="px-4 py-2 border-b border-white/5 mb-2">
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/perfil/compras" className="block px-4 py-2 text-sm text-gray-300 hover:text-[#CAA959] hover:bg-white/5 transition-colors">Mis Compras</Link>
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/perfil/favoritos" className="block px-4 py-2 text-sm text-gray-300 hover:text-[#CAA959] hover:bg-white/5 transition-colors">Favoritos</Link>
                      <button 
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 mt-2 transition-colors border-t border-white/5"
                      >
                        Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
