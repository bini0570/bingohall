import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, CreditCard, Users, Gift, Tag, Radio, 
  Settings, AlertOctagon, Menu, X, ArrowUpRight, ArrowDownLeft, 
  Activity, RefreshCw, LogOut, CheckCircle2, XCircle, Search, Eye,
  Home, Zap, Send
} from 'lucide-react';
import { io } from 'socket.io-client';
import './WalletView.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://bingohall-production.up.railway.app').replace(/\/$/, '');
const apiFetch = async (path, options = {}) => fetch(`${API_BASE}${path}`, options);
let adminSocket = null;

// Reusable UI
const S = {
  pill: (status) => {
    const map = {
      pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
      approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
      rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
      DRAWING: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
      COUNTDOWN: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
      WAITING: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    };
    const s = map[status] || map.pending;
    return { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` };
  },
  btn: (v = 'primary') => {
    const bg = v === 'primary' ? 'var(--brand-1)' : v === 'success' ? '#10b981' : v === 'danger' ? '#ef4444' : 'rgba(255,255,255,0.05)';
    return {
      background: bg, color: v === 'ghost' ? '#9CA3AF' : '#fff', border: v === 'ghost' ? '1px solid rgba(255,255,255,0.1)' : 'none',
      padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', width: '100%'
    };
  }
};

export default function AdminView({ token, onLogout, onBack }) {
  const [tab, setTab] = useState('dashboard');
  
  // Data State
  const [metrics, setMetrics] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ ticket_price: '10', commission_pct: '20', countdown_sec: '40', draw_speed_sec: '3' });

  // UI State
  const [msg, setMsg] = useState({ error: '', success: '' });
  const [refreshing, setRefreshing] = useState(false);

  const flash = (key, text) => {
    setMsg({ error: '', success: '', [key]: text });
    setTimeout(() => setMsg({ error: '', success: '' }), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [mR, dR, wR, uR, sR, gR] = await Promise.all([
        apiFetch('/api/admin/metrics', { headers: h }),
        apiFetch('/api/admin/deposits', { headers: h }),
        apiFetch('/api/admin/withdrawals', { headers: h }),
        apiFetch('/api/admin/users', { headers: h }),
        apiFetch('/api/admin/settings', { headers: h }),
        apiFetch('/api/game/state'),
      ]);
      if (mR.ok) setMetrics(await mR.json());
      if (dR.ok) setDeposits(await dR.json());
      if (wR.ok) setWithdrawals(await wR.json());
      if (uR.ok) setUsers(await uR.json());
      if (sR.ok) setSettings(await sR.json());
      if (gR.ok) setGameState(await gR.json());
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    adminSocket = io(API_BASE || window.location.origin, { transports: ['websocket', 'polling'] });
    adminSocket.on('admin_data_changed', fetchData);
    adminSocket.on('balance_updated', fetchData);
    adminSocket.on('round_state', (state) => setGameState(state));
    adminSocket.on('countdown_tick', (d) => setGameState(prev => prev ? { ...prev, secondsLeft: d.secondsLeft } : prev));
    adminSocket.on('round_ended', fetchData);
    return () => {
      clearInterval(interval);
      if (adminSocket) { adminSocket.disconnect(); adminSocket = null; }
    };
  }, [fetchData]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardTab metrics={metrics} deposits={deposits} withdrawals={withdrawals} users={users} />;
      case 'game': return <LiveGameTab gameState={gameState} token={token} flash={flash} refresh={manualRefresh} settings={settings} />;
      case 'payments': return <PaymentsTab deposits={deposits} withdrawals={withdrawals} token={token} onRefresh={fetchData} flash={flash} />;
      case 'users': return <UsersTab users={users} token={token} flash={flash} onRefresh={fetchData} />;
      case 'settings': return <SettingsTab settings={settings} setSettings={setSettings} token={token} flash={flash} />;
      default: return null;
    }
  };

  return (
    <div className="wallet-wrapper" style={{ paddingBottom: '70px', background: 'var(--bg-main)' }}>
      <main className="wallet-card">
        
        <header className="wallet__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="greeting__label">Admin Portal</p>
            <p className="greeting__name">Bingo Hall</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={manualRefresh} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
              <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onLogout} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {msg.error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>{msg.error}</div>}
        {msg.success && <div style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', padding: '12px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>{msg.success}</div>}

        {renderTab()}

      </main>

      <nav className="mobile-bottom-nav" style={{ display: 'flex' }}>
        {[
          { key: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
          { key: 'game', icon: Zap, label: 'Game' },
          { key: 'payments', icon: CreditCard, label: 'Payments', badge: deposits.filter(d=>d.status==='pending').length + withdrawals.filter(w=>w.status==='pending').length },
          { key: 'users', icon: Users, label: 'Users' },
          { key: 'settings', icon: Settings, label: 'Settings' }
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} className={`mobile-nav-item ${active ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <div style={{ position: 'relative' }}>
                <Icon size={20} />
                {t.badge > 0 && <span style={{ position: 'absolute', top: -5, right: -10, background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '2px 5px', borderRadius: '10px' }}>{t.badge}</span>}
              </div>
              <span style={{ marginTop: '4px' }}>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTab({ metrics, deposits, withdrawals, users }) {
  const totDep = deposits.filter(d=>d.status==='approved').reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const totWit = withdrawals.filter(w=>w.status==='approved').reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const net = totDep - totWit;

  return (
    <>
      <section className="total-card" aria-label="Total Revenue">
        <div className="total-card__top">
          <div>
            <p className="total-card__label" style={{ color: 'rgba(255,255,255,0.7)' }}>Net Revenue</p>
            <p className="total-card__amount" style={{ color: '#fff' }}>
              <span>Br</span><span style={{ color: '#fff' }}>{net.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </p>
          </div>
        </div>
        <div className="total-card__meta">
          <div className="total-card__chip" />
          <span className="total-card__number">System Income</span>
        </div>
      </section>

      <section className="split" aria-label="Deposit/Withdrawal Stats" style={{ marginTop: '16px' }}>
        <article className="bal bal--withdraw">
          <div className="bal__head">
            <span className="bal__icon"><ArrowDownLeft size={13} /></span>
            <p className="bal__label">Total Deposited</p>
          </div>
          <p className="bal__amount">Br {totDep.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
        </article>
        <article className="bal bal--locked">
          <div className="bal__head">
            <span className="bal__icon"><ArrowUpRight size={13} /></span>
            <p className="bal__label">Total Withdrawn</p>
          </div>
          <p className="bal__amount">Br {totWit.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
        </article>
      </section>

      <div className="section-head" style={{ marginTop: '24px' }}>
        <h2>Platform Metrics</h2>
      </div>
      <div className="transactions-wrap" style={{ height: 'auto', paddingBottom: '20px' }}>
        <ul className="transactions">
          <li className="tx">
            <span className="tx__avatar" style={{ background: 'var(--brand-1)' }}><Users size={16} /></span>
            <div className="tx__body">
              <p className="tx__name">Active Players</p>
              <p className="tx__meta">Registered users</p>
            </div>
            <span className="tx__amount" style={{ color: '#fff' }}>{users.length}</span>
          </li>
          <li className="tx">
            <span className="tx__avatar" style={{ background: '#10b981' }}><Activity size={16} /></span>
            <div className="tx__body">
              <p className="tx__name">System Balance</p>
              <p className="tx__meta">Total user balances</p>
            </div>
            <span className="tx__amount" style={{ color: '#10b981' }}>{parseFloat(metrics?.totalSystemBalance||0).toFixed(2)}</span>
          </li>
        </ul>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE GAME
// ─────────────────────────────────────────────────────────────────────────────
function LiveGameTab({ gameState, token, flash, refresh, settings }) {
  const gameAction = async (endpoint, successMsg) => {
    try {
      const r = await apiFetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      r.ok ? flash('success', successMsg) : flash('error', d.error || d.message);
      refresh();
    } catch (e) { flash('error', e.message); }
  };

  if (!gameState) return <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>Loading game state...</div>;

  return (
    <>
      <section className="total-card" aria-label="Game Status" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <div className="total-card__top">
          <div>
            <p className="total-card__label" style={{ color: 'rgba(255,255,255,0.7)' }}>Live Game · Round #{gameState.roundId || '-'}</p>
            <p className="total-card__amount" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={S.pill(gameState.status)}>{gameState.status}</span>
              <span style={{ fontSize: '24px', color: '#fff' }}>
                {gameState.status === 'DRAWING' ? `${gameState.calledNumbers?.length||0}/75 Balls` : `${gameState.secondsLeft??'-'}s`}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="split" aria-label="Game Stats" style={{ marginTop: '16px' }}>
        <article className="bal bal--withdraw" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="bal__head"><p className="bal__label" style={{ color: '#10b981' }}>Prize Pool</p></div>
          <p className="bal__amount" style={{ color: '#10b981' }}>Br {(gameState.prizePool||0).toFixed(2)}</p>
        </article>
        <article className="bal bal--locked" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="bal__head"><p className="bal__label" style={{ color: '#60a5fa' }}>Tickets Sold</p></div>
          <p className="bal__amount" style={{ color: '#60a5fa' }}>{gameState.totalTickets||0}</p>
        </article>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
        <button style={S.btn('primary')} onClick={() => gameAction('/api/admin/game/force-start', 'Draw started!')}><Zap size={16}/> Force Start</button>
        <button style={S.btn('success')} onClick={() => gameAction('/api/admin/game/restart-countdown', 'Timer reset!')}><RefreshCw size={16}/> Reset Timer</button>
      </div>

      {gameState.calledNumbers?.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div className="section-head"><h2>Called Numbers</h2></div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {gameState.calledNumbers.map(n => {
              const letter = n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O';
              return (
                <div key={n} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                  <span style={{ fontSize: '8px', color: '#9CA3AF' }}>{letter}</span><span style={{ color: '#fff' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
function PaymentsTab({ deposits, withdrawals, token, onRefresh, flash }) {
  const [subTab, setSubTab] = useState('deposits');
  const [filter, setFilter] = useState('pending');
  
  const activeData = subTab === 'deposits' ? deposits : withdrawals;
  const filtered = activeData.filter(d => filter === 'all' || d.status === filter).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const handleAction = async (id, action) => {
    try {
      const res = await apiFetch(`/api/admin/${subTab}/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { onRefresh(); flash('success', 'Action completed successfully.'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={{ ...S.btn(subTab === 'deposits' ? 'primary' : 'ghost'), flex: 1 }} onClick={() => setSubTab('deposits')}>Deposits</button>
        <button style={{ ...S.btn(subTab === 'withdrawals' ? 'primary' : 'ghost'), flex: 1 }} onClick={() => setSubTab('withdrawals')}>Withdrawals</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', overflowX: 'auto', marginBottom: '16px' }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#000' : '#9CA3AF', fontWeight: '700', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize', flexShrink: 0 }}>{f}</button>
        ))}
      </div>

      <div className="transactions-wrap" style={{ height: 'auto', paddingBottom: '20px' }}>
        <ul className="transactions">
          {filtered.length === 0 ? <li className="tx-empty" style={{ border: 'none' }}>No {filter} {subTab}.</li> : filtered.map(item => (
            <li className="tx" key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="tx__avatar" style={{ background: subTab === 'deposits' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: subTab === 'deposits' ? '#10b981' : '#ef4444' }}>
                    {subTab === 'deposits' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </span>
                  <div>
                    <p className="tx__name" style={{ fontSize: '15px' }}>{item.username}</p>
                    <p className="tx__meta" style={{ marginTop: '2px' }}>{item.method} {item.account_number ? `· ${item.account_number}` : ''}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className={`tx__amount tx__amount--${subTab === 'deposits' ? 'up' : 'down'}`} style={{ fontSize: '16px' }}>{parseFloat(item.amount).toFixed(2)}</p>
                  <span style={{ ...S.pill(item.status), marginTop: '4px', display: 'inline-block' }}>{item.status}</span>
                </div>
              </div>
              
              {item.receipt_sms && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {item.receipt_sms}
                </div>
              )}

              {item.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button style={S.btn('danger')} onClick={() => handleAction(item.id, 'reject')}><XCircle size={16}/> Reject</button>
                  <button style={S.btn('success')} onClick={() => handleAction(item.id, 'approve')}><CheckCircle2 size={16}/> Approve</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
function UsersTab({ users, token, flash, onRefresh }) {
  const [search, setSearch] = useState('');
  
  const filtered = users.filter(u => (u.username||'').toLowerCase().includes(search.toLowerCase()) || (u.phone||'').includes(search));

  const adjustBal = async (uid, action) => {
    const amt = prompt(`Enter amount to ${action}:`);
    if (!amt || isNaN(amt) || amt <= 0) return;
    try {
      const res = await apiFetch(`/api/admin/users/${uid}/balance`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, amount: parseFloat(amt) }) });
      if (res.ok) { onRefresh(); flash('success', 'Balance updated'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <>
      <div className="field">
        <input className="input-field" type="text" placeholder="Search username or phone..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="transactions-wrap" style={{ height: 'auto', paddingBottom: '20px', marginTop: '16px' }}>
        <ul className="transactions">
          {filtered.map(u => (
            <li className="tx" key={u.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="tx__avatar" style={{ background: 'var(--brand-1)', color: '#fff' }}>{u.username?u.username[0].toUpperCase():'?'}</span>
                  <div>
                    <p className="tx__name" style={{ fontSize: '15px' }}>{u.username}</p>
                    <p className="tx__meta" style={{ marginTop: '2px' }}>{u.phone}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="tx__amount" style={{ color: '#10b981' }}>{parseFloat(u.balance||0).toFixed(2)}</p>
                  <p className="tx__meta">ETB</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={S.btn('ghost')} onClick={() => adjustBal(u.id, 'add')}>+ Add</button>
                <button style={S.btn('ghost')} onClick={() => adjustBal(u.id, 'deduct')}>- Deduct</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings, token, flash }) {
  const handleChange = (k, v) => setSettings(p => ({ ...p, [k]: v }));
  
  const save = async () => {
    try {
      const r = await apiFetch('/api/admin/settings', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (r.ok) flash('success', 'Settings saved!');
      else flash('error', (await r.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="field">
        <label className="field__label">Ticket Price (ETB)</label>
        <input className="input-field" type="number" value={settings.ticket_price||''} onChange={e=>handleChange('ticket_price', e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">House Commission (%)</label>
        <input className="input-field" type="number" value={settings.commission_pct||''} onChange={e=>handleChange('commission_pct', e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">Countdown Duration (sec)</label>
        <input className="input-field" type="number" value={settings.countdown_sec||''} onChange={e=>handleChange('countdown_sec', e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label">Draw Speed (sec per ball)</label>
        <input className="input-field" type="number" value={settings.draw_speed_sec||''} onChange={e=>handleChange('draw_speed_sec', e.target.value)} />
      </div>
      <button style={{ ...S.btn('primary'), marginTop: '8px' }} onClick={save}>Save Settings</button>
    </div>
  );
}
