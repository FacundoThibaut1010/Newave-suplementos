import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { CreditCard, CheckCircle2, AlertTriangle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'sonner';

interface CardPaymentSectionProps {
  amount: number;
  payerEmail: string;
  orderItems: any[];
  guestInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    addressLine2?: string;
  };
  shippingOption: any;
  userId?: string;
  onPaymentSuccess?: (result: any) => void;
}

export const CardPaymentSection: React.FC<CardPaymentSectionProps> = ({
  amount,
  payerEmail,
  orderItems,
  guestInfo,
  shippingAddress,
  shippingOption,
  userId,
  onPaymentSuccess,
}) => {
  const [publicKey, setPublicKey] = useState<string>(import.meta.env.VITE_MP_PUBLIC_KEY || '');
  const [policyConfig, setPolicyConfig] = useState<{
    policy: string;
    maxInstallments: number;
    excludedPaymentTypes: string[];
  }>({
    policy: import.meta.env.VITE_PAYMENT_POLICY || 'credit_debit',
    maxInstallments: 12,
    excludedPaymentTypes: [],
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'approved' | 'in_process' | 'rejected'>('idle');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Obtener configuración pública y política desde el Backend
  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const { data } = await apiClient.get('/payments/config');
        if (isMounted) {
          const resolvedKey = data.publicKey || import.meta.env.VITE_MP_PUBLIC_KEY || '';
          if (resolvedKey) {
            setPublicKey(resolvedKey);
            initMercadoPago(resolvedKey, { locale: 'es-AR' });
            setIsInitialized(true);
          }
          if (data.brickConfig) {
            setPolicyConfig(data.brickConfig);
          }
        }
      } catch (err) {
        // Fallback a variable local de Vite si la API no responde
        const localKey = import.meta.env.VITE_MP_PUBLIC_KEY || '';
        if (localKey && isMounted) {
          setPublicKey(localKey);
          initMercadoPago(localKey, { locale: 'es-AR' });
          setIsInitialized(true);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  // Monto inicial estable (mínimo $100 ARS para que Mercado Pago no desactive medios de pago)
  const [initialAmount] = useState(() => Math.max(100, Math.round(Number(amount) > 0 ? Number(amount) : 1000)));

  const stableInitialization = useMemo(() => ({
    amount: initialAmount,
    payer: {
      email: payerEmail || guestInfo?.email || 'cliente@newave.com',
    },
  }), []);

  const stableCustomization = useMemo(() => {
    const paymentMethods: any = {
      maxInstallments: policyConfig.maxInstallments || 12,
    };

    if (policyConfig.excludedPaymentTypes && policyConfig.excludedPaymentTypes.length > 0) {
      paymentMethods.types = {
        excluded: policyConfig.excludedPaymentTypes,
      };
    }

    return {
      visual: {
        style: {
          theme: 'default' as const,
        },
        hideFormTitle: true,
      },
      paymentMethods,
    };
  }, [policyConfig.maxInstallments, policyConfig.excludedPaymentTypes?.join(',')]);

  const handleSubmit = useCallback(async (cardFormData: any) => {
    if (!shippingAddress?.address || !shippingAddress?.postalCode) {
      toast.error('Por favor completa los datos de entrega antes de pagar.');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // Generar idempotencyKey única por intento para evitar cobros duplicados
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // El payload contiene SOLO los datos de tarjeta entregados por el Brick y datos de la orden.
      // El backend recalcula y valida el monto final y stock por su cuenta.
      const payload = {
        orderItems,
        guestInfo,
        shippingAddress,
        shippingOption,
        user: userId,
        idempotencyKey,
        cardPaymentData: {
          token: cardFormData.token,
          issuer_id: cardFormData.issuer_id,
          payment_method_id: cardFormData.payment_method_id,
          installments: Number(cardFormData.installments) || 1,
          payer: {
            email: cardFormData.payer?.email || payerEmail,
            identification: cardFormData.payer?.identification,
          },
        },
      };

      const { data } = await apiClient.post('/payments/card', payload);

      setPaymentResult(data);

      if (data.status === 'approved') {
        setPaymentStatus('approved');
        useCartStore.getState().clearCart();
        if (onPaymentSuccess) onPaymentSuccess(data);
      } else if (data.status === 'in_process' || data.status === 'pending') {
        setPaymentStatus('in_process');
        useCartStore.getState().clearCart();
        if (onPaymentSuccess) onPaymentSuccess(data);
      } else {
        setPaymentStatus('rejected');
        setErrorMessage(data.friendlyMessage?.description || 'El pago fue rechazado por la entidad bancaria.');
      }
    } catch (err: any) {
      console.error('Error procesando pago con tarjeta:', err);
      const apiData = err.response?.data;
      setPaymentStatus('rejected');
      setPaymentResult(apiData);
      setErrorMessage(
        apiData?.friendlyMessage?.description ||
        apiData?.message ||
        'Ocurrió un error al procesar el pago con tu tarjeta. Por favor verificá los datos o intentá nuevamente.'
      );
    }
  }, [orderItems, guestInfo, shippingAddress, shippingOption, userId, payerEmail, onPaymentSuccess, amount]);

  // Pantalla de resultado Aprobado
  if (paymentStatus === 'approved') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-[2.5rem] p-8 text-center space-y-5 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
            Transacción Exitosa
          </span>
          <h3 className="text-2xl font-black text-black italic uppercase tracking-tight">
            ¡Pago Aprobado!
          </h3>
          <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
            Tu compra por <strong className="text-black">${(paymentResult?.totalPrice || amount).toLocaleString('es-AR')}</strong> fue confirmada con éxito. Ya estamos preparando tu pedido.
          </p>
          {paymentResult?.paymentId && (
            <p className="text-[11px] text-gray-400 font-mono mt-3">
              ID de Pago MP: #{paymentResult.paymentId}
            </p>
          )}
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md"
          >
            Volver a la Tienda
          </a>
        </div>
      </div>
    );
  }

  // Pantalla de resultado En Revisión / Pendiente
  if (paymentStatus === 'in_process') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 text-center space-y-5 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-200">
          <Clock size={36} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">
            En Proceso
          </span>
          <h3 className="text-2xl font-black text-black italic uppercase tracking-tight">
            Pago en Revisión
          </h3>
          <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
            Mercado Pago está procesando tu pago. En cuanto sea confirmado recibirás un correo electrónico con todos los detalles.
          </p>
          {paymentResult?.paymentId && (
            <p className="text-[11px] text-gray-400 font-mono mt-3">
              ID de Pago MP: #{paymentResult.paymentId}
            </p>
          )}
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md"
          >
            Volver a la Tienda
          </a>
        </div>
      </div>
    );
  }

  // Pantalla de resultado Rechazado con opción de reintentar
  if (paymentStatus === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-8 text-center space-y-5 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-200">
          <AlertTriangle size={36} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">
            Pago no completado
          </span>
          <h3 className="text-2xl font-black text-black italic uppercase tracking-tight">
            {paymentResult?.friendlyMessage?.title || 'Pago Rechazado'}
          </h3>
          <p className="text-xs text-red-700 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
            {errorMessage || 'No pudimos cobrar con la tarjeta seleccionada.'}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              setPaymentStatus('idle');
              setErrorMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md"
          >
            <RefreshCw size={14} /> Reintentar Pago
          </button>
        </div>
      </div>
    );
  }

  // Aviso si falta la Public Key de Mercado Pago
  if (!publicKey || !isInitialized) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-amber-50 border border-amber-200 text-center space-y-3">
        <CreditCard className="mx-auto text-amber-600" size={32} />
        <h4 className="text-sm font-black uppercase italic text-black">
          Configuración de Mercado Pago pendiente
        </h4>
        <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
          Para habilitar el pago con tarjeta directo en la web, cargá la variable <strong>MP_PUBLIC_KEY</strong> en el servidor o <strong>VITE_MP_PUBLIC_KEY</strong> en el frontend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Política de Pago */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
        <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
        <div className="text-left">
          <span className="text-[11px] font-black uppercase tracking-wide text-gray-800 block">
            Pago Seguro con Mercado Pago
          </span>
          <span className="text-[10px] text-gray-500 font-medium block">
            {policyConfig.policy === 'debit_only'
              ? 'Solo tarjetas de débito en 1 pago.'
              : policyConfig.policy === 'credit_debit_one_installment'
              ? 'Tarjetas de crédito y débito en 1 cuota.'
              : 'Crédito y débito. Si elegís cuotas, el interés se calcula automáticamente en pantalla.'}
          </span>
        </div>
      </div>

      {paymentStatus === 'processing' && (
        <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-600">
            Procesando cobro seguro con Mercado Pago...
          </p>
        </div>
      )}

      {/* Card Payment Brick Container */}
      <div className={`transition-opacity duration-300 ${paymentStatus === 'processing' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <CardPayment
          key="card-brick-stable"
          initialization={stableInitialization}
          customization={stableCustomization}
          onSubmit={handleSubmit}
          onError={(error) => {
            if (error?.type === 'critical') {
              console.warn('Alerta en Card Payment Brick:', error);
            }
          }}
        />
      </div>
    </div>
  );
};

export default CardPaymentSection;

