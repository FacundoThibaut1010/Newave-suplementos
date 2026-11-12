import { lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';

// Cada página se descarga recién cuando se visita (el inicio queda en el paquete principal para que abra al instante)
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <Toaster position="bottom-right" richColors />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/checkout/success" element={<SuccessPage />} />
        
        <Route path="/*" element={
          <Layout>
            {/* Suspense interno: al navegar se mantiene el menú y solo cambia el contenido */}
            <Suspense fallback={<PageFallback />}>
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
            </Suspense>
          </Layout>
        } />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
