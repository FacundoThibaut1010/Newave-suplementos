import React, { lazy } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
const InventoryTable = lazy(() => import('./pages/InventoryTable'));
const StoreSettings = lazy(() => import('./pages/StoreSettings'));
const OrdersTable = lazy(() => import('./pages/OrdersTable'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
import Login from './pages/Login';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { hasValidAdminToken } from './api/apiClient';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-300">
    <h1 className="text-3xl font-black text-black mb-2">{title}</h1>
    <p className="text-sm font-bold uppercase tracking-widest">En desarrollo</p>
  </div>
);

// Componente para proteger las rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // El token lo emite el backend; si no hay o venció, se pide login de nuevo
  const isAuthenticated = hasValidAdminToken();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <ErrorBoundary>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<InventoryTable />} />
          <Route path="analytics" element={<OrdersTable />} />
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
      </ErrorBoundary>
    </>
  );
}

export default App;
