import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import TopBar from './TopBar';
import CartDrawer from '../cart/CartDrawer';
import { useUIStore } from '../../store/useUIStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isCartOpen, closeCart } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopBar />
      <Navbar />
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
