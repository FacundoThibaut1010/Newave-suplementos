import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import type { CartItem as CartItemType } from '../../types/cart';

const CartItem = ({ item }: { item: CartItemType }) => {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-5 py-5 border-b border-gray-50 last:border-0"
    >
      <div className="w-20 h-24 rounded-2xl overflow-hidden bg-[#F9F9F9] shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h4 className="font-bold text-[#1A1A1A] text-sm tracking-tight truncate md:whitespace-normal md:break-words flex-1">{item.name}</h4>
          <span className="font-bold text-sm text-black shrink-0 whitespace-nowrap">${Number(item.price * item.quantity).toLocaleString('es-AR')}</span>
        </div>
        
        <p className="text-xs text-gray-400 mb-4">${Number(item.price).toLocaleString('es-AR')}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-[#F9F9F9] rounded-xl px-2 py-1 border border-gray-100">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="p-1.5 hover:text-black text-gray-400 transition-colors"
            >
              <Minus size={14} strokeWidth={2.5} />
            </motion.button>
            <span className="w-8 text-center text-xs font-bold text-black">{item.quantity}</span>
            <motion.button 
              whileTap={item.countInStock === undefined || item.quantity < item.countInStock ? { scale: 0.8 } : {}}
              onClick={() => {
                if (item.countInStock === undefined || item.quantity < item.countInStock) {
                  updateQuantity(item.id, item.quantity + 1);
                }
              }}
              disabled={item.countInStock !== undefined && item.quantity >= item.countInStock}
              className={`p-1.5 transition-colors ${item.countInStock !== undefined && item.quantity >= item.countInStock ? 'text-gray-200 cursor-not-allowed' : 'hover:text-black text-gray-400'}`}
            >
              <Plus size={14} strokeWidth={2.5} />
            </motion.button>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => removeItem(item.id)}
            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
