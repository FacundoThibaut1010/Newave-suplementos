import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { smoothScrollTo } from '../lib/smoothScroll';
import Hero from '../components/home/Hero';
import ProductGrid from '../components/home/ProductGrid';
import CategoryScroll from '../components/home/CategoryScroll';
import BestSellers from '../components/home/BestSellers';

const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        smoothScrollTo(id);
      }, 300); // Wait a bit for layout to settle
      return () => clearTimeout(timer);
    } else {
      smoothScrollTo(0); // al llegar desde otra página ya está arriba (ScrollToTop): no hay recorrido
    }
  }, [location]);

  return (
    <>
      <Hero />
      <CategoryScroll />
      <ProductGrid />
      <BestSellers />


    </>
  );
};

export default HomePage;
