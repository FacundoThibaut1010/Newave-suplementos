import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      await apiClient.post('/users/forgot-password', { email: resetEmail });
      toast.success('Código de recuperación enviado');
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
      await apiClient.post('/users/send-verification-code', { email: regEmail });
      toast.success('Código de verificación enviado');
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md h-[600px] perspective-[1000px] z-[101]">
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* FRONT: LOGIN */}
              <div
                className="absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-2xl backface-hidden overflow-y-auto scrollbar-hide"
              >
                <div className="p-8 pb-10 flex flex-col justify-center min-h-full relative">
                  <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none">
                    <X size={20} className="text-gray-400" />
                  </button>

                  {frontView === 'login' ? (
                    <>
                      <div className="text-center mt-4 mb-8">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#202A36] mb-2">
                          Bienvenido
                        </h2>
                        <p className="text-gray-500 font-medium text-sm">
                          Ingresa para ver tus compras y favoritos.
                        </p>
                      </div>

                      <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Correo</label>
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                            placeholder="tu@correo.com"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Contraseña</label>
                            <button type="button" onClick={() => setFrontView('forgot_email')} className="text-[9px] font-bold text-[#CAA959] hover:underline uppercase tracking-widest">
                              ¿Olvidaste tu contraseña?
                            </button>
                          </div>
                          <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                            placeholder="••••••••"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full mt-4 py-4 bg-[#202A36] text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#CAA959] transition-all flex items-center justify-center gap-2"
                        >
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Iniciar Sesión'}
                        </button>
                      </form>

                      <p className="mt-8 text-center text-xs font-medium text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <button onClick={() => setIsFlipped(true)} className="text-[#CAA959] font-black uppercase tracking-widest hover:underline ml-1">
                          Regístrate
                        </button>
                      </p>
                    </>
                  ) : frontView === 'forgot_email' ? (
                    <>
                      <div className="text-center mt-4 mb-8">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#202A36] mb-2">
                          Recuperar
                        </h2>
                        <p className="text-gray-500 font-medium text-xs">
                          Te enviaremos un código para restablecerla.
                        </p>
                      </div>

                      <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Correo Electrónico</label>
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                            placeholder="tu@correo.com"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full mt-4 py-4 bg-[#CAA959] text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#202A36] transition-all flex items-center justify-center gap-2"
                        >
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Enviar Código'}
                        </button>
                      </form>
                      
                      <button onClick={() => setFrontView('login')} className="mt-6 text-[10px] font-bold text-gray-400 hover:text-[#202A36] uppercase tracking-widest w-full text-center transition-colors">
                        Volver a iniciar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-center mt-4 mb-8">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#202A36] mb-2">
                          Nueva Contraseña
                        </h2>
                        <p className="text-gray-500 font-medium text-xs">
                          Ingresa el código que enviamos a {resetEmail}
                        </p>
                      </div>

                      <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Código de 4 dígitos</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center tracking-[0.5em] font-black text-xl text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                            placeholder="0000"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nueva Contraseña</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                            placeholder="••••••••"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || resetCode.length !== 4}
                          className="w-full mt-4 py-4 bg-[#CAA959] text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#202A36] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Restablecer Contraseña'}
                        </button>
                      </form>
                      
                      <button onClick={() => setFrontView('login')} className="mt-6 text-[10px] font-bold text-gray-400 hover:text-[#202A36] uppercase tracking-widest w-full text-center transition-colors">
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* BACK: REGISTER */}
              <div
                className="absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-2xl backface-hidden overflow-y-auto scrollbar-hide"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="p-8 pb-10 flex flex-col justify-center min-h-full relative">
                  <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none">
                    <X size={20} className="text-gray-400" />
                  </button>

                  <div className="text-center mt-2 mb-6">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#202A36] mb-1">
                      Crear Cuenta
                    </h2>
                    <p className="text-gray-500 font-medium text-xs">
                      Únete a la elite de Newave.
                    </p>
                  </div>

                  {step === 'form' ? (
                    <form onSubmit={handleSendCode} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                          placeholder="tu@correo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Contraseña</label>
                        <input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                          placeholder="••••••••"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3.5 bg-[#CAA959] text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#202A36] transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Siguiente'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerify} className="flex flex-col gap-3">
                      <p className="text-sm text-gray-600 text-center mb-2">
                        Ingresa el código de 4 dígitos que enviamos a <strong className="text-[#202A36]">{regEmail}</strong>
                      </p>
                      <div className="flex justify-center mt-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          className="w-48 text-center text-3xl tracking-[0.2em] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-black text-black focus:outline-none focus:border-[#CAA959] transition-colors"
                          placeholder="0000"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || verificationCode.length !== 4}
                        className="w-full mt-6 py-3.5 bg-[#CAA959] text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-[#202A36] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Verificar y Crear Cuenta'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setStep('form');
                        }}
                        className="w-full mt-1 py-2 text-gray-400 text-[10px] font-bold uppercase hover:text-[#202A36] transition-colors"
                      >
                        Volver
                      </button>
                    </form>
                  )}

                  {step === 'form' && (
                    <p className="mt-3 text-center text-xs font-medium text-gray-500">
                      ¿Ya tienes cuenta?{' '}
                      <button type="button" onClick={() => setIsFlipped(false)} className="text-[#202A36] font-black uppercase tracking-widest hover:underline ml-1">
                        Inicia Sesión
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
