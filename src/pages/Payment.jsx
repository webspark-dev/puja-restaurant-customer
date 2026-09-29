import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI, paymentAPI } from '../services/api';

export default function Payment() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { cart, orderType, getTotal, getItemCount, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOrderPayment = !!orderId;

  // ============================================
  // 🔑 Build Complete Order Payload
  // ============================================
  const buildOrderPayload = (paymentMethod) => {
    // Customer info from localStorage (saved at Checkout)
    const customer_name =
      localStorage.getItem('customerName') ||
      localStorage.getItem('customer_name') ||
      '';

    const customer_mobile =
      localStorage.getItem('customerMobile') ||
      localStorage.getItem('customer_mobile') ||
      '';

    const total_amount = getTotal();

    // Validation
    if (!customer_name.trim()) {
      alert('❌ Please enter your name. Redirecting to checkout...');
      navigate('/checkout');
      return null;
    }

    if (!customer_mobile || customer_mobile.length < 10) {
      alert('❌ Please enter a valid mobile number. Redirecting to checkout...');
      navigate('/checkout');
      return null;
    }

    if (!cart || cart.length === 0) {
      alert('❌ Your cart is empty');
      navigate('/cart');
      return null;
    }

    if (!total_amount || total_amount <= 0) {
      alert('❌ Invalid total amount');
      return null;
    }

    // Build items array
    const items = cart.map(item => ({
      item_id: item.id || item.item_id,
      item_name: item.name || item.item_name,
      quantity: item.quantity,
      price: item.variant_price || item.price,
      total: (item.variant_price || item.price) * item.quantity,
      variant_name: item.variant_name || null,
      spice_level: item.spice_level || null,
      addons: item.addons || [],
      special_note: item.special_note || ''
    }));

    return {
      customer_name: customer_name.trim(),
      customer_mobile: customer_mobile.trim(),
      total_amount,
      items,
      payment_method: paymentMethod,
      order_type: orderType || 'dinein'
    };
  };

  // ============================================
  // Create Order
  // ============================================
  const createOrder = async (paymentMethod) => {
    setError('');
    setLoading(true);

    try {
      const payload = buildOrderPayload(paymentMethod);

      if (!payload) {
        setLoading(false);
        return;
      }

      console.log('📤 Order payload:', payload);

      const res = await orderAPI.create(payload);
      const order = res.data.order;

      if (paymentMethod === 'cash') {
        // ✅ Cash flow: Redirect to Tracker (cash pending view)
        clearCart();
        navigate(`/tracker/${order.id}`);
      } else {
        // ============================================
        // 📱 UPI FLOW
        // ============================================
        clearCart();

        // 🎯 Detect dev/sandbox — use mock payment directly
        const isSandbox =
          import.meta.env.DEV ||
          import.meta.env.VITE_ENV === 'sandbox' ||
          window.location.hostname === 'localhost' ||
          window.location.hostname.includes('vercel.app'); // 🚧 For testing on live

        if (isSandbox) {
          // 🎯 Mock payment: mark order as paid directly
          console.log('🎯 Mock payment mode — auto-confirming order');

          try {
            await paymentAPI.mockSuccess(order.id);
            console.log('✅ Mock payment success');
            navigate(`/tracker/${order.id}`);
          } catch (mockErr) {
            console.error('❌ Mock payment failed:', mockErr);
            // Fallback: navigate to tracker anyway (order exists)
            navigate(`/tracker/${order.id}`);
          }
        } else {
          // Production UPI flow
          const payRes = await paymentAPI.initiateUPI(order.id);
          const redirectUrl = payRes.data.payment_url || payRes.data.redirect_url;

          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            navigate(`/tracker/${order.id}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ Order create error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create order';
      setError(errMsg);
      setLoading(false);
    }
  };

  // ============================================
  // UPI Redirect Loader
  // ============================================
  if (isOrderPayment) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>
          Redirecting to payment...
        </p>
      </div>
    );
  }

  // ============================================
  // Payment Selection UI
  // ============================================
  return (
    <div style={{ paddingBottom: '20px' }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/checkout')}
          style={{ background: 'none', fontSize: '20px', border: 'none', cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Select Payment</h1>
      </div>

      {/* Amount */}
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
          Amount to Pay
        </div>
        <div style={{
          fontSize: '40px',
          fontWeight: '800',
          color: '#e23744'
        }}>
          ₹{getTotal()}
        </div>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
          {getItemCount()} item{getItemCount() > 1 ? 's' : ''}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: '0 20px 16px',
          background: '#fee2e2',
          color: '#b8142a',
          padding: '12px',
          borderRadius: '10px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* Payment Options */}
      <div style={{ padding: '0 20px' }}>

        {/* UPI */}
        <button
          onClick={() => createOrder('upi')}
          disabled={loading}
          style={{
            width: '100%',
            background: '#fff',
            border: '2px solid #e5e5e5',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '12px',
            textAlign: 'left',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          <div style={{ fontSize: '32px' }}>📱</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
              Pay via UPI
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              GPay / PhonePe / Paytm / BHIM
            </div>
          </div>
          <div style={{ fontSize: '20px', color: '#e23744' }}>→</div>
        </button>

        {/* Cash */}
        <button
          onClick={() => createOrder('cash')}
          disabled={loading}
          style={{
            width: '100%',
            background: '#fff',
            border: '2px solid #e5e5e5',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textAlign: 'left',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          <div style={{ fontSize: '32px' }}>💵</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
              Pay with Cash
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Pay at counter after getting token
            </div>
          </div>
          <div style={{ fontSize: '20px', color: '#e23744' }}>→</div>
        </button>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div className="loader"></div>
            <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
              {loading ? 'Creating order...' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        margin: '24px 20px 0',
        background: '#f0f9ff',
        borderLeft: '4px solid #0ea5e9',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#075985'
      }}>
        💡 You'll get a token after payment confirmation
      </div>
    </div>
  );
}