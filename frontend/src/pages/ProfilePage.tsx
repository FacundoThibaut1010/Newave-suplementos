import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/apiClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dni: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        dni: user.dni || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cpDatabase: Record<string, { city: string; state: string }> = {
    '1714': { city: 'Ituzaingó', state: 'Buenos Aires' },
    '1708': { city: 'Morón', state: 'Buenos Aires' },
    '1704': { city: 'Ramos Mejía', state: 'Buenos Aires' },
    '1706': { city: 'Haedo', state: 'Buenos Aires' },
    '1712': { city: 'Castelar', state: 'Buenos Aires' },
    '1722': { city: 'Merlo', state: 'Buenos Aires' },
    '1425': { city: 'Palermo', state: 'CABA' },
    '1414': { city: 'Villa Crespo', state: 'CABA' },
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value;
    setFormData(prev => ({ ...prev, zipCode: cp }));

    if (cpDatabase[cp]) {
      setFormData(prev => ({
        ...prev,
        city: cpDatabase[cp].city,
        state: cpDatabase[cp].state
      }));
      toast.success(`Ubicación detectada: ${cpDatabase[cp].city}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await apiClient.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
        dni: formData.dni,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      });
      login(data);
      toast.success('Perfil actualizado correctamente');
      setTimeout(() => {
        navigate(-1);
      }, 500);
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] pt-40 md:pt-48 pb-20 flex items-center justify-center">
        <p className="text-gray-500 font-bold">Por favor inicia sesión para ver tu perfil.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] pt-40 md:pt-40 pb-20">
      {/* Compu: resumen de la cuenta a la izquierda y formulario ancho a la derecha · Celular: apilado */}
      <div className="max-w-3xl lg:max-w-[1200px] mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        <aside className="hidden lg:flex flex-col bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 sticky top-36">
          <div className="w-16 h-16 rounded-full bg-[#111214] text-white flex items-center justify-center text-xl font-black mb-4">
            {(user.name || user.email || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <p className="text-lg font-black text-[#111214] leading-tight break-words">{user.name || 'Mi cuenta'}</p>
          <p className="text-sm text-gray-500 break-all mt-1">{user.email}</p>
          <nav className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-1">
            <Link to="/perfil/datos" className="px-4 py-3 rounded-xl text-sm font-bold bg-gray-50 text-[#111214]">Mis datos</Link>
            <Link to="/perfil/compras" className="px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-[#111214] hover:bg-gray-50 transition-colors">Mis compras</Link>
            <Link to="/perfil/favoritos" className="px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-[#111214] hover:bg-gray-50 transition-colors">Favoritos</Link>
          </nav>
        </aside>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-gray-100"
        >
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-[#111214] mb-2">Mi Perfil</h1>
            <p className="text-gray-500 text-sm font-medium">Actualiza tus datos para agilizar tus compras.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#111214]">Datos personales</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Celular</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#111214] mb-6">Dirección de Envío Principal</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Calle y Número</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Provincia</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Código Postal</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handlePostalCodeChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:border-[#1C86C8] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-10 py-4 bg-[#111214] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#1C86C8] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
