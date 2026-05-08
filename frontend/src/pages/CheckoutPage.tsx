import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { CreditCard, Truck, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useState } from 'react';

const checkoutSchema = z.object({
  fullName: z.string().min(3, { message: '¡Opa! Cuéntanos quién eres (mínimo 3 letras)' }),
  email: z.string().email({ message: 'Ese correo parece un poco tímido, ¿lo revisas?' }),
  address: z.string().min(5, { message: '¡Casi lo tienes! Falta completar tu dirección' }),
  city: z.string().min(2, { message: '¿En qué ciudad te encuentras?' }),
  cardNumber: z.string().regex(/^\d{16}$/, { message: 'Necesitamos los 16 números de tu tarjeta' }),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Usa el formato MM/AA' }),
  cvv: z.string().regex(/^\d{3}$/, { message: 'Son los 3 números de atrás' }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
  });

  const onSubmit = async (_data: CheckoutFormData) => {
    setIsSubmitting(true);
    // Simulating API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      clearCart();
      setTimeout(() => navigate('/'), 3000);
    }, 2000);
  };

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">¡Tu carrito está suspirando por algo!</h2>
        <Link to="/" className="btn-primary">Ir a ver productos</Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-[#F8F9FA] text-[#202A36] rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl border border-gray-100">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 size={48} strokeWidth={2} />
            </motion.div>
          </div>
          <h2 className="text-5xl font-black text-[#202A36] mb-6 tracking-tighter uppercase italic">¡PAGO EXITOSO!</h2>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed font-medium">
            Tu pedido de Newave está siendo procesado. Te enviaremos un correo con los detalles del envío en breve.
          </p>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-full bg-[#CAA959]"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-[0.2em] font-black">Redirigiendo a la tienda...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 pt-32">
      <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-[#202A36] mb-12 transition-colors uppercase text-[10px] font-black tracking-widest">
        <ArrowLeft size={16} />
        <span>Seguir comprando</span>
      </Link>

      <div className="grid lg:grid-cols-2 gap-20 items-start">
        {/* Left: Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-black text-[#202A36] mb-12 uppercase italic tracking-tighter">Finalizar Compra</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-[#202A36]/5 rounded-full flex items-center justify-center text-[#202A36]">
                  <User size={20} />
                </div>
                <h3 className="text-xl font-black text-[#202A36] uppercase tracking-tight">Tus Datos</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="label-minimal">Nombre Completo</label>
                  <input {...register('fullName')} className="input-minimal" placeholder="Ej: Juan Pérez" />
                  {errors.fullName && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="label-minimal">Email</label>
                  <input {...register('email')} className="input-minimal" placeholder="hola@newave.com" />
                  {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.email.message}</p>}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-[#202A36]/5 rounded-full flex items-center justify-center text-[#202A36]">
                  <Truck size={20} />
                </div>
                <h3 className="text-xl font-black text-[#202A36] uppercase tracking-tight">Envío</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="label-minimal">Dirección de Entrega</label>
                  <input {...register('address')} className="input-minimal" placeholder="Calle Ejemplo 123" />
                  {errors.address && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="label-minimal">Ciudad</label>
                  <input {...register('city')} className="input-minimal" placeholder="Buenos Aires" />
                  {errors.city && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.city.message}</p>}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-[#202A36]/5 rounded-full flex items-center justify-center text-[#202A36]">
                  <CreditCard size={20} />
                </div>
                <h3 className="text-xl font-black text-[#202A36] uppercase tracking-tight">Pago Seguro</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="label-minimal">Número de Tarjeta</label>
                  <input {...register('cardNumber')} className="input-minimal" placeholder="0000 0000 0000 0000" maxLength={16} />
                  {errors.cardNumber && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.cardNumber.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label-minimal">Vencimiento</label>
                    <input {...register('expiry')} className="input-minimal" placeholder="MM/AA" maxLength={5} />
                    {errors.expiry && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.expiry.message}</p>}
                  </div>
                  <div>
                    <label className="label-minimal">CVV</label>
                    <input {...register('cvv')} className="input-minimal" placeholder="123" maxLength={3} />
                    {errors.cvv && <p className="text-[10px] text-red-500 font-bold uppercase mt-2 ml-4">{errors.cvv.message}</p>}
                  </div>
                </div>
              </div>
            </section>

            <button
              disabled={!isValid || isSubmitting}
              type="submit"
              className="w-full btn-accent py-5 text-lg flex items-center justify-center gap-3 group shadow-2xl shadow-gold/20"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Procesando...
                </span>
              ) : (
                <>Pagar ${totalPrice().toLocaleString('es-AR')}</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Right: Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#F8F9FA] rounded-[3rem] p-10 lg:sticky lg:top-32 border border-gray-100 shadow-sm"
        >
          <h3 className="text-2xl font-black text-[#202A36] mb-10 uppercase italic tracking-tighter">Tu Pedido</h3>
          <div className="space-y-8 mb-10 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="flex gap-6 items-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shrink-0 border border-gray-100 p-2">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-grow">
                  <p className="font-black text-[#202A36] text-sm uppercase italic">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Cantidad: {item.quantity}</p>
                </div>
                <p className="font-black text-[#202A36] text-base">${Number(item.price * item.quantity).toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
          
          <div className="space-y-4 pt-8 border-t border-gray-200">
            <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              <span>Subtotal</span>
              <span className="text-[#202A36] text-sm">${totalPrice().toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-[#CAA959] font-black uppercase text-[10px] tracking-widest">
              <span>Envío</span>
              <span className="text-sm italic">¡Bonificado!</span>
            </div>
            <div className="flex justify-between text-4xl font-black text-[#202A36] pt-6 italic tracking-tighter">
              <span>TOTAL</span>
              <span>${totalPrice().toLocaleString('es-AR')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
