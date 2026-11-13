
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Truck, User, ArrowLeft, CheckCircle2, ShieldCheck, Phone, Wallet, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';
import AuthModal from '../components/auth/AuthModal';
import { toast } from 'sonner';
import { useShippingQuote } from '../hooks/useShippingQuote';
import type { Rate } from '../types/shipping';
import CardPaymentSection from '../components/checkout/CardPaymentSection';

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

  // Estado para la opción de envío seleccionada
  const [selectedShipping, setSelectedShipping] = useState<Rate | null>(null);

  // Modo de pago: tarjeta dentro de la web (Brick) o redirección a Mercado Pago (Checkout Pro)
  const [paymentMode, setPaymentMode] = useState<'card' | 'mercadopago'>('card');

  // Hook personalizado para obtener la cotización de envíos de Correo Argentino
  const {
    loading: shippingLoading,
    error: shippingError,
    homeOptions,
    branchOptions,
    fetchQuote,
    clearQuote
  } = useShippingQuote(items);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<CheckoutFormData>({
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

  const postalCode = watch('postalCode');

  // Efecto reactivo para disparar la cotización de envíos al escribir el código postal
  useEffect(() => {
    setSelectedShipping(null); // Limpiar selección previa cuando cambia el CP
    if (postalCode && postalCode.trim().length >= 4) {
      fetchQuote(postalCode.trim());
    } else {
      clearQuote();
    }
  }, [postalCode, fetchQuote, clearQuote]);

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

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value;
    setValue('postalCode', cp, { shouldValidate: true });
  };

  const onFormError = (errors: any) => {
    console.log("Errores de validación:", errors);
    toast.error('Faltan datos obligatorios para el envío.');
  };

  // Items del carrito en el formato que espera el backend (producto + sabor separados).
  // Lo usan tanto el pago con tarjeta (Brick) como Checkout Pro.
  const orderItemsPayload = useMemo(() => items.map(item => {
    const isVariant = item.id.includes('-');
    const productId = isVariant ? item.id.split('-')[0] : item.id;
    const variantFlavor = isVariant ? item.id.split('-').slice(1).join('-') : undefined;

    return {
      product: productId,
      variant: variantFlavor,
      name: item.name,
      qty: item.quantity,
      price: item.price,
      // Las imágenes en base64 no hacen falta para cobrar y hacen pesadísimo el pedido
      image: typeof item.image === 'string' && item.image.startsWith('data:') ? '' : item.image
    };
  }), [items]);

  const onSubmit = async (data: CheckoutFormData) => {
    // Validar que se haya seleccionado un método de envío si hay código postal ingresado
    if (postalCode && postalCode.trim().length >= 4 && !selectedShipping) {
      toast.error('Por favor, selecciona una opción de envío para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        orderItems: orderItemsPayload,
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
            ? `${data.addressLine2} - Envío: ${selectedShipping?.productName}`
            : (selectedShipping ? `Envío: ${selectedShipping.productName}` : undefined)
        },
        shippingPrice: selectedShipping ? selectedShipping.price : 0,
        shippingOption: selectedShipping || undefined,
        totalPrice: totalPrice() + (selectedShipping ? selectedShipping.price : 0),
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
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-[#111214]">Inicia Sesión para Comprar</h2>
            <p className="text-gray-500 font-medium mb-8">
              Para garantizar la seguridad de tu compra y poder hacerle seguimiento a tu paquete, necesitas una cuenta en Newave.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-4 px-12 bg-[#111214] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#1C86C8] transition-colors inline-block shadow-xl hover:-translate-y-1"
            >
              Iniciar Sesión / Registrarse
            </button>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
          </div>
        ) : (
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-start">

            <div className="lg:col-span-7 bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-sm border border-gray-100 w-full overflow-hidden">
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-10 md:mb-14 text-center md:text-left">Finalizar compra</h1>

              <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-16" noValidate autoComplete="off">

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

                  {/* SECCIÓN DE ENVÍOS */}
                  {(postalCode && postalCode.trim().length >= 4) && (
                    <div className="mt-12 border-t pt-8 border-gray-100 space-y-6">
                      <div className="flex items-center gap-3">
                        <Truck size={20} className="text-black" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-black">Envío a domicilio</h4>
                      </div>

                      {shippingLoading && (
                        <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Calculando costos de envío...</p>
                        </div>
                      )}

                      {/* Opciones de Envío */}

                      {!shippingLoading && (
                        <div className="space-y-6">
                          {/* Opciones a Domicilio (Clásico / Fast) */}
                          {homeOptions.length > 0 && (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {homeOptions.map((option) => {
                                const isFast = option.productType === 'EP' || option.productName.toLowerCase().includes('expreso');
                                const displayTitle = isFast ? 'Envío Fast' : 'Envío clásico';
                                const isSelected = selectedShipping?.productName === option.productName && selectedShipping?.deliveredType === option.deliveredType;

                                return (
                                  <button
                                    type="button"
                                    key={`${option.productName}-${option.deliveredType}`}
                                    onClick={() => setSelectedShipping(option)}
                                    className={`p-6 rounded-[2rem] text-left border-2 transition-all flex flex-col justify-between h-36 ${isSelected ? 'border-black bg-gray-50 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-gray-300 bg-white'
                                      }`}
                                  >
                                    <div className="w-full">
                                      <div className="flex justify-between items-start w-full">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-black uppercase italic leading-tight text-black">{displayTitle}</span>
                                          <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Correo Argentino</span>
                                        </div>
                                        {isSelected && <CheckCircle2 size={18} className="text-black flex-shrink-0" />}
                                      </div>
                                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-2">
                                        Llega en {option.deliveryTimeMin === option.deliveryTimeMax ? option.deliveryTimeMin : `${option.deliveryTimeMin} a ${option.deliveryTimeMax}`} días hábiles
                                      </p>
                                    </div>
                                    <div className="text-lg font-black italic tracking-tighter mt-4">${option.price.toLocaleString('es-AR')}</div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Retiro en Sucursal / Local (En negro, una sola opción, $0 gratis) */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedShipping({
                                productName: 'Retiro en Sucursal (Gratis)',
                                price: 0,
                                deliveredType: 'S',
                                productType: 'RETIRO',
                                deliveryTimeMin: '1',
                                deliveryTimeMax: '2'
                              })}
                              className={`w-full p-6 rounded-[2rem] text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 ${selectedShipping?.deliveredType === 'S'
                                ? 'bg-black text-white border-black shadow-xl ring-2 ring-black/20 scale-[1.01]'
                                : 'bg-[#121214] text-white border-neutral-800 hover:bg-[#1C86C8] hover:border-black'
                                }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <MapPin size={20} className="text-[#1C86C8]" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black uppercase italic tracking-wide text-white">Retiro en Sucursal</span>
                                    <span className="bg-[#1C86C8] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                      Gratis
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-300 font-medium mt-1">
                                    Punto de entrega en Ituzaingó • Listo para retirar en 24hs hábiles
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    Al confirmar la compra recibirás un email con la dirección exacta e indicaciones para retirar.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <span className="text-xl font-black italic tracking-tighter text-[#1C86C8]">GRATIS</span>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedShipping?.deliveredType === 'S' ? 'bg-[#1C86C8] text-black border-[#1C86C8]' : 'border-gray-500'
                                  }`}>
                                  {selectedShipping?.deliveredType === 'S' && <CheckCircle2 size={16} />}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* 03. PAGO */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Wallet size={26} className="text-black" />
                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-black-400">3. Método de Pago</h3>
                  </div>

                  {/* Selector entre Card Payment Brick y Checkout Pro */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-[#F4F4F5] rounded-2xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('card')}
                      className={`py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 ${paymentMode === 'card'
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-500 hover:text-black bg-transparent'
                        }`}
                    >
                      <CreditCard size={18} />
                      <span>Pagar con tarjeta acá</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('mercadopago')}
                      className={`py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 ${paymentMode === 'mercadopago'
                        ? 'bg-[#009EE3] text-white shadow-md'
                        : 'text-gray-500 hover:text-black bg-transparent'
                        }`}
                    >
                      <div className="w-6 h-4 bg-white rounded flex items-center justify-center p-0.5 shadow-sm shrink-0">
                        <img
                          src="/mercadopago.BK20nVmQ.svg"
                          alt="Mercado Pago"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span>Pagar con Mercado Pago</span>
                    </button>
                  </div>

                  {/* OPCIÓN 1: CARD PAYMENT BRICK (DENTRO DE LA WEB) */}
                  {paymentMode === 'card' && !selectedShipping && (
                    <div className="pt-2">
                      <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                          Completá tus datos y elegí una opción de envío para pagar con tarjeta
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMode === 'card' && selectedShipping && (
                    <div className="pt-2">
                      <CardPaymentSection
                        // Si cambia el total (otro envío), se vuelve a montar el formulario con el monto correcto para las cuotas
                        key={`card-${Math.round(totalPrice() + selectedShipping.price)}`}
                        amount={totalPrice() + selectedShipping.price}
                        payerEmail={watch('email')}
                        orderItems={orderItemsPayload}
                        guestInfo={{
                          fullName: watch('fullName'),
                          email: watch('email'),
                          phone: watch('phone'),
                        }}
                        shippingAddress={{
                          address: watch('address'),
                          city: watch('city'),
                          state: watch('state'),
                          postalCode: watch('postalCode'),
                          addressLine2: watch('addressLine2'),
                        }}
                        shippingOption={selectedShipping}
                        userId={user?._id}
                      />
                    </div>
                  )}

                  {/* OPCIÓN 2: CHECKOUT PRO (REDIRECCIÓN A MERCADO PAGO) */}
                  {paymentMode === 'mercadopago' && (
                    <div className="space-y-6 pt-2">
                      <div className="p-10 rounded-[3rem] border-2 border-[#009EE3] bg-blue-50/40 shadow-xl shadow-blue-100 flex flex-col items-center gap-4">
                        <div className="w-16 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md border border-blue-100">
                          <img src="/mercadopago.BK20nVmQ.svg" alt="Mercado Pago" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#009EE3] text-center">Checkout Pro</span>
                        <span className="text-[9px] font-bold text-gray-500 text-center max-w-sm">Paga en la plataforma de Mercado Pago con dinero en cuenta, tarjetas o débito</span>
                        <CardHoverStack />
                      </div>

                      <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full py-8 rounded-full text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl bg-[#009EE3] text-white hover:scale-[1.01]"
                      >
                        {isSubmitting
                          ? "Procesando..."
                          : `Pagar con Mercado Pago $${(totalPrice() + (selectedShipping ? selectedShipping.price : 0)).toLocaleString('es-AR')}`}
                      </button>
                    </div>
                  )}
                </section>
              </form>
            </div>

            {/* COLUMNA DERECHA: RESUMEN STICKY SIEMPRE VISIBLE */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 w-full self-start transition-all duration-300">
              <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-lg border border-gray-100">
                <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8 border-b-2 border-gray-50 pb-6 text-center">Tu Pedido</h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#F9F9F9] p-3 md:p-4 rounded-[1.5rem] border border-gray-50">
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white flex-shrink-0 p-2 shadow-sm">
                        <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        <div className="absolute -top-2 -right-2 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center font-black italic text-xs shadow-md">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-xs md:text-base font-black uppercase italic leading-tight break-words">{item.name}</h4>
                        {item.id.includes('-') && (
                          <p className="text-xs text-gray-400 font-bold uppercase mt-1">{item.id.split('-').slice(1).join('-')}</p>
                        )}
                        <p className="text-lg md:text-xl font-black italic tracking-tighter mt-1">${(item.price * item.quantity).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-gray-100 mt-6 space-y-3 px-2">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span>${totalPrice().toLocaleString('es-AR')}</span>
                  </div>
                  {selectedShipping && (
                    <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                      <span>Envío ({selectedShipping.productName})</span>
                      <span className={selectedShipping.price === 0 ? "text-emerald-600 font-black uppercase" : "text-black"}>
                        {selectedShipping.price === 0 ? "GRATIS" : `$${selectedShipping.price.toLocaleString('es-AR')}`}
                      </span>
                    </div>
                  )}
                  <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">TOTAL</span>
                    <span className="text-2xl md:text-3xl font-black italic tracking-tighter">
                      ${(totalPrice() + (selectedShipping ? selectedShipping.price : 0)).toLocaleString('es-AR')}
                    </span>
                  </div>
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