import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-[#CAA959]/10 text-[#CAA959]'}`}>
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-[#202A36] uppercase tracking-tighter mb-3">
              {title}
            </h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="bg-gray-50 p-6 flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-xs text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-xs text-white transition-colors shadow-lg hover:-translate-y-0.5 ${
                isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#202A36] hover:bg-[#CAA959]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
