import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Gift, Check, Share2, Users, Copy, HelpCircle, ArrowRight } from 'lucide-react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';
import './WalletView.css';

export default function TasksView({ lang }) {
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('bingo_streak') || '1'));
  const [cooldownEnd, setCooldownEnd] = useState(() => parseInt(localStorage.getItem('bingo_cooldown') || '0'));
  const [tasks, setTasks] = useState([]);
  
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
    // Fetch real tasks from backend
    apiFetch('/api/tasks')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filteredTasks = data.filter(t => {
            const title = t.title || '';
            const type = t.type || '';
            return !title.toLowerCase().includes('telegram') && type.toLowerCase() !== 'telegram';
          });
          setTasks(filteredTasks);
        }
      })
      .catch(console.error);

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
    
    // Calculate next midnight (local time)
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const nextCooldown = nextMidnight.getTime();
    
    setStreak(nextStreak);
    setCooldownEnd(nextCooldown);
    localStorage.setItem('bingo_streak', nextStreak.toString());
    localStorage.setItem('bingo_cooldown', nextCooldown.toString());
    
    const diff = nextCooldown - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  };

  return (
    <div className="wallet-wrapper">
      <main className="wallet-card">
        {/* Daily Check-in Card (TotalCard style) */}
        <section className="total-card" aria-label="Daily Check-In" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const isToday = day === streak; 
              const isClaimed = day < streak || (streak === 1 && cooldownEnd > Date.now() && day === 7); 
              const reward = day === 7 ? 10 : day; 
              const isMystery = day === 7;

              return (
                <div key={day} style={{ 
                  flex: 1, minWidth: 0, padding: '8px 0', borderRadius: '8px',
                  background: isToday ? '#fff' : (isClaimed ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  boxShadow: isToday ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  opacity: (isClaimed || isToday) ? 1 : 0.6
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: isToday ? 'var(--brand-1)' : '#fff', lineHeight: '1' }}>D{day}</div>
                  
                  {isClaimed ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '14px' }}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                  ) : isMystery ? (
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '14px' }}>
                      <Gift size={14} color={isToday ? 'var(--brand-1)' : '#fff'} />
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', fontWeight: '900', color: isToday ? 'var(--brand-1)' : '#fff', lineHeight: '1' }}>+{reward}</div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleClaim}
            disabled={!!timeLeft}
            style={{ 
              width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
              background: timeLeft ? 'rgba(255,255,255,0.2)' : '#fff', 
              color: timeLeft ? 'rgba(255,255,255,0.7)' : 'var(--brand-1)',
              fontSize: '14px', fontWeight: '700', cursor: timeLeft ? 'not-allowed' : 'pointer', marginTop: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              boxShadow: timeLeft ? 'none' : '0 4px 10px rgba(0,0,0,0.1)'
            }}>
            {timeLeft ? (
              <>Come back in <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>{timeLeft}</span></>
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
            {tasks.length > 0 ? (
              tasks.map(t => (
                <TaskCard 
                  key={t.id} 
                  icon={t.type === 'youtube' ? <Gift size={18} /> : t.type === 'tiktok' ? <CheckCircle2 size={18} /> : <Share2 size={18} />} 
                  title={t.title || `Join our ${t.type || 'social'} channel`} 
                  reward={`${t.reward || 0} ETB`} 
                  url={t.url}
                  button_name={t.button_name}
                  status="pending" 
                />
              ))
            ) : (
              <li style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No tasks available right now.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}

function TaskCard({ icon, title, reward, status, progress, url, button_name }) {
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
          <button 
            onClick={() => {
              if (url) window.open(url, '_blank');
            }}
            style={{ 
            background: 'var(--brand-1)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 10px rgba(109, 94, 252, 0.2)'
          }}>
            {button_name || 'Go'}
          </button>
        )}
      </div>
    </li>
  );
}
