import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import CartItem from './CartItem';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, totalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col"
          >
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-black" />
                <h2 className="text-lg font-bold text-black tracking-tight uppercase">Tu Carrito</h2>
              </div>
              <button
                onClick={onClose}
                className="p-4 md:p-3 bg-gray-50 border border-gray-200 shadow-sm hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={32} className="text-black" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-[#F9F9F9] rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={24} className="text-black" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">Tu carrito está vacío</h3>

                  <Link to="/productos"
                    className="btn-primary"
                    onClick={onClose}
                  >
                    Ver todos los Productos
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 border-t border-gray-50 bg-[#F9F9F9]/50">
                <div className="flex justify-between items-end mb-8">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                  <span className="text-2xl font-black text-black">${totalPrice().toLocaleString('es-AR')}</span>
                </div>

                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="w-full btn-primary py-5 flex items-center justify-center gap-3 group shadow-xl shadow-black/10"
                >
                  Continuar al pago
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-center text-[11px] font-medium text-gray-400 mt-6 uppercase tracking-wider">
                  Envío premium gratuito incluido
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
