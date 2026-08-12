import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ArrowDownLeft, ArrowUpRight, Send, BarChart3,
  Users, CheckCircle2, XCircle, ShieldCheck, AlertCircle,
  Eye, RefreshCw, Menu, X, TrendingUp, Clock, Wifi
} from 'lucide-react';
import { apiFetch } from '../api';

/* ─────────────────────────────────────────────────
   INJECT GLOBAL STYLES for responsiveness + fonts
───────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; }

  .admin-shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: #050914;
    color: #f1f5f9;
    font-family: 'Outfit', system-ui, sans-serif;
    overflow-x: hidden;
  }

  /* ── Top Header ── */
  .admin-header {
    position: sticky;
    top: 0;
    z-index: 200;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: rgba(8, 13, 28, 0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 2px 24px rgba(0,0,0,0.6);
  }
  .admin-header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    font-size: 16px;
    color: #fff;
  }
  .admin-header-brand .icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 16px rgba(59,130,246,0.5);
  }
  .admin-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .admin-refresh-btn {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: inherit;
    transition: all 0.15s;
  }
  .admin-refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .admin-menu-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #94a3b8;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .admin-menu-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* ── Layout ── */
  .admin-body {
    display: flex;
    flex: 1;
    overflow: hidden;
    height: calc(100dvh - 56px);
  }

  /* ── Sidebar ── */
  .admin-sidebar {
    width: 240px;
    min-width: 240px;
    height: 100%;
    background: rgba(10,16,32,0.98);
    border-right: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    padding: 12px 8px;
    gap: 3px;
    overflow-y: auto;
    overflow-x: hidden;
    flex-shrink: 0;
    transition: all 0.25s ease;
  }
  .admin-sidebar.closed {
    width: 0;
    min-width: 0;
    padding: 0;
    overflow: hidden;
  }
  @media (max-width: 768px) {
    .admin-sidebar {
      position: fixed;
      top: 56px;
      left: 0;
      bottom: 0;
      z-index: 150;
      box-shadow: 4px 0 40px rgba(0,0,0,0.7);
    }
    .admin-sidebar.closed {
      left: -260px;
      width: 240px;
      min-width: 240px;
    }
    .admin-sidebar-overlay {
      position: fixed;
      inset: 0;
      top: 56px;
      background: rgba(0,0,0,0.6);
      z-index: 140;
      backdrop-filter: blur(2px);
    }
  }
  .admin-nav-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 12px;
    border-radius: 11px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
    text-align: left;
    white-space: nowrap;
    font-family: inherit;
    gap: 8px;
  }
  .admin-nav-btn:hover { background: rgba(255,255,255,0.05); color: #94a3b8; }
  .admin-nav-btn.active {
    background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(29,78,216,0.15));
    color: #fff;
    border: 1px solid rgba(59,130,246,0.3);
  }
  .admin-nav-btn .nav-inner { display: flex; align-items: center; gap: 10px; }
  .admin-nav-badge {
    background: #ef4444;
    color: #fff;
    border-radius: 20px;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 900;
    min-width: 18px;
    text-align: center;
  }
  .admin-nav-badge.active-badge { background: #fff; color: #1d4ed8; }
  .admin-nav-section-label {
    padding: 10px 12px 4px;
    font-size: 10px;
    font-weight: 900;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* ── Content ── */
  .admin-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  @media (max-width: 480px) {
    .admin-content { padding: 12px 10px 20px; gap: 14px; }
  }

  /* ── Cards Grid ── */
  .stat-grid-5 {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  @media (max-width: 1100px) {
    .stat-grid-5 { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 680px) {
    .stat-grid-5 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 360px) {
    .stat-grid-5 { grid-template-columns: 1fr 1fr; gap: 8px; }
  }

  .stat-card {
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(14,20,40,0.8);
    transition: transform 0.15s;
    position: relative;
    overflow: hidden;
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }
  .stat-card:hover { transform: translateY(-1px); }
  .stat-card .sc-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 2px;
    font-size: 18px;
  }
  .stat-card .sc-label {
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .stat-card .sc-value {
    font-size: 20px;
    font-weight: 900;
    line-height: 1.1;
  }
  .stat-card .sc-sub {
    font-size: 10px;
    color: #475569;
    font-weight: 700;
  }
  @media (max-width: 480px) {
    .stat-card { padding: 11px 12px; }
    .stat-card .sc-value { font-size: 16px; }
  }

  /* ── Bottom Grid ── */
  .bottom-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  @media (max-width: 900px) {
    .bottom-grid { grid-template-columns: 1fr; }
  }

  /* ── Section / Table ── */
  .section-card {
    background: rgba(12,18,36,0.9);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    overflow: hidden;
  }
  .section-card-header {
    padding: 12px 16px;
    font-weight: 900;
    font-size: 13px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .admin-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .admin-table th {
    background: rgba(20,30,60,0.7);
    color: #475569;
    font-weight: 800;
    padding: 9px 14px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    text-align: left;
    white-space: nowrap;
  }
  .admin-table td {
    padding: 11px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: #cbd5e1;
    vertical-align: middle;
  }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tr:hover td { background: rgba(255,255,255,0.025); }

  /* Mobile table - horizontal scroll */
  .table-overflow { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* ── Status badge ── */
  .status-badge {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 900;
    text-transform: capitalize;
    white-space: nowrap;
  }
  .status-pending { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
  .status-approved, .status-paid { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
  .status-rejected { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }

  /* ── Buttons ── */
  .btn-approve {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border: none;
    padding: 6px 11px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .btn-approve:hover { opacity: 0.85; }
  .btn-reject {
    background: rgba(239,68,68,0.12);
    color: #fca5a5;
    border: 1px solid rgba(239,68,68,0.25);
    padding: 6px 11px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .btn-reject:hover { opacity: 0.85; }
  .actions-cell { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; }

  /* ── Filter tabs ── */
  .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-tab {
    padding: 7px 14px;
    border-radius: 9px;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.05);
    color: #64748b;
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .filter-tab:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
  .filter-tab.active {
    background: rgba(59,130,246,0.18);
    color: #38bdf8;
    border-color: rgba(59,130,246,0.35);
  }

  /* ── Broadcast ── */
  .broadcast-card {
    max-width: 580px;
    width: 100%;
    margin: 0 auto;
    background: rgba(12,18,36,0.9);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  @media (max-width: 480px) { .broadcast-card { padding: 16px; } }
  .broadcast-target-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 360px) { .broadcast-target-grid { grid-template-columns: 1fr; } }
  .target-btn {
    padding: 14px;
    border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: #64748b;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    text-align: center;
    font-family: inherit;
    transition: all 0.2s;
  }
  .target-btn.active-all { border-color: #38bdf8; background: rgba(56,189,248,0.12); color: #38bdf8; }
  .target-btn.active-online { border-color: #10b981; background: rgba(16,185,129,0.12); color: #10b981; }
  .broadcast-textarea {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(5,8,18,0.9);
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 120px;
    outline: none;
    transition: border-color 0.15s;
  }
  .broadcast-textarea:focus { border-color: rgba(59,130,246,0.5); }
  .broadcast-send-btn {
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity 0.15s;
  }
  .broadcast-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .broadcast-send-btn:not(:disabled):hover { opacity: 0.9; }

  /* ── Reports ── */
  .reports-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (max-width: 680px) { .reports-stat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 360px) { .reports-stat-grid { grid-template-columns: 1fr 1fr; } }

  /* ── Flash ── */
  .flash-success { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; padding: 12px 16px; border-radius: 12px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
  .flash-error   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.3);  color: #fca5a5; padding: 12px 16px; border-radius: 12px; font-size: 13px; display: flex; align-items: center; gap: 8px; }

  /* ── Page heading ── */
  .page-heading { font-size: 17px; font-weight: 900; color: #fff; margin: 0; }
  .page-sub { font-size: 12px; color: #475569; font-weight: 600; margin: 2px 0 0; }

  /* ── Input label ── */
  .form-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }

  /* ── Empty state ── */
  .empty-state { text-align: center; padding: 32px 16px; color: #334155; font-size: 13px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spinning { animation: spin 0.8s linear infinite; }
`;

function injectStyles() {
  if (document.getElementById('admin-view-css')) return;
  const el = document.createElement('style');
  el.id = 'admin-view-css';
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ── Sub-components ────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls =
    status === 'approved' || status === 'paid' ? 'approved' :
    status === 'rejected' ? 'rejected' : 'pending';
  const label = status === 'approved' ? 'Approved' : status === 'paid' ? 'Paid' : status;
  return <span className={`status-badge status-${cls}`}>{label}</span>;
}

export default function AdminView({ token, socket }) {
  injectStyles();

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [metrics, setMetrics] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState({ type: '', msg: '' });

  const [depositFilter, setDepositFilter]   = useState('pending');
  const [withdrawFilter, setWithdrawFilter] = useState('pending');
  const [reportsFrame, setReportsFrame]     = useState('all');

  const [bcastTarget, setBcastTarget] = useState('both');
  const [bcastMsg, setBcastMsg]       = useState('');
  const [bcastBusy, setBcastBusy]     = useState(false);

  const AUTO_REASON = 'fake transaction and try again';

  const showFlash = (type, msg) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash({ type: '', msg: '' }), 4000);
  };

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const hdrs = { Authorization: `Bearer ${token}` };
      const [mR, dR, wR, uR] = await Promise.all([
        apiFetch('/api/admin/metrics',     { headers: hdrs }),
        apiFetch('/api/admin/deposits',    { headers: hdrs }),
        apiFetch('/api/admin/withdrawals', { headers: hdrs }),
        apiFetch('/api/admin/users',       { headers: hdrs }),
      ]);
      if (mR.ok) setMetrics(await mR.json());
      if (dR.ok) setDeposits(await dR.json());
      if (wR.ok) setWithdrawals(await wR.json());
      if (uR.ok) setUsersList(await uR.json());
    } catch (e) { console.error('[Admin]', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(true); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on('admin_data_changed', fetchAll);
    return () => socket.off('admin_data_changed', fetchAll);
  }, [socket]);

  const post = async (url, body) => {
    const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res  = await apiFetch(url, { method: 'POST', headers: hdrs, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const approveDeposit    = async (id) => { try { await post(`/api/admin/deposits/${id}/approve`);               showFlash('success', `Deposit #${id} approved`); fetchAll(); } catch(e){ showFlash('error', e.message); } };
  const rejectDeposit     = async (id) => { try { await post(`/api/admin/deposits/${id}/reject`, { reason: AUTO_REASON });  showFlash('success', `Deposit #${id} rejected`); fetchAll(); } catch(e){ showFlash('error', e.message); } };
  const approveWithdrawal = async (id) => { try { await post(`/api/admin/withdrawals/${id}/approve`);             showFlash('success', `Withdrawal #${id} approved & paid`); fetchAll(); } catch(e){ showFlash('error', e.message); } };
  const rejectWithdrawal  = async (id) => { try { await post(`/api/admin/withdrawals/${id}/reject`, { reason: AUTO_REASON }); showFlash('success', `Withdrawal #${id} rejected`); fetchAll(); } catch(e){ showFlash('error', e.message); } };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!bcastMsg.trim()) return;
    setBcastBusy(true);
    try {
      await post('/api/admin/broadcast', { target: bcastTarget, message: bcastMsg });
      showFlash('success', `Broadcast sent to ${bcastTarget === 'online' ? 'online users' : 'all users'}!`);
      setBcastMsg('');
    } catch(e){ showFlash('error', e.message); }
    finally { setBcastBusy(false); }
  };

  // ── Derived ──────────────────────────────────────────────────
  const pendingDep  = useMemo(() => deposits.filter(d => d.status === 'pending'), [deposits]);
  const pendingWith = useMemo(() => withdrawals.filter(w => w.status === 'pending'), [withdrawals]);
  const totalPending = pendingDep.length + pendingWith.length;

  const totalDeposited  = useMemo(() => deposits.filter(d => d.status === 'approved').reduce((s,d) => s + (+d.amount||0), 0), [deposits]);
  const totalWithdrawn  = useMemo(() => withdrawals.filter(w => w.status==='approved'||w.status==='paid').reduce((s,w) => s + (+w.amount||0), 0), [withdrawals]);
  const totalRevenue    = Math.max(0, totalDeposited - totalWithdrawn);

  const timeFilter = (arr) => {
    if (reportsFrame === 'all') return arr;
    const now = Date.now();
    const days = reportsFrame === 'daily' ? 1 : reportsFrame === 'weekly' ? 7 : 30;
    return arr.filter(r => (now - new Date(r.created_at||Date.now())) / 86400000 <= days);
  };
  const rDep   = useMemo(() => timeFilter(deposits),    [deposits, reportsFrame]);
  const rWith  = useMemo(() => timeFilter(withdrawals), [withdrawals, reportsFrame]);
  const rDepAmt  = rDep.filter(d => d.status==='approved').reduce((s,d) => s+(+d.amount||0), 0);
  const rWithAmt = rWith.filter(w => w.status==='approved'||w.status==='paid').reduce((s,w) => s+(+w.amount||0), 0);

  const navItems = [
    { key: 'dashboard',    emoji: '📊', label: 'Dashboard',    badge: totalPending },
    { key: 'deposits',     emoji: '💰', label: 'Deposits',     badge: pendingDep.length },
    { key: 'withdrawals',  emoji: '📤', label: 'Withdrawals',  badge: pendingWith.length },
    { key: 'broadcast',    emoji: '📢', label: 'Broadcast',    badge: 0 },
    { key: 'reports',      emoji: '📈', label: 'Reports',      badge: 0 },
  ];

  const closeSidebar = () => { if (window.innerWidth < 768) setSidebarOpen(false); };
  const goTab = (key) => { setActiveTab(key); closeSidebar(); };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="admin-shell">

      {/* ── TOP HEADER ── */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <div className="icon-box">
            <ShieldCheck size={18} color="#fff" />
          </div>
          <span>Afla Bingo Admin</span>
        </div>

        <div className="admin-header-right">
          <button className="admin-refresh-btn" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen && window.innerWidth < 768 ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="admin-body">

        {/* Overlay (mobile only) */}
        {sidebarOpen && window.innerWidth < 768 && (
          <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <nav className={`admin-sidebar${sidebarOpen ? '' : ' closed'}`}>
          <div className="admin-nav-section-label">Navigation</div>

          {navItems.map(item => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`admin-nav-btn${active ? ' active' : ''}`}
                onClick={() => goTab(item.key)}
              >
                <span className="nav-inner">
                  <span style={{ fontSize: '16px' }}>{item.emoji}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge > 0 && (
                  <span className={`admin-nav-badge${active ? ' active-badge' : ''}`}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main className="admin-content">

          {/* Flash messages */}
          {flash.msg && (
            <div className={flash.type === 'success' ? 'flash-success' : 'flash-error'}>
              {flash.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {flash.msg}
            </div>
          )}

          {/* ══════════════════════════════════════
              📊 DASHBOARD
          ══════════════════════════════════════ */}
          {activeTab === 'dashboard' && <>
            {/* 5 stat cards */}
            <div className="stat-grid-5">
              <StatCard icon="👥" label="Total Users"        value={metrics?.totalUsers ?? usersList.length} color="#38bdf8" accent="#3b82f6" />
              <StatCard icon="💰" label="Total Deposits"     value={`${totalDeposited.toFixed(0)} ETB`}      color="#10b981" accent="#059669" />
              <StatCard icon="📤" label="Total Withdrawals"  value={`${totalWithdrawn.toFixed(0)} ETB`}       color="#f87171" accent="#ef4444" />
              <StatCard icon="📈" label="Revenue"            value={`${totalRevenue.toFixed(0)} ETB`}         color="#f59e0b" accent="#d97706" />
              <StatCard icon="⏳" label="Pending Requests"   value={totalPending}                              color="#c084fc" accent="#7c3aed" urgent={totalPending > 0} />
            </div>

            {/* Bottom 4 panels */}
            <div className="bottom-grid">
              {/* Recent deposits */}
              <div className="section-card">
                <div className="section-card-header" style={{ color: '#10b981' }}>
                  <ArrowDownLeft size={15} /> Recent Deposits
                </div>
                <div className="table-overflow">
                  <table className="admin-table">
                    <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
                    <tbody>
                      {deposits.slice(0, 5).map(d => (
                        <tr key={d.id}>
                          <td><strong>{d.username || `#${d.user_id}`}</strong></td>
                          <td style={{ color: '#10b981', fontWeight: 800 }}>{(+d.amount).toFixed(2)} ETB</td>
                          <td>{d.method}</td>
                          <td><StatusBadge status={d.status} /></td>
                        </tr>
                      ))}
                      {!deposits.length && <tr><td colSpan={4} className="empty-state">No deposits yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent withdrawals */}
              <div className="section-card">
                <div className="section-card-header" style={{ color: '#f87171' }}>
                  <ArrowUpRight size={15} /> Recent Withdrawals
                </div>
                <div className="table-overflow">
                  <table className="admin-table">
                    <thead><tr><th>User</th><th>Amount</th><th>Account</th><th>Status</th></tr></thead>
                    <tbody>
                      {withdrawals.slice(0, 5).map(w => (
                        <tr key={w.id}>
                          <td><strong>{w.username || `#${w.user_id}`}</strong></td>
                          <td style={{ color: '#f87171', fontWeight: 800 }}>{(+w.amount).toFixed(2)} ETB</td>
                          <td><code style={{ color: '#94a3b8', fontSize: '11px' }}>{w.account_number}</code></td>
                          <td><StatusBadge status={w.status} /></td>
                        </tr>
                      ))}
                      {!withdrawals.length && <tr><td colSpan={4} className="empty-state">No withdrawals yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live game status */}
              <div className="section-card">
                <div className="section-card-header" style={{ color: '#f59e0b' }}>
                  🎮 Live Game Status
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow label="Game Status"        value={<span style={{ color: '#10b981', fontWeight: 900 }}>{metrics?.gameStatus || 'COUNTDOWN'}</span>} />
                  <InfoRow label="Tickets This Round" value={metrics?.cartellasSoldThisRound ?? 0} />
                  <InfoRow label="Prize Pool"         value={<span style={{ color: '#f59e0b', fontWeight: 900 }}>{(metrics?.prizePool || 0).toFixed(2)} ETB</span>} />
                </div>
              </div>

              {/* Online users */}
              <div className="section-card">
                <div className="section-card-header" style={{ color: '#c084fc' }}>
                  <Wifi size={15} /> Online Users
                </div>
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                    {metrics?.onlinePlayers ?? 1}
                  </div>
                  <div style={{ color: '#475569', fontSize: '12px', fontWeight: 700, marginTop: '6px' }}>
                    Players Connected Right Now
                  </div>
                </div>
              </div>
            </div>
          </>}

          {/* ══════════════════════════════════════
              💰 DEPOSITS
          ══════════════════════════════════════ */}
          {activeTab === 'deposits' && <>
            <div>
              <p className="page-heading">💰 Deposits</p>
              <p className="page-sub">Manage player deposit requests</p>
            </div>

            <div className="filter-tabs">
              {['pending','approved','rejected','all'].map(f => (
                <button key={f} className={`filter-tab${depositFilter===f?' active':''}`} onClick={() => setDepositFilter(f)}>
                  {f.charAt(0).toUpperCase()+f.slice(1)} ({f==='all' ? deposits.length : deposits.filter(d=>d.status===f).length})
                </button>
              ))}
            </div>

            <div className="section-card">
              <div className="table-overflow">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th><th>User</th><th>Amount</th><th>Method</th>
                      <th>SMS / Ref Code</th><th>Screenshot</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.filter(d => depositFilter==='all' || d.status===depositFilter).map(d => (
                      <tr key={d.id}>
                        <td style={{ color: '#475569' }}>#{d.id}</td>
                        <td>
                          <strong style={{ display: 'block' }}>{d.username || `User #${d.user_id}`}</strong>
                          {d.phone && <span style={{ color: '#475569', fontSize: '11px' }}>{d.phone}</span>}
                        </td>
                        <td style={{ color: '#10b981', fontWeight: 900, fontSize: '13px' }}>{(+d.amount).toFixed(2)} ETB</td>
                        <td><span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{d.method}</span></td>
                        <td><code style={{ color: '#38bdf8', fontSize: '11px' }}>{d.receipt_sms || 'N/A'}</code></td>
                        <td>
                          {d.proof_image
                            ? <a href={d.proof_image} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700, fontSize: '12px' }}><Eye size={13}/> View</a>
                            : <span style={{ color: '#334155', fontSize: '11px' }}>None</span>}
                        </td>
                        <td><StatusBadge status={d.status} /></td>
                        <td>
                          {d.status === 'pending'
                            ? <div className="actions-cell">
                                <button className="btn-approve" onClick={() => approveDeposit(d.id)}>✅ Approve</button>
                                <button className="btn-reject"  onClick={() => rejectDeposit(d.id)}>❌ Reject</button>
                              </div>
                            : <span style={{ color: '#334155', fontSize: '11px' }}>Processed</span>}
                        </td>
                      </tr>
                    ))}
                    {deposits.filter(d => depositFilter==='all'||d.status===depositFilter).length === 0 && (
                      <tr><td colSpan={8} className="empty-state">No {depositFilter} deposits found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>}

          {/* ══════════════════════════════════════
              📤 WITHDRAWALS
          ══════════════════════════════════════ */}
          {activeTab === 'withdrawals' && <>
            <div>
              <p className="page-heading">📤 Withdrawals</p>
              <p className="page-sub">Manage player withdrawal requests</p>
            </div>

            <div className="filter-tabs">
              {[
                { key: 'pending',  label: 'Pending' },
                { key: 'approved', label: 'Approved / Paid' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'all',      label: 'All' },
              ].map(f => (
                <button key={f.key} className={`filter-tab${withdrawFilter===f.key?' active':''}`} onClick={() => setWithdrawFilter(f.key)}>
                  {f.label} ({f.key==='all' ? withdrawals.length : withdrawals.filter(w => f.key==='approved' ? (w.status==='approved'||w.status==='paid') : w.status===f.key).length})
                </button>
              ))}
            </div>

            <div className="section-card">
              <div className="table-overflow">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th><th>User</th><th>Amount</th><th>Method</th>
                      <th>Telebirr / CBE / CBE Birr Account</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.filter(w => {
                      if (withdrawFilter === 'all') return true;
                      if (withdrawFilter === 'approved') return w.status==='approved'||w.status==='paid';
                      return w.status === withdrawFilter;
                    }).map(w => (
                      <tr key={w.id}>
                        <td style={{ color: '#475569' }}>#{w.id}</td>
                        <td>
                          <strong style={{ display: 'block' }}>{w.username || `User #${w.user_id}`}</strong>
                          {w.phone && <span style={{ color: '#475569', fontSize: '11px' }}>{w.phone}</span>}
                        </td>
                        <td style={{ color: '#f87171', fontWeight: 900, fontSize: '13px' }}>{(+w.amount).toFixed(2)} ETB</td>
                        <td><span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{w.method}</span></td>
                        <td><code style={{ color: '#10b981', fontWeight: 800, fontSize: '13px' }}>{w.account_number}</code></td>
                        <td><StatusBadge status={w.status} /></td>
                        <td>
                          {w.status === 'pending'
                            ? <div className="actions-cell">
                                <button className="btn-approve" onClick={() => approveWithdrawal(w.id)}>✅ Mark as Paid</button>
                                <button className="btn-reject"  onClick={() => rejectWithdrawal(w.id)}>❌ Reject</button>
                              </div>
                            : <span style={{ color: '#334155', fontSize: '11px' }}>Completed</span>}
                        </td>
                      </tr>
                    ))}
                    {withdrawals.filter(w => withdrawFilter==='all'||(withdrawFilter==='approved'?(w.status==='approved'||w.status==='paid'):w.status===withdrawFilter)).length === 0 && (
                      <tr><td colSpan={7} className="empty-state">No {withdrawFilter} withdrawals found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>}

          {/* ══════════════════════════════════════
              📢 BROADCAST
          ══════════════════════════════════════ */}
          {activeTab === 'broadcast' && <>
            <div>
              <p className="page-heading">📢 Broadcast</p>
              <p className="page-sub">Send announcements to players</p>
            </div>

            <div className="broadcast-card">
              <form onSubmit={sendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <div className="form-label">Select Target Audience</div>
                  <div className="broadcast-target-grid">
                    <button type="button" className={`target-btn${bcastTarget==='both'?' active-all':''}`} onClick={() => setBcastTarget('both')}>
                      📢 Send to All Users
                    </button>
                    <button type="button" className={`target-btn${bcastTarget==='online'?' active-online':''}`} onClick={() => setBcastTarget('online')}>
                      🟢 Send to Online Users
                    </button>
                  </div>
                </div>

                <div>
                  <div className="form-label">Message</div>
                  <textarea
                    className="broadcast-textarea"
                    placeholder="Type your announcement here..."
                    value={bcastMsg}
                    onChange={e => setBcastMsg(e.target.value)}
                    rows={5}
                  />
                </div>

                <button type="submit" className="broadcast-send-btn" disabled={bcastBusy || !bcastMsg.trim()}>
                  <Send size={15} />
                  {bcastBusy ? 'Sending...' : 'Send Broadcast'}
                </button>
              </form>
            </div>
          </>}

          {/* ══════════════════════════════════════
              📈 REPORTS
          ══════════════════════════════════════ */}
          {activeTab === 'reports' && <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p className="page-heading">📈 Reports</p>
                <p className="page-sub">System financial analytics</p>
              </div>
              <div className="filter-tabs">
                {[
                  { key: 'daily',   label: '📅 Daily' },
                  { key: 'weekly',  label: '🗓 Weekly' },
                  { key: 'monthly', label: '📊 Monthly' },
                  { key: 'all',     label: '♾ All Time' },
                ].map(f => (
                  <button key={f.key} className={`filter-tab${reportsFrame===f.key?' active':''}`} onClick={() => setReportsFrame(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="reports-stat-grid">
              <ReportCard label="Total Deposits"    value={`${rDepAmt.toFixed(0)} ETB`}      sub={`${rDep.filter(d=>d.status==='approved').length} approved`}                           color="#10b981" />
              <ReportCard label="Total Withdrawals" value={`${rWithAmt.toFixed(0)} ETB`}     sub={`${rWith.filter(w=>w.status==='approved'||w.status==='paid').length} paid`}            color="#f87171" />
              <ReportCard label="Revenue"           value={`${Math.max(0,rDepAmt-rWithAmt).toFixed(0)} ETB`} sub="Net system earnings"                                                  color="#f59e0b" />
              <ReportCard label="Total Games"       value={metrics?.totalGamesPlayed ?? 1}   sub="Bingo rounds played"                                                                    color="#38bdf8" />
              <ReportCard label="Total Players"     value={usersList.length}                 sub="Registered accounts"                                                                    color="#c084fc" />
              <ReportCard label="Prizes Paid"       value={`${rWithAmt.toFixed(0)} ETB`}     sub="Claimed winnings"                                                                       color="#f472b6" />
            </div>

            <div className="section-card">
              <div className="section-card-header" style={{ color: '#38bdf8' }}>
                📋 Transaction History &nbsp;<span style={{ color: '#475569', fontSize: '11px', fontWeight: 700 }}>({reportsFrame.toUpperCase()})</span>
              </div>
              <div className="table-overflow">
                <table className="admin-table">
                  <thead>
                    <tr><th>Type</th><th>User</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {[...rDep.map(d=>({...d,_type:'DEPOSIT'})), ...rWith.map(w=>({...w,_type:'WITHDRAWAL'}))]
                      .sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0))
                      .map((tx, i) => (
                        <tr key={i}>
                          <td>
                            <span style={{ background: tx._type==='DEPOSIT'?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color: tx._type==='DEPOSIT'?'#10b981':'#f87171', padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:900 }}>
                              {tx._type==='DEPOSIT'?'📥 DEPOSIT':'📤 WITHDRAWAL'}
                            </span>
                          </td>
                          <td><strong>{tx.username || `#${tx.user_id}`}</strong></td>
                          <td style={{ fontWeight: 900, color: tx._type==='DEPOSIT'?'#10b981':'#f87171' }}>{(+tx.amount).toFixed(2)} ETB</td>
                          <td>{tx.method} {tx.account_number ? `(${tx.account_number})` : tx.receipt_sms ? `(${tx.receipt_sms})` : ''}</td>
                          <td><StatusBadge status={tx.status} /></td>
                          <td style={{ color: '#475569', fontSize: '11px' }}>{tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Recent'}</td>
                        </tr>
                      ))
                    }
                    {(rDep.length + rWith.length) === 0 && (
                      <tr><td colSpan={6} className="empty-state">No transactions found for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>}

        </main>
      </div>
    </div>
  );
}

// ── Shared mini-components ───────────────────────────────────

function StatCard({ icon, label, value, color, accent, urgent }) {
  return (
    <div className="stat-card" style={{ borderColor: `${accent}40` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="sc-icon" style={{ background: `${accent}20`, color: accent }}>{icon}</div>
      <div className="sc-label">{label}</div>
      <div className="sc-value" style={{ color: urgent ? '#ef4444' : color }}>{value}</div>
    </div>
  );
}

function ReportCard({ label, value, sub, color }) {
  return (
    <div className="section-card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#334155', marginTop: 3, fontWeight: 700 }}>{sub}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <strong style={{ color: '#e2e8f0' }}>{value}</strong>
    </div>
  );
}
