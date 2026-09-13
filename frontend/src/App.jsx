import React, { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import { apiFetch } from './api';
import Navbar from './components/Navbar';
import LobbyView from './views/LobbyView';
import GameplayView from './views/GameplayView';
import WalletView from './views/WalletView';
import AuthView from './views/AuthView';
import AdminView from './views/AdminView';

let socketRef = socket;

// ─────────────────────────────────────────────────────────────────
// Telegram WebApp SDK helper — safely read from window.Telegram
// ─────────────────────────────────────────────────────────────────
const twa = () => (typeof window !== 'undefined' ? window.Telegram?.WebApp : null);
const isInsideTelegram = () => {
  const wa = twa();
  return !!(wa && wa.initData && wa.initData.length > 0);
};

// ─────────────────────────────────────────────────────────────────
// Telegram Gate — shown when user opens the site in a browser
// ─────────────────────────────────────────────────────────────────
function TelegramGate({ message, onPlayWeb }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #0a1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '"Outfit", system-ui, sans-serif',
      textAlign: 'center'
    }}>
      {/* Animated logo area */}
      <div style={{
        width: '110px',
        height: '110px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #229ed9 0%, #0a7abf 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '52px',
        marginBottom: '28px',
        boxShadow: '0 0 40px rgba(34, 158, 217, 0.5)',
        animation: 'pulse 2.5s ease-in-out infinite'
      }}>
        🎰
      </div>

      <h1 style={{
        fontSize: '26px',
        fontWeight: '800',
        color: '#fff',
        margin: '0 0 10px',
        letterSpacing: '-0.5px'
      }}>
        Ethiopian Bingo Platform
      </h1>
      <p style={{
        fontSize: '15px',
        color: '#94a3b8',
        margin: '0 0 32px',
        maxWidth: '340px',
        lineHeight: '1.6'
      }}>
        {message || 'Play live 75-Ball Ethiopian Bingo online or inside Telegram Mini App!'}
      </p>

      {/* Main CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
        {/* Direct Play Web Link */}
        <a
          href="https://localhost:3000"
          onClick={(e) => {
            if (onPlayWeb) {
              e.preventDefault();
              onPlayWeb();
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            textDecoration: 'none',
            padding: '15px 28px',
            borderRadius: '50px',
            fontSize: '16px',
            fontWeight: '800',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
        >
          🎮 Play Web App Now
        </a>

        {/* Telegram Bot */}
        <a
          href="https://t.me/bingox2019_bot"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #229ed9 0%, #1a82b5 100%)',
            color: '#fff',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: '50px',
            fontSize: '15px',
            fontWeight: '700',
            boxShadow: '0 8px 30px rgba(34, 158, 217, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
        >
          📱 Open @bingox2019_bot
        </a>
      </div>

      <p style={{ color: '#475569', fontSize: '13px', margin: '24px 0 0' }}>
        🇪🇹 Play Live 75-Ball Bingo · Win Real ETB
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(34, 158, 217, 0.5); }
          50% { box-shadow: 0 0 60px rgba(34, 158, 217, 0.8); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Registration required screen (inside Telegram but not phone-verified)
// ─────────────────────────────────────────────────────────────────
function PhoneRegistrationRequired({ message }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #0a1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '"Outfit", system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '24px',
        animation: 'bounce 1.5s ease-in-out infinite'
      }}>📱</div>

      <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', margin: '0 0 12px' }}>
        One More Step!
      </h2>
      <p style={{
        color: '#94a3b8',
        fontSize: '15px',
        maxWidth: '320px',
        lineHeight: '1.6',
        margin: '0 0 28px'
      }}>
        {message || 'Please open @bingox2019_bot in Telegram and tap "Share Phone Number" to activate your account and claim your 🎁 20 ETB welcome bonus!'}
      </p>

      <a
        href="https://t.me/bingox2019_bot"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          textDecoration: 'none',
          padding: '14px 28px',
          borderRadius: '50px',
          fontSize: '15px',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
        }}
      >
        📱 Open Bot & Register
      </a>

      <div style={{
        marginTop: '24px',
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '12px',
        padding: '14px 20px',
        color: '#6ee7b7',
        fontSize: '13px',
        maxWidth: '300px'
      }}>
        🎁 Registration Bonus: <strong>20 ETB</strong><br/>
        👥 Referral Bonus: <strong>10 ETB per friend</strong>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bingo_token') || null);
  const [currentView, setCurrentView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('view') === 'admin' ? 'admin' : 'lobby';
  });

  const [gameState, setGameState] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Auth state machine
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading' | 'authenticated' | 'needs_phone' | 'not_telegram'
  const [showWebAuth, setShowWebAuth] = useState(false);

  const [gateMessage, setGateMessage] = useState('');

  // Guard refs
  const gameEndedRef = useRef(false);
  const inGameplayRef = useRef(false);
  const authAttemptedRef = useRef(false);
  const loadingTimerRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // Primary auth flow — Telegram WebApp SDK
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authAttemptedRef.current) return;
    authAttemptedRef.current = true;

    // Loading timeout — if backend is unreachable, show clear error
    loadingTimerRef.current = setTimeout(() => {
      setGateMessage('Server connection timeout. Please check your internet or try again later.');
      setAuthStatus(prev => prev === 'loading' ? 'needs_phone' : prev);
    }, 10000);

    const wa = twa();

    // Expand to full screen immediately
    if (wa) {
      wa.expand();
      wa.ready();
    }

    // Case 1: Already have a valid stored token — restore session quickly
    if (token) {
      apiFetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          clearTimeout(loadingTimerRef.current);
          if (d.user) {
            setUser({ ...d.user, balance: d.user.balance ?? 0 });
            setAuthStatus('authenticated');
          } else {
            localStorage.removeItem('bingo_token');
            setToken(null);
            attemptTelegramAuth(wa);
          }
        })
        .catch(() => { clearTimeout(loadingTimerRef.current); attemptTelegramAuth(wa); });
      return;
    }

    // Case 2: No stored token — try Telegram auth
    attemptTelegramAuth(wa);
  }, []);

  function attemptTelegramAuth(wa) {
    clearTimeout(loadingTimerRef.current);
    if (!wa || !wa.initData || wa.initData.length === 0) {
      setGateMessage('Please open this game directly inside the Telegram Bot by clicking "PLAY BINGO". External browsers are not supported.');
      setAuthStatus('needs_phone');
      return;
    }

    apiFetch('/api/auth/telegram-webapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: wa.initData })
    })
      .then(r => r.json())
      .then(data => {
        if (data.token && data.user) {
          setToken(data.token);
          localStorage.setItem('bingo_token', data.token);
          setUser({ ...data.user, balance: data.user.balance ?? 0 });
          setAuthStatus('authenticated');
        } else if (data.requiresPhoneRegistration) {
          setGateMessage(data.message || '');
          setAuthStatus('needs_phone');
        } else if (data.error) {
          setGateMessage(data.error);
          setAuthStatus('needs_phone');
        }
      })
      .catch((err) => {
        const cachedToken = localStorage.getItem('bingo_token');
        if (cachedToken) {
          setToken(cachedToken);
          setAuthStatus('authenticated');
        } else {
          setGateMessage('Backend connection error: ' + err.message);
          setAuthStatus('needs_phone');
        }
      });
  }

  // ─────────────────────────────────────────────────────────────
  // Socket.io
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    socketRef = socket;

    socket.on('connect', () => console.log('Connected to Bingo Socket.io'));

    socket.on('round_state', state => {
      setGameState(state);
      if (state.secondsLeft !== undefined && state.secondsLeft !== null && state.status === 'COUNTDOWN') {
        setCountdown(state.secondsLeft);
      } else if (state.status === 'WAITING') {
        setCountdown(null);
      }
      if (state.status === 'COUNTDOWN') gameEndedRef.current = false;
    });

    socket.on('countdown_tick', ({ secondsLeft }) => setCountdown(secondsLeft));

    socket.on('broadcast_message', ({ message }) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(''), 8000);
    });

    socket.on('balance_updated', ({ userId, newBalance, withdrawableBalance }) => {
      setUser(prev => {
        if (prev && String(prev.id) === String(userId)) {
          const updated = { ...prev, balance: newBalance };
          if (withdrawableBalance !== undefined) {
            updated.withdrawableBalance = withdrawableBalance;
            updated.withdrawable_balance = withdrawableBalance;
          }
          return updated;
        }
        return prev;
      });
    });

    socket.on('round_ended', () => {
      gameEndedRef.current = true;
      const storedToken = localStorage.getItem('bingo_token');
      if (storedToken) {
        apiFetch('/api/user/profile', { headers: { Authorization: `Bearer ${storedToken}` } })
          .then(r => r.json())
          .then(d => {
            if (d.user) setUser(d.user);
          })
          .catch(() => {});
      }
    });

    // NOTE: Do NOT disconnect the module-level socket singleton here.
    // Disconnecting it kills real-time for the entire session.
    return () => {};
  }, []);

  // Periodic profile sync
  useEffect(() => {
    const syncProfile = () => {
      if (token) {
        apiFetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => {
            if (d.user) {
              setUser(prev => prev ? { ...prev, balance: d.user.balance } : d.user);
            }
          })
          .catch(() => {});
      }
    };
    if (authStatus === 'authenticated') {
      syncProfile();
      const interval = setInterval(syncProfile, 5000);
      return () => clearInterval(interval);
    }
  }, [token, authStatus]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bingo_token');
    setAuthStatus('loading');
    setShowWebAuth(false);
    authAttemptedRef.current = false;
    setCurrentView('lobby');
    window.location.reload();
  };

  const handleBalanceUpdate = (newBalance, withdrawableBal) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, balance: newBalance };
      if (withdrawableBal !== undefined) {
        updated.withdrawableBalance = withdrawableBal;
        updated.withdrawable_balance = withdrawableBal;
      }
      return updated;
    });
  };

  const handleWebLoginSuccess = (userObj, userToken) => {
    setUser(userObj);
    setToken(userToken);
    localStorage.setItem('bingo_token', userToken);
    setAuthStatus('authenticated');
    setShowWebAuth(false);
  };

  const getUserTickets = () => {
    if (!user || !gameState?.purchasedTickets) return [];
    return gameState.purchasedTickets.filter(t => String(t.userId) === String(user.id));
  };

  const userTickets = getUserTickets();

  // Auto-switch to gameplay when drawing starts and user has tickets
  // AND auto-switch back to lobby when round ends (status is COUNTDOWN or WAITING)
  useEffect(() => {
    if (
      gameState?.status === 'DRAWING' &&
      userTickets.length > 0 &&
      currentView !== 'gameplay' &&
      !gameEndedRef.current
    ) {
      setCurrentView('gameplay');
    } else if (
      currentView === 'gameplay' &&
      (gameState?.status === 'COUNTDOWN' || gameState?.status === 'WAITING' || userTickets.length === 0)
    ) {
      // Auto-return to lobby when game finishes or user has no active tickets
      setCurrentView('lobby');
    }
  }, [gameState?.status, userTickets.length, currentView]);

  const handleBackToLobby = () => {
    gameEndedRef.current = true;
    setCurrentView('lobby');
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────

  // Loading spinner
  if (authStatus === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090d16',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: '"Outfit", system-ui, sans-serif',
        gap: '20px'
      }}>
        <div style={{ fontSize: '56px' }}>🎰</div>
        <div style={{ color: '#94a3b8', fontSize: '15px' }}>Loading Ethiopian Bingo...</div>
        <div style={{
          width: '200px', height: '3px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            borderRadius: '4px',
            animation: 'slide 1.4s ease-in-out infinite'
          }} />
        </div>
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  // Not inside Telegram — allow direct access to LobbyView instead of blocking with gate
  if (authStatus === 'not_telegram' && showWebAuth) {
    return (
      <AuthView
        lang={lang}
        onLoginSuccess={handleWebLoginSuccess}
        onToggleLang={() => setLang(lang === 'en' ? 'am' : 'en')}
      />
    );
  }

  // Inside Telegram but phone not registered
  if (authStatus === 'needs_phone') {
    return <PhoneRegistrationRequired message={gateMessage} />;
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN GAME UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', paddingBottom: currentView === 'admin' ? '0' : '74px', background: '#090d16', color: '#fff' }}>
      <Navbar
        lang={lang}
        setLang={setLang}
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Toast Announcement */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
          maxWidth: '90vw',
          fontSize: '13px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          📢 {toastMessage}
        </div>
      )}

      {currentView === 'lobby' && (
        <LobbyView
          lang={lang}
          user={user}
          gameState={gameState}
          countdown={countdown}
          token={token}
          onTicketPurchased={handleBalanceUpdate}
          onGoToGameplay={() => setCurrentView('gameplay')}
          onGoToWallet={() => setCurrentView('wallet')}
        />
      )}

      {currentView === 'gameplay' && userTickets.length > 0 && (
        <GameplayView
          lang={lang}
          user={user}
          gameState={gameState}
          userTickets={userTickets}
          socket={socket}
          onBackToLobby={handleBackToLobby}
        />
      )}
      {currentView === 'gameplay' && userTickets.length === 0 && null}

      {currentView === 'wallet' && (
        <WalletView
          lang={lang}
          user={user}
          token={token}
          socket={socket}
          onBalanceUpdated={handleBalanceUpdate}
        />
      )}

      {currentView === 'admin' && (
        <AdminView
          lang={lang}
          token={token}
          socket={socket}
          onGoToLobby={() => setCurrentView('lobby')}
        />
      )}

    </div>
  );
}
