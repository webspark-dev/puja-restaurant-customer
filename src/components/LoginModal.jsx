import { useState } from 'react';
import { customerAPI } from '../services/api';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testOtp, setTestOtp] = useState('');

  if (!isOpen) return null;

  // Reset when opened
  const resetAndClose = () => {
    setStep('mobile');
    setName('');
    setMobile('');
    setOtp('');
    setError('');
    setTestOtp('');
    onClose();
  };

  // ============================================
  // Send OTP
  // ============================================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(0, 10);
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const res = await customerAPI.sendOtp(name.trim(), cleanMobile);
      console.log('📤 OTP sent response:', res.data);

      // Check if test OTP returned (dev mode)
      if (res.data?.test_otp) {
        setTestOtp(res.data.test_otp);
      } else if (res.data?.otp) {
        setTestOtp(res.data.otp);
      }

      setMobile(cleanMobile);
      setStep('otp');
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to send OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Verify OTP
  // ============================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const res = await customerAPI.verifyOtp(mobile, otp);
      console.log('✅ Verify response:', res.data);

      const data = res.data;

      // Save login info
      const token = data.token || data.customerToken || `token-${Date.now()}`;
      const customerName = data.customer?.name || name;
      const customerMobile = data.customer?.mobile || mobile;

      localStorage.setItem('customerToken', token);
      localStorage.setItem('customerName', customerName);
      localStorage.setItem('customerMobile', customerMobile);

      setLoading(false);

      // Success callback
      if (onSuccess) {
        onSuccess({ name: customerName, mobile: customerMobile, token });
      }

      resetAndClose();
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Invalid OTP. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div
      onClick={resetAndClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 4000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          maxWidth: '420px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'loginModalIn 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: '#fff',
          padding: '24px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={resetAndClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>

          <div style={{ fontSize: '40px', marginBottom: '8px' }}>
            {step === 'mobile' ? '👤' : '🔐'}
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '800',
            margin: 0
          }}>
            {step === 'mobile' ? 'Login / Sign Up' : 'Enter OTP'}
          </h2>
          <p style={{
            fontSize: '12px',
            opacity: 0.9,
            margin: '6px 0 0'
          }}>
            {step === 'mobile'
              ? 'নাম ও মোবাইল নম্বর দিন'
              : `OTP পাঠানো হয়েছে +91 ${mobile}`}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              borderLeft: '4px solid #dc2626'
            }}>
              ❌ {error}
            </div>
          )}

          {/* STEP 1: Mobile */}
          {step === 'mobile' && (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '6px'
                }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  autoFocus
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e5e5',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '6px'
                }}>
                  Mobile Number *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '14px 12px',
                    background: '#f0f0f0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#555'
                  }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="10-digit number"
                    disabled={loading}
                    maxLength={10}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '2px solid #e5e5e5',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading
                    ? '#ccc'
                    : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.4)'
                }}
              >
                {loading ? '⏳ Sending OTP...' : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              {testOtp && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#92400e',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  🧪 Test Mode OTP: <strong>{testOtp}</strong>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#333',
                  marginBottom: '6px'
                }}>
                  Enter 6-digit OTP *
                </label>
                <input
                  type="tel"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="• • • • • •"
                  autoFocus
                  disabled={loading}
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e5e5',
                    fontSize: '24px',
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc2626'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading
                    ? '#ccc'
                    : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.4)'
                }}
              >
                {loading ? '⏳ Verifying...' : '✅ Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => setStep('mobile')}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '12px',
                  background: 'transparent',
                  color: '#666',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Change mobile number
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loginModalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}