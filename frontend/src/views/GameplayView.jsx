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
        padding: '4px 6px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100dvh - 56px - 68px)',
        boxSizing: 'border-box',
        gap: '4px'
      }}
    >
      {/* ─────────────────────────────────────────
          SOLID COMPACT GAMEPLAY BANNER
      ───────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(8, 14, 28, 0.95)',
          borderRadius: '10px',
          padding: '4px 8px',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}
      >
        {/* Back to Lobby */}
        <button
          onClick={onBackToLobby}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '8px',
            padding: '4px 8px',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0
          }}
        >
          <ArrowLeft size={13} /> Lobby
        </button>

        {/* Current Ball Badge */}
        {lastBall ? (
          <div
            key={lastBall.number}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${lastBallColor}cc 0%, ${lastBallColor}55 100%)`,
              border: `2px solid ${lastBallColor}`,
              boxShadow: `0 0 12px ${lastBallColor}90`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '7.5px', color: lastBallColor, lineHeight: 1, fontWeight: '800' }}>
              {lastBall.letter}
            </span>
            <span style={{ fontSize: '14px', color: '#fff', lineHeight: 1, fontWeight: '900' }}>
              {lastBall.number}
            </span>
          </div>
        ) : (
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '8px', color: '#475569', fontWeight: '700' }}>Wait</span>
          </div>
        )}

        {/* Middle Stats & Called Balls */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Stats inline */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '10px', fontWeight: '800' }}>
            <span style={{ color: '#10b981' }}>🏆 {(gameState?.prizePool || 0).toFixed(0)} ETB</span>
            <span style={{ color: '#38bdf8' }}>👥 {gameState?.totalTickets || 1}</span>
            <span style={{ color: '#94a3b8', fontSize: '9px' }}>({calledNumbers.length}/75)</span>
          </div>

          {/* Called ball strip */}
          <div style={{ display: 'flex', gap: '3px', overflowX: 'auto' }}>
            {calledNumbers.length === 0 ? (
              <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>Waiting...</span>
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
                      borderRadius: '4px',
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

        {/* Sound toggle */}
        <button
          onClick={() => setSoundOn(s => !s)}
          style={{
            background: soundOn ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
            border: soundOn ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '5px 8px',
            color: soundOn ? '#818cf8' : '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>ding: '6px 10px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={13} /> Lobby
          </button>
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
          {/* Cartella selector pills (only if multiple) */}
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

            <button
              onClick={() => { setWinnerData(null); onBackToLobby(); }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#000',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(245,158,11,0.45)',
                letterSpacing: '0.3px'
              }}
            >
              → Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
