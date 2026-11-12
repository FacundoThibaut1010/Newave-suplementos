import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import apiClient, { ADMIN_TOKEN_KEY } from '../api/apiClient';

// El usuario y la contraseña se validan en el backend (ADMIN_USER / ADMIN_PASSWORD), nunca acá.

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await apiClient.post('/admin/login', { username, password });
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.removeItem('isAdminAuth'); // marca vieja, ya no se usa
      toast.success('¡Bienvenido de nuevo!');
      // Recargamos en la ruta del panel (relativa, funciona aunque el admin esté en una subcarpeta)
      window.location.hash = '#/admin';
    } catch (err: any) {
      const status = err.response?.status;
      toast.error(
        status === 401 ? 'Usuario o contraseña incorrectos.'
          : err.response?.data?.message || 'No se pudo conectar con el servidor.'
      );
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/20">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tighter">Acceso Restringido</h1>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mt-2">Panel de Administración</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#F8F9FA] text-black rounded-2xl py-4 pl-12 pr-4 border border-gray-100 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder-gray-400 font-medium"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F8F9FA] text-black rounded-2xl py-4 pl-12 pr-4 border border-gray-100 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-full py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-black/90 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                Entrar al sistema
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
