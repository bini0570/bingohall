import React, { useState, useEffect } from 'react';
import { Wallet, Trophy, AlertCircle, X, Clock, Zap } from 'lucide-react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';

export default function LobbyView({
  lang,
  user,
  gameState,
  countdown,
  token,
  onTicketPurchased,
  onGoToGameplay,
  onGoToWallet
}) {
  const t = translations[lang];
  const [errMsg, setErrMsg] = useState('');
  const [localMyCartellas, setLocalMyCartellas] = useState(null);

  // Build a map of purchased tickets: { cartellaIndex -> userId }
  const purchasedMap = {};
  if (gameState?.purchasedTickets) {
    gameState.purchasedTickets.forEach(tk => {
      purchasedMap[tk.cartellaIndex] = tk.userId;
    });
  }

  // Server-authoritative my cartellas
  const serverMyCartellas = gameState?.purchasedTickets
    ? gameState.purchasedTickets
        .filter(t => String(t.userId) === String(user?.id))
        .map(t => t.cartellaIndex)
    : [];

  // Use local state for instant feedback, sync when server updates
  const myCartellas = localMyCartellas !== null ? localMyCartellas : serverMyCartellas;

  useEffect(() => {
    setLocalMyCartellas(serverMyCartellas);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serverMyCartellas)]);

  const price = gameState?.ticketPrice || 10;
  const balance = user?.balance || 0;
  const totalPot = gameState?.prizePool || 0;
  const totalPlayers = gameState?.totalTickets || 0;
  const isDrawing = gameState?.status === 'DRAWING';
  const isCountdown = gameState?.status === 'COUNTDOWN';
  const currentSec = countdown !== null ? countdown : (gameState?.secondsLeft ?? 40);

  const handleCartellaClick = async (index) => {
    if (isDrawing) return; // Cannot change during drawing
    setErrMsg('');

    const isMine = myCartellas.includes(index);
    const ownerId = purchasedMap[index];
    const isTaken = !!ownerId && String(ownerId) !== String(user?.id);

    // UNSELECT
    if (isMine) {
      const updated = myCartellas.filter(i => i !== index);
      setLocalMyCartellas(updated);
      if (onTicketPurchased) onTicketPurchased(balance + price);

      try {
        const res = await apiFetch('/api/game/unselect-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cartellaIndex: index })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to unselect');
        if (onTicketPurchased && data.newBalance !== undefined) onTicketPurchased(data.newBalance);
      } catch (err) {
        setErrMsg(err.message);
        setLocalMyCartellas(myCartellas); // rollback
      }
      return;
    }

    // Block if taken by someone else
    if (isTaken) {
      setErrMsg(`Cartella #${index} is already taken.`);
      setTimeout(() => setErrMsg(''), 2000);
      return;
    }

    // Max cartellas check
    if (myCartellas.length >= 4) {
      setErrMsg('Maximum 4 cartellas per round.');
      setTimeout(() => setErrMsg(''), 2500);
      return;
    }

    // Balance check
    if (balance < price) {
      setErrMsg(`Need ${price} ETB — deposit in Wallet first.`);
      setTimeout(() => setErrMsg(''), 3000);
      return;
    }

    // SELECT
    const updated = [...myCartellas, index];
    setLocalMyCartellas(updated);
    if (onTicketPurchased) onTicketPurchased(Math.max(0, balance - price));

    try {
      const res = await apiFetch('/api/game/buy-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartellaIndex: index })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim cartella');
      if (onTicketPurchased && data.newBalance !== undefined) onTicketPurchased(data.newBalance);
    } catch (err) {
      setErrMsg(err.message);
      setLocalMyCartellas(myCartellas); // rollback
    }
  };

  const cdColor = currentSec <= 10 ? '#ef4444' : currentSec <= 20 ? '#f59e0b' : '#06b6d4';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '6px 10px 4px', height: 'calc(100dvh - 48px - 68px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ── SOLID FULL-WIDTH STATS BANNER (fused with top Navbar into one banner) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '5px',
          margin: '-6px -10px 6px -10px',
          background: 'rgba(5, 8, 15, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '2px solid rgba(245,158,11,0.25)',
          padding: '5px 12px 8px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}
      >
        {/* Balance */}
        <div
          onClick={() => onGoToWallet && onGoToWallet()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 4px',
            borderRadius: '6px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            gap: '1px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Wallet size={11} color="#10b981" />
            <span style={{ fontSize: '8px', color: '#10b981', fontWeight: '700', letterSpacing: '0.4px' }}>BALANCE</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>
            {balance.toFixed(0)} <span style={{ fontSize: '9px', opacity: 0.8 }}>ETB</span>
          </span>
        </div>

        {/* Countdown / LIVE */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 4px',
            borderRadius: '6px',
            background: isDrawing ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.08)',
            border: `1px solid ${isDrawing ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.2)'}`,
            gap: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} color={isDrawing ? '#10b981' : cdColor} />
            <span style={{ fontSize: '8px', color: isDrawing ? '#10b981' : cdColor, fontWeight: '700', letterSpacing: '0.4px' }}>
              {isDrawing ? 'LIVE' : 'STARTS IN'}
            </span>
          </div>
          {isDrawing ? (
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>▶ LIVE</span>
          ) : (
            <span style={{ fontSize: '13px', fontWeight: '900', color: cdColor, lineHeight: 1 }}>
              {currentSec}<span style={{ fontSize: '9px', opacity: 0.8 }}>s</span>
            </span>
          )}
        </div>

        {/* Prize Pool */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 4px',
            borderRadius: '6px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            gap: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Trophy size={11} color="#f59e0b" />
            <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: '700', letterSpacing: '0.4px' }}>PRIZE</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>
            {totalPot.toFixed(0)} <span style={{ fontSize: '9px', opacity: 0.8 }}>ETB</span>
          </span>
        </div>

        {/* Stake / Ticket Price */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 4px',
            borderRadius: '6px',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            gap: '1px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Zap size={11} color="#a78bfa" />
            <span style={{ fontSize: '8px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.4px' }}>STAKE</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#a78bfa', lineHeight: 1 }}>
            {(gameState?.ticketPrice || 10).toFixed(0)} <span style={{ fontSize: '9px', opacity: 0.8 }}>ETB</span>
          </span>
        </div>
      </div>

      {/* ── MY CHOSEN CARTELLAS BANNER ── */}
      {myCartellas.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(5,8,15,0.95) 100%)',
            border: '1.5px solid rgba(6,182,212,0.4)',
            borderRadius: '12px',
            padding: '6px 10px',
            marginBottom: '6px',
            animation: 'fadeInUp 0.3s ease',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.5px' }}>
              ✓ YOUR CARTELLAS ({myCartellas.length}/4)
            </span>
            {isCountdown && (
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                ⏳ Game starts in {currentSec}s
              </span>
            )}
            {isDrawing && (
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800' }}>
                🎮 Game is LIVE!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {myCartellas.map(idx => (
              <button
                key={idx}
                onClick={() => handleCartellaClick(idx)}
                style={{
                  background: 'rgba(6,182,212,0.25)',
                  color: '#38bdf8',
                  fontWeight: '900',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid rgba(6,182,212,0.5)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title="Click to unselect"
              >
                #{idx}
                <X size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ERROR MSG ── */}
      {errMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '6px',
            fontSize: '12px',
            fontWeight: '700',
            flexShrink: 0
          }}
        >
          <AlertCircle size={14} />
          {errMsg}
        </div>
      )}

      {/* ── SECTION HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
          padding: '0 2px',
          flexShrink: 0
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: '900', color: '#f1f5f9' }}>
            Choose Your Cartella
          </div>
          <div style={{ fontSize: '10px', color: '#475569', fontWeight: '600', marginTop: '1px' }}>
            <span style={{ color: '#f59e0b', fontWeight: '800' }}>{price} ETB</span>/cartella · Max 4 · {totalPlayers} purchased
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '9px', fontWeight: '800' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#38bdf8' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'rgba(6,182,212,0.5)', border: '1px solid #06b6d4', display: 'inline-block' }} />
            Mine
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#34d399' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.4)', display: 'inline-block' }} />
            Taken
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#475569' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'rgba(13,20,38,0.9)', border: '1px solid rgba(255,255,255,0.06)', display: 'inline-block' }} />
            Free
          </span>
        </div>
      </div>

      {/* ── 400 CARTELLAS GRID ── */}
      <div
        style={{
          background: 'rgba(8,14,28,0.7)',
          borderRadius: '14px',
          padding: '6px',
          border: '1px solid rgba(255,255,255,0.06)',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="lobby-cartella-grid" style={{ flex: 1, minHeight: 0, maxHeight: 'none' }}>
          {Array.from({ length: 400 }, (_, i) => i + 1).map(id => {
            const ownerId = purchasedMap[id];
            const isMine = myCartellas.includes(id);
            const isTaken = !!ownerId && !isMine;
            const isDisabled = isTaken || (isDrawing && !isMine);

            return (
              <button
                key={id}
                type="button"
                onClick={() => !isDisabled && handleCartellaClick(id)}
                disabled={isDisabled}
                className={`cartella-grid-item${isMine ? ' mine' : isTaken ? ' taken' : ''}`}
                aria-label={`Cartella ${id}${isMine ? ' (yours)' : isTaken ? ' (taken)' : ''}`}
              >
                {id}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
