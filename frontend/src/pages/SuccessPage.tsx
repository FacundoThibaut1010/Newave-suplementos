import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

const SuccessPage = () => {
  const { clearCart } = useCartStore();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const payment_id = searchParams.get('payment_id');
  const external_reference = searchParams.get('external_reference');
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

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

    // Auto redirección después de 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, payment_id, external_reference, clearCart, navigate]);

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
        <div className="text-sm font-bold text-gray-400 mb-6 flex items-center justify-center gap-2">
          Serás redirigido a la tienda en {countdown} segundos <ArrowRight size={14} className="animate-pulse" />
        </div>
        <Link to="/" className="btn-primary inline-block w-full">
          Volver Ahora
        </Link>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
