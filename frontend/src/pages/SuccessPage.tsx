import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

const SuccessPage = () => {
  const { clearCart } = useCartStore();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const payment_id = searchParams.get('payment_id');
  const external_reference = searchParams.get('external_reference');

  useEffect(() => {
    // Si el pago fue aprobado, intentamos verificarlo en el backend (Fallback local)
    if (status === 'approved' && payment_id && external_reference) {
      clearCart();
      
      // Llamada de verificación al backend
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id, external_reference })
      }).catch(err => console.error('Error verifying payment fallback:', err));
    } else if (status === 'pending' || status === 'in_process') {
      clearCart();
    }
  }, [status, payment_id, external_reference, clearCart]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md border border-gray-100"
      >
        <CheckCircle2 size={80} className="mx-auto mb-6 text-[#CAA959]" strokeWidth={1.5} />
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-[#202A36]">¡Pago Exitoso!</h2>
        <p className="text-gray-500 font-medium mb-8">
          Tu pago ha sido procesado correctamente. En breve recibirás un correo con el comprobante y los detalles de envío.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">
          <ArrowRight size={16} />
          Volver a la tienda
        </Link>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
