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

  // Referral State
  const [referrals, setReferrals] = useState([]);
  const [refLoading, setRefLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('daily');

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
      // Stub - in a real app this comes from backend
      setTasks([
        { id: 1, title: 'Join our Official Channel', reward: 50, type: 'social', link: 'https://t.me/bingoXofficial', actionText: 'Join Channel' },
        { id: 2, title: 'Follow on Twitter', reward: 30, type: 'social', link: '#', actionText: 'Follow' },
        { id: 3, title: 'Play 5 Games', reward: 100, type: 'in-game', progress: 2, target: 5 },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    setRefLoading(true);
    try {
      const res = await apiFetch('/api/referrals', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        setReferrals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'referral') {
      fetchReferrals();
    }
  }, [activeTab]);

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

  const copyReferralLink = () => {
    const link = `https://t.me/bingox2019_bot?start=${user?.id || ''}`;
    navigator.clipboard.writeText(link);
    window.Telegram?.WebApp?.showAlert('Referral link copied!');
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

        {/* Custom Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '4px', borderRadius: '12px', marginBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('daily')}
            style={{ 
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', 
              background: activeTab === 'daily' ? 'var(--brand-1)' : 'transparent',
              color: activeTab === 'daily' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '14px'
            }}
          >
            Daily Tasks
          </button>
          <button 
            onClick={() => setActiveTab('referral')}
            style={{ 
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', 
              background: activeTab === 'referral' ? 'var(--brand-1)' : 'transparent',
              color: activeTab === 'referral' ? '#fff' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '14px'
            }}
          >
            Referrals
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'daily' ? (
          <section className="transaction-list">
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Available Tasks</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading tasks...</div>
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
                      {task.actionText}
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="transaction-list">
            <div style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px' }}>Your Invite Link</div>
              <div 
                onClick={copyReferralLink}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                  background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px', 
                  color: 'var(--brand-1)', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                }}
              >
                https://t.me/bingo... <Copy size={16} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                Earn 10 ETB for every friend who joins and plays!
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Your Referrals</h3>
              <button onClick={fetchReferrals} style={{ background: 'none', border: 'none', color: 'var(--brand-1)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700' }}>
                <RefreshCw size={14} className={refLoading ? 'spin' : ''} /> Refresh
              </button>
            </div>

            {refLoading && referrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : referrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--surface-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                No referrals yet. Share your link to start earning!
              </div>
            ) : (
              referrals.map(ref => (
                <div key={ref.id} className="transaction-item" style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', border: 'none' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{ref.username || 'Anonymous User'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {new Date(ref.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', fontWeight: '800', padding: '4px 8px', borderRadius: '20px',
                    background: ref.status === 'qualified' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                    color: ref.status === 'qualified' ? 'var(--success-color)' : 'var(--warning-color)'
                  }}>
                    {ref.status === 'qualified' ? '+10 ETB Earned' : 'Pending (Needs Deposit)'}
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
