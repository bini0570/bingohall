import { useState, useEffect } from 'react';
import { Check, Gift, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';

export default function TasksView({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Daily Reward State
  const [streak, setStreak] = useState(1);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Load state from localStorage on mount
    const savedStreak = parseInt(localStorage.getItem('bingo_streak') || '1');
    const savedCooldown = parseInt(localStorage.getItem('bingo_cooldown') || '0');
    
    // Check if cooldown expired multiple days ago (reset streak)
    if (savedCooldown && Date.now() > savedCooldown + (24 * 60 * 60 * 1000)) {
      setStreak(1);
      setCooldownEnd(0);
    } else {
      setStreak(savedStreak);
      setCooldownEnd(savedCooldown);
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiFetch('/api/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        // Filter out any task related to invites if the backend returns them, though we just display admin tasks.
        // Wait, the prompt says "Only tasks actually created from the Admin Panel are displayed."
        // We will just set tasks directly from the API.
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cooldownEnd || cooldownEnd < Date.now()) {
      setTimeLeft('');
      return;
    }
    
    const tick = () => {
      const diff = cooldownEnd - Date.now();
      if (diff <= 0) {
        setTimeLeft('');
        setCooldownEnd(0);
        return;
      }
      
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`);
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleClaim = async () => {
    if (timeLeft) return;
    
    const nextStreak = streak >= 7 ? 1 : streak + 1;
    const reward = streak === 7 ? 10 : streak;
    
    // Call backend to credit wallet
    try {
      await apiFetch('/api/user/claim-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reward })
      });
    } catch (err) {
      console.error('Failed to claim daily reward', err);
    }
    
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
    setTimeLeft(`${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`);
    
    // Emit custom event so App.jsx re-fetches profile to update balance
    window.dispatchEvent(new Event('profileUpdated'));
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
            className="deposit-btn" 
            style={{ width: '100%', marginTop: '16px', background: timeLeft ? 'rgba(0,0,0,0.2)' : undefined, color: timeLeft ? '#fff' : undefined }}
            onClick={handleClaim}
            disabled={!!timeLeft}
          >
            {timeLeft ? 
              `Next Reward in ${timeLeft}` : 
              'Claim Reward'
            }
          </button>
        </section>

        <section className="transaction-list" style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Available Tasks</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--surface-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              No active tasks available right now.
            </div>
          ) : tasks.map(task => (
            <div key={task.id} className="transaction-item" style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', border: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{task.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--brand-1)', fontWeight: '800', marginTop: '4px' }}>+{task.reward} ETB</div>
                  </div>
                  {task.type === 'in-game' && task.progress !== undefined && (
                    <div style={{ fontSize: '12px', fontWeight: '800', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '20px' }}>
                      {task.progress}/{task.target}
                    </div>
                  )}
                </div>
                
                {task.type === 'social' && (
                  <button className="action-btn" style={{ width: '100%', background: 'rgba(255, 69, 58, 0.1)', color: 'var(--brand-1)' }} onClick={() => window.open(task.link, '_blank')}>
                    {task.actionText || 'Complete Task'}
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
