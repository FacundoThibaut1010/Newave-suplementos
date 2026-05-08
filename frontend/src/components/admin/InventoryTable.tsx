import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/apiClient';

const InventoryTable = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/admin/products');
      setProducts(data);
    } catch (err) {
      toast.error('No se pudo cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      toast.success('¡Hecho! El producto ya no está en tu vitrina virtual');
      fetchProducts();
    } catch (err) {
      toast.error('Hubo un problema al eliminar');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Inventario</h1>
          <p className="text-gray-400 font-medium">Gestiona tus productos y niveles de stock.</p>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-6 py-4 rounded-3xl font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 transition-transform">
          <Plus size={18} strokeWidth={3} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-premium overflow-hidden border border-gray-50">
        <div className="p-8 border-b border-gray-50 flex gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o categoría..." 
              className="w-full pl-12 pr-4 py-4 bg-[#F4F4F5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 uppercase text-[10px] font-black tracking-widest text-gray-400">
                <th className="px-8 py-6">Producto</th>
                <th className="px-8 py-6">Categoría</th>
                <th className="px-8 py-6">Precio</th>
                <th className="px-8 py-6">Stock</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {products.map((p) => (
                  <motion.tr 
                    layout
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-[#F9F9F9] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                          <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-sm text-black">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase text-gray-500">
                        {p.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-sm text-black">${Number(p.price).toLocaleString('es-AR')}</td>
                    <td className="px-8 py-6">
                      {p.countInStock <= 5 ? (
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle size={16} />
                          <span className="font-bold text-sm">{p.countInStock} unidades</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <PackageCheck size={16} />
                          <span className="font-bold text-sm">{p.countInStock} unidades</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all">
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
