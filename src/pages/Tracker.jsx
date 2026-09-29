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

  // ============================================
  // Load Order
  // ============================================
  const loadOrder = useCallback(async () => {
    const res = await orderAPI.get(orderId);
    return res.data;
  }, [orderId]);

  const updateOrder = useCallback((data) => {
    setOrder(data.order);
    setItems(data.items || []);
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

  // ============================================
  // Initial Load + Socket.IO
  // ============================================
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
      if (data.order_id === orderId) {
        refreshOrder();
      }
    });

    // 🚨 NEW: Listen for cash settlement
    socket.on('orderUpdate', (data) => {
      if (data.orderId === orderId || data.order_id === orderId) {
        refreshOrder();
      }
    });

    // Polling fallback every 15s
    const poll = setInterval(refreshOrder, 15000);

    return () => {
      socket.off('order:status');
      socket.off('order:confirmed');
      socket.off('orderUpdate');
      clearInterval(poll);
    };
  }, [handleLoadError, loadOrder, orderId, refreshOrder, updateOrder]);

  // ============================================
  // Stage Definitions (Fixed overlap)
  // ============================================
  const stages = [
    { key: 'order_placed', label: 'Order Placed', icon: '✓', match: ['PENDING_PAYMENT'] },
    { key: 'confirmed',    label: 'Confirmed',    icon: '✓', match: ['CONFIRMED'] },
    { key: 'preparing',    label: 'Preparing',    icon: '👨‍🍳', match: ['PREPARING'] },
    { key: 'ready',        label: 'Ready',        icon: '🔔', match: ['READY'] },
    { key: 'completed',    label: 'Completed',    icon: '✓', match: ['COMPLETED'] }
  ];

  const getCurrentIndex = () => {
    if (!order?.status) return -1;

    // Direct match
    const idx = stages.findIndex(s => s.match.includes(order.status));
    if (idx !== -1) return idx;

    // Fallback: derive from status progression
    const order_status_flow = ['PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
    const statusIdx = order_status_flow.indexOf(order.status);
    if (statusIdx === -1) return 0;

    if (statusIdx === 0) return 0;
    if (statusIdx === 1) return 1;
    if (statusIdx === 2) return 2;
    if (statusIdx === 3) return 3;
    if (statusIdx === 4) return 4;
    return 0;
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // 🚨 CASH LOGIC — Using is_cash_settled flag
  // ============================================
  const isCash = order?.payment_method === 'cash';

  // New flag first, fallback to old logic for backward compatibility
  const isCashPending = isCash && (
    order?.is_cash_settled === false
      ? true
      : (order?.is_cash_settled === undefined
          ? (order?.payment_status !== 'PAID' || !order?.bill_no)
          : false)
  );

  const isCompleted = order?.status === 'COMPLETED';

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading order...</p>
      </div>
    );
  }

  // ============================================
  // 🚨 CASH PENDING VIEW
  // ============================================
  if (isCashPending) {
    const cancelled = order.status === 'CANCELLED';

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

        {/* Token */}
        <div style={{
          background: 'linear-gradient(135deg, #16a34a, #0e7a37)',
          color: '#fff',
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px' }}>
            🎫 YOUR TOKEN
          </div>
          <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '3px' }}>
            {order.token}
          </div>
        </div>

        {/* Cash Pending Message */}
        <div style={{ padding: '24px 20px' }}>
          <div style={{
            background: cancelled ? '#fee2e2' : '#fef3c7',
            borderLeft: cancelled ? '4px solid #dc2626' : '4px solid #f59e0b',
            padding: '16px',
            borderRadius: '10px',
            color: cancelled ? '#991b1b' : '#92400e'
          }}>
            <strong style={{ fontSize: '16px' }}>
              {cancelled ? '❌ Order Cancelled' : '💵 Cash Payment Pending'}
            </strong>
            <p style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '8px' }}>
              {cancelled
                ? 'This order was cancelled before the cash payment was confirmed.'
                : 'Please show your token at the counter. Order tracking will start after staff confirms your cash payment and prints your bill.'}
            </p>
          </div>

          {!cancelled && (
            <>
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#4b5563' }}>
                  Amount to pay:
                </span>
                <strong style={{ fontSize: '20px', color: '#dc2626' }}>
                  ₹{order.total}
                </strong>
              </div>

              <button
                onClick={refreshOrder}
                className="btn btn-primary"
                style={{ marginTop: '16px', width: '100%' }}
              >
                🔄 Check Payment Status
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // NORMAL TRACKING VIEW
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
          const status = getStageStatus(idx);
          const time = getHistoryTime(
            stage.key === 'order_placed' ? 'PENDING_PAYMENT' :
            stage.key === 'confirmed'    ? 'CONFIRMED' :
            stage.key === 'preparing'    ? 'PREPARING' :
            stage.key === 'ready'        ? 'READY' :
            'COMPLETED'
          );

          // ✅ Show "In progress..." ONLY on active stage AND NOT completed
          const showInProgress = status === 'active' && !isCompleted;

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
                zIndex: 1,
                animation: showInProgress ? 'pulse 1.5s infinite' : 'none'
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

        {/* ✅ Completed Banner */}
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

      {/* Order Items */}
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
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
            : '⏳ Payment Pending'}
        </div>
      </div>

      {/* ============================================
          🚨 e-Bill Download — ONLY for online payments
          Cash customers get printed bill from counter
         ============================================ */}
      {order?.payment_status === 'PAID' &&
       order?.bill_no &&
       !isCash && (
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={() => window.open(`/api/payment/bill-public?orderId=${orderId}`, '_blank')}
            className="btn btn-success"
            style={{ width: '100%' }}
          >
            📥 Download e-Bill
          </button>
        </div>
      )}

      {/* Cash bill note */}
      {isCash && order?.payment_status === 'PAID' && (
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