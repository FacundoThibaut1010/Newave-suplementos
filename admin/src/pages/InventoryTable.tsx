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
import ConfirmModal from '../components/ConfirmModal';
import { useAdminStore } from '../store/useAdminStore';

const InventoryTable = () => {
  const { products, loadingProducts: loading, fetchProducts } = useAdminStore();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiClient.delete(`/admin/products/${productToDelete}`);
      toast.success('¡Excelente! Inventario actualizado.');
      fetchProducts(true);
    } catch (err) {
      toast.error('Hubo un problema al eliminar.');
    } finally {
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (p: any) => {
    const totalStock = (p.variants && p.variants.length > 0)
      ? p.variants.reduce((acc: number, v: any) => acc + (Number(v.countInStock) || 0), 0)
      : (Number(p.countInStock) || 0);

    if (!p.isActive && totalStock <= 0) {
      toast.error('No puedes activar un producto sin stock disponible.');
      return;
    }

    setTogglingId(p._id);
    try {
      await apiClient.put(`/admin/products/${p._id}`, {
        isActive: !p.isActive
      });
      toast.success(p.isActive ? 'Producto desactivado' : 'Producto activado');
      fetchProducts(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setEditingProduct(null);
    }, 350);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter(p => p && p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showModal && (
          <ProductForm
            initialData={editingProduct}
            onClose={handleCloseModal}
            onSuccess={() => fetchProducts(true)}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="input-admin pl-12"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 uppercase text-[10px] font-black tracking-widest text-gray-400">
                <th className="px-4 md:px-8 py-4 md:py-6">Producto</th>
                <th className="px-4 md:px-6 py-4 md:py-6">Estado</th>
                <th className="hidden md:table-cell px-6 py-6">Stock</th>
                <th className="hidden lg:table-cell px-6 py-6">Medidas


                </th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {filteredProducts.map((p: any) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-[#F9F9F9] transition-colors"
                  >
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-2 md:gap-4">
                        <img src={p.images?.[0]} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border border-gray-100" />
                        <div className="flex flex-col">
                          <span className="font-bold text-xs md:text-sm text-black line-clamp-1">{p.name}</span>
                          <span className="text-[10px] md:text-xs font-bold text-gray-500 mt-0.5">${p.price}</span>
                          {/* Stock in mobile */}
                          <div className="md:hidden mt-1">
                            {p.variants && p.variants.length > 0 ? (
                              <div className="flex flex-col gap-1 mt-1">
                                {p.variants.map((v: any, i: number) => (
                                  <span key={i} className={`text-[10px] font-bold ${v.countInStock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                    {v.flavor}: {v.countInStock === 0 ? 'Agotado' : `${v.countInStock} unids`}
                                  </span>
                                ))}
                              </div>
                            ) : p.countInStock <= 5 ? (
                              <span className="text-[10px] text-red-500 font-bold">{p.countInStock === 0 ? 'Agotado' : `${p.countInStock} unids`}</span>
                            ) : (
                              <span className="text-[10px] text-green-600 font-bold">{p.countInStock} unids</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-6">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        disabled={togglingId === p._id}
                        title={p.isActive ? 'Clic para desactivar' : 'Clic para activar'}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span>{p.isActive ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>
                    <td className="hidden md:table-cell px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                        {p.variants && p.variants.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {p.variants.map((v: any, i: number) => (
                              <div key={i} className={`flex items-start gap-2 text-xs md:text-sm font-bold ${v.countInStock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                <span className="shrink-0 mt-0.5">
                                  {v.countInStock <= 5 ? <AlertCircle size={15} /> : <PackageCheck size={15} />}
                                </span>
                                <span className="leading-tight">
                                  <span className="text-gray-500 font-medium mr-1">{v.flavor}:</span>
                                  <span className="whitespace-nowrap">{v.countInStock === 0 ? 'Agotado' : `${v.countInStock} unidades`}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : p.countInStock <= 5 ? (
                          <div className="flex items-start gap-2 text-red-500 font-bold text-sm">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <span>{p.countInStock === 0 ? 'Agotado' : `${p.countInStock} unidades`}</span>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 text-green-600 font-bold text-sm">
                            <PackageCheck size={15} className="shrink-0 mt-0.5" />
                            <span>{p.countInStock} unidades</span>
                          </div>
                        )}
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">
                          {p.displaySection === 'Producto' && p.category ? `Producto • ${p.category}` : p.displaySection}
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-6">
                      <div className="flex flex-col text-xs font-bold text-gray-700">
                        <span>{p.weightInGrams || 500}g</span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {p.height || 15} x {p.width || 15} x {p.length || 15} cm
                        </span>
                        {p.hasCustomDimensions === false && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 w-fit">
                            ⚠️ Medidas por defecto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => confirmDelete(p._id)}
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
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="¿Eliminar Producto?"
        message="¿Deseas eliminar este producto permanentemente de tu catálogo? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default InventoryTable;



