import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, RESTAURANT_NAME } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Home() {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const [myOrders, setMyOrders] = useState([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerName, setCustomerName] = useState('');

  // ============================================
  // Load customer info + orders
  // ============================================
  useEffect(() => {
    const mobile = localStorage.getItem('customerMobile');
    const name = localStorage.getItem('customerName') || '';
    setCustomerName(name);

    if (!mobile) return;

    setLoadingOrders(true);
    orderAPI
      .customerHistory(mobile, 20)
      .then((res) => {
        setMyOrders(res.data.orders || []);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
      })
      .finally(() => setLoadingOrders(false));
  }, []);

  // ============================================
  // Helper: Status info
  // ============================================
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

  // Sort: active first, then by date
  const sortedOrders = [...myOrders].sort((a, b) => {
    const aActive = isActiveOrder(a.status) ? 1 : 0;
    const bActive = isActiveOrder(b.status) ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const displayedOrders = showAllOrders ? sortedOrders : sortedOrders.slice(0, 3);

  return (
    <div style={{ paddingBottom: '20px' }}>

      {/* HERO SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        color: '#fff',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🍽️</div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '900',
          letterSpacing: '1px',
          marginBottom: '4px'
        }}>
          {RESTAURANT_NAME || 'PUJA RESTAURANT'}
        </h1>
        <p style={{
          fontSize: '13px',
          opacity: 0.9,
          marginBottom: '20px'
        }}>
          Good Food • Happy Mood
        </p>

        {customerName && (
          <p style={{
            fontSize: '14px',
            opacity: 0.95,
            marginBottom: '16px'
          }}>
            👋 Welcome, <strong>{customerName}</strong>
          </p>
        )}

        <button
          onClick={() => navigate('/menu')}
          style={{
            background: '#fff',
            color: '#dc2626',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🍴 Start Ordering →
        </button>
      </div>

      {/* FEATURE CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        padding: '20px'
      }}>
        {[
          { icon: '⚡', title: 'Fast', sub: 'Service' },
          { icon: '💳', title: 'UPI', sub: '& Cash' },
          { icon: '🎫', title: 'Instant', sub: 'Token' }
        ].map((item, i) => (
          <div key={i} style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '16px 12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* MY ORDERS SECTION */}
      {loadingOrders && (
        <div style={{
          padding: '30px 20px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div className="loader"></div>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>Loading orders...</p>
        </div>
      )}

      {!loadingOrders && myOrders.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '800',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1a1a1a'
            }}>
              📋 My Orders
              <span style={{
                background: '#dc2626',
                color: '#fff',
                borderRadius: '20px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {myOrders.length}
              </span>
            </h2>

            {myOrders.length > 3 && (
              <button
                onClick={() => setShowAllOrders(!showAllOrders)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {showAllOrders ? 'Show Less' : 'View All →'}
              </button>
            )}
          </div>

          {displayedOrders.map((order) => {
            const info = getStatusInfo(order.status);
            const isActive = isActiveOrder(order.status);
            const displayTotal = order.total || order.total_amount || 0;
            const displayToken = order.token || order.token_number || '—';
            const itemCount = (order.items && order.items.length) || 0;

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/tracker/${order.id}`)}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '10px',
                  borderLeft: `4px solid ${info.color}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
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
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </span>

                      {isActive && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#16a34a',
                          animation: 'pulse 1.5s infinite',
                          display: 'inline-block'
                        }} />
                      )}
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: '#666'
                    }}>
                      {new Date(order.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div style={{
                    textAlign: 'right',
                    marginLeft: '12px'
                  }}>
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
                      {order.order_type === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
                    </div>
                  </div>
                </div>

                {isActive && (order.tracking_enabled || order.payment_method !== 'cash') && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '10px',
                    marginBottom: '8px'
                  }}>
                    {['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].map((s, i) => {
                      const statusOrder = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
                      const currentIdx = statusOrder.indexOf(
                        String(order.status).toUpperCase()
                      );
                      const isDone = i <= currentIdx;
                      return (
                        <div
                          key={s}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: isDone ? '#16a34a' : '#e5e7eb',
                            transition: 'background 0.3s'
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span>
                    {itemCount} item{itemCount !== 1 ? 's' : ''} •{' '}
                    {order.payment_method === 'cash' ? '💵 Cash' : '📱 UPI'}
                  </span>
                  <span style={{
                    color: info.color,
                    fontWeight: '700'
                  }}>
                    {isActive ? 'Track →' : 'Details →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loadingOrders && myOrders.length === 0 && (
        <div style={{
          margin: '0 20px 20px',
          background: '#f9fafb',
          borderRadius: '14px',
          padding: '30px 20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          No orders yet. Start ordering!
        </div>
      )}

      {/* INFO SECTION */}
      <div style={{
        margin: '0 20px 20px',
        background: '#f0f9ff',
        borderLeft: '4px solid #0ea5e9',
        padding: '14px',
        borderRadius: '10px',
        fontSize: '12px',
        color: '#075985'
      }}>
        💡 <strong>Tip:</strong> আপনার অর্ডার এখানে সেভ থাকবে। ক্লিক করে ট্র্যাকিং দেখতে পারবেন।
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}