import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
import { X, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';
import { auth } from '../../config/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // false = Login, true = Register
  const login = useAuthStore((state) => state.login);
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [verificationCode, setVerificationCode] = useState('');

  const [frontView, setFrontView] = useState<'login' | 'forgot_email' | 'forgot_code'>('login');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password Form
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');


  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
      // Reset state when closed
      setIsFlipped(false);
      setLoginEmail('');
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setStep('form');
      setVerificationCode('');
      setFrontView('login');
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Ingresa tu correo');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/users/forgot-password', { email: resetEmail });
      toast.success('Código de recuperación enviado');
      if (data?.devCode) {
        toast.info(`Código Dev: ${data.devCode}`, { duration: 8000 });
        setResetCode(data.devCode);
      }
      setFrontView('forgot_code');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length !== 4 || !newPassword) {
      toast.error('Completa los campos correctamente');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/users/reset-password', {
        email: resetEmail,
        code: resetCode,
        newPassword: newPassword
      });
      toast.success('¡Contraseña restablecida con éxito!');
      setFrontView('login');
      setLoginEmail(resetEmail);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/users/login', { email: loginEmail, password: loginPassword });
      login(data);
      toast.success('¡Bienvenido de nuevo!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/users/send-verification-code', { email: regEmail });
      toast.success('Código de verificación enviado');
      if (data?.devCode) {
        toast.info(`Código Dev: ${data.devCode}`, { duration: 8000 });
        setVerificationCode(data.devCode);
      }
      setStep('verification');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 4) {
      toast.error('El código debe ser de 4 dígitos');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/users/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        verificationCode: verificationCode
      });
      login(data);
      toast.success('¡Cuenta creada con éxito!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  // Vista actual (determina el contenido y la pestaña activa)
  const view = isFlipped ? (step === 'form' ? 'register' : 'verify') : frontView;
  const isRegisterTab = isFlipped;
  const reduce = useReducedMotion();

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const goTab = (register: boolean) => {
    setIsFlipped(register);
    if (!register) setFrontView('login');
  };

  const inputCls =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] focus:bg-white transition-colors';
  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5';
  const primaryBtn =
    'auth-btn w-full mt-2 py-3.5 rounded-xl bg-[#202A36] text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-50';
  const linkBtn = 'py-1 text-[10px] font-bold text-gray-400 hover:text-[#202A36] uppercase tracking-widest transition-colors';

  // Entrada con resorte suave (mínimo rebote); la salida es más rápida y sin rebote
  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: 'translateY(24px) scale(0.92)' },
        animate: {
          opacity: 1,
          transform: 'translateY(0px) scale(1)',
          transition: { type: 'spring' as const, duration: 0.5, bounce: 0.22, opacity: { duration: 0.2 } },
        },
        exit: { opacity: 0, transform: 'translateY(10px) scale(0.96)', transition: { duration: 0.15, ease: EASE_OUT } },
      };

  const titles: Record<string, { title: string; subtitle: string }> = {
    login: { title: 'Bienvenido', subtitle: 'Ingresá para ver tus compras y favoritos.' },
    register: { title: 'Crear cuenta', subtitle: 'Sumate a la elite de Newave.' },
    verify: { title: 'Verificá tu correo', subtitle: `Ingresá el código de 4 dígitos que enviamos a ${regEmail}` },
    forgot_email: { title: 'Recuperar', subtitle: 'Te enviaremos un código para restablecerla.' },
    forgot_code: { title: 'Nueva contraseña', subtitle: `Ingresá el código que enviamos a ${resetEmail}` },
  };

  // Orden espacial de las vistas: las de "Ingresar" a la izquierda, las de "Crear cuenta" a la derecha.
  // Una vista anterior sale/entra por la izquierda y una posterior por la derecha.
  const ORDER: Record<string, number> = { login: 0, forgot_email: 1, forgot_code: 2, register: 3, verify: 4 };

  // Todas las vistas se apilan en la MISMA celda de una grilla: la tarjeta toma el alto de la más alta
  // y nunca cambia de tamaño al pasar de una a otra (solo se desliza el contenido).
  // Función (no componente): si fuera un componente definido acá adentro, React lo recrearía en cada
  // tecla y los campos perderían el foco.
  const panel = (name: string, children: React.ReactNode) => {
    const active = view === name;
    const side = ORDER[name] < ORDER[view] ? 'is-left' : 'is-right';
    return (
      <div
        key={name}
        className={`auth-panel ${active ? 'is-active' : side}`}
        aria-hidden={!active}
        {...(!active ? { inert: '' as any } : {})}
      >
        <div className={active ? 'auth-stagger' : ''}>
          <div className="mb-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#202A36] mb-1">{titles[name].title}</h2>
            <p className="text-gray-500 font-medium text-sm break-words">{titles[name].subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={titles[view].title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            {...card}
            className="relative z-[101] w-full max-w-[420px] max-h-[calc(100svh-2rem)] overflow-y-auto overflow-x-hidden scrollbar-hide bg-white rounded-[1.75rem] shadow-2xl"
          >
            <div className="relative px-7 pt-7 pb-8 sm:px-8">
              <button onClick={onClose} aria-label="Cerrar" className="auth-close absolute top-4 right-4 p-2 rounded-full focus:outline-none">
                <X size={18} className="text-gray-400" />
              </button>

              {/* Pestañas siempre visibles (así el alto no cambia); el fondo blanco se desliza a la activa */}
              <div className="relative grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-6 mr-10">
                {[
                  { label: 'Ingresar', active: !isRegisterTab, onClick: () => goTab(false) },
                  { label: 'Crear cuenta', active: isRegisterTab, onClick: () => goTab(true) },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={tab.onClick}
                    className={`relative z-10 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors duration-200 ${
                      tab.active ? 'text-[#202A36]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.active && (
                      <motion.span
                        layoutId="auth-tab-indicator"
                        className="absolute inset-0 -z-10 bg-white rounded-lg shadow-sm"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                      />
                    )}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="auth-panels">
                {panel('login', (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls}>Correo</label>
                      <input type="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} placeholder="tu@correo.com" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Contraseña</label>
                        <button type="button" onClick={() => setFrontView('forgot_email')} className="text-[10px] font-bold text-[#CAA959] hover:underline">
                          ¿La olvidaste?
                        </button>
                      </div>
                      <input type="password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={isLoading} className={primaryBtn}>
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Iniciar sesión'}
                    </button>
                    <p className="text-center text-xs font-medium text-gray-500">
                      ¿No tenés cuenta?{' '}
                      <button type="button" onClick={() => goTab(true)} className="text-[#CAA959] font-black hover:underline">
                        Creá una
                      </button>
                    </p>
                  </form>
                ))}

                {panel('forgot_email', (
                  <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls}>Correo electrónico</label>
                      <input type="email" autoComplete="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={inputCls} placeholder="tu@correo.com" />
                    </div>
                    <button type="submit" disabled={isLoading} className={primaryBtn}>
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Enviar código'}
                    </button>
                    <button type="button" onClick={() => setFrontView('login')} className={linkBtn}>
                      Volver a iniciar sesión
                    </button>
                  </form>
                ))}

                {panel('forgot_code', (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls}>Código de 4 dígitos</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center tracking-[0.5em] font-black text-xl text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                        placeholder="0000"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Nueva contraseña</label>
                      <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={isLoading || resetCode.length !== 4} className={primaryBtn}>
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Restablecer contraseña'}
                    </button>
                    <button type="button" onClick={() => setFrontView('login')} className={linkBtn}>
                      Cancelar
                    </button>
                  </form>
                ))}

                {panel('register', (
                  <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls}>Nombre completo</label>
                      <input type="text" autoComplete="name" value={regName} onChange={(e) => setRegName(e.target.value)} className={inputCls} placeholder="Juan Pérez" />
                    </div>
                    <div>
                      <label className={labelCls}>Correo electrónico</label>
                      <input type="email" autoComplete="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputCls} placeholder="tu@correo.com" />
                    </div>
                    <div>
                      <label className={labelCls}>Contraseña</label>
                      <input type="password" autoComplete="new-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={isLoading} className={primaryBtn}>
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Siguiente'}
                    </button>
                  </form>
                ))}

                {panel('verify', (
                  <form onSubmit={handleVerify} className="flex flex-col gap-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl tracking-[0.4em] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-black text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                      placeholder="0000"
                    />
                    <button type="submit" disabled={isLoading || verificationCode.length !== 4} className={primaryBtn}>
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Verificar y crear cuenta'}
                    </button>
                    <button type="button" onClick={() => setStep('form')} className={linkBtn}>
                      Volver
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
