import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Tracker from './pages/Tracker';
import Success from './pages/Success';
import CashPending from './pages/CashPending';
import ItemDetails from './pages/ItemDetails';
import CustomerHistory from './pages/CustomerHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Menu */}
        <Route path="/menu" element={<Menu />} />

        {/* Item Details */}
        <Route path="/item/:itemId" element={<ItemDetails />} />

        {/* Cart */}
        <Route path="/cart" element={<Cart />} />

        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Payment */}
        <Route path="/payment/select" element={<Payment />} />
        <Route path="/payment/:orderId" element={<Payment />} />

        {/* Order Tracking */}
        <Route path="/tracker/:orderId" element={<Tracker />} />
        <Route path="/cash-pending/:orderId" element={<CashPending />} />

        {/* Payment Success */}
        <Route path="/success" element={<Success />} />

        {/* 🆕 Customer Order History */}
        <Route path="/my-orders" element={<CustomerHistory />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;