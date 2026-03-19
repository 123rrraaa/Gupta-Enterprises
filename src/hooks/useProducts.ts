import { useState, useEffect } from 'react';
import { Product } from '@/types/product';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          localStorage.setItem('water-products', JSON.stringify(data));
        } else {
          const savedProducts = localStorage.getItem('water-products');
          setProducts(savedProducts ? JSON.parse(savedProducts) : []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        const savedProducts = localStorage.getItem('water-products');
        setProducts(savedProducts ? JSON.parse(savedProducts) : []);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('water-products', JSON.stringify(newProducts));
  };

  return { products, setProducts: updateProducts, loading };
};
