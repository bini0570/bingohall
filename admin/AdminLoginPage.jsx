import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      // Artificial delay for security scan effect
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 600);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      {/* Background with animated grid and ambient glow */}
      <div className="ambient-glow" />
      <div className="grid-overlay" />
      
      <div className={`login-container ${mounted ? 'visible' : ''}`}>
        
        {/* Security Badge */}
        <div className="security-badge">
          <div className="pulse-dot"></div>
          <span>END-TO-END ENCRYPTED</span>
        </div>

        {/* Header */}
        <div className="header-section">
          <div className="icon-container">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1>System Control</h1>
          <p>AUTHORIZED ACCESS ONLY</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Admin ID</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter administrator ID"
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label>Security Key</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
              </svg>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`submit-btn ${loading ? 'loading' : ''}`}>
            {loading ? (
              <>
                <span className="spinner"></span>
                AUTHENTICATING...
              </>
            ) : (
              'INITIALIZE SESSION'
            )}
          </button>
        </form>

        <div className="footer-note">
          IP: {Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}.1 • LOGGED & MONITORED
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
        body { margin: 0; background: #050505; color: #fff; }
        
        .admin-login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          position: relative;
          z-index: 1;
        }

        .ambient-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80vw;
          height: 80vh;
          background: radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: -2;
        }

        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 30px 30px;
          background-position: center center;
          mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
          pointer-events: none;
          z-index: -1;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          background: rgba(10, 10, 10, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 16px;
          padding: 40px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(16, 185, 129, 0.05) inset;
          opacity: 0;
          transform: translateY(20px) scale(0.98);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-container.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 6px 12px;
          border-radius: 30px;
          margin: 0 auto 32px;
          width: max-content;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .security-badge span {
          color: #10b981;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .header-section {
          text-align: center;
          margin-bottom: 36px;
        }

        .icon-container {
          width: 56px;
          height: 56px;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #fff;
          box-shadow: 0 8px 16px rgba(0,0,0,0.5);
        }

        .header-section h1 {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .header-section p {
          color: #71717a;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          margin: 0;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #a1a1aa;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #71717a;
        }

        .input-wrapper input {
          width: 100%;
          background: #111;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 14px 14px 14px 44px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 1px #10b981, 0 0 12px rgba(16, 185, 129, 0.2);
        }

        .input-wrapper input::placeholder {
          color: #52525b;
        }

        .submit-btn {
          width: 100%;
          background: #fff;
          color: #000;
          border: none;
          padding: 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-top: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #f4f4f5;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.2);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .submit-btn.loading {
          background: #27272a;
          color: #71717a;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #71717a;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer-note {
          margin-top: 32px;
          text-align: center;
          color: #52525b;
          font-size: 10px;
          font-family: monospace;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
