import React, { useState } from 'react';
import { apiFetch } from '../api';

export default function AuthView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username.trim(), password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1120',
      padding: '24px',
      fontFamily: '"Outfit", system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#111827',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '32px',
          letterSpacing: '-0.5px'
        }}>Bingo X</h1>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#facc15'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#facc15'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              opacity: loading ? 0.8 : 1,
              transition: 'transform 0.1s',
              boxShadow: '0 4px 14px rgba(234, 179, 8, 0.3)'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
