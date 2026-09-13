import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bingohall-production.up.railway.app';

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Inter", system-ui, sans-serif',
      padding: '24px',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '40px 36px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
          }}>
            🛡️
          </div>
          <h1 style={{
            fontSize: '22px', fontWeight: '900', color: '#f1f5f9',
            margin: '0 0 6px', letterSpacing: '-0.3px',
          }}>
            Admin Portal
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: '500' }}>
            Bingo X — Restricted Access
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin username"
              required
              autoComplete="username"
              style={{
                width: '100%', padding: '13px 16px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(2,6,23,0.8)',
                color: '#f1f5f9', fontSize: '14px', fontWeight: '600',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%', padding: '13px 16px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(2,6,23,0.8)',
                color: '#f1f5f9', fontSize: '14px', fontWeight: '600',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: loading
                ? 'rgba(59,130,246,0.5)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff', fontSize: '15px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(59,130,246,0.35)',
              letterSpacing: '0.2px',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Signing in…' : '🔐  Sign In to Admin Portal'}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          color: '#334155', fontSize: '12px', textAlign: 'center',
          marginTop: '28px', marginBottom: 0, fontWeight: '500',
        }}>
          Authorized personnel only. All access is logged.
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #020617; }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}
