import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Trophy, AlertCircle, Clock, Zap } from 'lucide-react';
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
  // Track in-flight purchases to prevent race-condition bypass of the 4-cartella limit
  const purchasingRef = useRef(new Set());

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

    // Block if this cartella is already being purchased (in-flight)
    if (purchasingRef.current.has(index)) return;

    // Max cartellas check — count includes in-flight purchases to prevent race bypass
    const effectiveCount = myCartellas.length + purchasingRef.current.size;
    if (effectiveCount >= 4) {
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

    // SELECT — mark as in-flight immediately before any await
    purchasingRef.current.add(index);
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
    } finally {
      purchasingRef.current.delete(index); // always release the lock
    }
  };

  const cdColor = currentSec <= 10 ? '#ef4444' : currentSec <= 20 ? '#f59e0b' : '#06b6d4';

  return (
    <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '12px 10px 4px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', height: '100%', flex: 1, overflow: 'hidden', position: 'relative' }}>
      
      {/* ── MODERN STATS BANNER ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          flexShrink: 0,
          marginBottom: '12px'
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
            padding: '6px 4px',
            borderRadius: '8px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            gap: '2px',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: 'inset 0 2px 10px rgba(16,185,129,0.05)'
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
            padding: '6px 4px',
            borderRadius: '8px',
            background: isDrawing ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.1)',
            border: `1px solid ${isDrawing ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.25)'}`,
            gap: '2px',
            boxShadow: `inset 0 2px 10px ${isDrawing ? 'rgba(16,185,129,0.05)' : 'rgba(6,182,212,0.05)'}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} color={isDrawing ? '#10b981' : cdColor} />
            <span style={{ fontSize: '8px', color: isDrawing ? '#10b981' : cdColor, fontWeight: '800', letterSpacing: '0.4px' }}>
              {isDrawing ? 'LIVE' : 'STARTS IN'}
            </span>
          </div>
          {isDrawing ? (
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#10b981', lineHeight: 1, textShadow: '0 0 8px rgba(16,185,129,0.4)' }}>▶ LIVE</span>
          ) : (
            <span style={{ fontSize: '14px', fontWeight: '900', color: cdColor, lineHeight: 1 }}>
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
            padding: '6px 4px',
            borderRadius: '8px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
            gap: '2px',
            boxShadow: 'inset 0 2px 10px rgba(245,158,11,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Trophy size={11} color="#f59e0b" />
            <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: '800', letterSpacing: '0.4px' }}>PRIZE</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>
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
            padding: '6px 4px',
            borderRadius: '8px',
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.25)',
            gap: '2px',
            boxShadow: 'inset 0 2px 10px rgba(139,92,246,0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Zap size={11} color="#a78bfa" />
            <span style={{ fontSize: '8px', color: '#a78bfa', fontWeight: '800', letterSpacing: '0.4px' }}>STAKE</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#a78bfa', lineHeight: 1 }}>
            {(gameState?.ticketPrice || 10).toFixed(0)} <span style={{ fontSize: '9px', opacity: 0.8 }}>ETB</span>
          </span>
        </div>
      </div>


      {/* ── FLOATING TOAST ERROR HIGHLIGHT (doesn't push or take space) ── */}
      {errMsg && (
        <div
          style={{
            position: 'absolute',
            top: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '800',
            boxShadow: '0 4px 20px rgba(239,68,68,0.5), 0 8px 32px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <AlertCircle size={15} color="#fff" />
          {errMsg}
        </div>
      )}



      {/* ── 400 CARTELLAS GRID ── */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '8px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
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
