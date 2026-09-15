import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Gift, Check, Share2, Users, Copy } from 'lucide-react';
import { translations } from '../i18n/i18n';
import './WalletView.css'; // Borrowing the same design tokens and card styles

export default function TasksView({ lang }) {
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('bingo_streak') || '1'));
  const [cooldownEnd, setCooldownEnd] = useState(() => parseInt(localStorage.getItem('bingo_cooldown') || '0'));
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = parseInt(localStorage.getItem('bingo_cooldown') || '0');
    if (end > 0) {
      const now = Date.now();
      if (now < end) {
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    }
    return null;
  });

  useEffect(() => {
    if (cooldownEnd > 0) {
      const now = Date.now();
      if (now > cooldownEnd + (24 * 60 * 60 * 1000)) {
        setStreak(1);
        setCooldownEnd(0);
        localStorage.setItem('bingo_streak', '1');
        localStorage.setItem('bingo_cooldown', '0');
        setTimeLeft(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!cooldownEnd || cooldownEnd === 0) return;
    
    const tick = () => {
      const now = Date.now();
      if (now >= cooldownEnd) {
        if (now > cooldownEnd + (24 * 60 * 60 * 1000)) {
          setStreak(1);
          setCooldownEnd(0);
          localStorage.setItem('bingo_streak', '1');
          localStorage.setItem('bingo_cooldown', '0');
          setTimeLeft(null);
        } else {
          setTimeLeft(null);
        }
      } else {
        const diff = cooldownEnd - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleClaim = () => {
    if (timeLeft) return;
    
    const nextStreak = streak >= 7 ? 1 : streak + 1;
    const nextCooldown = Date.now() + (24 * 60 * 60 * 1000);
    
    setStreak(nextStreak);
    setCooldownEnd(nextCooldown);
    localStorage.setItem('bingo_streak', nextStreak.toString());
    localStorage.setItem('bingo_cooldown', nextCooldown.toString());
    setTimeLeft('24:00:00');
  };

  return (
    <div className="wallet-wrapper">
      <main className="wallet-card">
        <header className="wallet__header">
          <p className="greeting__label">Rewards</p>
          <p className="greeting__name">Daily Tasks & Check-in</p>
        </header>

        {/* Daily Check-in Card (TotalCard style) */}
        <section className="total-card" aria-label="Daily Check-In">
          <div className="total-card__top">
            <div>
              <p className="total-card__label" style={{ color: 'rgba(255,255,255,0.85)' }}>Daily Check-In Streak</p>
              <p className="total-card__amount" style={{ fontSize: '28px', marginTop: '4px' }}>
                Day {streak} <span>/ 7</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'space-between', marginTop: '20px' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const isToday = day === streak; 
              const isClaimed = day < streak || (streak === 1 && cooldownEnd > Date.now() && day === 7); 
              const reward = day === 7 ? 10 : day; 
              const isMystery = day === 7;

              return (
                <div key={day} style={{ 
                  flex: 1, minWidth: 0, aspectRatio: '1 / 1.15', padding: '6px 2px', borderRadius: '12px',
                  background: isToday ? '#fff' : (isClaimed ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  boxShadow: isToday ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  opacity: (isClaimed || isToday) ? 1 : 0.6
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: isToday ? 'var(--brand-1)' : '#fff', lineHeight: '1' }}>D{day}</div>
                  
                  {isClaimed ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px' }}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                  ) : isMystery ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px' }}>
                      <Gift size={14} color={isToday ? 'var(--brand-1)' : '#fff'} />
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: '900', color: isToday ? 'var(--brand-1)' : '#fff', lineHeight: '1' }}>+{reward}</div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleClaim}
            disabled={!!timeLeft}
            style={{ 
              width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
              background: timeLeft ? 'rgba(255,255,255,0.2)' : '#fff', 
              color: timeLeft ? 'rgba(255,255,255,0.7)' : 'var(--brand-1)',
              fontSize: '15px', fontWeight: '700', cursor: timeLeft ? 'not-allowed' : 'pointer', marginTop: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              boxShadow: timeLeft ? 'none' : '0 8px 16px rgba(0,0,0,0.1)'
            }}>
            {timeLeft ? (
              <>Come back in <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' }}>{timeLeft}</span></>
            ) : (
              'Claim Reward'
            )}
          </button>
        </section>

        <div className="section-head" style={{ marginTop: '28px' }}>
          <h2>Available Tasks</h2>
        </div>

        <div className="transactions-wrap" style={{ height: 'auto', paddingBottom: '20px' }}>
          <ul className="transactions">
            <TaskCard icon={<CheckCircle2 size={18} />} title="Join Telegram Channel" reward="5 ETB" status="pending" />
            <TaskCard icon={<Gift size={18} />} title="Play 5 Bingo Games" reward="10 ETB" status="in_progress" progress="2/5" />
            <TaskCard icon={<ClipboardList size={18} />} title="Deposit First Time" reward="20 ETB" status="completed" />
          </ul>
        </div>
      </main>
    </div>
  );
}

function TaskCard({ icon, title, reward, status, progress }) {
  const isCompleted = status === 'completed';
  return (
    <li className="tx" style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      <span className="tx__avatar" style={{ 
        background: isCompleted ? 'var(--green-soft)' : '#f6f4ff', 
        color: isCompleted ? 'var(--green)' : 'var(--brand-1)' 
      }}>
        {icon}
      </span>
      <div className="tx__body">
        <p className="tx__name" style={{ fontSize: '15px' }}>{title}</p>
        <p className="tx__meta" style={{ marginTop: '4px' }}>
          <span style={{ color: 'var(--amber)', fontWeight: '700' }}>+{reward}</span>
        </p>
      </div>
      <div>
        {isCompleted ? (
          <span className="badge badge--ready" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            Done
          </span>
        ) : (
          <button style={{ 
            background: 'var(--brand-1)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 10px rgba(109, 94, 252, 0.2)'
          }}>
            {status === 'in_progress' ? progress : 'Go'}
          </button>
        )}
      </div>
    </li>
  );
}
