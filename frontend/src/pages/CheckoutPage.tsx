import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Truck, User, ArrowLeft, CheckCircle2, ShieldCheck, Phone, Wallet, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import AuthModal from '../components/auth/AuthModal';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  fullName: z.string().min(3, { message: 'Nombre requerido' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().min(8, { message: 'Teléfono requerido' }),
  address: z.string().min(5, { message: 'Dirección requerida' }),
  addressLine2: z.string().optional(),
  // --- AÑADE ESTA LÍNEA ---
  state: z.string().min(1, { message: 'Provincia requerida' }),
  // -------------------------
  city: z.string().min(2, { message: 'Ciudad requerida' }),
  postalCode: z.string().min(4, { message: 'CP requerido' }),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvv: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// COMPONENTE DEL ABANICO DE TARJETAS (RESTAURADO)
const CardHoverStack = ({ visibleCardsCount = 3, totalCards = 5 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardLogos = [
    '/visa.sxIq5Dot.svg',
    '/master.CzeoQWmc.svg',
    '/american_express.C3z4WB9r.svg',
    '/diners_club.B9hVEmwz.svg',
    '/maestro.ByfUQi1c.svg'
  ];

  return (
    <div className="flex items-center gap-2 relative h-14 cursor-pointer" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="flex items-center -space-x-5">
        {cardLogos.slice(0, visibleCardsCount).map((logo, index) => (
          <img key={logo} src={logo} alt="Card" className="w-12 h-12 rounded-full bg-white border-2 border-gray-100 p-2 object-contain shadow-md" style={{ zIndex: visibleCardsCount - index }} />
        ))}
      </div>
      <AnimatePresence>
        {!isHovered ? (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="w-12 h-12 rounded-full bg-[#E5E7EB] border-2 border-white flex items-center justify-center -ml-5 z-0 shadow-sm">
            <span className="text-xs font-black text-[#6B7280]">+{totalCards - visibleCardsCount}</span>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex items-center -space-x-5 -ml-5 z-0">
            {cardLogos.slice(visibleCardsCount).map((logo, index) => (
              <motion.img key={logo} src={logo} alt="Other card" className="w-12 h-12 rounded-full bg-white border-2 border-gray-100 p-2 object-contain shadow-md" style={{ zIndex: -(index + 1) }} layout />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { register, handleSubmit, setValue, formState: { errors, isValid } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      email: user?.email || '',
      fullName: user?.name || '',
      phone: user?.phone || '',
      address: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.zipCode || '',
    }
  });

  useEffect(() => {
    if (user) {
      setValue('email', user.email || '');
      setValue('fullName', user.name || '');
      setValue('phone', user.phone || '');
      setValue('address', user.address?.street || '');
      setValue('city', user.address?.city || '');
      setValue('state', user.address?.state || '');
      setValue('postalCode', user.address?.zipCode || '');
    }
  }, [user, setValue]);

  // Base de datos de prueba para códigos postales
  const cpDatabase: Record<string, { city: string; state: string }> = {
    '1714': { city: 'Ituzaingó', state: 'Buenos Aires' },
    '1708': { city: 'Morón', state: 'Buenos Aires' },
    '1704': { city: 'Ramos Mejía', state: 'Buenos Aires' },
    '1706': { city: 'Haedo', state: 'Buenos Aires' },
    '1712': { city: 'Castelar', state: 'Buenos Aires' },
    '1722': { city: 'Merlo', state: 'Buenos Aires' },
    '1425': { city: 'Palermo', state: 'CABA' },
    '1414': { city: 'Villa Crespo', state: 'CABA' },
    // Puedes agregar más aquí o conectarlo a una API
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value;
    setValue('postalCode', cp, { shouldValidate: true });

    if (cpDatabase[cp]) {
      setValue('city', cpDatabase[cp].city, { shouldValidate: true });
      setValue('state', cpDatabase[cp].state, { shouldValidate: true });
      toast.success(`Ubicación detectada: ${cpDatabase[cp].city}`);
    }
  };

  const onFormError = (errors: any) => {
    console.log("Errores de validación:", errors);
    toast.error('Faltan datos obligatorios para el envío.');
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      const payload = {
        orderItems: items.map(item => {
          const isVariant = item.id.includes('-');
          const productId = isVariant ? item.id.split('-')[0] : item.id;
          const variantFlavor = isVariant ? item.id.split('-').slice(1).join('-') : undefined;
          
          return {
            product: productId,
            variant: variantFlavor,
            name: item.name,
            qty: item.quantity,
            price: item.price,
            image: item.image
          };
        }),
        guestInfo: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone
        },
        shippingAddress: {
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          state: data.state,
          addressLine2: data.addressLine2
        },
        totalPrice: totalPrice(),
        paymentMethod: 'Mercado Pago',
        user: user?._id
      };

      const res = await apiClient.post('/orders/create_preference', payload);

      if (res.data.init_point) {
        window.location.href = res.data.init_point;
      } else {
        console.error("No init_point received", res.data);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error procesando pago:", error);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-[#F8F9FA] z-[200] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md border border-gray-100">
          <CheckCircle2 size={80} className="mx-auto mb-6 text-black" strokeWidth={1.5} />
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">¡Pedido Recibido!</h2>
          <p className="text-gray-500 font-medium mb-8">Tu Newave llegará pronto.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black pt-40 md:pt-48 pb-20">
      <div className="max-w-7xl mx-auto px-6">

        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-400 hover:text-black mb-10 transition-colors uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft size={14} /> Volver
        </button>

        {!user ? (
          <div className="bg-white rounded-[3.5rem] p-16 shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <User size={40} className="text-gray-300" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-[#202A36]">Inicia Sesión para Comprar</h2>
            <p className="text-gray-500 font-medium mb-8">
              Para garantizar la seguridad de tu compra y poder hacerle seguimiento a tu paquete, necesitas una cuenta en Newave.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-4 px-12 bg-[#202A36] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#CAA959] transition-colors inline-block shadow-xl hover:-translate-y-1"
            >
              Iniciar Sesión / Registrarse
            </button>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
          </div>
        ) : (
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-start">

            <div className="lg:col-span-7 bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-sm border border-gray-100 w-full overflow-hidden">
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-10 md:mb-14 text-center md:text-left">Finalizar compra</h1>

              <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-16" noValidate>

                {/* 01. DATOS PERSONALES */}
                <section className="space-y-8">
                  <div className="flex items-center gap-3">
                    <User size={26} className="text-black" /> {/* Icono en negro */}
                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-black-400">1. Tus Datos</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <input {...register('fullName')} placeholder="Nombre completo" className="input-field w-full" />
                      {errors.fullName && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.fullName.message}</span>}
                    </div>
                    <div>
                      <input
                        {...register('email')}
                        placeholder="Email"
                        className="input-field w-full bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                        readOnly
                        title="Email asociado a tu cuenta"
                      />
                      {errors.email && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.email.message}</span>}
                    </div>
                    <div className="md:col-span-2">
                      <div className="relative w-full">
                        <input
                          {...register('phone')}
                          placeholder="Telefono"
                          className="input-field w-full"
                          style={{ paddingLeft: '3.2rem' }}
                        />
                        <Phone className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                      {errors.phone && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.phone.message}</span>}
                    </div>
                  </div>
                </section>

                {/* 02. DETALLES DE ENTREGA */}
                <section className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Truck size={26} className="text-black" />
                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-black-400">2. Entrega</h3>
                  </div>



                  <div className="grid md:grid-cols-4 gap-5">
                    {/* Dirección completa */}
                    <div className="md:col-span-4">
                      <input
                        {...register('address')}
                        placeholder="Calle y número de casa"
                        className="input-field w-full"
                      />
                      {errors.address && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.address.message}</span>}
                    </div>

                    {/*Departamento, casa, etc*/}
                    <div className="md:col-span-4">
                      <div className="relative">
                        <input
                          {...register('addressLine2')}
                          placeholder="Casa, apartamento, etc (opcional)"
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    {/* Código Postal */}
                    <div className="md:col-span-1">
                      <input
                        {...register('postalCode', { onChange: handlePostalCodeChange })}
                        placeholder="CP (Ej: 1714)"
                        className="input-field w-full"
                      />
                      {errors.postalCode && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.postalCode.message}</span>}
                    </div>

                    {/* Ciudad */}
                    <div className="md:col-span-1">
                      <input
                        {...register('city')}
                        placeholder="Ciudad"
                        className="input-field w-full"
                      />
                      {errors.city && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.city.message}</span>}
                    </div>

                    <div className="md:col-span-2">
                      <div className="relative">
                        <select
                          {...register('state')}
                          className="input-field appearance-none cursor-pointer w-full bg-[#F9F9F9] text-black-500 focus:text-black transition-colors"
                          defaultValue=""
                        >
                          <option value="" disabled>Provincia / Estado</option>
                          <option value="Buenos Aires">Buenos Aires</option>
                          <option value="CABA">CABA</option>
                          <option value="Catamarca">Catamarca</option>
                          <option value="Chaco">Chaco</option>
                          <option value="Chubut">Chubut</option>
                          <option value="Cordoba">Córdoba</option>
                          <option value="Corrientes">Corrientes</option>
                          <option value="Entre Rios">Entre Ríos</option>
                          <option value="Formosa">Formosa</option>
                          <option value="Jujuy">Jujuy</option>
                          <option value="La Pampa">La Pampa</option>
                          <option value="La Rioja">La Rioja</option>
                          <option value="Mendoza">Mendoza</option>
                          <option value="Misiones">Misiones</option>
                          <option value="Neuquen">Neuquén</option>
                          <option value="Rio Negro">Río Negro</option>
                          <option value="Salta">Salta</option>
                          <option value="San Juan">San Juan</option>
                          <option value="San Luis">San Luis</option>
                          <option value="Santa Cruz">Santa Cruz</option>
                          <option value="Santa Fe">Santa Fe</option>
                          <option value="Santiago del Estero">Santiago del Estero</option>
                          <option value="Tierra del Fuego">Tierra del Fuego</option>
                          <option value="Tucuman">Tucumán</option>
                        </select>

                        {/* Flechita decorativa para que sepa que es un menú */}
                        <div className="absolute right-6 top-4 pointer-events-none text-gray-400">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      {errors.state && <span className="text-red-500 text-xs mt-1 block font-bold">{errors.state.message}</span>}
                    </div>



                  </div>
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Wallet size={26} className="text-black-300" />
                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-black-400">3. Pago</h3>
                  </div>

                  <div className="w-full">
                    {/* MERCADO PAGO CON ABANICO */}
                    <div className="p-10 rounded-[3rem] border-2 border-[#009EE3] bg-blue-50/40 shadow-xl shadow-blue-100 flex flex-col items-center gap-4">
                      <img src="/mercadopago.BK20nVmQ.svg" alt="MP" className="h-10 object-contain" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#009EE3] text-center">Mercado pago</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#009EE3] text-center">Paga con Mercado Pago de forma 100% segura</span>
                      <CardHoverStack />
                    </div>
                  </div>
                </section>

                <button disabled={isSubmitting} type="submit"
                  className="w-full py-8 rounded-full text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl bg-[#009EE3] text-white hover:scale-[1.01]">
                  {isSubmitting ? "Procesando..." : `Pagar con Mercado Pago $${totalPrice().toLocaleString('es-AR')}`}
                </button>
              </form>
            </div>

            {/* COLUMNA DERECHA: RESUMEN STICKY SIEMPRE VISIBLE */}
            <div className="lg:col-span-5 sticky top-32 w-full">
              <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-lg border border-gray-100">
                <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8 border-b-2 border-gray-50 pb-6 text-center">Tu Pedido</h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#F9F9F9] p-3 md:p-4 rounded-[1.5rem] border border-gray-50">
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white flex-shrink-0 p-2 shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        <div className="absolute -top-2 -right-2 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center font-black italic text-xs shadow-md">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-sm md:text-base font-black uppercase italic leading-tight break-words">{item.name}</h4>
                        {item.id.includes('-') && (
                          <p className="text-xs text-gray-400 font-bold uppercase mt-1">{item.id.split('-').slice(1).join('-')}</p>
                        )}
                        <p className="text-lg md:text-xl font-black italic tracking-tighter mt-1">${(item.price * item.quantity).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-8 border-t-2 border-dashed border-gray-100 mt-8 flex justify-between items-center px-2">
                  <span className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">TOTAL</span>
                  <span className="text-2xl md:text-3xl font-black italic tracking-tighter">${totalPrice().toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background-color: #F9F9F9;
          border: 1px solid #E5E7EB;
          border-radius: 9999px; padding: 1.4rem 2rem; font-size: 0.9rem;
          font-weight: 700; outline: none; transition: all 0.3s;
        }
        .input-field:focus { border-color: black; background-color: white; transform: translateY(-2px); }
        .input-white {
          width: 100%; background-color: white; border: 1px solid #EEE;
          border-radius: 9999px; padding: 1.2rem 1.8rem; font-size: 0.9rem;
          font-weight: 700; outline: none;
        }
        .input-white:focus { border-color: black; }
      `}</style>
    </div>
  );
};

export default CheckoutPage;