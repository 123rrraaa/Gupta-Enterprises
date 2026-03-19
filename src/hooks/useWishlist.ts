import { useState, useEffect } from 'react';
import { Product } from '@/types/product';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('water-wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  const saveWishlist = (newWishlist: Product[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('water-wishlist', JSON.stringify(newWishlist));
  };

  const getProductId = (product: Product): string | number => {
    return product._id || product.id || '';
  };

  const addToWishlist = (product: Product) => {
    const productId = getProductId(product);
    if (!wishlist.find(item => getProductId(item) === productId)) {
      saveWishlist([...wishlist, product]);
    }
  };

  const removeFromWishlist = (productId: string | number) => {
    const updatedWishlist = wishlist.filter(item => getProductId(item) !== productId);
    saveWishlist(updatedWishlist);
  };

  const isInWishlist = (productId: string | number) => {
    return wishlist.some(item => getProductId(item) === productId);
  };

  const toggleWishlist = (product: Product) => {
    const productId = getProductId(product);
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  return { wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist };
};
