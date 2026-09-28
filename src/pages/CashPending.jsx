import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { getSocket, connectSocket } from '../services/socket';

export default function CashPending() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min in seconds
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    loadOrder();

    // WebSocket connect + track
    const socket = connectSocket();
    socket.emit('track:order', orderId);

    // Listen for confirmation
    socket.on('order:confirmed', (data) => {
      if (data.order_id === orderId) {
        setPaid(true);
        setTimeout(() => navigate(`/tracker/${orderId}`), 2000);
      }
    });

    socket.on('order:cancelled', (data) => {
      if (data.order_id === orderId) {
        alert('Order cancelled: ' + (data.reason || 'Cash payment timeout'));
        navigate('/');
      }
    });

    return () => {
      socket.off('order:confirmed');
      socket.off('order:cancelled');
    };
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const loadOrder = async () => {
    try {
      const res = await orderAPI.get(orderId);
      setOrder(res.data.order);
    } catch (err) {
      console.error(err);
      alert('Order not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (paid) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #16a34a, #0e7a37)',
        color: '#fff'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>✓</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
          Payment Received!
        </h1>
        <p style={{ fontSize: '14px', opacity: 0.9 }}>
          Redirecting to tracker...
        </p>
      </div>
    );
  }

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
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>
          Order Created
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ padding: '30px 20px', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '50px',
          margin: '0 auto 24px'
        }}>
          💵
        </div>

        {/* Token */}
        <div style={{
          background: '#fafafa',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#666',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '6px'
          }}>
            🎫 YOUR TOKEN
          </div>
          <div style={{
            fontSize: '44px',
            fontWeight: '900',
            color: '#e23744',
            letterSpacing: '3px'
          }}>
            {order?.token}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            Amount to Pay
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1a1a1a'
          }}>
            ₹{order?.total}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: '#f0f9ff',
          borderLeft: '4px solid #0ea5e9',
          padding: '14px',
          borderRadius: '10px',
          textAlign: 'left',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#075985', marginBottom: '6px' }}>
            📢 Please pay at counter
          </div>
          <div style={{ fontSize: '13px', color: '#075985', lineHeight: 1.5 }}>
            Show this token to our staff. They will collect cash and confirm your order.
          </div>
        </div>

        {/* Countdown Timer */}
        <div style={{
          background: timeLeft < 60 ? '#fee2e2' : '#fef3c7',
          border: timeLeft < 60 ? '2px solid #e23744' : '2px solid #f59e0b',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: timeLeft < 60 ? '#b8142a' : '#92400e',
            marginBottom: '6px'
          }}>
            ⏱️ Time Remaining
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '900',
            color: timeLeft < 60 ? '#b8142a' : '#92400e',
            letterSpacing: '3px',
            fontFamily: 'monospace'
          }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{
            fontSize: '11px',
            color: timeLeft < 60 ? '#b8142a' : '#92400e',
            marginTop: '6px'
          }}>
            {timeLeft < 60
              ? 'Hurry! Order will be cancelled soon'
              : 'Order will auto-cancel after timeout'}
          </div>
        </div>

        {/* Order Details */}
        <div style={{
          background: '#fafafa',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '700',
            marginBottom: '10px',
            color: '#555'
          }}>
            Order Details
          </h3>
          <div style={{ fontSize: '13px', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Order ID</span>
            <span style={{ fontWeight: '600' }}>{order?.order_number}</span>
          </div>
          <div style={{ fontSize: '13px', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Type</span>
            <span style={{ fontWeight: '600' }}>
              {order?.order_type === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
            </span>
          </div>
          <div style={{ fontSize: '13px', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Payment</span>
            <span style={{ fontWeight: '600', color: '#b45309' }}>💵 PENDING</span>
          </div>
        </div>
      </div>
    </div>
  );
}