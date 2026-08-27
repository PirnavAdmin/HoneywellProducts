import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { products } from '../data/products';

const CartContext = createContext(null);
const storageKey = 'honey-well-cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      return Array.isArray(stored) ? stored.map((item) => {
        const currentProduct = products.find((product) => product.id === item.id);
        return currentProduct ? { ...item, price: currentProduct.price, priceLabel: currentProduct.priceLabel } : item;
      }) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(items)); }, [items]);

  const addItem = (product, quantity = 1) => setItems((current) => {
    const found = current.find((item) => item.id === product.id);
    if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
    const { id, name, category, productType, image, description, model, availability, price, priceLabel } = product;
    return [...current, { id, name, category, productType, image, description, model, availability, price, priceLabel, quantity }];
  });
  const updateQuantity = (id, quantity) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clearCart = () => setItems([]);

  const value = useMemo(() => ({
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
