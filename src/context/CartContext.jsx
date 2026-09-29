import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

// ============================================
// CartProvider
// ============================================
export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState(() => {
    return localStorage.getItem('orderType') || 'dinein';
  });

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('orderType', orderType);
  }, [orderType]);

  // ============================================
  // Add item to cart
  // ============================================
  const addToCart = (item) => {
    setCart(prev => {
      // Check if same item + same variant exists
      const existingIndex = prev.findIndex(
        c => c.id === item.id && c.variant_name === item.variant_name
      );

      if (existingIndex > -1) {
        // Update quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity || 1)
        };
        return updated;
      }

      // Add new item
      return [
        ...prev,
        {
          ...item,
          quantity: item.quantity || 1,
          variant_name: item.variant_name || null,
          variant_price: item.variant_price || item.price,
          price: item.variant_price || item.price
        }
      ];
    });
  };

  // ============================================
  // Remove item from cart
  // ============================================
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================
  // Update quantity
  // ============================================
  const updateQuantity = (index, quantity) => {
    if (quantity < 1) return;
    setCart(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  };

  // ============================================
  // Clear cart
  // ============================================
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  // ============================================
  // Get total items count
  // ============================================
  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  // ============================================
  // Get total price
  // ============================================
  const getTotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.variant_price || item.price || 0;
      return sum + (price * (item.quantity || 1));
    }, 0);
  };

  // ============================================
  // Context value
  // ============================================
  const value = {
    cart,
    orderType,
    setOrderType,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ============================================
// useCart Hook
// ============================================
export function useCart() {
  const context = useContext(CartContext);

  // Safe fallback if used outside provider
  if (!context) {
    console.warn('⚠️ useCart used outside CartProvider — using fallback');
    return {
      cart: [],
      orderType: 'dinein',
      setOrderType: () => {},
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getItemCount: () => 0,
      getTotal: () => 0
    };
  }

  return context;
}

export default CartContext;