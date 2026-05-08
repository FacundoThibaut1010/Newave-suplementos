import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import InventoryTable from './pages/InventoryTable';
import StoreSettings from './pages/StoreSettings';
import Login from './pages/Login';
import { Toaster } from 'sonner';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-300">
    <h1 className="text-3xl font-black text-black mb-2">{title}</h1>
    <p className="text-sm font-bold uppercase tracking-widest">En desarrollo</p>
  </div>
);

// Componente para proteger las rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAdminAuth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Placeholder title="Resumen" />} />
          <Route path="inventory" element={<InventoryTable />} />
          <Route path="analytics" element={<Placeholder title="Ventas" />} />
          <Route path="settings" element={<StoreSettings />} />
        </Route>
        
        {/* Redirect for the root /admin if needed, or just let AdminLayout handle base */}
        <Route path="/" element={
           <Link to="/admin" className="p-10 flex flex-col items-center justify-center underline">
             Entrar al Panel de Control
           </Link>
        } />
      </Routes>
    </Router>
    </>
  );
}

export default App;
