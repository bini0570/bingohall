import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Users, CheckCircle2, XCircle, Settings, Send, Ban,
  AlertCircle, PlusCircle, MinusCircle, Clock,
  LayoutDashboard, ArrowDownLeft, ArrowUpRight, Search, Menu, X,
  RefreshCw, Zap, Eye, Trophy, Circle, TrendingUp, Activity
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://bingohall-production.up.railway.app').replace(/\/$/, '');

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

let adminSocket = null;

// ─── Shared styles ───────────────────────────────────────────────────────────
const S = {
  shell: {
    display: 'flex', flexDirection: 'column', minHeight: '100vh',
    background: '#030712', color: '#f1f5f9',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' },

  // Sidebar
  sidebar: (open, isMobile) => ({
    width: open ? '256px' : '0px',
    minWidth: open ? '256px' : '0px',
    background: 'linear-gradient(180deg, #0f172a 0%, #0a1628 100%)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column',
    padding: open ? '0' : '0',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    flexShrink: 0,
    position: isMobile ? 'fixed' : 'relative',
    top: 0, bottom: 0, left: 0,
    zIndex: 9999,
    boxShadow: (isMobile && open) ? '8px 0 32px rgba(0,0,0,0.6)' : 'none',
  }),
  sidebarInner: {
    display: 'flex', flexDirection: 'column', height: '100%',
    padding: '0 12px 16px', overflowY: 'auto', overflowX: 'hidden',
  },
  sidebarHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '20px 4px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    marginBottom: '12px', whiteSpace: 'nowrap',
  },
  logoBox: {
    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px',
  },
  logoText: { fontSize: '14px', fontWeight: '800', color: '#fff', lineHeight: 1.2 },
  logoSub: { fontSize: '10px', color: '#475569', fontWeight: '600' },

  navSection: { fontSize: '10px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 4px 4px', marginTop: '8px' },

  navBtn: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px', borderRadius: '10px', border: 'none',
    background: active ? 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(99,102,241,0.15))' : 'transparent',
    borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
    color: active ? '#93c5fd' : '#64748b',
    fontSize: '13px', fontWeight: active ? '700' : '600',
    cursor: 'pointer', transition: 'all 0.15s',
    width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
    marginBottom: '2px',
  }),
  navBtnInner: { display: 'flex', alignItems: 'center', gap: '10px' },
  badge: (active) => ({
    background: active ? '#3b82f6' : '#ef4444',
    color: '#fff', borderRadius: '20px', padding: '1px 7px',
    fontSize: '10px', fontWeight: '800', flexShrink: 0,
    animation: !active ? 'pulse 2s infinite' : 'none',
  }),

  // Topbar
  topbar: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px',
    background: 'rgba(15,23,42,0.9)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)', flexShrink: 0,
  },
  menuBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
    padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Main
  main: { flex: 1, overflowY: 'auto', padding: '20px', minWidth: 0 },

  // Cards
  card: (extra = {}) => ({
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px', padding: '20px', ...extra,
  }),
  metricCard: (r, g, b) => ({
    background: `linear-gradient(135deg, rgba(${r},${g},${b},0.1) 0%, rgba(15,23,42,0.8) 100%)`,
    border: `1px solid rgba(${r},${g},${b},0.2)`,
    borderRadius: '16px', padding: '18px',
  }),

  // Buttons
  btn: (variant = 'primary', extra = {}) => {
    const variants = {
      primary: { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none' },
      success: { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none' },
      danger:  { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
      warning: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
      ghost:   { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' },
    };
    return {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '10px 16px', borderRadius: '10px',
      fontWeight: '700', fontSize: '13px', cursor: 'pointer',
      transition: 'all 0.15s', fontFamily: 'inherit',
      ...variants[variant], ...extra,
    };
  },

  // Input
  input: (extra = {}) => ({
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(2,6,23,0.8)',
    color: '#f1f5f9', fontSize: '13px', fontWeight: '600',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', ...extra,
  }),
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },

  // Pills
  pill: (status) => {
    const map = {
      pending:  { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
      approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
      rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
      COUNTDOWN:{ bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
      DRAWING:  { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
      ENDED:    { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
      WAITING:  { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    };
    const s = map[status] || map.pending;
    return {
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '800', background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
    };
  },

  // Alerts
  alert: (type) => {
    const t = type === 'error'
      ? { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', color: '#fca5a5' }
      : { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#6ee7b7' };
    return {
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
      fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
    };
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modal: (extra = {}) => ({
    background: '#0f172a', borderRadius: '20px', padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '420px', ...extra,
  }),
};

// ─── Main AdminView component ─────────────────────────────────────────────────
export default function AdminView({ token, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Data
  const [metrics, setMetrics] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ ticket_price: '10', commission_pct: '20', countdown_sec: '40', draw_speed_sec: '3' });

  // UI state
  const [msg, setMsg] = useState({ error: '', success: '' });
  const [userSearch, setUserSearch] = useState('');
  const [showAll, setShowAll] = useState({ deposits: false, withdrawals: false });
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [bMsg, setBMsg] = useState('');
  const [bTarget, setBTarget] = useState('both');
  const [refreshing, setRefreshing] = useState(false);

  // Responsive
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const flash = (key, text) => {
    setMsg({ error: '', success: '', [key]: text });
    setTimeout(() => setMsg({ error: '', success: '' }), 4000);
  };

  // Fetch all admin data
  const fetchData = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [mR, dR, wR, uR, sR, gR] = await Promise.all([
        apiFetch('/api/admin/metrics',     { headers: h }),
        apiFetch('/api/admin/deposits',    { headers: h }),
        apiFetch('/api/admin/withdrawals', { headers: h }),
        apiFetch('/api/admin/users',       { headers: h }),
        apiFetch('/api/admin/settings',    { headers: h }),
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

  // ── Actions
  const approveDeposit = async (id) => {
    const r = await apiFetch(`/api/admin/deposits/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    r.ok ? flash('success', '✅ Deposit approved & balance credited!') : flash('error', d.error);
    fetchData();
  };

  const approveWithdrawal = async (id) => {
    const r = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    r.ok ? flash('success', '✅ Withdrawal approved!') : flash('error', d.error);
    fetchData();
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    const { type, id } = rejectModal;
    await apiFetch(`/api/admin/${type === 'deposit' ? 'deposits' : 'withdrawals'}/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    });
    flash('success', `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} rejected.`);
    fetchData();
    setRejectModal(null); setRejectReason('');
  };

  const adjustBalance = async () => {
    if (!balanceModal || !balanceAmount || parseFloat(balanceAmount) <= 0) return;
    const r = await apiFetch(`/api/admin/users/${balanceModal.user.id}/balance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: balanceModal.action, amount: parseFloat(balanceAmount) }),
    });
    const d = await r.json();
    r.ok ? flash('success', `${balanceModal.user.username}'s balance updated!`) : flash('error', d.error);
    fetchData();
    setBalanceModal(null); setBalanceAmount('');
  };

  const toggleBan = async (uid) => {
    await apiFetch(`/api/admin/users/${uid}/ban`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    const r = await apiFetch('/api/admin/settings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const d = await r.json();
    r.ok ? flash('success', '✅ Settings saved!') : flash('error', d.error);
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    const r = await apiFetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: bTarget, message: bMsg }),
    });
    const d = await r.json();
    r.ok ? (flash('success', '📢 Broadcast sent!'), setBMsg('')) : flash('error', d.error);
  };

  const gameAction = async (endpoint, successMsg) => {
    try {
      const r = await apiFetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      r.ok ? flash('success', successMsg) : flash('error', d.error || d.message);
      fetchData();
    } catch (e) { flash('error', e.message); }
  };

  // Derived counts
  const pendingDep = deposits.filter(d => d.status === 'pending').length;
  const pendingWit = withdrawals.filter(w => w.status === 'pending').length;
  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.phone || '').includes(userSearch)
  );

  const totalDeposited = deposits.filter(d => d.status === 'approved').reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + parseFloat(w.amount || 0), 0);

  // NAV config
  const NAV = [
    { section: 'Overview' },
    { key: 'dashboard',   label: 'Dashboard',      icon: <LayoutDashboard size={16} />, badge: 0 },
    { key: 'live_game',   label: 'Live Game',       icon: <Activity size={16} />,        badge: 0 },
    { section: 'Finance' },
    { key: 'deposits',    label: 'Deposits',        icon: <ArrowDownLeft size={16} />,   badge: pendingDep },
    { key: 'withdrawals', label: 'Withdrawals',     icon: <ArrowUpRight size={16} />,    badge: pendingWit },
    { section: 'Management' },
    { key: 'users',       label: 'Users',           icon: <Users size={16} />,           badge: 0 },
    { key: 'settings',    label: 'Game Settings',   icon: <Settings size={16} />,        badge: 0 },
    { key: 'broadcast',   label: 'Broadcast',       icon: <Send size={16} />,            badge: 0 },
  ];

  return (
    <div style={S.shell}>

      {/* MODALS */}
      {rejectModal && (
        <div style={S.overlay}>
          <div style={S.modal({ border: '1px solid rgba(239,68,68,0.3)' })}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444', marginBottom: '8px' }}>
              ❌ Reject {rejectModal.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Reason (optional, sent to user):</div>
            <textarea rows={3} style={{ ...S.input(), resize: 'vertical' }}
              placeholder="e.g. Invalid transaction ID"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
              <button style={S.btn('ghost')} onClick={() => setRejectModal(null)}>Cancel</button>
              <button style={S.btn('danger')} onClick={submitReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {balanceModal && (
        <div style={S.overlay}>
          <div style={S.modal()}>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#3b82f6', marginBottom: '6px' }}>
              {balanceModal.action === 'add' ? '➕ Add' : '➖ Deduct'} Balance
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
              User: <strong style={{ color: '#fff' }}>{balanceModal.user.username}</strong><br />
              Current: <strong style={{ color: '#10b981' }}>{(parseFloat(balanceModal.user.balance) || 0).toFixed(2)} ETB</strong>
            </div>
            <label style={S.label}>Amount (ETB)</label>
            <input type="number" style={S.input({ fontSize: '22px', fontWeight: '900', textAlign: 'center' })}
              placeholder="100" min="1" value={balanceAmount}
              onChange={e => setBalanceAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button style={S.btn('ghost')} onClick={() => setBalanceModal(null)}>Cancel</button>
              <button style={S.btn('primary')} onClick={adjustBalance}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={S.topbar}>
        <button style={S.menuBtn} onClick={() => setSidebarOpen(o => !o)}>
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
            🛡️ Bingo Admin
          </span>
          <span style={{ fontSize: '12px', color: '#475569' }}>·</span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {NAV.find(n => n.key === tab)?.label}
          </span>
        </div>

        {/* Live indicator */}
        {gameState && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981' }}>LIVE</span>
          </div>
        )}

        <button style={{ ...S.btn('ghost', { padding: '8px 12px', fontSize: '12px' }), gap: '5px' }}
          onClick={manualRefresh}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} />
          Refresh
        </button>
        <button style={S.btn('danger', { padding: '8px 12px', fontSize: '12px' })} onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      {/* BODY */}
      <div style={S.body}>

        {/* Sidebar overlay on mobile */}
        {isMobile && sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(2px)' }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <aside style={S.sidebar(sidebarOpen, isMobile)}>
          <div style={S.sidebarInner}>
            <div style={S.sidebarHeader}>
              <div style={S.logoBox}>🎰</div>
              <div>
                <div style={S.logoText}>Bingo X</div>
                <div style={S.logoSub}>Admin Portal</div>
              </div>
            </div>

            {NAV.map((item, i) => {
              if (item.section) return (
                <div key={i} style={S.navSection}>{item.section}</div>
              );
              const active = tab === item.key;
              return (
                <button key={item.key} style={S.navBtn(active)}
                  onClick={() => { setTab(item.key); if (isMobile) setSidebarOpen(false); }}>
                  <div style={S.navBtnInner}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && <span style={S.badge(active)}>{item.badge}</span>}
                </button>
              );
            })}

            {/* Sidebar bottom stats */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>PENDING ACTIONS</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: pendingDep > 0 ? '#f59e0b' : '#334155' }}>{pendingDep}</div>
                    <div style={{ fontSize: '10px', color: '#475569' }}>Deposits</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: pendingWit > 0 ? '#f59e0b' : '#334155' }}>{pendingWit}</div>
                    <div style={{ fontSize: '10px', color: '#475569' }}>Withdrawals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={S.main}>

          {msg.error   && <div style={S.alert('error')}><AlertCircle size={15} />{msg.error}</div>}
          {msg.success && <div style={S.alert('success')}><CheckCircle2 size={15} />{msg.success}</div>}

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>System Overview</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>Real-time platform metrics</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'System Balance', value: (metrics?.totalSystemBalance || 0).toFixed(0), unit: 'ETB', rgb: '16,185,129', color: '#10b981', icon: '💰' },
                  { label: 'Total Users', value: metrics?.totalUsers || 0, unit: '', rgb: '59,130,246', color: '#60a5fa', icon: '👥' },
                  { label: 'Total Deposited', value: totalDeposited.toFixed(0), unit: 'ETB', rgb: '99,102,241', color: '#818cf8', icon: '📥' },
                  { label: 'Total Paid Out', value: totalWithdrawn.toFixed(0), unit: 'ETB', rgb: '239,68,68', color: '#f87171', icon: '📤' },
                  { label: 'Revenue', value: (totalDeposited - totalWithdrawn).toFixed(0), unit: 'ETB', rgb: '245,158,11', color: '#fbbf24', icon: '📈' },
                  { label: 'Pending Deposits', value: pendingDep, unit: '', rgb: '245,158,11', color: '#fbbf24', icon: '⏳' },
                ].map(m => (
                  <div key={m.label} style={S.metricCard(...m.rgb.split(','))}>
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{m.icon}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: m.color, lineHeight: 1 }}>
                      {m.value}<span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Game Summary */}
              {gameState && (
                <div style={S.card()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>⚡ Current Game Round</div>
                    <span style={S.pill(gameState.status)}>{gameState.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px' }}>
                    {[
                      { label: 'Round ID', value: `#${gameState.roundId || '–'}`, color: '#94a3b8' },
                      { label: 'Tickets Sold', value: gameState.totalTickets || 0, color: '#60a5fa' },
                      { label: 'Prize Pool', value: `${(gameState.prizePool || 0).toFixed(0)} ETB`, color: '#10b981' },
                      { label: 'Countdown', value: `${gameState.secondsLeft ?? '–'}s`, color: '#fbbf24' },
                      { label: 'Balls Called', value: gameState.calledNumbers?.length || 0, color: '#818cf8' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LIVE GAME ── */}
          {tab === 'live_game' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>⚡ Live Game Control</h2>

              {/* Game Status Card */}
              <div style={{ ...S.card(), background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(15,23,42,0.8))', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Game Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={S.pill(gameState?.status || 'WAITING')}>
                        {gameState?.status || 'LOADING...'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Round #{gameState?.roundId || '–'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      {gameState?.status === 'DRAWING' ? 'Balls Called' : 'Countdown'}
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#06b6d4', lineHeight: 1 }}>
                      {gameState?.status === 'DRAWING'
                        ? `${gameState?.calledNumbers?.length || 0}/75`
                        : `${gameState?.secondsLeft ?? '–'}s`}
                    </div>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  {[
                    { label: 'Tickets Sold', value: gameState?.totalTickets || 0, icon: '🎫' },
                    { label: 'Prize Pool', value: `${(gameState?.prizePool || 0).toFixed(0)} ETB`, icon: '🏆' },
                    { label: 'Balls Called', value: `${gameState?.calledNumbers?.length || 0}`, icon: '🎱' },
                    { label: 'Remaining', value: `${75 - (gameState?.calledNumbers?.length || 0)}`, icon: '⚪' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', marginBottom: '2px' }}>{s.icon}</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Called Numbers Visual */}
              {gameState?.calledNumbers?.length > 0 && (
                <div style={S.card()}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
                    🎱 Called Numbers ({gameState.calledNumbers.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {gameState.calledNumbers.map(n => {
                      const letter = n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O';
                      const colors = { B: '#3b82f6', I: '#10b981', N: '#f59e0b', G: '#ef4444', O: '#8b5cf6' };
                      return (
                        <div key={n} style={{
                          width: '36px', height: '36px', borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                          background: `rgba(${colors[letter] === '#3b82f6' ? '59,130,246' : colors[letter] === '#10b981' ? '16,185,129' : colors[letter] === '#f59e0b' ? '245,158,11' : colors[letter] === '#ef4444' ? '239,68,68' : '139,92,246'},0.2)`,
                          border: `1px solid ${colors[letter]}`,
                          fontSize: '11px', fontWeight: '800', color: colors[letter], lineHeight: 1,
                        }}>
                          <span style={{ fontSize: '8px' }}>{letter}</span>
                          <span>{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin Controls */}
              <div style={S.card()}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '14px' }}>🕹️ Admin Controls</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button style={S.btn('primary', { flex: '1', minWidth: '160px' })}
                    onClick={() => gameAction('/api/admin/game/force-start', '⚡ Draw started immediately!')}>
                    <Zap size={15} /> Force Start Draw
                  </button>
                  <button style={S.btn('success', { flex: '1', minWidth: '160px' })}
                    onClick={() => gameAction('/api/admin/game/restart-countdown', '🔄 Countdown restarted!')}>
                    <RefreshCw size={15} /> Reset Countdown
                  </button>
                  <button style={S.btn('ghost', { flex: '1', minWidth: '120px' })}
                    onClick={manualRefresh}>
                    <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} /> Refresh State
                  </button>
                </div>

                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700', marginBottom: '4px' }}>ℹ️ How it works</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: 1.8 }}>
                    <li><strong style={{ color: '#94a3b8' }}>COUNTDOWN</strong> — Players are buying tickets. Timer counts down automatically.</li>
                    <li><strong style={{ color: '#94a3b8' }}>Force Start Draw</strong> — Immediately starts drawing balls, even with 0 players.</li>
                    <li><strong style={{ color: '#94a3b8' }}>Reset Countdown</strong> — Restarts the timer back to its full duration.</li>
                    <li><strong style={{ color: '#94a3b8' }}>DRAWING</strong> — Balls are drawn every {settings?.draw_speed_sec || 3}s. Stops when a player wins.</li>
                    <li><strong style={{ color: '#94a3b8' }}>Auto next round</strong> — After a winner is found, the next round starts in 8 seconds.</li>
                  </ul>
                </div>
              </div>

              {/* Currently Purchased Tickets */}
              {gameState?.purchasedTickets?.length > 0 && (
                <div style={S.card()}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
                    🎫 Tickets This Round ({gameState.purchasedTickets.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gameState.purchasedTickets.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{t.username}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Cartella #{t.cartellaIndex}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DEPOSITS ── */}
          {tab === 'deposits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                  💳 Deposits {pendingDep > 0 && <span style={{ ...S.pill('pending'), marginLeft: '8px' }}>{pendingDep} pending</span>}
                </h2>
                <button style={S.btn('ghost', { fontSize: '12px', padding: '8px 14px' })}
                  onClick={() => setShowAll(s => ({ ...s, deposits: !s.deposits }))}>
                  {showAll.deposits ? 'Pending Only' : 'Show All'}
                </button>
              </div>

              {(showAll.deposits ? deposits : deposits.filter(d => d.status === 'pending')).length === 0 && (
                <div style={S.card({ textAlign: 'center', padding: '40px', color: '#334155' })}>
                  ✅ No pending deposits
                </div>
              )}

              {(showAll.deposits ? deposits : deposits.filter(d => d.status === 'pending')).map(d => (
                <div key={d.id} style={S.card({ borderColor: d.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)' })}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>+{parseFloat(d.amount).toFixed(2)} ETB</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{d.method} · #{d.id}</div>
                    </div>
                    <span style={S.pill(d.status)}>{d.status === 'approved' ? 'APPROVED' : d.status.toUpperCase()}</span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                    <strong style={{ color: '#fff' }}>{d.username}</strong>
                    {d.phone && <span style={{ color: '#475569' }}> · {d.phone}</span>}
                  </div>

                  {d.receipt_sms && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '8px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '10px' }}>
                      {d.receipt_sms}
                    </div>
                  )}

                  {d.created_at && <div style={{ fontSize: '11px', color: '#334155', marginBottom: '10px' }}>{new Date(d.created_at).toLocaleString()}</div>}

                  {d.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {d.proof_image && (
                        <a href={`${API_BASE}${d.proof_image}`} target="_blank" rel="noreferrer"
                          style={{ ...S.btn('ghost'), textDecoration: 'none', flex: '1', minWidth: '100px' }}>
                          <Eye size={14} /> Screenshot
                        </a>
                      )}
                      <button style={{ ...S.btn('success'), flex: '1', minWidth: '120px' }} onClick={() => approveDeposit(d.id)}>
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button style={{ ...S.btn('danger'), flex: '1', minWidth: '100px' }}
                        onClick={() => { setRejectModal({ type: 'deposit', id: d.id }); setRejectReason(''); }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── WITHDRAWALS ── */}
          {tab === 'withdrawals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                  💸 Withdrawals {pendingWit > 0 && <span style={{ ...S.pill('pending'), marginLeft: '8px' }}>{pendingWit} pending</span>}
                </h2>
                <button style={S.btn('ghost', { fontSize: '12px', padding: '8px 14px' })}
                  onClick={() => setShowAll(s => ({ ...s, withdrawals: !s.withdrawals }))}>
                  {showAll.withdrawals ? 'Pending Only' : 'Show All'}
                </button>
              </div>

              {(showAll.withdrawals ? withdrawals : withdrawals.filter(w => w.status === 'pending')).length === 0 && (
                <div style={S.card({ textAlign: 'center', padding: '40px', color: '#334155' })}>
                  ✅ No pending withdrawals
                </div>
              )}

              {(showAll.withdrawals ? withdrawals : withdrawals.filter(w => w.status === 'pending')).map(w => (
                <div key={w.id} style={S.card({ borderColor: w.status === 'pending' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)' })}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>-{parseFloat(w.amount).toFixed(2)} ETB</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{w.method} · #{w.id}</div>
                    </div>
                    <span style={S.pill(w.status)}>{w.status === 'approved' ? 'PAID' : w.status.toUpperCase()}</span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    <strong style={{ color: '#fff' }}>{w.username}</strong>
                    {w.phone && <span style={{ color: '#475569' }}> · {w.phone}</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#06b6d4', marginBottom: '8px' }}>
                    Send to: <strong>{w.method}</strong> → <strong>{w.account_number || 'N/A'}</strong>
                    {w.account_name && <span style={{ color: '#475569' }}> ({w.account_name})</span>}
                  </div>

                  {w.created_at && <div style={{ fontSize: '11px', color: '#334155', marginBottom: '10px' }}>{new Date(w.created_at).toLocaleString()}</div>}

                  {w.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button style={{ ...S.btn('success'), flex: '1', minWidth: '140px' }} onClick={() => approveWithdrawal(w.id)}>
                        <CheckCircle2 size={14} /> Approve & Pay
                      </button>
                      <button style={{ ...S.btn('danger'), flex: '1', minWidth: '100px' }}
                        onClick={() => { setRejectModal({ type: 'withdrawal', id: w.id }); setRejectReason(''); }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                  👥 Users ({filteredUsers.length})
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', minWidth: '220px' }}>
                  <Search size={14} color="#475569" />
                  <input type="text" placeholder="Search name or phone…"
                    value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', flex: 1, fontFamily: 'inherit' }} />
                </div>
              </div>

              {filteredUsers.length === 0 && (
                <div style={S.card({ textAlign: 'center', padding: '40px', color: '#334155' })}>No users found.</div>
              )}

              {filteredUsers.map(u => (
                <div key={u.id} style={S.card({ borderColor: u.is_banned ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)' })}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>{u.username}</span>
                        {u.is_admin == 1 && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', fontWeight: '700' }}>ADMIN</span>}
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '800', background: u.is_banned ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', color: u.is_banned ? '#ef4444' : '#10b981' }}>
                          {u.is_banned ? 'BANNED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{u.phone || 'No phone'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>{(parseFloat(u.balance) || 0).toFixed(2)} ETB</div>
                      <div style={{ fontSize: '11px', color: '#334155' }}>total balance</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={{ ...S.btn('success', { padding: '8px 14px', flex: '1', minWidth: '90px' }) }}
                      onClick={() => { setBalanceModal({ user: u, action: 'add' }); setBalanceAmount(''); }}>
                      <PlusCircle size={13} /> Add
                    </button>
                    <button style={{ ...S.btn('warning', { padding: '8px 14px', flex: '1', minWidth: '90px' }) }}
                      onClick={() => { setBalanceModal({ user: u, action: 'deduct' }); setBalanceAmount(''); }}>
                      <MinusCircle size={13} /> Deduct
                    </button>
                    <button style={{ ...S.btn(u.is_banned ? 'success' : 'danger', { padding: '8px 14px', flex: '1', minWidth: '80px' }) }}
                      onClick={() => toggleBan(u.id)}>
                      <Ban size={13} /> {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>⚙️ Game Settings</h2>

              <div style={S.card()}>
                <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {[
                    { key: 'ticket_price', label: 'Ticket Price per Cartella', unit: 'ETB', type: 'number', min: 1, help: 'Cost for each player to buy one cartella ticket.' },
                    { key: 'commission_pct', label: 'House Commission', unit: '%', type: 'number', min: 0, max: 100, help: 'Percentage of the prize pool kept by the house.' },
                    { key: 'countdown_sec', label: 'Countdown Duration', unit: 'seconds', type: 'number', min: 10, help: 'How long players have to buy tickets before the draw starts.' },
                    { key: 'draw_speed_sec', label: 'Ball Draw Speed', unit: 'seconds/ball', type: 'number', min: 1, help: 'How many seconds between each ball being drawn.' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={S.label}>{f.label} <span style={{ color: '#475569', fontWeight: '600' }}>({f.unit})</span></label>
                      <input type={f.type} min={f.min} max={f.max}
                        style={S.input()}
                        value={settings[f.key] || ''}
                        onChange={e => setSettings({ ...settings, [f.key]: e.target.value })} />
                      <div style={{ fontSize: '11px', color: '#334155', marginTop: '5px' }}>{f.help}</div>
                    </div>
                  ))}

                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', fontSize: '12px', color: '#475569' }}>
                    💡 <strong style={{ color: '#60a5fa' }}>Live Preview:</strong> Ticket price: <strong style={{ color: '#fff' }}>{settings.ticket_price} ETB</strong> · Commission: <strong style={{ color: '#fff' }}>{settings.commission_pct}%</strong> · Countdown: <strong style={{ color: '#fff' }}>{settings.countdown_sec}s</strong> · Draw speed: <strong style={{ color: '#fff' }}>{settings.draw_speed_sec}s/ball</strong>
                  </div>

                  <button type="submit" style={S.btn('primary', { padding: '13px', fontSize: '14px', width: '100%' })}>
                    💾 Save Settings
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── BROADCAST ── */}
          {tab === 'broadcast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>📢 Broadcast Message</h2>
              <div style={S.card()}>
                <form onSubmit={sendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={S.label}>Target Audience</label>
                    <select style={S.input({ cursor: 'pointer' })} value={bTarget} onChange={e => setBTarget(e.target.value)}>
                      <option value="both">Everyone (Telegram + Web App)</option>
                      <option value="telegram">Telegram Bot Users Only</option>
                      <option value="web">Web App Users Only</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Message</label>
                    <textarea rows={5} style={S.input({ resize: 'vertical' })}
                      placeholder="Enter your announcement message…"
                      value={bMsg} onChange={e => setBMsg(e.target.value)} />
                  </div>
                  <button type="submit" disabled={!bMsg.trim()} style={S.btn('primary', { padding: '13px', fontSize: '14px', width: '100%', opacity: bMsg.trim() ? 1 : 0.5 })}>
                    <Send size={16} /> Send Broadcast
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #030712; }
        input::placeholder, textarea::placeholder { color: #334155; }
        select option { background: #0f172a; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
