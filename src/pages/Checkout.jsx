import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { customerAPI } from '../services/api';
import LoginModal from '../components/LoginModal';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, orderType, getSubtotal, getGst, getTotal, getItemCount } = useCart();

  const [step, setStep] = useState('details'); // details | otp
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [testModeOtp, setTestModeOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Already logged in?
  const existingToken = localStorage.getItem('customerToken');
  const existingName = localStorage.getItem('customerName');
  const existingMobile = localStorage.getItem('customerMobile');

  // ============================================
  // Send OTP (inline flow)
  // ============================================
  const handleSendOtp = async () => {
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter valid 10-digit mobile');
      return;
    }

    setLoading(true);
    try {
      const res = await customerAPI.sendOtp(name.trim(), mobile);
      setTestModeOtp(res.data.test_otp ? String(res.data.test_otp) : '');
      setDevOtp(res.data.dev_otp || '');
      setOtp(res.data.test_otp ? String(res.data.test_otp) : '');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Verify OTP
  // ============================================
  const handleVerifyOtp = async () => {
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await customerAPI.verifyOtp(mobile, otp);
      localStorage.setItem('customerToken', res.data.token);
      localStorage.setItem('customerName', res.data.customer.name);
      localStorage.setItem('customerMobile', res.data.customer.mobile);

      navigate('/payment/select');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLoggedIn = () => {
    navigate('/payment/select');
  };

  // ============================================
  // Login Modal Success
  // ============================================
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Reload to pick up new login state
    window.location.reload();
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div style={{ paddingBottom: '120px' }}>

      {/* ============================================
          Header with Login Button
         ============================================ */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => step === 'otp' ? setStep('details') : navigate('/cart')}
          style={{ background: 'none', fontSize: '20px', border: 'none', cursor: 'pointer' }}
        >
          ←
        </button>

        <h1 style={{
          fontSize: '18px',
          fontWeight: '800',
          margin: 0,
          flex: 1
        }}>
          {step === 'details' ? 'Checkout' : 'Verify OTP'}
        </h1>

        {/* 🔐 Login / User Button */}
        {existingToken && existingName ? (
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              background: '#dcfce7',
              color: '#16a34a',
              border: '1px solid #16a34a',
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
            👤 {existingName.length > 10
              ? existingName.slice(0, 10) + '...'
              : existingName}
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            🔐 Login
          </button>
        )}
      </div>

      {/* ============================================
          Already Logged In
         ============================================ */}
      {existingToken && existingName && (
        <div style={{ padding: '20px' }}>
          <div style={{
            background: '#dcfce7',
            border: '1px solid #16a34a',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#16a34a',
              marginBottom: '4px'
            }}>
              ✓ Logged in as
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              {existingName}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {existingMobile}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerName');
                localStorage.removeItem('customerMobile');
                window.location.reload();
              }}
              style={{
                background: 'none',
                color: '#e23744',
                fontSize: '12px',
                textDecoration: 'underline',
                marginTop: '8px',
                padding: 0,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Change User
            </button>
          </div>

          <button
            onClick={handleContinueLoggedIn}
            className="btn btn-primary"
          >
            Continue to Payment →
          </button>
        </div>
      )}

      {/* ============================================
          Not Logged In — Details Form
         ============================================ */}
      {!existingToken && step === 'details' && (
        <div style={{ padding: '20px' }}>

          {/* Quick Login Hint */}
          <div style={{
            background: '#f0f9ff',
            borderLeft: '4px solid #0ea5e9',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#075985',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚡ Quick login with OTP</span>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              Open Modal →
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#555',
              marginBottom: '8px'
            }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                border: '1.5px solid #e5e5e5',
                borderRadius: '12px',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#555',
              marginBottom: '8px'
            }}>
              Mobile Number
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666',
                fontSize: '15px'
              }}>
                +91
              </span>
              <input
                type="tel"
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 50px',
                  border: '1.5px solid #e5e5e5',
                  borderRadius: '12px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#b8142a',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Sending...' : 'Send OTP →'}
          </button>
        </div>
      )}

      {/* ============================================
          OTP Step
         ============================================ */}
      {!existingToken && step === 'otp' && (
        <div style={{ padding: '20px' }}>
          <div style={{
            background: '#f0f9ff',
            borderLeft: '4px solid #0ea5e9',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#075985'
          }}>
            📱 OTP sent to +91 {mobile}
          </div>

          {testModeOtp && (
            <div style={{
              background: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              ⚠️ <strong>Test Mode: Use OTP {testModeOtp}</strong>
            </div>
          )}

          {!testModeOtp && devOtp && (
            <div style={{
              background: '#fef3c7',
              borderLeft: '4px solid #f59e0b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              ⚠️ <strong>Dev Mode:</strong> Your OTP is <strong>{devOtp}</strong>
            </div>
          )}

          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: '#555',
            marginBottom: '8px'
          }}>
            Enter 6-digit OTP
          </label>
          <input
            type="tel"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            style={{
              width: '100%',
              padding: '16px',
              border: '1.5px solid #e5e5e5',
              borderRadius: '12px',
              fontSize: '24px',
              letterSpacing: '8px',
              textAlign: 'center',
              fontWeight: '700',
              marginBottom: '16px',
              boxSizing: 'border-box'
            }}
          />

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#b8142a',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Verifying...' : 'Verify & Continue →'}
          </button>

          <button
            onClick={() => { setStep('details'); setOtp(''); setError(''); }}
            style={{
              width: '100%',
              background: 'none',
              color: '#666',
              fontSize: '13px',
              padding: '16px',
              textDecoration: 'underline',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Change mobile number
          </button>
        </div>
      )}

      {/* ============================================
          Order Summary
         ============================================ */}
      <div style={{
        padding: '20px',
        background: '#fafafa',
        borderTop: '1px solid #eee',
        marginTop: '20px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '12px'
        }}>
          Order Summary
        </h3>

        {cart.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            padding: '4px 0',
            color: '#555'
          }}>
            <span>
              {item.name}
              {item.variant_name ? ` (${item.variant_name})` : ''}
              {' × '}
              {item.quantity}
            </span>
            <span>₹{(item.price + (item.addons_total || 0)) * item.quantity}</span>
          </div>
        ))}

        <div style={{
          borderTop: '1px dashed #ccc',
          marginTop: '10px',
          paddingTop: '10px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            padding: '3px 0'
          }}>
            <span>Subtotal</span>
            <span>₹{getSubtotal()}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            padding: '3px 0'
          }}>
            <span>GST (5%)</span>
            <span>₹{getGst()}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: '800',
            paddingTop: '8px',
            borderTop: '1px solid #e5e5e5',
            marginTop: '6px'
          }}>
            <span>Total</span>
            <span>₹{getTotal()}</span>
          </div>
        </div>
      </div>

      {/* ============================================
          Login Modal
         ============================================ */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}