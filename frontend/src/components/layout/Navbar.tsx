import React from 'react';
import { ShoppingBag, Search, User, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import { useUIStore } from '../../store/useUIStore';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useUIStore((state) => state.openCart);

  return (
    <nav className="fixed top-10 w-full bg-[#202A36] text-white z-[50] shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Menu */}
          <div className="flex-1 flex items-center">
            <button className="flex items-center gap-2 group">
              <Menu size={24} strokeWidth={2} className="group-hover:text-[#CAA959] transition-colors" />
              <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-[#CAA959] transition-colors">Menú</span>
            </button>
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
