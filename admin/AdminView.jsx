import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, CreditCard, Users, Gift, Tag, Menu, RefreshCw, LogOut, CheckCircle2, XCircle, Search, TrendingUp, TrendingDown, Zap, Sun, Moon, Activity, Gamepad2, Wallet } from 'lucide-react';
import { io } from 'socket.io-client';
import './AdminTheme.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://bingohall-production.up.railway.app').replace(/\/$/, '');
const apiFetch = async (path, options = {}) => fetch(`${API_BASE}${path}`, options);
let adminSocket = null;

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Overview of your platform' },
  payments:  { title: 'Payments',  sub: 'Manage deposits & withdrawals' },
  users:     { title: 'Players',   sub: 'Player accounts & balances' },
  tasks:     { title: 'Tasks',     sub: 'Social engagement tasks' },
  promos:    { title: 'Promos',    sub: 'Promo codes & bonuses' },
};

export default function AdminView({ token, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'dark');
  const [metrics, setMetrics]       = useState(null);
  const [gameState, setGameState]   = useState(null);
  const [deposits, setDeposits]     = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers]           = useState([]);
  const [msg, setMsg]               = useState({ error: '', success: '' });
  const [refreshing, setRefreshing] = useState(false);

  const flash = (key, text) => {
    setMsg({ error: '', success: '', [key]: text });
    setTimeout(() => setMsg({ error: '', success: '' }), 4000);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('admin_theme', next);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [mR, dR, wR, uR, gR] = await Promise.all([
        apiFetch('/api/admin/metrics',     { headers: h }),
        apiFetch('/api/admin/deposits',    { headers: h }),
        apiFetch('/api/admin/withdrawals', { headers: h }),
        apiFetch('/api/admin/users',       { headers: h }),
        apiFetch('/api/game/state'),
      ]);
      if (mR.ok) setMetrics(await mR.json());
      if (dR.ok) setDeposits(await dR.json());
      if (wR.ok) setWithdrawals(await wR.json());
      if (uR.ok) setUsers(await uR.json());
      if (gR.ok) setGameState(await gR.json());
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    adminSocket = io(API_BASE || window.location.origin, { transports: ['websocket', 'polling'] });
    adminSocket.on('admin_data_changed', fetchData);
    adminSocket.on('balance_updated', fetchData);
    adminSocket.on('round_state', (s) => setGameState(s));
    adminSocket.on('countdown_tick', (d) => setGameState(prev => prev ? { ...prev, secondsLeft: d.secondsLeft } : prev));
    adminSocket.on('round_ended', fetchData);
    return () => { clearInterval(interval); if (adminSocket) { adminSocket.disconnect(); adminSocket = null; } };
  }, [fetchData]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const NAV = [
    { label: 'MAIN' },
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'payments',  icon: CreditCard,      label: 'Payments' },
    { key: 'users',     icon: Users,           label: 'Players' },
    { label: 'TOOLS' },
    { key: 'tasks',  icon: Tag,  label: 'Tasks' },
    { key: 'promos', icon: Gift, label: 'Promos' },
  ];

  const pageInfo = PAGE_TITLES[tab] || PAGE_TITLES.dashboard;

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardTab metrics={metrics} deposits={deposits} withdrawals={withdrawals} users={users} gameState={gameState} token={token} flash={flash} refresh={manualRefresh} />;
      case 'payments':  return <PaymentsTab deposits={deposits} withdrawals={withdrawals} token={token} onRefresh={fetchData} flash={flash} />;
      case 'users':     return <UsersTab users={users} token={token} flash={flash} onRefresh={fetchData} />;
      case 'tasks':     return <TasksTab token={token} flash={flash} />;
      case 'promos':    return <PromosTab token={token} flash={flash} />;
      default: return null;
    }
  };

  return (
    <div className={`admin-root theme-${theme}`}>
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎯</div>
          <span className="sidebar-logo-text">BingoX</span>
          <span className="sidebar-logo-badge">ADMIN</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            if (!item.key) return <div key={i} className="nav-section-label">{item.label}</div>;
            const Icon = item.icon;
            return (
              <div key={item.key} className={`nav-item ${tab === item.key ? 'active' : ''}`}
                onClick={() => { setTab(item.key); setSidebarOpen(false); }}>
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-item" onClick={onLogout} style={{ color: 'var(--red)' }}>
            <LogOut size={16} /> Sign Out
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div>
              <div className="header-page-title">{pageInfo.title}</div>
              <div className="header-page-sub">{pageInfo.sub}</div>
            </div>
          </div>
          <div className="header-right">
            <button className={`header-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={manualRefresh} title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button className="header-icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="header-icon-btn" onClick={onLogout} title="Sign out" style={{ color: 'var(--red)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="admin-content fade-in">
          {msg.error   && <div className="toast-bar error"><XCircle size={16} />{msg.error}</div>}
          {msg.success && <div className="toast-bar success"><CheckCircle2 size={16} />{msg.success}</div>}
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ metrics, deposits, withdrawals, users, gameState, token, flash, refresh }) {
  const totDep = deposits.filter(d => d.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const totWit = withdrawals.filter(w => w.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const net = totDep - totWit;
  const pendingDep = deposits.filter(d => d.status === 'pending').length;
  const pendingWit = withdrawals.filter(w => w.status === 'pending').length;
  const isLive = gameState?.status === 'DRAWING';

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
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-soft)' }}><TrendingUp size={20} color="var(--green)" /></div>
          <div className="kpi-label">Total Deposited</div>
          <div className="kpi-value">Br {totDep.toFixed(0)}</div>
          <div className="kpi-sub">{deposits.filter(d=>d.status==='approved').length} transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-soft)' }}><TrendingDown size={20} color="var(--red)" /></div>
          <div className="kpi-label">Total Withdrawn</div>
          <div className="kpi-value">Br {totWit.toFixed(0)}</div>
          <div className="kpi-sub">{withdrawals.filter(w=>w.status==='approved').length} transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--accent-soft)' }}><Wallet size={20} color="var(--accent)" /></div>
          <div className="kpi-label">Net Revenue</div>
          <div className="kpi-value" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>Br {net.toFixed(0)}</div>
          <div className="kpi-sub">Deposits minus withdrawals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--blue-soft)' }}><Users size={20} color="var(--blue)" /></div>
          <div className="kpi-label">Players</div>
          <div className="kpi-value">{users.length}</div>
          <div className="kpi-sub">Registered accounts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--amber-soft)' }}><Activity size={20} color="var(--amber)" /></div>
          <div className="kpi-label">Pending Actions</div>
          <div className="kpi-value">{pendingDep + pendingWit}</div>
          <div className="kpi-sub">{pendingDep} deposits · {pendingWit} withdrawals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: isLive ? 'var(--green-soft)' : 'var(--amber-soft)' }}><Gamepad2 size={20} color={isLive ? 'var(--green)' : 'var(--amber)'} /></div>
          <div className="kpi-label">Game Status</div>
          <div className="kpi-value" style={{ fontSize: '16px' }}><span className="live-dot" />{gameState?.status || 'WAITING'}</div>
          <div className="kpi-sub">Round #{gameState?.roundId || '-'} · Br {(gameState?.prizePool||0).toFixed(0)} pool</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Game Control</div>
            <div className="card-subtitle">
              {isLive ? `Drawing — ${gameState?.calledNumbers?.length||0}/75 balls` : `Countdown — ${gameState?.secondsLeft??'-'}s remaining`}
            </div>
          </div>
          <span className={`badge ${isLive ? 'badge-approved' : 'badge-pending'}`}>{isLive ? '● LIVE' : '● WAITING'}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="stat-row"><span className="stat-row-label">Prize Pool</span><span className="stat-row-value" style={{ color: 'var(--green)' }}>Br {(gameState?.prizePool||0).toFixed(2)}</span></div>
            <div className="stat-row"><span className="stat-row-label">Tickets Sold</span><span className="stat-row-value">{gameState?.totalTickets||0}</span></div>
            <div className="stat-row"><span className="stat-row-label">System Balance</span><span className="stat-row-value">Br {parseFloat(metrics?.totalSystemBalance||0).toFixed(2)}</span></div>
          </div>
          <div className="game-actions">
            <button className="btn btn-primary" onClick={() => gameAction('/api/admin/game/force-start', 'Draw started!')}><Zap size={14} /> Force Start</button>
            <button className="btn btn-ghost" onClick={() => gameAction('/api/admin/game/restart-countdown', 'Timer reset!')}><RefreshCw size={14} /> Reset Timer</button>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Deposits</div><span className="badge badge-accent">{pendingDep} pending</span></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {deposits.slice(0,5).map(d => (
                  <tr key={d.id}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div className="avatar">{(d.username||'?')[0].toUpperCase()}</div>{d.username}</div></td>
                    <td style={{ fontWeight:600, color:'var(--green)' }}>+Br {parseFloat(d.amount).toFixed(0)}</td>
                    <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                  </tr>
                ))}
                {deposits.length===0 && <tr><td colSpan="3"><div className="empty-state"><div className="empty-state-text">No deposits yet</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Withdrawals</div><span className="badge badge-pending">{pendingWit} pending</span></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {withdrawals.slice(0,5).map(w => (
                  <tr key={w.id}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div className="avatar">{(w.username||'?')[0].toUpperCase()}</div>{w.username}</div></td>
                    <td style={{ fontWeight:600, color:'var(--red)' }}>-Br {parseFloat(w.amount).toFixed(0)}</td>
                    <td><span className={`badge badge-${w.status}`}>{w.status}</span></td>
                  </tr>
                ))}
                {withdrawals.length===0 && <tr><td colSpan="3"><div className="empty-state"><div className="empty-state-text">No withdrawals yet</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function PaymentsTab({ deposits, withdrawals, token, onRefresh, flash }) {
  const [subTab, setSubTab] = useState('deposits');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const activeData = subTab === 'deposits' ? deposits : withdrawals;
  const filtered = activeData
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => !search || (d.username||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const handleAction = async (id, action) => {
    try {
      const res = await apiFetch(`/api/admin/${subTab}/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { onRefresh(); flash('success', 'Action completed.'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <div className="card">
      <div className="section-header">
        <div><div className="section-title">Payments Manager</div><div className="section-sub">{filtered.length} records</div></div>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-wrap"><Search size={14} color="var(--text-muted)" /><input placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="filter-tabs">
            {['deposits','withdrawals'].map(t => <button key={t} className={`filter-tab ${subTab===t?'active':''}`} onClick={() => setSubTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
          </div>
          <div className="filter-tabs">
            {['pending','approved','rejected','all'].map(f => <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
          </div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>User</th><th>Method</th><th>Amount</th>{subTab==='withdrawals'&&<th>Account</th>}<th>Receipt</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td><div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div className="avatar">{(item.username||'?')[0].toUpperCase()}</div><div><div style={{ fontWeight:600 }}>{item.username}</div><div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{item.phone}</div></div></div></td>
                <td><span className="badge badge-blue">{item.method||'—'}</span></td>
                <td style={{ fontWeight:700, color: subTab==='deposits'?'var(--green)':'var(--red)' }}>{subTab==='deposits'?'+':'-'}Br {parseFloat(item.amount).toFixed(2)}</td>
                {subTab==='withdrawals'&&<td style={{ color:'var(--text-secondary)' }}>{item.account_number||'—'}</td>}
                <td style={{ maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-secondary)', fontSize:'12px' }}>{item.receipt_sms||'—'}</td>
                <td style={{ color:'var(--text-muted)', fontSize:'12px' }}>{item.created_at?new Date(item.created_at).toLocaleDateString():'—'}</td>
                <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                <td>{item.status==='pending'&&<div style={{ display:'flex', gap:'6px' }}><button className="btn btn-success" onClick={() => handleAction(item.id,'approve')}><CheckCircle2 size={13}/> Approve</button><button className="btn btn-danger" onClick={() => handleAction(item.id,'reject')}><XCircle size={13}/> Reject</button></div>}</td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No {filter} {subTab}</div></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab({ users, token, flash, onRefresh }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => (u.username||'').toLowerCase().includes(search.toLowerCase()) || (u.phone||'').includes(search));

  const adjustBal = async (uid, action) => {
    const amt = prompt(`Enter amount to ${action}:`);
    if (!amt || isNaN(amt) || amt <= 0) return;
    try {
      const res = await apiFetch(`/api/admin/users/${uid}/balance`, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ action, amount: parseFloat(amt) }) });
      if (res.ok) { onRefresh(); flash('success', 'Balance updated'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <div className="card">
      <div className="section-header">
        <div><div className="section-title">Players</div><div className="section-sub">{filtered.length} of {users.length} players</div></div>
        <div className="search-wrap"><Search size={14} color="var(--text-muted)" /><input placeholder="Search username or phone..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Player</th><th>Phone</th><th>Balance</th><th>Withdrawable</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><div style={{ display:'flex', alignItems:'center', gap:'10px' }}><div className="avatar">{(u.username||'?')[0].toUpperCase()}</div><div><div style={{ fontWeight:600 }}>{u.username}</div><div style={{ fontSize:'11px', color:'var(--text-muted)' }}>ID #{u.id}</div></div></div></td>
                <td style={{ color:'var(--text-secondary)' }}>{u.phone||'—'}</td>
                <td style={{ fontWeight:700, color:'var(--green)' }}>Br {parseFloat(u.balance||0).toFixed(2)}</td>
                <td style={{ color:'var(--text-secondary)' }}>Br {parseFloat(u.withdrawable_balance||0).toFixed(2)}</td>
                <td><span className={`badge ${u.is_banned?'badge-rejected':'badge-active'}`}>{u.is_banned?'Banned':'Active'}</span></td>
                <td><div style={{ display:'flex', gap:'6px' }}><button className="btn btn-success" style={{ padding:'6px 10px', fontSize:'12px' }} onClick={() => adjustBal(u.id,'add')}>+ Add</button><button className="btn btn-danger" style={{ padding:'6px 10px', fontSize:'12px' }} onClick={() => adjustBal(u.id,'deduct')}>- Deduct</button></div></td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-text">No players found</div></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksTab({ token, flash }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ platform:'telegram', link:'', reward_amount:'' });

  const loadTasks = async () => { try { const r = await apiFetch('/api/admin/tasks', { headers:{ Authorization:`Bearer ${token}` }}); if (r.ok) setTasks(await r.json()); } catch(e) {} };
  useEffect(() => { loadTasks(); }, []);

  const add = async (e) => { e.preventDefault(); setLoading(true); try { const r = await apiFetch('/api/admin/tasks', { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ ...form, reward_amount: parseFloat(form.reward_amount) }) }); if (r.ok) { flash('success','Task added!'); setForm({ platform:'telegram', link:'', reward_amount:'' }); loadTasks(); } else flash('error','Failed'); } finally { setLoading(false); } };
  const remove = async (id) => { await apiFetch(`/api/admin/tasks/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); flash('success','Task deleted'); loadTasks(); };

  return (
    <>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Add Task</div><div className="card-subtitle">Create a social engagement task</div></div></div>
        <form onSubmit={add} style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}><label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>PLATFORM</label><select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} className="form-input" style={{ width:'auto' }}><option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option></select></div>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px', flex:1, minWidth:'200px' }}><label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>LINK URL</label><input className="form-input" placeholder="https://..." value={form.link} onChange={e=>setForm({...form,link:e.target.value})} required /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}><label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>REWARD (ETB)</label><input className="form-input" type="number" placeholder="20" style={{ width:'110px' }} value={form.reward_amount} onChange={e=>setForm({...form,reward_amount:e.target.value})} required /></div>
          <button className="btn btn-primary" disabled={loading}>{loading?'Adding...':'+ Add Task'}</button>
        </form>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Active Tasks</div><span className="badge badge-accent">{tasks.length}</span></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Platform</th><th>Link</th><th>Reward</th><th>Action</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><span className="badge badge-blue">{t.platform}</span></td><td style={{ color:'var(--text-secondary)', maxWidth:'250px', overflow:'hidden', textOverflow:'ellipsis' }}>{t.link}</td><td style={{ fontWeight:700, color:'var(--green)' }}>+Br {t.reward_amount}</td><td><button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:'12px' }} onClick={()=>remove(t.id)}>Delete</button></td></tr>)}{tasks.length===0&&<tr><td colSpan="4"><div className="empty-state"><div className="empty-state-text">No tasks yet</div></div></td></tr>}</tbody></table></div>
      </div>
    </>
  );
}

function PromosTab({ token, flash }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code:'', reward:'', uses_limit:'' });

  const loadPromos = async () => { try { const r = await apiFetch('/api/admin/promos', { headers:{ Authorization:`Bearer ${token}` }}); if (r.ok) setPromos(await r.json()); } catch(e) {} };
  useEffect(() => { loadPromos(); }, []);

  const add = async (e) => { e.preventDefault(); setLoading(true); try { const r = await apiFetch('/api/admin/promos', { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ ...form, reward:parseFloat(form.reward), uses_limit:parseInt(form.uses_limit) }) }); if (r.ok) { flash('success','Promo added!'); setForm({ code:'', reward:'', uses_limit:'' }); loadPromos(); } else flash('error','Failed'); } finally { setLoading(false); } };
  const remove = async (id) => { await apiFetch(`/api/admin/promos/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` }}); flash('success','Promo deleted'); loadPromos(); };

  return (
    <>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Add Promo Code</div><div className="card-subtitle">Create reward codes for players</div></div></div>
        <form onSubmit={add} style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px', flex:1, minWidth:'140px' }}><label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>CODE</label><input className="form-input" placeholder="VIP20" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} required /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}><label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>REWARD (ETB)</label><input className="form-input" type="number" placeholder="20" style={{ width:'110px' }} value={form.reward} onChange={e=>setForm({...form,reward:e.target.value})} required /></div>
          <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}><label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>USAGE LIMIT</label><input className="form-input" type="number" placeholder="100" style={{ width:'110px' }} value={form.uses_limit} onChange={e=>setForm({...form,uses_limit:e.target.value})} required /></div>
          <button className="btn btn-primary" disabled={loading}>{loading?'Adding...':'+ Add Promo'}</button>
        </form>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">Active Promos</div><span className="badge badge-accent">{promos.length}</span></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Code</th><th>Reward</th><th>Usage Limit</th><th>Action</th></tr></thead><tbody>{promos.map(p=><tr key={p.id}><td><span style={{ fontWeight:800, color:'var(--accent)', fontFamily:'monospace', fontSize:'14px' }}>{p.code}</span></td><td style={{ fontWeight:700, color:'var(--green)' }}>+Br {p.reward}</td><td style={{ color:'var(--text-secondary)' }}>{p.uses_limit} uses</td><td><button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:'12px' }} onClick={()=>remove(p.id)}>Delete</button></td></tr>)}{promos.length===0&&<tr><td colSpan="4"><div className="empty-state"><div className="empty-state-text">No promos yet</div></div></td></tr>}</tbody></table></div>
      </div>
    </>
  );
}
