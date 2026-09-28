import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    orderType,
    setOrderType,
    removeItem,
    updateQuantity,
    getSubtotal,
    getGst,
    getTotal,
    getItemCount
  } = useCart();

  if (cart.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ padding: '80px 20px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🛒</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Cart is Empty</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
            Add items to get started
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="btn btn-primary"
            style={{ maxWidth: '300px', margin: '0 auto' }}
          >
            🍽️ Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '120px' }}>
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/menu')}
          style={{ background: 'none', fontSize: '20px', color: '#333' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '800' }}>
          My Cart ({getItemCount()})
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {cart.map((item, index) => {
          const itemUnitPrice = item.price + (item.addons_total || 0);
          const itemTotal = itemUnitPrice * item.quantity;

          return (
            <div key={index} style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '12px',
              marginTop: '12px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                    {item.name}
                  </h3>

                  {item.variant_name && (
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                      Size: {item.variant_name}
                    </div>
                  )}

                  {item.spice_level && (
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                      Spice: {item.spice_level}
                    </div>
                  )}

                  {item.addons && item.addons.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                      + {item.addons.map(a => a.name).join(', ')}
                    </div>
                  )}

                  {item.special_note && (
                    <div style={{
                      fontSize: '11px',
                      color: '#b45309',
                      fontStyle: 'italic',
                      marginTop: '4px'
                    }}>
                      📝 {item.special_note}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeItem(index)}
                  style={{
                    background: 'none',
                    color: '#e23744',
                    fontSize: '18px',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px'
              }}>
                <div style={{
                  background: '#e23744',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    style={{
                      background: 'none',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: '700',
                      width: '22px',
                      lineHeight: 1
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '15px',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    style={{
                      background: 'none',
                      color: '#fff',
                      fontSize: '18px',
                      fontWeight: '700',
                      width: '22px',
                      lineHeight: 1
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ fontSize: '16px', fontWeight: '800' }}>
                  ₹{itemTotal}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>
          Order Type
        </h3>
        <div style={{
          display: 'flex',
          gap: '10px',
          background: '#f0f0f0',
          borderRadius: '12px',
          padding: '4px'
        }}>
          <button
            onClick={() => setOrderType('dinein')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: orderType === 'dinein' ? '#fff' : 'transparent',
              color: orderType === 'dinein' ? '#e23744' : '#666',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: orderType === 'dinein' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            🍽️ Dine-in
          </button>
          <button
            onClick={() => setOrderType('takeaway')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: orderType === 'takeaway' ? '#fff' : 'transparent',
              color: orderType === 'takeaway' ? '#e23744' : '#666',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: orderType === 'takeaway' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            🥡 Takeaway
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#fafafa',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            padding: '6px 0'
          }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span style={{ fontWeight: '600' }}>₹{getSubtotal()}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            padding: '6px 0'
          }}>
            <span style={{ color: '#666' }}>GST (5%)</span>
            <span style={{ fontWeight: '600' }}>₹{getGst()}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            padding: '12px 0 0',
            marginTop: '6px',
            borderTop: '1px dashed #ccc',
            fontWeight: '800'
          }}>
            <span>Total</span>
            <span>₹{getTotal()}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <button
          onClick={() => navigate('/menu')}
          className="btn btn-secondary"
        >
          + Add More Items
        </button>
      </div>

      <div
        onClick={() => navigate('/checkout')}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '480px',
          width: '100%',
          background: '#e23744',
          color: '#fff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          zIndex: 60
        }}
      >
        <div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            {getItemCount()} items
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>
            ₹{getTotal()}
          </div>
        </div>
        <div style={{ fontWeight: '700', fontSize: '15px' }}>
          Checkout →
        </div>
      </div>
    </div>
  );
}