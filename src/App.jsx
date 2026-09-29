import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Tracker from './pages/Tracker';
import CustomerHistory from './pages/CustomerHistory';
import ItemDetails from './pages/ItemDetails';
import Success from './pages/Success';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Menu & Cart */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/item/:itemId" element={<ItemDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* Checkout & Payment */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/select" element={<Payment />} />
          <Route path="/payment/:orderId" element={<Payment />} />

          {/* Order Tracking */}
          <Route path="/tracker/:orderId" element={<Tracker />} />
          <Route path="/success" element={<Success />} />

          {/* Customer Order History */}
          <Route path="/my-orders" element={<CustomerHistory />} />

          {/* 404 fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;