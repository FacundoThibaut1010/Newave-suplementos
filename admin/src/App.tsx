import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import InventoryTable from './pages/InventoryTable';
import StoreSettings from './pages/StoreSettings';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-300">
    <h1 className="text-3xl font-black text-black mb-2">{title}</h1>
    <p className="text-sm font-bold uppercase tracking-widest">En desarrollo</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
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
  );
}

export default App;
