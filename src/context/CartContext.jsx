import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orderType, setOrderType] = useState('dinein');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item) => {
    setCart(prev => {
      const existing = prev.find(i =>
        i.id === item.id &&
        i.variant_name === item.variant_name &&
        i.spice_level === item.spice_level &&
        JSON.stringify(i.addons) === JSON.stringify(item.addons) &&
        i.special_note === item.special_note
      );

      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, qty) => {
    if (qty <= 0) {
      removeItem(index);
      return;
    }
    setCart(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: qty } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.price + (item.addons_total || 0);
      return sum + (itemPrice * item.quantity);
    }, 0);
  };

  const getGst = () => {
    return Math.round(getSubtotal() * 0.05);
  };

  const getTotal = () => {
    return getSubtotal() + getGst();
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      orderType,
      setOrderType,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getSubtotal,
      getGst,
      getTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}