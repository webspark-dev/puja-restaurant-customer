import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, RESTAURANT_NAME } from '../services/api';
import { useCart } from '../context/CartContext';

export default function Home() {
  const navigate = useNavigate();
  const cartContext = useCart();
  const getItemCount = cartContext?.getItemCount || (() => 0);

  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ============================================
  // Load customer info + orders
  // ============================================
  useEffect(() => {
    const mobile = localStorage.getItem('customerMobile');
    const name = localStorage.getItem('customerName') || '';
    setCustomerName(name);
    setCustomerMobile(mobile || '');

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
  // Logout / Switch User
  // ============================================
  const handleLogout = () => {
  // Clear all customer data
  localStorage.removeItem('customerToken');
  localStorage.removeItem('customerName');
  localStorage.removeItem('customerMobile');

  // Close modal
  setShowLogoutModal(false);

  // 🎯 Force full page reload to home (avoids blank page)
  window.location.href = '/';
};
  const handleSwitchUser = () => {
    setShowLogoutModal(true);
  };

  // ============================================
  // Helpers
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

  const sortedOrders = [...myOrders].sort((a, b) => {
    const aActive = isActiveOrder(a.status) ? 1 : 0;
    const bActive = isActiveOrder(b.status) ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const displayedOrders = sortedOrders.slice(0, 3);

  // Mask mobile (show last 4 digits)
  const maskedMobile = customerMobile
    ? customerMobile.slice(0, 2) + 'XXXX' + customerMobile.slice(-2)
    : '';

  return (
    <div style={{ paddingBottom: '20px' }}>

      {/* ============================================
          HERO SECTION
         ============================================ */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        color: '#fff',
        padding: '40px 20px',
        textAlign: 'center',
        position: 'relative'
      }}>

        {/* 🆕 Logout Button (Top Right) */}
        {customerName && (
          <button
            onClick={handleSwitchUser}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🚪 Logout
          </button>
        )}

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

        {/* 🆕 Welcome with masked mobile */}
        {customerName && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            👋 Welcome, <strong>{customerName}</strong>
            {maskedMobile && (
              <span style={{ opacity: 0.85, marginLeft: '6px' }}>
                ({maskedMobile})
              </span>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
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
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            🍴 Start Ordering →
          </button>

          <button
            onClick={() => navigate('/my-orders')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.6)',
              padding: '12px 28px',
              borderRadius: '30px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            📋 My Orders
          </button>
        </div>
      </div>

      {/* ============================================
          FEATURES
         ============================================ */}
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

      {/* ============================================
          MY ORDERS
         ============================================ */}
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
              📋 Recent Orders
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

            <button
              onClick={() => navigate('/my-orders')}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              View All →
            </button>
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
                  cursor: 'pointer'
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
                        color: '#dc2626'
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
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '8px'
                }}>
                  <span>
                    {order.payment_method === 'cash' ? '💵 Cash' : '📱 UPI'}
                  </span>
                  <span style={{ color: info.color, fontWeight: '700' }}>
                    {isActive ? 'Track →' : 'Details →'}
                  </span>
                </div>
              </div>
            );
          })}

          {myOrders.length > 3 && (
            <button
              onClick={() => navigate('/my-orders')}
              style={{
                width: '100%',
                padding: '14px',
                background: '#f9fafb',
                color: '#dc2626',
                border: '1px dashed #dc2626',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              View All {myOrders.length} Orders →
            </button>
          )}
        </div>
      )}

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

      {/* ============================================
          INFO
         ============================================ */}
      <div style={{
        margin: '0 20px 20px',
        background: '#f0f9ff',
        borderLeft: '4px solid #0ea5e9',
        padding: '14px',
        borderRadius: '10px',
        fontSize: '12px',
        color: '#075985'
      }}>
        💡 <strong>Tip:</strong> আপনার অর্ডার এখানে সেভ থাকবে। 
        "📋 My Orders" ক্লিক করে সব order দেখতে ও bill print করতে পারবেন।
      </div>

      {/* ============================================
          🆕 LOGOUT CONFIRM MODAL
         ============================================ */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '28px 24px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'modalIn 0.25s ease-out'
            }}
          >
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              🚪
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>
              Switch User?
            </h2>

            <p style={{
              fontSize: '13px',
              color: '#666',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}>
              আপনি কি <strong>{customerName}</strong>-এর অ্যাকাউন্ট থেকে Logout করতে চান?
            </p>

            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '13px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ color: '#666' }}>Name</span>
                <span style={{ fontWeight: '700' }}>{customerName}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#666' }}>Mobile</span>
                <span style={{ fontWeight: '700' }}>{maskedMobile}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancel
              </button>

              <button
                onClick={handleLogout}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }}
              >
                🚪 Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}