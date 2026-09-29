import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { printBill } from '../utils/printBill';

export default function CustomerHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | active | completed
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ============================================
  // Auth check
  // ============================================
  useEffect(() => {
    const mobile = localStorage.getItem('customerMobile');
    if (!mobile) {
      navigate('/checkout');
      return;
    }

    orderAPI
      .customerHistory(mobile, 100)
      .then(res => setOrders(res.data.orders || []))
      .catch(err => console.error('Failed to load history:', err))
      .finally(() => setLoading(false));
  }, [navigate]);

  // ============================================
  // Date grouping helper
  // ============================================
  const getDateGroup = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    if (date >= startOfWeek) return 'This Week';
    if (date >= startOfMonth) return 'This Month';
    return 'Older';
  };

  const getStatusInfo = (status) => {
    const s = String(status || '').toUpperCase();
    const map = {
      PENDING_PAYMENT: { color: '#dc2626', bg: '#fee2e2', label: 'Pay at Counter', icon: '💵' },
      CONFIRMED:       { color: '#b45309', bg: '#fef3c7', label: 'Confirmed',       icon: '✓' },
      PREPARING:       { color: '#1e40af', bg: '#dbeafe', label: 'Preparing',       icon: '👨‍🍳' },
      READY:           { color: '#16a34a', bg: '#dcfce7', label: 'Ready',           icon: '🔔' },
      COMPLETED:       { color: '#374151', bg: '#e5e7eb', label: 'Completed',       icon: '✓' },
      CANCELLED:       { color: '#6b7280', bg: '#f3f4f6', label: 'Cancelled',       icon: '✕' }
    };
    return map[s] || map.CONFIRMED;
  };

  const isActiveOrder = (status) => {
    const s = String(status || '').toUpperCase();
    return ['PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'READY'].includes(s);
  };

  // ============================================
  // Filter + Group orders
  // ============================================
  const filteredOrders = orders.filter(o => {
    const s = String(o.status || '').toUpperCase();
    if (filter === 'active') return isActiveOrder(s);
    if (filter === 'completed') return s === 'COMPLETED';
    return true;
  });

  const grouped = {};
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  filteredOrders.forEach(o => {
    const group = getDateGroup(o.created_at);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(o);
  });

  // ============================================
  // Loading
  // ============================================
  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading history...</p>
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
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            fontSize: '20px',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, flex: 1 }}>
          📋 My Order History
        </h1>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          🏠 Home
        </button>
      </div>

      {/* Summary Card */}
      <div style={{
        margin: '16px 20px',
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        color: '#fff',
        borderRadius: '16px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '6px' }}>
          Total Orders
        </div>
        <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px' }}>
          {orders.length}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span>
            🟢 Active: <strong>{orders.filter(o => isActiveOrder(o.status)).length}</strong>
          </span>
          <span>
            ✅ Completed: <strong>{orders.filter(o => String(o.status).toUpperCase() === 'COMPLETED').length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '0 20px 16px',
        overflowX: 'auto'
      }}>
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'active', label: 'Active', icon: '🟢' },
          { key: 'completed', label: 'Completed', icon: '✅' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              background: filter === f.key ? '#dc2626' : '#fff',
              color: filter === f.key ? '#fff' : '#666',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid #e5e5e5',
              cursor: 'pointer'
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Orders by Date Group */}
      {filteredOrders.length === 0 ? (
        <div style={{
          margin: '0 20px',
          background: '#f9fafb',
          borderRadius: '14px',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '700' }}>
            No orders found
          </p>
          <p style={{ fontSize: '12px' }}>
            আপনার অর্ডার এখানে দেখা যাবে
          </p>
        </div>
      ) : (
        <div style={{ padding: '0 20px' }}>
          {groupOrder.map(groupName => {
            const groupOrders = grouped[groupName];
            if (!groupOrders || groupOrders.length === 0) return null;

            return (
              <div key={groupName} style={{ marginBottom: '24px' }}>
                {/* Date Group Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '800',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    📅 {groupName}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    background: '#e5e7eb'
                  }} />
                  <div style={{
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {groupOrders.length}
                  </div>
                </div>

                {/* Orders in this group */}
                {groupOrders.map(order => {
                  const info = getStatusInfo(order.status);
                  const isActive = isActiveOrder(order.status);
                  const displayTotal = order.total || order.total_amount || 0;
                  const displayToken = order.token || order.token_number || '—';
                  const itemCount = (order.items && order.items.length) || 0;

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: '#fff',
                        borderRadius: '14px',
                        padding: '14px',
                        marginBottom: '10px',
                        borderLeft: `4px solid ${info.color}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Top Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              fontSize: '18px',
                              fontWeight: '900',
                              color: '#dc2626',
                              letterSpacing: '1px'
                            }}>
                              {displayToken}
                            </span>
                            <span style={{
                              background: info.bg,
                              color: info.color,
                              padding: '2px 8px',
                              borderRadius: '20px',
                              fontSize: '10px',
                              fontWeight: '700'
                            }}>
                              {info.icon} {info.label}
                            </span>
                            {isActive && (
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#16a34a',
                                animation: 'pulse 1.5s infinite'
                              }} />
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {new Date(order.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '800',
                            color: '#1a1a1a'
                          }}>
                            ₹{displayTotal}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#666'
                          }}>
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Info Row */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '11px',
                        color: '#666',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #f0f0f0',
                        marginBottom: '10px',
                        flexWrap: 'wrap'
                      }}>
                        <span>
                          {order.payment_method === 'cash' ? '💵 Cash' : '📱 UPI'}
                        </span>
                        <span>
                          {order.order_type === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#f0f0f0',
                            color: '#333',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          👁️ View
                        </button>

                        <button
                          onClick={() => navigate(`/tracker/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: isActive ? '#dc2626' : '#16a34a',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? '📊 Track' : '📊 Details'}
                        </button>

                        {String(order.status).toUpperCase() === 'COMPLETED' && (
                          <button
                            onClick={() => printBill(order)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              color: '#fff',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '700',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                            }}
                          >
                            🖨️ Bill
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onTrack={() => {
            setSelectedOrder(null);
            navigate(`/tracker/${selectedOrder.id}`);
          }}
          onPrint={() => printBill(selectedOrder)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Order Detail Modal
// ============================================
function OrderDetailModal({ order, onClose, onTrack, onPrint }) {
  const info = (() => {
    const s = String(order.status || '').toUpperCase();
    const map = {
      PENDING_PAYMENT: { color: '#dc2626', bg: '#fee2e2', label: 'Pay at Counter' },
      CONFIRMED:       { color: '#b45309', bg: '#fef3c7', label: 'Confirmed' },
      PREPARING:       { color: '#1e40af', bg: '#dbeafe', label: 'Preparing' },
      READY:           { color: '#16a34a', bg: '#dcfce7', label: 'Ready' },
      COMPLETED:       { color: '#374151', bg: '#e5e7eb', label: 'Completed' },
      CANCELLED:       { color: '#6b7280', bg: '#f3f4f6', label: 'Cancelled' }
    };
    return map[s] || map.CONFIRMED;
  })();

  const items = order.items || [];
  const displayToken = order.token || order.token_number || '—';
  const displayTotal = order.total || order.total_amount || 0;
  const isCompleted = String(order.status).toUpperCase() === 'COMPLETED';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '900',
              color: '#dc2626',
              letterSpacing: '2px'
            }}>
              {displayToken}
            </div>
            <div style={{
              display: 'inline-block',
              background: info.bg,
              color: info.color,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              marginTop: '4px'
            }}>
              {info.label}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              fontSize: '24px',
              color: '#666',
              padding: '4px 8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Order ID</span>
            <span style={{ fontWeight: '600' }}>{order.order_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Date</span>
            <span style={{ fontWeight: '600' }}>
              {new Date(order.created_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Type</span>
            <span style={{ fontWeight: '600' }}>
              {order.order_type === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Payment</span>
            <span style={{ fontWeight: '600' }}>
              {order.payment_method === 'cash' ? '💵 Cash' : '📱 UPI'}
            </span>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e5e5'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
              Items
            </h3>
            {items.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                padding: '4px 0'
              }}>
                <span>{item.item_name || item.name} × {item.quantity}</span>
                <span style={{ fontWeight: '600' }}>
                  ₹{item.total || (item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e5e5'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            padding: '4px 0',
            color: '#666'
          }}>
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          {order.gst > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              padding: '4px 0',
              color: '#666'
            }}>
              <span>GST</span>
              <span>₹{order.gst}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '18px',
            fontWeight: '800',
            paddingTop: '8px',
            borderTop: '1px dashed #ccc',
            marginTop: '8px'
          }}>
            <span>Total</span>
            <span>₹{displayTotal}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={onTrack}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            📊 Track
          </button>

          {isCompleted && (
            <button
              onClick={onPrint}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
              }}
            >
              🖨️ Print Bill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}