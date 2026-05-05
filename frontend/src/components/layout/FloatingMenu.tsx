import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, LayoutGroup } from "framer-motion";
import { Menu, X, ShoppingBag, Search, User, Package, MessageSquare, Home, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useUIStore } from "../../store/useUIStore";

/**
 * Floating Menu: Newave Elite Edition
 * Foco: Estética premium Newave, glassmorphism profundo y detalles en oro.
 */
const menuItems = [
  { id: "home", label: "Inicio", path: "/", icon: <Home size={20} /> },
  { id: "categorias", label: "Categorías", path: "/#categorias", icon: <Package size={20} /> },
  { id: "productos", label: "Productos", path: "/productos", icon: <ShoppingBag size={20} /> },
  { id: "contacto", label: "Contacto", path: "/#contacto", icon: <MessageSquare size={20} /> },
];

export const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((state) => state.totalItems());
  const openCart = useUIStore((state) => state.openCart);

  // --- EFECTO MAGNÉTICO ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 200 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isOpen) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.35);
    mouseY.set((e.clientY - centerY) * 0.35);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <LayoutGroup>
      <div className="fixed top-6 right-6 md:top-10 md:right-10 z-[500] flex flex-col items-end gap-4">
        {/* Cart Trigger (Always visible or integrated) */}
        {!isOpen && totalItems > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={openCart}
            className="w-12 h-12 rounded-full bg-[#CAA959] text-black flex items-center justify-center shadow-lg relative"
          >
            <ShoppingBag size={20} strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black">
              {totalItems}
            </span>
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {!isOpen ? (
            // BURBUJA CERRADA: Newave Glass con Puntos de Luz Oro
            <motion.div
              key="bubble"
              ref={containerRef}
              layoutId="glass-panel"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ x: springX, y: springY }}
              onClick={() => setIsOpen(true)}
              className="
                relative w-16 h-16 md:w-20 md:h-20 
                rounded-full flex items-center justify-center 
                shadow-[0_12px_40px_rgba(0,0,0,0.5)]
                cursor-pointer group overflow-hidden
                
                /* --- NEWAVE GLASS EFFECT --- */
                bg-black/60                 /* Fondo oscuro Newave */
                backdrop-blur-[20px]        /* Desenfoque profundo */
                backdrop-saturate-[180%]    /* Viveza de color */
                border border-white/10      /* Borde de cristal */

                /* --- LUZ EXTRA (Reflejos Newave) --- */
                before:absolute before:inset-0
                before:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_50%)]
                
                after:absolute after:inset-0
                after:bg-[radial-gradient(circle_at_80%_80%,rgba(202,169,89,0.1),transparent_50%)] /* Luz Oro sutil */
              "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div layout className="relative z-10">
                <Menu className="text-[#CAA959] group-hover:scale-110 transition-transform duration-300" size={26} />
              </motion.div>
            </motion.div>
          ) : (
            // PANEL ABIERTO: Newave Elite Expandido
            <React.Fragment key="open-panel">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-[8px] z-[-1]"
              />

              <motion.div
                layoutId="glass-panel"
                className="
                  text-white p-6 md:p-8 
                  rounded-[2.5rem] md:rounded-[3rem] 
                  shadow-[0_32px_64px_rgba(0,0,0,0.8)]
                  w-[min(90vw,380px)] origin-top-right overflow-hidden
                  
                  /* --- NEWAVE PANEL EFFECT --- */
                  bg-black/80                 /* Más opaco Newave */
                  backdrop-blur-[30px] 
                  backdrop-saturate-[160%]
                  border border-white/10
                  
                  /* Luz ambiental Oro */
                  before:absolute before:inset-0
                  before:bg-[radial-gradient(circle_at_top_right,rgba(202,169,89,0.1),transparent_60%)]
                "
                initial={{ scale: 0.9, opacity: 0, x: 20, y: -20 }}
                animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, x: 20, y: -20 }}
              >
                {/* Header Newave */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#CAA959]">Newave Navigation</span>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={18} className="text-white/40" />
                  </button>
                </div>

                <nav className="flex flex-col gap-2 relative z-10">
                  {menuItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/0 hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-[#CAA959] opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
                          <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                        </div>
                        <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#CAA959]" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Footer del Menú */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30 relative z-10">
                  <span className="text-[9px] font-black tracking-[0.2em] uppercase italic">NEWAVE.</span>
                  <div className="text-[9px] font-black px-2 py-1 border border-white/20 rounded uppercase tracking-tighter italic">ELITE SERIES</div>
                </div>
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};
