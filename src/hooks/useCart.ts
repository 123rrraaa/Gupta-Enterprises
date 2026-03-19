import { useState, useEffect } from 'react';
import { CartItem, Product } from '@/types/product';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('water-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('water-cart', JSON.stringify(newCart));
  };

  const getProductId = (product: Product): string | number => {
    return product._id || product.id || '';
  };

  const addToCart = (product: Product) => {
    const productId = getProductId(product);
    const existingItem = cart.find(item => getProductId(item.product) === productId);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        getProductId(item.product) === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedCart);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string | number) => {
    const updatedCart = cart.filter(item => getProductId(item.product) !== productId);
    saveCart(updatedCart);
  };

  const updateQuantity = (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedCart = cart.map(item =>
      getProductId(item.product) === productId ? { ...item, quantity } : item
    );
    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount };
};
