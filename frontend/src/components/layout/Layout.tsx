import Navbar from './Navbar';
import Footer from './Footer';
import TopBar from './TopBar';
import CartDrawer from '../cart/CartDrawer';
import { useUIStore } from '../../store/useUIStore';
import { useEffect } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';
import { useHideHeaderOnHero } from '../../hooks/useHideHeaderOnHero';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isCartOpen, closeCart } = useUIStore();
  // En celular, en la home, el menú se esconde mientras se ve el Hero
  const headerHidden = useHideHeaderOnHero();

  useEffect(() => {
    useProductStore.getState().fetchProducts();
    useStoreConfigStore.getState().fetchConfig();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] overflow-x-clip">
      <TopBar hidden={headerHidden} />
      <Navbar hidden={headerHidden} />
      {/* <FloatingMenu /> */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
