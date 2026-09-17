import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AdminLoginPage from './AdminLoginPage';
import AdminView from './AdminView';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

export default function AdminApp() {
  // 'loading' | 'login' | 'dashboard'
  const [status, setStatus] = useState('loading');
  const [token, setToken] = useState(null);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (!stored) {
      setStatus('login');
      return;
    }
    // Validate stored token against /api/user/profile
    apiFetch('/api/user/profile', { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.json())
      .then(d => {
        if (d.user && d.user.isAdmin) {
          setToken(stored);
          setAdminUser(d.user);
          setStatus('dashboard');
        } else {
          // Token invalid or not admin — clear and show login
          localStorage.removeItem('admin_token');
          setStatus('login');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        setStatus('login');
      });
  }, []);

  const handleLoginSuccess = (newToken, user) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    setAdminUser(user);
    setStatus('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdminUser(null);
    setStatus('login');
  };

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: '"Inter", system-ui, sans-serif',
        gap: '16px',
      }}>
        <div style={{ fontSize: '40px' }}>🛡️</div>
        <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
          Verifying admin session…
        </div>
      </div>
    );
  }

  if (status === 'login') {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminView
      token={token}
      onLogout={handleLogout}
    />
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
