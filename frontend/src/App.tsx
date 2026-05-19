import React from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import ProductsPage from './pages/ProductsPage';
import SuccessPage from './pages/SuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import FavoritesPage from './pages/FavoritesPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route path="/checkout/success" element={<SuccessPage />} />
        
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/productos" element={<ProductsPage />} />
              <Route path="/productos/:category" element={<ProductsPage />} />
              <Route path="/producto/:id" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/perfil/compras" element={<MyOrdersPage />} />
              <Route path="/perfil/favoritos" element={<FavoritesPage />} />
              <Route path="/perfil/datos" element={<ProfilePage />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
