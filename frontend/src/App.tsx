import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import HomePage from './pages/HomePage';

// Cada página es un archivo aparte (el inicio queda en el paquete principal para que abra al instante).
// Después de cargar la home se descargan en segundo plano, así navegar es instantáneo.
const pageLoaders = [
  () => import('./pages/ProductsPage'),
  () => import('./pages/ProductDetailPage'),
  () => import('./pages/CheckoutPage'),
  () => import('./pages/FavoritesPage'),
  () => import('./pages/MyOrdersPage'),
  () => import('./pages/ProfilePage'),
  () => import('./pages/SuccessPage'),
];
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Ocupa toda la pantalla: si fuera bajita, el footer subiría y sería lo primero que se ve
const PageFallback = () => (
  <div className="min-h-[100svh] flex items-center justify-center bg-[#0A0A0B]">
    <div className="w-8 h-8 border-4 border-white/80 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  useEffect(() => {
    const prefetch = () => pageLoaders.forEach((load) => load().catch(() => {}));
    const w = window as any;
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(prefetch, 2500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Router>
      <Toaster position="bottom-right" richColors />
      <ScrollToTop />
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
