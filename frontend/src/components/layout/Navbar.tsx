import { useState, useEffect, useRef } from 'react';
import { smoothScrollTo } from '../../lib/smoothScroll';
import { ShoppingBag, Search, User, Menu, ChevronDown, Home, Package, MessageSquare, X, ChevronRight, Gift, AlertCircle, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '../auth/AuthModal';
import SearchModal from './SearchModal';
import MobileMenu, { type MobileMenuItem } from './MobileMenu';
import { useProductStore } from '../../store/useProductStore';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';

const Navbar = ({ hidden = false }: { hidden?: boolean }) => {
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useUIStore((state) => state.openCart);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const activeCategories = useProductStore((state) => state.activeCategories);
  const productsFetched = useProductStore((state) => state.hasFetched);
  const hasCombos = useProductStore((state) => state.hasCombos());
  const showCombos = !productsFetched || hasCombos;
  const configFetched = useStoreConfigStore((state) => state.hasFetched);
  const bestSellers = useStoreConfigStore((state) => state.bestSellers);
  const showBestSellers = !configFetched || bestSellers.length > 0;
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

  // Celular: menú de pantalla completa · Compu: desplegable
  const [isMobileView, setIsMobileView] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOrigin, setMenuOrigin] = useState({ x: 40, y: 90 });
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobileView(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const toggleMenu = () => {
    const r = menuButtonRef.current?.getBoundingClientRect();
    if (r) setMenuOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setIsMenuOpen((v) => !v);
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    setIsMenuOpen(false);
    e.preventDefault();
    
    if (smoothScrollTo(id)) return;
    if (window.location.pathname !== '/') {
      navigate(`/#${id}`);
    }
  };

  const mobileItems: MobileMenuItem[] = [
    { label: 'Inicio', to: '/', onClick: () => { if (window.location.pathname === '/') smoothScrollTo(0); } },
    { label: 'Categorías', href: '/#categorias', onClick: (e) => handleScrollTo(e, 'categorias') },
    ...(showBestSellers ? [{ label: 'Más vendidos', href: '/#mas-vendidos', onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleScrollTo(e, 'mas-vendidos') }] : []),
    ...(showCombos ? [{ label: 'Combos', href: '/#combos', onClick: (e: React.MouseEvent<HTMLAnchorElement>) => handleScrollTo(e, 'combos') }] : []),
    { label: 'Contacto', href: '/#contacto', onClick: (e) => handleScrollTo(e, 'contacto') },
  ];

  return (
    <>
      <MobileMenu
        open={isMenuOpen && isMobileView}
        onClose={() => setIsMenuOpen(false)}
        items={mobileItems}
        categories={activeCategories}
        origin={menuOrigin}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />

      <AnimatePresence>
        {isMenuOpen && !isMobileView && (
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

      <nav
        style={{ transform: hidden ? 'translateY(calc(-100% - 3rem - 48px))' : 'none' }}
        aria-hidden={hidden || undefined}
        className="transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] fixed top-12 md:top-10 left-0 w-full bg-black/60 md:bg-black/40 backdrop-blur-md md:backdrop-blur-2xl text-white z-[50] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] border-b border-white/10">
        <div className="mx-auto px-2 sm:px-4 lg:px-10">
          <div className="flex justify-between items-center h-20">

            {/* Left: Menu */}
            <div className="flex-1 flex items-center">
              <div className="relative">
                <button
                  ref={menuButtonRef}
                  aria-label="Abrir menú"
                  aria-expanded={isMenuOpen}
                  onClick={toggleMenu}
                  className="flex items-center gap-3 group px-4 py-2 rounded-full transition-all duration-300 focus:outline-none"
                >
                  <div className="relative">
                    <Menu size={22} strokeWidth={2.5} className={`${isMenuOpen ? 'text-white rotate-90' : ''} group-hover:text-white transition-all duration-500`} />
                  </div>
                  <span className={`hidden md:block text-[13px] font-black uppercase tracking-[0.25em] ${isMenuOpen ? 'text-white' : ''} group-hover:text-white transition-colors`}>
                    Menú
                  </span>
                </button>

                {/* Elite Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && !isMobileView && (
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
                        before:bg-[radial-gradient(circle_at_top_right,rgba(28,134,200,0.15),transparent_60%)]
                      "
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Newave Navigation</span>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full transition-colors focus:outline-none">
                          <X size={18} className="text-white/40 hover:text-white transition-colors" />
                        </button>
                      </div>

                      <nav className="flex flex-col gap-1 relative z-10 flex-1">
                        <Link
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (window.location.pathname === '/') {
                              smoothScrollTo(0);
                            }
                          }}
                          to="/"
                          className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Home size={20} className="text-white opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-white transition-colors">Inicio</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white" />
                        </Link>

                        <a
                          onClick={(e) => handleScrollTo(e, 'categorias')}
                          href="/#categorias"
                          className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Package size={20} className="text-white opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-white transition-colors">Categorías</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white" />
                        </a>

                        <div className="relative">
                          <button
                            onClick={() => setIsProductsOpen(!isProductsOpen)}
                            className="w-full flex items-center justify-between p-3 rounded-2xl group transition-all focus:outline-none"
                          >
                            <div className="flex items-center gap-4">
                              <ShoppingBag size={20} className="text-white opacity-70 group-hover:opacity-100 transition-all" />
                              <span className="text-lg font-black uppercase tracking-widest group-hover:text-white transition-colors">Productos</span>
                            </div>
                            <motion.div animate={{ rotate: isProductsOpen ? 180 : 0 }}>
                              <ChevronDown size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
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
                                  {activeCategories.map((cat: any, i: number) => (
                                    <Link key={i} onClick={() => setIsMenuOpen(false)} to={`/productos/${cat.slug}`} className="px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors text-zinc-400">{cat.name}</Link>
                                  ))}
                                  <Link onClick={() => setIsMenuOpen(false)} to="/productos" className="px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:text-white transition-colors">Ver todos</Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {showCombos && (
                          <a
                            onClick={(e) => handleScrollTo(e, 'combos')}
                            href="/#combos"
                            className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <Gift size={20} className="text-white opacity-70 group-hover:opacity-100 transition-all" />
                              <span className="text-lg font-black uppercase tracking-widest group-hover:text-white transition-colors">Combos</span>
                            </div>
                            <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white" />
                          </a>
                        )}

                        {showBestSellers && (
                          <a
                            onClick={(e) => handleScrollTo(e, 'mas-vendidos')}
                            href="/#mas-vendidos"
                            className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <Star size={20} className="text-white opacity-70 group-hover:opacity-100 transition-all" />
                              <span className="text-lg font-black uppercase tracking-widest group-hover:text-white transition-colors">Más Vendidos</span>
                            </div>
                            <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white" />
                          </a>
                        )}

                        <a
                          onClick={(e) => handleScrollTo(e, 'contacto')}
                          href="/#contacto"
                          className="flex items-center justify-between p-3 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <MessageSquare size={20} className="text-white opacity-70 group-hover:opacity-100 transition-all" />
                            <span className="text-lg font-black uppercase tracking-widest group-hover:text-white transition-colors">Contacto</span>
                          </div>
                          <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-white" />
                        </a>
                      </nav>

                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-30 relative z-10">
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase italic">NEWAVE.</span>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 flex justify-center">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-2xl lg:text-3xl font-black tracking-[0.2em] italic group-hover:text-white transition-all duration-500">NEWAVE.</span>
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex-1 flex items-center justify-end gap-0 sm:gap-2 lg:gap-4">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-2 group p-2 md:p-3 rounded-full transition-all focus:outline-none"
              >
                <Search size={20} strokeWidth={2.5} className="group-hover:text-white transition-all duration-300" />
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
                  className="p-2 sm:p-3 rounded-full transition-all group focus:outline-none flex items-center gap-2"
                >
                  <div className="relative">
                    <User size={20} strokeWidth={2.5} className={`${user ? 'text-white' : ''} group-hover:text-white transition-all duration-300`} />
                    {user && (!user.phone || !user.dni || !user.address?.street) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" title="Faltan datos en tu perfil" />
                    )}
                  </div>
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
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/perfil/datos" className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <span>Mis Datos</span>
                        {(!user.phone || !user.dni || !user.address?.street) && (
                          <AlertCircle size={14} className="text-yellow-500" />
                        )}
                      </Link>
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/perfil/compras" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Mis Compras</Link>
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/perfil/favoritos" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Favoritos</Link>
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
                className="group relative flex items-center justify-center p-2 sm:p-3 rounded-full transition-all focus:outline-none"
              >
                <ShoppingBag size={22} strokeWidth={2.5} className="group-hover:text-white transition-all duration-300" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1 right-1 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-[0_0_15px_rgba(28,134,200,0.5)]"
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
