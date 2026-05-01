import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/apiClient';
import ProductForm from '../components/ProductForm';

const InventoryTable = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

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
    if (!window.confirm('¿Deseas eliminar este producto permanentemente de tu vitrina?')) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      toast.success('¡Excelente! Inventario actualizado.');
      fetchProducts();
    } catch (err) {
      toast.error('Hubo un problema al eliminar.');
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showModal && (
          <ProductForm 
            initialData={editingProduct}
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            onSuccess={fetchProducts}
          />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Inventario</h1>
          <p className="text-gray-400 font-medium tracking-tight">Gestión total de tus productos y stock.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-admin-primary"
        >
          <Plus size={18} strokeWidth={3} />
          Nuevo Producto
        </button>
      </div>

      <div className="card-premium">
        <div className="p-8 border-b border-gray-50 flex gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="input-admin pl-12"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 uppercase text-[10px] font-black tracking-widest text-gray-400">
                <th className="px-8 py-6">Producto</th>
                <th className="px-8 py-6">Stock</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {products.map((p) => (
                  <motion.tr 
                    layout
                    key={p._id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="hover:bg-[#F9F9F9] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={p.images?.[0]} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                        <span className="font-bold text-sm text-black">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {p.countInStock <= 5 ? (
                        <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                          <AlertCircle size={16} />
                          {p.countInStock === 0 ? 'Agotado' : `${p.countInStock} unidades`}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                          <PackageCheck size={16} />
                          {p.countInStock} unidades
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEdit(p)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all"
                        >
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



