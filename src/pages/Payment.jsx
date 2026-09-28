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

  // If orderId exists in URL → this is UPI payment for existing order
  const isOrderPayment = !!orderId;

  const createOrder = async (paymentMethod) => {
    setError('');
    setLoading(true);

    try {
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        variant_name: item.variant_name,
        variant_price: item.variant_price,
        spice_level: item.spice_level,
        addons: item.addons || [],
        addons_total: item.addons_total || 0,
        special_note: item.special_note || ''
      }));

      const res = await orderAPI.create({
        order_type: orderType,
        payment_method: paymentMethod,
        items
      });

      const order = res.data.order;

      if (paymentMethod === 'cash') {
        clearCart();
        navigate(`/cash-pending/${order.id}`);
      } else {
        // UPI — initiate payment
        const payRes = await paymentAPI.initiateUPI(order.id);
        clearCart();
        window.location.href = payRes.data.payment_url;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create order');
      setLoading(false);
    }
  };

  // ==========================
  // Real order payment (UPI)
  // ==========================
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

  // ==========================
  // Payment selection page
  // ==========================
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
          style={{ background: 'none', fontSize: '20px' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>Select Payment</h1>
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
      </div>

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
            textAlign: 'left'
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
            textAlign: 'left'
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
              Creating order...
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