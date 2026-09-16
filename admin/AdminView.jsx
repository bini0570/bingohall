import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, CreditCard, Users, Gift, Tag, Settings, 
  Menu, X, ArrowUpRight, ArrowDownLeft, Activity, RefreshCw, 
  LogOut, CheckCircle2, XCircle, Search, Eye, Zap, DollarSign, Handshake
} from 'lucide-react';
import { io } from 'socket.io-client';
import './AdminTheme.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://bingohall-production.up.railway.app').replace(/\/$/, '');
const apiFetch = async (path, options = {}) => fetch(`${API_BASE}${path}`, options);
let adminSocket = null;

export default function AdminView({ token, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
      case 'dashboard': return <DashboardTab metrics={metrics} deposits={deposits} withdrawals={withdrawals} users={users} gameState={gameState} token={token} flash={flash} refresh={manualRefresh} />;
      case 'payments': return <PaymentsTab deposits={deposits} withdrawals={withdrawals} token={token} onRefresh={fetchData} flash={flash} />;
      case 'users': return <UsersTab users={users} token={token} flash={flash} onRefresh={fetchData} />;
      case 'settings': return <SettingsTab settings={settings} setSettings={setSettings} token={token} flash={flash} />;
      case 'tasks': return <TasksTab token={token} flash={flash} />;
      case 'promos': return <PromosTab token={token} flash={flash} />;
      default: return null;
    }
  };

  const NAV_ITEMS = [
    { label: 'MENU' },
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'payments', icon: CreditCard, label: 'Payments' },
    { key: 'users', icon: Users, label: 'Users' },
    { label: 'FEATURES' },
    { key: 'settings', icon: Settings, label: 'Settings' },
    { key: 'tasks', icon: Tag, label: 'Tasks' },
    { key: 'promos', icon: Gift, label: 'Promos' },
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          CONCEPT
          {sidebarOpen && (
            <button className="admin-menu-btn" style={{ marginLeft: 'auto', color: '#333' }} onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map((item, idx) => {
            if (!item.key) return <div key={idx} className="admin-menu-label">{item.label}</div>;
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <div key={item.key} className={`admin-nav-item ${active ? 'active' : ''}`} onClick={() => { setTab(item.key); setSidebarOpen(false); }}>
                <Icon size={18} /> {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="admin-main">
        {/* NAVBAR */}
        <div className="admin-navbar">
          <div className="admin-nav-left">
            <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <input type="text" className="admin-search" placeholder="Search.." />
          </div>
          <div className="admin-nav-right">
            <button onClick={manualRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
              <RefreshCw size={20} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="admin-content">
          {msg.error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>{msg.error}</div>}
          {msg.success && <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>{msg.success}</div>}
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTab({ metrics, deposits, withdrawals, users, gameState, token, flash, refresh }) {
  const totDep = deposits.filter(d=>d.status==='approved').reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const totWit = withdrawals.filter(w=>w.status==='approved').reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const net = totDep - totWit;

  const gameAction = async (endpoint, successMsg) => {
    try {
      const r = await apiFetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      r.ok ? flash('success', successMsg) : flash('error', d.error || d.message);
      refresh();
    } catch (e) { flash('error', e.message); }
  };

  return (
    <>
      {/* Live Game "Profile" Card */}
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          Live Bingo Game <span style={{ color: '#f59e0b' }}>★★★★★</span>
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
          Round #{gameState?.roundId || '-'} &nbsp;|&nbsp; Status: {gameState?.status || 'Loading'} &nbsp;|&nbsp; 
          {gameState?.status === 'DRAWING' ? ` ${gameState?.calledNumbers?.length||0}/75 Balls` : ` ${gameState?.secondsLeft??'-'}s`}
        </p>

        <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', width: '100%', justifyContent: 'center' }}>
          <div>
            <p style={{ color: '#3b82f6', fontWeight: '700', fontSize: '16px' }}>Br {(gameState?.prizePool||0).toFixed(2)}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Prize Pool</p>
          </div>
          <div>
            <p style={{ color: '#ef4444', fontWeight: '700', fontSize: '16px' }}>{gameState?.totalTickets||0}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Tickets Sold</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => gameAction('/api/admin/game/force-start', 'Draw started!')}>Force Start Game</button>
          <button className="admin-btn admin-btn-outline" onClick={() => gameAction('/api/admin/game/restart-countdown', 'Timer reset!')}>Reset Timer</button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div>
            <div className="admin-kpi-label">Net Revenue</div>
            <div className="admin-kpi-value">{net.toFixed(2)}</div>
          </div>
          <div className="admin-kpi-icon icon-blue"><Eye size={24}/></div>
        </div>
        
        <div className="admin-kpi-card">
          <div>
            <div className="admin-kpi-label">Active Players</div>
            <div className="admin-kpi-value">{users.length}</div>
          </div>
          <div className="admin-kpi-icon icon-purple"><Users size={24}/></div>
        </div>

        <div className="admin-kpi-card">
          <div>
            <div className="admin-kpi-label">Total Deposited</div>
            <div className="admin-kpi-value">{totDep.toFixed(2)}</div>
          </div>
          <div className="admin-kpi-icon icon-pink"><Handshake size={24}/></div>
        </div>

        <div className="admin-kpi-card">
          <div>
            <div className="admin-kpi-label">Total Withdrawn</div>
            <div className="admin-kpi-value">{totWit.toFixed(2)}</div>
          </div>
          <div className="admin-kpi-icon icon-yellow"><DollarSign size={24}/></div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">System Overview</div>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>System Balance: <strong style={{ color: '#111827' }}>Br {parseFloat(metrics?.totalSystemBalance||0).toFixed(2)}</strong></p>
      </div>
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
    <div className="admin-card">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={`admin-btn ${subTab === 'deposits' ? 'admin-btn-primary' : 'admin-btn-outline'}`} onClick={() => setSubTab('deposits')}>Deposits</button>
        <button className={`admin-btn ${subTab === 'withdrawals' ? 'admin-btn-primary' : 'admin-btn-outline'}`} onClick={() => setSubTab('withdrawals')}>Withdrawals</button>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} className="admin-btn" style={{ background: filter === f ? '#f1f5f9' : 'transparent', color: filter === f ? '#000' : '#64748b' }} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: '600' }}>{item.username}</td>
                <td>{item.method} {item.account_number ? `· ${item.account_number}` : ''}</td>
                <td style={{ color: subTab==='deposits' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{parseFloat(item.amount).toFixed(2)}</td>
                <td><span className={`admin-pill pill-${item.status}`}>{item.status}</span></td>
                <td>
                  {item.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="admin-btn admin-btn-success" onClick={() => handleAction(item.id, 'approve')}>Approve</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleAction(item.id, 'reject')}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>No {filter} {subTab}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="admin-card">
      <div style={{ marginBottom: '20px' }}>
        <input className="admin-input" type="text" placeholder="Search username or phone..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '600' }}>{u.username}</td>
                <td>{u.phone}</td>
                <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{parseFloat(u.balance||0).toFixed(2)} ETB</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="admin-btn admin-btn-outline" onClick={() => adjustBal(u.id, 'add')}>+ Add</button>
                    <button className="admin-btn admin-btn-outline" onClick={() => adjustBal(u.id, 'deduct')}>- Deduct</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      if (r.ok) flash('success', 'All settings saved to database successfully!');
      else flash('error', (await r.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div className="admin-card">
        <div className="admin-card-header">🏦 Payment Methods</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Telebirr Name</label>
            <input className="admin-input" type="text" value={settings.telebirr_name||''} onChange={e=>handleChange('telebirr_name', e.target.value)} placeholder="e.g. Biniyam Eyoel" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Telebirr Number</label>
            <input className="admin-input" type="text" value={settings.telebirr_number||''} onChange={e=>handleChange('telebirr_number', e.target.value)} placeholder="e.g. 0993994168" />
          </div>
          <hr style={{ border: 0, borderTop: '1px solid #f1f5f9' }} />
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>CBE Birr Name</label>
            <input className="admin-input" type="text" value={settings.cbebirr_name||''} onChange={e=>handleChange('cbebirr_name', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>CBE Birr Number</label>
            <input className="admin-input" type="text" value={settings.cbebirr_number||''} onChange={e=>handleChange('cbebirr_number', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">💸 Limits & Bonuses</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Min Deposit</label>
              <input className="admin-input" type="number" value={settings.min_deposit||'50'} onChange={e=>handleChange('min_deposit', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Min Withdraw</label>
              <input className="admin-input" type="number" value={settings.min_withdraw||'100'} onChange={e=>handleChange('min_withdraw', e.target.value)} />
            </div>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid #f1f5f9' }} />
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Registration Bonus (ETB)</label>
            <input className="admin-input" type="number" value={settings.reg_bonus_amount||'20'} onChange={e=>handleChange('reg_bonus_amount', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.reg_bonus_enabled === 'true'} onChange={e=>handleChange('reg_bonus_enabled', e.target.checked ? 'true' : 'false')} />
              Enable Registration Bonus
            </label>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">🎰 Game Rules</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Ticket Price (Stake Amount)</label>
            <input className="admin-input" type="number" value={settings.ticket_price||''} onChange={e=>handleChange('ticket_price', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Min Cartellas</label>
              <input className="admin-input" type="number" value={settings.min_cartellas||'1'} onChange={e=>handleChange('min_cartellas', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Max Cartellas</label>
              <input className="admin-input" type="number" value={settings.max_cartellas||'4'} onChange={e=>handleChange('max_cartellas', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>House Commission (%)</label>
            <input className="admin-input" type="number" value={settings.commission_pct||''} onChange={e=>handleChange('commission_pct', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Draw Speed (sec/ball)</label>
            <input className="admin-input" type="number" value={settings.draw_speed_sec||''} onChange={e=>handleChange('draw_speed_sec', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="admin-btn admin-btn-primary" style={{ padding: '12px 32px', fontSize: '16px' }} onClick={save}>💾 Save All Settings</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
function TasksTab({ token, flash }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ platform: 'telegram', link: '', reward_amount: '' });

  const loadTasks = async () => {
    try {
      const r = await apiFetch('/api/admin/tasks', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setTasks(d);
    } catch(e) {}
  };
  
  useEffect(() => { loadTasks(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await apiFetch('/api/admin/tasks', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, reward_amount: parseFloat(form.reward_amount) }) });
      if (r.ok) { flash('success', 'Task added!'); setForm({ platform: 'telegram', link: '', reward_amount: '' }); loadTasks(); }
      else flash('error', 'Failed to add');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    await apiFetch(`/api/admin/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    flash('success', 'Task deleted');
    loadTasks();
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">Add New Task</div>
        <form onSubmit={add} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={form.platform} onChange={e=>setForm({...form, platform: e.target.value})} className="admin-input" style={{ width: 'auto' }}>
            <option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option>
          </select>
          <input placeholder="Link URL" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} className="admin-input" style={{ flex: 1, minWidth: '200px' }} required />
          <input type="number" placeholder="Reward ETB" value={form.reward_amount} onChange={e=>setForm({...form, reward_amount: e.target.value})} className="admin-input" style={{ width: '120px' }} required />
          <button className="admin-btn admin-btn-primary" disabled={loading}>Add Task</button>
        </form>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">Active Tasks</div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Link</th>
              <th>Reward</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{t.platform}</td>
                <td style={{ color: '#64748b' }}>{t.link}</td>
                <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{t.reward_amount} ETB</td>
                <td><button className="admin-btn admin-btn-danger" onClick={() => remove(t.id)}>Delete</button></td>
              </tr>
            ))}
            {tasks.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>No tasks found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOS
// ─────────────────────────────────────────────────────────────────────────────
function PromosTab({ token, flash }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: '', reward: '', uses_limit: '' });

  const loadPromos = async () => {
    try {
      const r = await apiFetch('/api/admin/promos', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setPromos(d);
    } catch(e) {}
  };
  
  useEffect(() => { loadPromos(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await apiFetch('/api/admin/promos', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, reward: parseFloat(form.reward), uses_limit: parseInt(form.uses_limit) }) });
      if (r.ok) { flash('success', 'Promo added!'); setForm({ code: '', reward: '', uses_limit: '' }); loadPromos(); }
      else flash('error', 'Failed to add');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    await apiFetch(`/api/admin/promos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    flash('success', 'Promo deleted');
    loadPromos();
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">Add Promo Code</div>
        <form onSubmit={add} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Code (e.g. VIP20)" value={form.code} onChange={e=>setForm({...form, code: e.target.value.toUpperCase()})} className="admin-input" style={{ flex: 1, minWidth: '150px' }} required />
          <input type="number" placeholder="Reward ETB" value={form.reward} onChange={e=>setForm({...form, reward: e.target.value})} className="admin-input" style={{ width: '120px' }} required />
          <input type="number" placeholder="Usage Limit" value={form.uses_limit} onChange={e=>setForm({...form, uses_limit: e.target.value})} className="admin-input" style={{ width: '120px' }} required />
          <button className="admin-btn admin-btn-primary" disabled={loading}>Add Promo</button>
        </form>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">Active Promos</div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Usage Limit</th>
              <th>Reward</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: '800', color: '#1d4ed8' }}>{p.code}</td>
                <td style={{ color: '#64748b' }}>{p.uses_limit}</td>
                <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{p.reward} ETB</td>
                <td><button className="admin-btn admin-btn-danger" onClick={() => remove(p.id)}>Delete</button></td>
              </tr>
            ))}
            {promos.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>No promos found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
