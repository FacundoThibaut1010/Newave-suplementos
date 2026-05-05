import React from 'react';
import Navbar from './Navbar';
import { FloatingMenu } from './FloatingMenu';
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
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] overflow-x-hidden">
      <TopBar />
      <Navbar />
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
