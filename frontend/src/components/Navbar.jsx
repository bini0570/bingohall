import React, { useState } from 'react';
import { Home, Wallet, Dices, HelpCircle, X, ClipboardList, Users } from 'lucide-react';
import { translations } from '../i18n/i18n';

export default function Navbar({
  lang,
  setLang,
  user,
  currentView,
  setCurrentView,
  onLogout
}) {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const navItems = [
    { id: 'lobby', label: 'Home', icon: Home, activeColor: '#f59e0b', activeBg: 'rgba(245,158,11,0.12)' },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, activeColor: '#3b82f6', activeBg: 'rgba(59,130,246,0.12)' },
    { id: 'invite', label: 'Invite', icon: Users, activeColor: '#8b5cf6', activeBg: 'rgba(139,92,246,0.12)' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, activeColor: '#10b981', activeBg: 'rgba(16,185,129,0.12)' },
  ];

  if (currentView === 'admin') return null;

  const getBannerDetails = () => {
    switch(currentView) {
      case 'tasks':
        return { 
          title: 'Tasks', 
          icon: <ClipboardList size={22} color="#fff" strokeWidth={2.5} />,
          bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          shadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        };
      case 'invite':
        return { 
          title: 'Invite', 
          icon: <Users size={22} color="#fff" strokeWidth={2.5} />,
          bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          shadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        };
      case 'wallet':
        return { 
          title: 'Wallet', 
          icon: <Wallet size={22} color="#fff" strokeWidth={2.5} />,
          bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          shadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        };
      default:
        return { 
          title: <>Bingo <span style={{ color: '#f59e0b' }}>X</span></>, 
          icon: <Dices size={22} color="#fff" strokeWidth={2.5} />,
          bg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          shadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        };
    }
  };

  const banner = getBannerDetails();

  return (
    <>
      {/* ── Top Header Bar (Modernized) ── */}
      <header
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(15, 23, 42, 1)', // Solid background so it's opaque
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
          flexShrink: 0, // Prevent shrinking in flex layout
          position: 'relative',
          zIndex: 500
        }}
      >
        {/* Brand Block */}
        <div
          onClick={() => setCurrentView('lobby')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: banner.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: banner.shadow,
              transition: 'all 0.3s ease'
            }}
          >
            {banner.icon}
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            {banner.title}
          </span>
        </div>

        {/* Balance Block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '6px 14px',
            borderRadius: '20px',
            boxShadow: '0 2px 12px rgba(16, 185, 129, 0.15)'
          }}
        >
          <Wallet size={16} color="#10b981" />
          {user ? (
            <span style={{
              color: '#10b981',
              fontWeight: '800',
              fontSize: '15px',
              letterSpacing: '-0.2px'
            }}>
              {(parseFloat(user.balance) || 0).toFixed(2)}
            </span>
          ) : (
            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>...</span>
          )}
        </div>
      </header>

      {/* ── Help Modal ── */}
      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              color: '#f1f5f9',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#0284c7', borderRadius: '12px', padding: '8px', display: 'flex' }}>
                <HelpCircle size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Bingo X Guide & Help</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>How to play and win ETB</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#f59e0b', fontSize: '14px' }}>🎰 1. How to Play Bingo</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Pick 1 to 4 cartellas (tickets) before the timer runs out. Each cartella costs 10 ETB. Numbers 1–75 will be drawn automatically in real-time.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#10b981', fontSize: '14px' }}>🏆 2. Winning the Prize Pool</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Complete any line (horizontal, vertical, diagonal, 4 corners, or Full House) on your cartella. Winners automatically share the round prize pool instantly credited to their wallet!
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '14px' }}>💳 3. Deposits & Withdrawals</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Deposit ETB instantly using Telebirr or CBE. Withdraw your winnings directly to your mobile money or bank account!
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <strong style={{ color: '#a78bfa', fontSize: '14px' }}>👥 4. Invite & Earn</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Share your referral link with friends. Earn 10 ETB bonus for every friend who registers and makes their first deposit!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Got It! Let's Play
            </button>
          </div>
        </div>
      )}

      {/* ── Premium Bottom Navigation Bar ── */}
      {(!user || !user.isAdmin) && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'rgba(5, 8, 15, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'stretch',
            height: '68px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.7)'
          }}
        >
          {navItems.map(({ id, label, icon: Icon, activeColor, activeBg }) => {
            const isActive = currentView === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  paddingBottom: '2px'
                }}
              >
                {/* Active top indicator bar */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '36px',
                      height: '2.5px',
                      borderRadius: '0 0 6px 6px',
                      background: activeColor,
                      boxShadow: `0 0 10px ${activeColor}`,
                    }}
                  />
                )}

                {/* Icon wrapper */}
                <div
                  style={{
                    width: '40px',
                    height: '32px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? activeBg : 'transparent',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 0 12px ${activeColor}30` : 'none'
                  }}
                >
                  <Icon
                    size={isActive ? 22 : 20}
                    color={isActive ? activeColor : '#475569'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: isActive ? '800' : '600',
                    color: isActive ? activeColor : '#475569',
                    letterSpacing: '0.2px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
