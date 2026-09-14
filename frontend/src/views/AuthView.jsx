import React, { useState } from 'react';
import { Dices, LogIn, UserPlus, ShieldAlert, KeyRound, Phone, User, Gift } from 'lucide-react';
import { apiFetch } from '../api';

export default function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRef, setRegRef] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!loginId || !loginPass) {
      setError('Please enter your phone/username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginId.trim(), password: loginPass })
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

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!regUsername || !regPhone || !regPass) {
      setError('Please fill in username, phone number, and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          phone: regPhone.trim(),
          password: regPass,
          referralCode: regRef.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '30px auto', padding: '0 16px', fontFamily: 'inherit' }}>
      <div className="glass-panel" style={{ padding: '32px 24px', borderRadius: '24px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 14px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Dices size={34} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '4px', color: '#fff' }}>
            Ethiopian Bingo Platform
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Live Multiplayer 75-Ball Game
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-elevated)',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'login' ? 'var(--bg-card-hover)' : 'transparent',
              color: mode === 'login' ? 'var(--gold)' : 'var(--text-muted)',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} /> Log In
          </button>

          <button
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'register' ? 'var(--bg-card-hover)' : 'transparent',
              color: mode === 'register' ? 'var(--gold)' : 'var(--text-muted)',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} /> Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* ========================================================= */}
        {/* LOG IN FORM                                               */}
        {/* ========================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Phone Number or Username:
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 0912345678 or username"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  style={{ paddingLeft: '42px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Password:
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  style={{ paddingLeft: '42px', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{ marginTop: '8px', width: '100%' }}
            >
              <LogIn size={18} /> {loading ? 'Logging in...' : 'Log In & Play'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* REGISTER FORM                                            */}
        {/* ========================================================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Username:
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. biniyam"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  style={{ paddingLeft: '42px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Phone Number (Telebirr / CBE):
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 0912345678"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  style={{ paddingLeft: '42px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Password:
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={regPass}
                  onChange={e => setRegPass(e.target.value)}
                  style={{ paddingLeft: '42px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                Referral Code (Optional):
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Gift size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. REF1234"
                  value={regRef}
                  onChange={e => setRegRef(e.target.value)}
                  style={{ paddingLeft: '42px', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold"
              style={{
                marginTop: '8px',
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
              }}
            >
              <UserPlus size={18} /> {loading ? 'Creating account...' : 'Create Account & Play'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
