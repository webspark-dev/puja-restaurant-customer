import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../services/api';
import { getSocket, connectSocket } from '../services/socket';

export default function Tracker() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();

    const socket = connectSocket();
    socket.emit('track:order', orderId);

    socket.on('order:status', (data) => {
      if (data.order_id === orderId) {
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
        loadOrder(); // Reload for updated history
      }
    });

    socket.on('order:confirmed', (data) => {
      if (data.order_id === orderId) {
        loadOrder();
      }
    });

    return () => {
      socket.off('order:status');
      socket.off('order:confirmed');
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await orderAPI.get(orderId);
      setOrder(res.data.order);
      setItems(res.data.items || []);
      setHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      alert('Order not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { key: 'order_placed', label: 'Order Placed', icon: '✓', match: ['PENDING_PAYMENT', 'CONFIRMED'] },
    { key: 'confirmed', label: 'Confirmed', icon: '✓', match: ['CONFIRMED'] },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', match: ['PREPARING'] },
    { key: 'ready', label: 'Ready', icon: '🔔', match: ['READY'] },
    { key: 'completed', label: 'Completed', icon: '✓', match: ['COMPLETED'] }
  ];

  const getStageStatus = (stage, idx) => {
    const currentStatus = order?.status;
    const currentIdx = stages.findIndex(s => s.match.includes(currentStatus));
    
    if (idx < currentIdx) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  };

  const getHistoryTime = (status) => {
    const h = history.find(entry => entry.status === status);
    if (!h) return null;
    return new Date(h.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading order...</p>
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
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', fontSize: '20px' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>Track Order</h1>
      </div>

      {/* Token Card */}
      <div style={{
        background: 'linear-gradient(135deg, #16a34a, #0e7a37)',
        color: '#fff',
        padding: '30px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '12px', opacity: 0.9, letterSpacing: '1px', marginBottom: '6px' }}>
          🎫 YOUR TOKEN
        </div>
        <div style={{
          fontSize: '48px',
          fontWeight: '900',
          letterSpacing: '3px',
          marginBottom: '6px'
        }}>
          {order?.token}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {order?.order_type === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
        </div>
      </div>

      {/* Status Timeline */}
      <div style={{ padding: '24px 20px' }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '700',
          marginBottom: '16px'
        }}>
          Order Status
        </h3>

        {stages.map((stage, idx) => {
          const status = getStageStatus(stage, idx);
          const time = getHistoryTime(
            stage.key === 'order_placed' ? 'PENDING_PAYMENT' :
            stage.key === 'confirmed' ? 'CONFIRMED' :
            stage.key === 'preparing' ? 'PREPARING' :
            stage.key === 'ready' ? 'READY' :
            'COMPLETED'
          );

          return (
            <div key={stage.key} style={{
              display: 'flex',
              gap: '14px',
              paddingBottom: idx < stages.length - 1 ? '20px' : 0,
              position: 'relative'
            }}>
              {/* Connector */}
              {idx < stages.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '15px',
                  top: '32px',
                  width: '2px',
                  height: 'calc(100% - 10px)',
                  background: status === 'done' ? '#16a34a' : '#e5e5e5'
                }} />
              )}

              {/* Circle */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background:
                  status === 'done' ? '#16a34a' :
                  status === 'active' ? '#e23744' :
                  '#e5e5e5',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                flexShrink: 0,
                zIndex: 1,
                animation: status === 'active' ? 'pulse 1.5s infinite' : 'none'
              }}>
                {status === 'done' ? '✓' : stage.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, paddingTop: '4px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: status === 'pending' ? '400' : '700',
                  color: status === 'pending' ? '#999' : '#1a1a1a',
                  marginBottom: '2px'
                }}>
                  {stage.label}
                </div>
                {time && (
                  <div style={{ fontSize: '12px', color: '#666' }}>{time}</div>
                )}
                {status === 'active' && (
                  <div style={{
                    fontSize: '12px',
                    color: '#e23744',
                    fontWeight: '600',
                    marginTop: '2px'
                  }}>
                    ● In progress...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Items */}
      <div style={{
        padding: '0 20px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: '#fafafa',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '700',
            marginBottom: '12px'
          }}>
            Your Items
          </h3>
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              padding: '6px 0'
            }}>
              <span>{item.item_name} × {item.quantity}</span>
              <span style={{ fontWeight: '600' }}>₹{item.total}</span>
            </div>
          ))}
          <div style={{
            borderTop: '1px dashed #ccc',
            marginTop: '10px',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: '800'
          }}>
            <span>Total</span>
            <span>₹{order?.total}</span>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: order?.payment_status === 'PAID' ? '#dcfce7' : '#fef3c7',
          borderLeft: order?.payment_status === 'PAID' ? '4px solid #16a34a' : '4px solid #f59e0b',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '13px',
          color: order?.payment_status === 'PAID' ? '#166534' : '#92400e'
        }}>
          {order?.payment_status === 'PAID'
            ? '✅ Payment Confirmed'
            : '⏳ Payment Pending — Please pay at counter'}
        </div>
      </div>

      {/* Download Bill (if PAID) */}
      {order?.payment_status === 'PAID' && order?.bill_no && (
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={() => window.open(`/api/payment/bill-public?orderId=${orderId}`, '_blank')}
            className="btn btn-success"
          >
            📥 Download e-Bill
          </button>
        </div>
      )}
    </div>
  );
}