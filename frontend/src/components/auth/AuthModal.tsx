import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';
import { toast } from 'sonner';
import { auth, googleProvider, signInWithPopup } from '../../config/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 1. Mostrar Popup de Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 2. Obtener Token de Firebase
      const idToken = await user.getIdToken();

      // 3. Enviar Token a nuestro Backend para verificar y registrar en MongoDB
      const { data } = await apiClient.post('/users/google-login', { idToken });
      
      // 4. Guardar usuario en Zustand
      login(data);
      toast.success('¡Bienvenido a Newave!');
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Se cerró la ventana de inicio de sesión');
      } else {
        toast.error('Ocurrió un error al iniciar sesión con Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-40%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 w-[90%] max-w-md bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-10 text-center">
              <div className="flex justify-end mb-4">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#202A36] mb-2">
                Únete a Newave
              </h2>
              <p className="text-gray-500 font-medium text-sm mb-8">
                Accede rápidamente para rastrear tus compras y guardar tus favoritos.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-4 bg-white border border-gray-200 shadow-sm text-gray-700 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-3 relative"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-[#CAA959]" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>

              <p className="mt-6 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Solo se admiten correos @gmail.com reales.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
