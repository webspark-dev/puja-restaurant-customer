// ============================================
// frontend-customer/src/pages/Tracker.jsx
// 3-Stage View: Pay at Counter → Paid → Full Tracking
// ============================================

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { connectSocket } from '../services/socket';

export default function Tracker() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    const res = await orderAPI.get(orderId);
    return res.data;
  }, [orderId]);

  const updateOrder = useCallback((data) => {
    setOrder(data.order);
    setItems(data.items || data.order?.items || []);
    setHistory(data.history || []);
  }, []);

  const handleLoadError = useCallback((err) => {
    console.error(err);
    alert('Order not found');
    navigate('/');
  }, [navigate]);

  const refreshOrder = useCallback(() => {
    return loadOrder()
      .then(updateOrder)
      .catch(handleLoadError)
      .finally(() => setLoading(false));
  }, [handleLoadError, loadOrder, updateOrder]);

  useEffect(() => {
    loadOrder()
      .then((data) => {
        updateOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        handleLoadError(err);
        setLoading(false);
      });

    const socket = connectSocket();
    socket.emit('track:order', orderId);

    socket.on('order:status', (data) => {
      if (data.order_id === orderId) {
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
        refreshOrder();
      }
    });

    socket.on('order:confirmed', (data) => {
      if (data.order_id === orderId) refreshOrder();
    });

    socket.on('orderUpdate', (data) => {
      if (data.orderId === orderId || data.order_id === orderId) {
        refreshOrder();
      }
    });

    const poll = setInterval(refreshOrder, 15000);

    return () => {
      socket.off('order:status');
      socket.off('order:confirmed');
      socket.off('orderUpdate');
      clearInterval(poll);
    };
  }, [handleLoadError, loadOrder, orderId, refreshOrder, updateOrder]);

  // ============================================
  // Stage definitions
  // ============================================
  const stages = [
    { key: 'placed',    label: 'Order Placed', icon: '✓', match: ['placed'] },
    { key: 'confirmed', label: 'Confirmed',    icon: '✓', match: ['confirmed'] },
    { key: 'preparing', label: 'Preparing',    icon: '👨‍🍳', match: ['preparing'] },
    { key: 'ready',     label: 'Ready',        icon: '🔔', match: ['ready'] },
    { key: 'completed', label: 'Completed',    icon: '✓', match: ['completed'] }
  ];

  const getCurrentIndex = () => {
    if (!order?.status) return -1;
    const flow = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
    return flow.indexOf(order.status);
  };

  const getStageStatus = (idx) => {
    const currentIdx = getCurrentIndex();
    if (idx < currentIdx) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  };

  const getHistoryTime = (status) => {
    const h = history.find(entry => entry.status === status);
    if (!h) return null;
    return new Date(h.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ============================================
  // State Determination
  // ============================================
  const isCash = order?.payment_method === 'cash';
  const isCashPending = isCash && !order?.is_cash_settled;              // Stage 1
  const waitingForBill = isCash && order?.is_cash_settled && !order?.tracking_enabled; // Stage 2
  const isCompleted = order?.status === 'completed';

  // ============================================
  // Loading
  // ============================================
  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading order...</p>
      </div>
    );
  }

  if (!order) return null;

  // ============================================
  // Common Header + Token Card
  // ============================================
  const HeaderSection = () => (
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
        style={{ background: 'none', fontSize: '20px', border: 'none', cursor: 'pointer' }}
      >
        ←
      </button>
      <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Track Order</h1>
    </div>
  );

  const TokenCard = () => (
    <div style={{
      background: 'linear-gradient(135deg, #16a34a, #0e7a37)',
      color: '#fff',
      padding: '30px 20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '12px', opacity: 0.9, letterSpacing: '1px', marginBottom: '6px' }}>
        🎫 YOUR TOKEN NUMBER
      </div>
      <div style={{
        fontSize: '56px',
        fontWeight: '900',
        letterSpacing: '4px',
        marginBottom: '6px'
      }}>
        {order.token || order.token_number || '—'}
      </div>
      <div style={{ fontSize: '12px', opacity: 0.9 }}>
        {order.order_type === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
      </div>
    </div>
  );

  // ============================================
  // STAGE 1: Cash Pending — Pay at Counter
  // ============================================
  if (isCashPending) {
    return (
      <div style={{ paddingBottom: '20px' }}>
        <HeaderSection />
        <TokenCard />

        <div style={{ padding: '24px 20px' }}>
          <div style={{
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '16px',
            borderRadius: '10px',
            color: '#92400e'
          }}>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              💵 Cash Payment Pending
            </strong>
            <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Please pay <strong>₹{order.total || order.total_amount}</strong> at the counter.
              Order will be placed after staff confirms your payment.
            </p>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>Amount to Pay:</span>
            <strong style={{ fontSize: '22px', color: '#dc2626' }}>
              ₹{order.total || order.total_amount}
            </strong>
          </div>

          <button
            onClick={refreshOrder}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '14px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            🔄 Check Payment Status
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // STAGE 2: Payment Confirmed — Waiting for Bill
  // ============================================
  if (waitingForBill) {
    return (
      <div style={{ paddingBottom: '20px' }}>
        <HeaderSection />
        <TokenCard />

        <div style={{ padding: '24px 20px' }}>
          <div style={{
            background: '#dcfce7',
            borderLeft: '4px solid #16a34a',
            padding: '16px',
            borderRadius: '10px',
            color: '#166534'
          }}>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
              ✅ Payment Successful
            </strong>
            <p style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Order Placed! Your token is <strong>{order.token || order.token_number}</strong>.<br />
              📋 Waiting for counter to print your bill...
            </p>
          </div>

          <p style={{
            marginTop: '20px',
            padding: '14px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666',
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            📊 Tracking will start automatically after bill is printed.
          </p>

          <button
            onClick={refreshOrder}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '14px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // STAGE 3: Full Tracking
  // ============================================
  return (
    <div style={{ paddingBottom: '20px' }}>
      <HeaderSection />
      <TokenCard />

      {/* Status Timeline */}
      <div style={{ padding: '24px 20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>
          Order Status
        </h3>

        {stages.map((stage, idx) => {
          const status = getStageStatus(idx);
          const time = getHistoryTime(stage.match[0]);
          const showInProgress = status === 'active' && !isCompleted;

          return (
            <div key={stage.key} style={{
              display: 'flex',
              gap: '14px',
              paddingBottom: idx < stages.length - 1 ? '20px' : 0,
              position: 'relative'
            }}>
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

              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background:
                  status === 'done'   ? '#16a34a' :
                  status === 'active' ? '#e23744' :
                  '#e5e5e5',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                flexShrink: 0,
                zIndex: 1
              }}>
                {status === 'done' ? '✓' : stage.icon}
              </div>

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
                {showInProgress && (
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

        {isCompleted && (
          <div style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            color: '#065f46'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>🎉</div>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
              Order Completed!
            </strong>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Thank you for dining with us!
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div style={{
          background: '#fafafa',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
            Your Items
          </h3>
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              padding: '6px 0'
            }}>
              <span>{item.item_name || item.name} × {item.quantity}</span>
              <span style={{ fontWeight: '600' }}>
                ₹{item.total || (item.price * item.quantity)}
              </span>
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
            <span>₹{order.total || order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: order?.payment_status === 'PAID' || order?.is_cash_settled ? '#dcfce7' : '#fef3c7',
          borderLeft: order?.payment_status === 'PAID' || order?.is_cash_settled ? '4px solid #16a34a' : '4px solid #f59e0b',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '13px',
          color: order?.payment_status === 'PAID' || order?.is_cash_settled ? '#166534' : '#92400e'
        }}>
          {order?.payment_status === 'PAID' || order?.is_cash_settled
            ? '✅ Payment Confirmed'
            : '⏳ Payment Pending'}
        </div>
      </div>

      {/* Cash Bill Note */}
      {isCash && order?.is_cash_settled && (
        <div style={{
          padding: '16px 20px 0',
          color: '#666',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          ℹ️ Your cash bill was printed at the counter.
        </div>
      )}
    </div>
  );
}