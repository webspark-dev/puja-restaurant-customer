import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuAPI, RESTAURANT_NAME } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [pauseMessage, setPauseMessage] = useState('');
  const [notifyMobile, setNotifyMobile] = useState('');
  const [notifySent, setNotifySent] = useState(false);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const res = await menuAPI.getMenu();
      setRestaurant(res.data.restaurant);
      setOrderingEnabled(res.data.ordering_enabled);
      setPauseMessage(res.data.pause_message || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (orderingEnabled) {
      navigate('/menu');
    }
  };

  const handleNotify = async () => {
    if (!/^[6-9]\d{9}$/.test(notifyMobile)) {
      alert('সঠিক ১০ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    // TODO: notifyAPI.add(notifyMobile)
    setNotifySent(true);
    setTimeout(() => setNotifySent(false), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #e23744, #b8142a)',
        color: '#fff',
        padding: '40px 24px 32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '12px' }}>🍽️</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px' }}>
          {restaurant?.name || RESTAURANT_NAME}
        </h1>
        <p style={{ fontSize: '14px', opacity: 0.9 }}>
          {restaurant?.tagline || 'Good Food • Happy Mood'}
        </p>
      </div>

      {/* Restaurant Info */}
      <div style={{ padding: '20px 24px' }}>
        {restaurant?.address && (
          <div style={{
            background: '#fafafa',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <span>📍</span>
              <span style={{ fontSize: '13px', color: '#555' }}>
                {restaurant.address}
              </span>
            </div>
            {restaurant.phone && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span>📞</span>
                <span style={{ fontSize: '13px', color: '#555' }}>
                  {restaurant.phone}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <span>{orderingEnabled ? '🟢' : '🔴'}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: orderingEnabled ? '#16a34a' : '#b8142a'
              }}>
                {orderingEnabled ? 'Open for Orders' : 'Currently Closed'}
              </span>
            </div>
          </div>
        )}

        {/* Ordering OFF State */}
        {!orderingEnabled ? (
          <div style={{
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '15px',
              marginBottom: '6px',
              color: '#92400e'
            }}>
              ⚠️ Ordering Paused
            </h3>
            <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '16px' }}>
              {pauseMessage || 'We will be back soon!'}
            </p>

            {!notifySent ? (
              <>
                <input
                  type="tel"
                  placeholder="Your mobile number"
                  value={notifyMobile}
                  onChange={(e) => setNotifyMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e5e5e5',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}
                />
                <button
                  onClick={handleNotify}
                  className="btn btn-primary"
                  style={{ background: '#f59e0b' }}
                >
                  🔔 Notify Me When Open
                </button>
              </>
            ) : (
              <div style={{
                background: '#dcfce7',
                color: '#16a34a',
                padding: '12px',
                borderRadius: '10px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                ✅ We'll notify you!
              </div>
            )}
          </div>
        ) : (
          /* Ordering ON */
          <button
            onClick={handleStart}
            className="btn btn-primary"
            style={{
              padding: '18px',
              fontSize: '16px',
              marginBottom: '16px'
            }}
          >
            🍽️ Start Ordering →
          </button>
        )}

        {/* Info Cards */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            flex: 1,
            background: '#fafafa',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚡</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Fast Service</div>
          </div>
          <div style={{
            flex: 1,
            background: '#fafafa',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>💳</div>
            <div style={{ fontSize: '12px', color: '#666' }}>UPI & Cash</div>
          </div>
          <div style={{
            flex: 1,
            background: '#fafafa',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎫</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Instant Token</div>
          </div>
        </div>
      </div>
    </div>
  );
}
