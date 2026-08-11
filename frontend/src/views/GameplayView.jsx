import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, ArrowLeft, Trophy, Clock } from 'lucide-react';
import { translations } from '../i18n/i18n';
import MasterBoard from '../components/MasterBoard';
import CartellaCard from '../components/CartellaCard';

const LETTER_COLORS = {
  B: '#ef4444',
  I: '#f59e0b',
  N: '#10b981',
  G: '#3b82f6',
  O: '#a855f7'
};

const getBallLetter = num => {
  if (!num) return 'G';
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
};

export default function GameplayView({
  lang,
  user,
  gameState,
  userTickets = [],
  socket,
  onBackToLobby
}) {
  const [activeCartellaIndex, setActiveCartellaIndex] = useState(
    userTickets.length > 0 ? userTickets[0].cartellaIndex : null
  );

  const initialLastBall = gameState?.lastCalledBall
    ? { number: gameState.lastCalledBall, letter: getBallLetter(gameState.lastCalledBall) }
    : null;

  const [calledNumbers, setCalledNumbers] = useState(gameState?.calledNumbers || []);
  const [lastBall, setLastBall] = useState(initialLastBall);
  const [winnerData, setWinnerData] = useState(null);
  const [redirectSec, setRedirectSec] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const confettiFired = useRef(false);

  // Ensure active ticket stays in sync if userTickets changes
  const currentTicket =
    userTickets.find(t => t.cartellaIndex === activeCartellaIndex) ||
    userTickets[0] || { cartellaIndex: 1, grid: [] };

  // calledSet for rendering the cartella — always include FREE (0)
  const calledSet = new Set(calledNumbers);
  calledSet.add(0);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket) return;

    const playChime = () => {
      if (!soundOn) return;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (_) {}
    };

    const speakBall = (letter, number) => {
      if (!soundOn) return;
      playChime();
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(`${letter} ${number}`);
          u.rate = 0.95;
          u.pitch = 1.1;
          u.volume = 1.0;
          window.speechSynthesis.speak(u);
        } catch (_) {}
      }
    };

    const onBallDrawn = data => {
      setLastBall({ number: data.number, letter: data.letter });
      setCalledNumbers(data.calledNumbers || []);
      speakBall(data.letter, data.number);
    };

    const onRoundEnded = data => {
      setWinnerData(data);
      setRedirectSec(6);
      if (!confettiFired.current && data.winners?.some(w => String(w.userId) === String(user?.id))) {
        confettiFired.current = true;
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, colors: ['#f59e0b', '#fbbf24', '#fff'] });
        setTimeout(() =>
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ['#10b981', '#34d399'] }), 600
        );
      }
    };

    const onRoundState = state => {
      if (state.calledNumbers) setCalledNumbers(state.calledNumbers);
      if (state.lastCalledBall) {
        setLastBall({ number: state.lastCalledBall, letter: getBallLetter(state.lastCalledBall) });
      }
    };

    socket.on('ball_drawn', onBallDrawn);
    socket.on('round_ended', onRoundEnded);
    socket.on('round_state', onRoundState);

    return () => {
      socket.off('ball_drawn', onBallDrawn);
      socket.off('round_ended', onRoundEnded);
      socket.off('round_state', onRoundState);
    };
  }, [socket, user, soundOn]);

  // ── 6-second auto-redirect countdown ──
  useEffect(() => {
    if (redirectSec === null) return;
    if (redirectSec <= 0) {
      onBackToLobby();
      return;
    }
    const t = setTimeout(() => setRedirectSec(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [redirectSec, onBackToLobby]);

  const lastBallColor = lastBall ? (LETTER_COLORS[lastBall.letter] || '#f59e0b') : '#f59e0b';
  const isWinner = winnerData?.winners?.some(w => String(w.userId) === String(user?.id));

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 6px 4px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100dvh - 48px - 68px)',
        boxSizing: 'border-box',
        gap: '4px'
      }}
    >
      {/* ── SOLID FULL-WIDTH GAMEPLAY BANNER ── */}
      <div
        style={{
          position: 'sticky',
          top: '48px',
          zIndex: 499,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '5px',
          margin: '0 -6px 4px -6px',
          background: 'rgba(5, 8, 15, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '2px solid rgba(245,158,11,0.25)',
          padding: '5px 12px 8px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}
      >
        {/* Prize */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 4px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', gap: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Trophy size={11} color="#f59e0b" />
            <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: '700', letterSpacing: '0.4px' }}>PRIZE</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>
            {(gameState?.prizePool || 0).toFixed(0)} <span style={{ fontSize: '9px', opacity: 0.8 }}>ETB</span>
          </span>
        </div>

        {/* Players */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 4px', borderRadius: '6px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', gap: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '9px' }}>👥</span>
            <span style={{ fontSize: '8px', color: '#38bdf8', fontWeight: '700', letterSpacing: '0.4px' }}>PLAYERS</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#38bdf8', lineHeight: 1 }}>
            {gameState?.totalTickets || 1}
          </span>
        </div>

        {/* Stake */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 4px', borderRadius: '6px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', gap: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '9px' }}>⚡</span>
            <span style={{ fontSize: '8px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.4px' }}>STAKE</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#a78bfa', lineHeight: 1 }}>
            {(gameState?.ticketPrice || 10).toFixed(0)} <span style={{ fontSize: '9px', opacity: 0.8 }}>ETB</span>
          </span>
        </div>

        {/* Called Count */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 4px', borderRadius: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', gap: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '9px' }}>🎱</span>
            <span style={{ fontSize: '8px', color: '#10b981', fontWeight: '700', letterSpacing: '0.4px' }}>CALLED</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>
            {calledNumbers.length} <span style={{ fontSize: '9px', opacity: 0.7 }}>/75</span>
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          MASTERBOARD + CARTELLA PANEL
      ───────────────────────────────────────── */}
      <div className="gameplay-layout">
        {/* LEFT: MasterBoard */}
        <div className="gameplay-masterboard">
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textAlign: 'center', letterSpacing: '1px', marginBottom: '2px' }}>
            MASTER BOARD
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MasterBoard calledNumbers={calledNumbers} />
          </div>
        </div>

        {/* RIGHT: Cartella display + switcher */}
        <div className="gameplay-cartella">
          {/* ── BIG DRAWING BALL + RECENT NUMBERS CONTAINER ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(8,14,28,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              flexShrink: 0
            }}
          >
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.8px' }}>
                CURRENT DRAWING BALL
              </span>
              <button
                onClick={() => setSoundOn(s => !s)}
                style={{
                  background: soundOn ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                  border: soundOn ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  color: soundOn ? '#818cf8' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}
              >
                {soundOn ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {soundOn ? 'Sound' : 'Muted'}
              </button>
            </div>

            {/* Big Ball */}
            {lastBall ? (
              <div
                key={lastBall.number}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 30%, ${lastBallColor}ff 0%, ${lastBallColor}66 100%)`,
                  border: `3px solid ${lastBallColor}`,
                  boxShadow: `0 0 20px ${lastBallColor}b0, inset 0 0 8px rgba(255,255,255,0.5)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '2px 0 6px'
                }}
              >
                <span style={{ fontSize: '10px', color: '#000', lineHeight: 1, fontWeight: '900' }}>
                  {lastBall.letter}
                </span>
                <span style={{ fontSize: '19px', color: '#fff', lineHeight: 1, fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {lastBall.number}
                </span>
              </div>
            ) : (
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '2px 0 6px'
                }}
              >
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Wait...</span>
              </div>
            )}

            {/* ── RECENT CALLED NUMBERS ROW ── */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '800', flexShrink: 0, marginRight: '2px' }}>RECENT:</span>
              {calledNumbers.length === 0 ? (
                <span style={{ fontSize: '9px', color: '#475569', fontWeight: '600' }}>Waiting for first ball...</span>
              ) : (
                [...calledNumbers].reverse().map((n, i) => {
                  const letter = getBallLetter(n);
                  const col = LETTER_COLORS[letter];
                  return (
                    <span
                      key={n}
                      style={{
                        flexShrink: 0,
                        padding: '1px 5px',
                        borderRadius: '5px',
                        fontSize: '9px',
                        fontWeight: '900',
                        background: i === 0 ? col : 'rgba(255,255,255,0.07)',
                        color: i === 0 ? '#000' : col,
                        border: i === 0 ? 'none' : `1px solid ${col}44`
                      }}
                    >
                      {letter}{n}
                    </span>
                  );
                })
              )}
            </div>
          </div>
          {userTickets.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '5px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                flexShrink: 0
              }}
            >
              {userTickets.map(tk => {
                const isActive = tk.cartellaIndex === currentTicket.cartellaIndex;
                return (
                  <button
                    key={tk.cartellaIndex}
                    onClick={() => setActiveCartellaIndex(tk.cartellaIndex)}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                        : 'rgba(255,255,255,0.07)',
                      color: isActive ? '#000' : '#94a3b8',
                      border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.10)',
                      borderRadius: '8px',
                      padding: '3px 10px',
                      fontWeight: '900',
                      fontSize: '11px',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0 12px rgba(6,182,212,0.5)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    #{tk.cartellaIndex}
                  </button>
                );
              })}
            </div>
          )}

          {/* Cartella card */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <CartellaCard
              id={currentTicket.cartellaIndex || 1}
              grid={currentTicket.grid || []}
              calledSet={calledSet}
              price={gameState?.ticketPrice || 10}
              compact
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          WINNER OVERLAY MODAL
      ───────────────────────────────────────── */}
      {winnerData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(18,28,50,0.99) 0%, rgba(5,8,15,1) 100%)',
              borderRadius: '28px',
              padding: '24px 20px',
              border: `2px solid ${isWinner ? '#f59e0b' : '#334155'}`,
              textAlign: 'center',
              maxWidth: '420px',
              width: '100%',
              boxShadow: isWinner ? '0 0 60px rgba(245,158,11,0.5)' : '0 0 40px rgba(0,0,0,0.8)',
              animation: 'fadeInUp 0.4s ease'
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: '52px', marginBottom: '8px', lineHeight: 1 }}>
              {isWinner ? '🏆' : '🎲'}
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '900',
                color: isWinner ? '#fbbf24' : '#f1f5f9',
                marginBottom: '6px',
                letterSpacing: '-0.5px'
              }}
            >
              {isWinner ? 'You Won! BINGO! 🎉' : 'Round Ended'}
            </h2>

            {/* Winner info */}
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700', marginBottom: '16px', lineHeight: 1.5 }}>
              {winnerData.winners?.map((w, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: '900' }}>
                    {w.username} (#{w.cartellaIndex})
                  </span>
                  {' '}— <span style={{ color: '#10b981', fontWeight: '900' }}>
                    {(winnerData.splitPrizePerWinner || 0).toFixed(0)} ETB
                  </span>
                  <span style={{ color: '#475569', fontSize: '11px', display: 'block' }}>
                    Pattern: {w.pattern}
                  </span>
                </div>
              ))}
            </div>

            {/* Winning cartella preview */}
            {winnerData.winners?.[0]?.grid && (
              <div
                style={{
                  margin: '0 0 16px',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: '16px',
                  padding: '10px',
                  background: 'rgba(5,8,15,0.8)'
                }}
              >
                <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '800', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  🎯 WINNING CARTELLA #{winnerData.winners[0].cartellaIndex}
                </div>
                <CartellaCard
                  id={winnerData.winners[0].cartellaIndex}
                  grid={winnerData.winners[0].grid}
                  calledSet={calledSet}
                  price={gameState?.ticketPrice || 10}
                />
              </div>
            )}

            {/* Countdown bar */}
            <div
              style={{
                background: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Clock size={16} color="#f59e0b" />
              <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: '800' }}>
                Returning to Lobby in{' '}
                <span style={{ fontSize: '18px', color: '#fff', fontWeight: '900' }}>{redirectSec ?? 6}</span>s
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
