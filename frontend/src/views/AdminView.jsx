import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ArrowDownLeft, ArrowUpRight, Send, BarChart3,
  Users, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle,
  Eye, Search, RefreshCw, Trophy, DollarSign, Filter, Menu, X, Smartphone
} from 'lucide-react';
import { apiFetch } from '../api';

const S = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#020617',
    color: '#f1f5f9',
    fontFamily: '"Outfit", "Inter", system-ui, sans-serif'
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  sidebar: (open) => ({
    width: open ? '240px' : '0px',
    minWidth: open ? '240px' : '0px',
    background: 'rgba(15,23,42,0.98)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: open ? '16px 10px' : '0',
    gap: '4px',
    overflow: 'hidden',
    transition: 'all 0.25s ease',
    flexShrink: 0,
    zIndex: 100
  }),
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px 14px',
    marginBottom: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: '15px',
    fontWeight: '900',
    color: '#fff',
    whiteSpace: 'nowrap'
  },
  navBtn: (active) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    borderRadius: '12px',
    border: 'none',
    background: active ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
    color: active ? '#fff' : '#94a3b8',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.18s',
    width: '100%',
    textAlign: 'left',
    whiteSpace: 'nowrap'
  }),
  navBtnInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  badge: (active) => ({
    background: active ? '#fff' : '#ef4444',
    color: active ? '#1d4ed8' : '#fff',
    borderRadius: '20px',
    padding: '1px 7px',
    fontSize: '11px',
    fontWeight: '900'
  }),
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(15,23,42,0.95)',
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  grid5: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px'
  },
  card: (border = 'rgba(255,255,255,0.08)', bg = 'rgba(15,23,42,0.7)') => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '14px',
    padding: '14px 16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  }),
  cardTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px'
  },
  cardValue: (color = '#fff') => ({
    fontSize: '22px',
    fontWeight: '900',
    color: color,
    lineHeight: 1.1
  }),
  tableWrap: {
    background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left'
  },
  th: {
    background: 'rgba(30,41,59,0.8)',
    color: '#94a3b8',
    fontWeight: '800',
    padding: '10px 14px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: '#e2e8f0',
    verticalAlign: 'middle'
  },
  btnApprove: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer'
  },
  btnReject: {
    background: 'rgba(239,68,68,0.15)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.3)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer'
  },
  statusBadge: (status) => {
    const isApp = status === 'approved' || status === 'paid';
    const isRej = status === 'rejected';
    return {
      background: isApp ? 'rgba(16,185,129,0.15)' : isRej ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
      color: isApp ? '#10b981' : isRej ? '#ef4444' : '#f59e0b',
      border: `1px solid ${isApp ? 'rgba(16,185,129,0.3)' : isRej ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
      padding: '3px 9px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'capitalize',
      display: 'inline-block'
    };
  },
  filterTabBtn: (active) => ({
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    background: active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? '#38bdf8' : '#94a3b8',
    fontWeight: '800',
    fontSize: '12px',
    cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'transparent'}`
  })
};

export default function AdminView({ lang, token, socket, onGoToLobby }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | deposits | withdrawals | broadcast | reports

  // Data state
  const [metrics, setMetrics] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flashMsg, setFlashMsg] = useState({ error: '', success: '' });

  // Filters
  const [depositFilter, setDepositFilter] = useState('pending'); // pending | approved | rejected | all
  const [withdrawFilter, setWithdrawFilter] = useState('pending'); // pending | approved | rejected | all
  const [reportsTimeframe, setReportsTimeframe] = useState('all'); // daily | weekly | monthly | all

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState('both'); // all (both) | online
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Auto rejection reason requested by user
  const AUTO_REJECT_REASON = 'fake transaction and try again';

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [mRes, dRes, wRes, uRes] = await Promise.all([
        apiFetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/admin/deposits', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/admin/withdrawals', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (mRes.ok) setMetrics(await mRes.json());
      if (dRes.ok) setDeposits(await dRes.json());
      if (wRes.ok) setWithdrawals(await wRes.json());
      if (uRes.ok) setUsersList(await uRes.json());
    } catch (e) {
      console.error('[Admin] Data fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (socket) {
      const handleDataChange = () => fetchAllData();
      socket.on('admin_data_changed', handleDataChange);
      return () => socket.off('admin_data_changed', handleDataChange);
    }
  }, [token, socket]);

  // Actions
  const handleApproveDeposit = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve deposit');
      setFlashMsg({ success: `Deposit #${id} approved successfully!`, error: '' });
      fetchAllData();
    } catch (err) {
      setFlashMsg({ error: err.message, success: '' });
    }
  };

  const handleRejectDeposit = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: AUTO_REJECT_REASON })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject deposit');
      setFlashMsg({ success: `Deposit #${id} rejected (${AUTO_REJECT_REASON})`, error: '' });
      fetchAllData();
    } catch (err) {
      setFlashMsg({ error: err.message, success: '' });
    }
  };

  const handleApproveWithdrawal = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve withdrawal');
      setFlashMsg({ success: `Withdrawal #${id} approved & marked as paid!`, error: '' });
      fetchAllData();
    } catch (err) {
      setFlashMsg({ error: err.message, success: '' });
    }
  };

  const handleRejectWithdrawal = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: AUTO_REJECT_REASON })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject withdrawal');
      setFlashMsg({ success: `Withdrawal #${id} rejected (${AUTO_REJECT_REASON})`, error: '' });
      fetchAllData();
    } catch (err) {
      setFlashMsg({ error: err.message, success: '' });
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    try {
      const res = await apiFetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: broadcastTarget, message: broadcastMsg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');
      setFlashMsg({ success: `Broadcast sent to ${broadcastTarget === 'online' ? 'Online Users' : 'All Users'}!`, error: '' });
      setBroadcastMsg('');
    } catch (err) {
      setFlashMsg({ error: err.message, success: '' });
    } finally {
      setBroadcasting(false);
    }
  };

  // Calculations
  const pendingDeposits = useMemo(() => deposits.filter(d => d.status === 'pending'), [deposits]);
  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => w.status === 'pending'), [withdrawals]);
  const pendingRequestsCount = pendingDeposits.length + pendingWithdrawals.length;

  const totalDeposited = useMemo(() => deposits.filter(d => d.status === 'approved').reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0), [deposits]);
  const totalWithdrawn = useMemo(() => withdrawals.filter(w => w.status === 'approved' || w.status === 'paid').reduce((acc, w) => acc + (parseFloat(w.amount) || 0), 0), [withdrawals]);
  const totalRevenue = useMemo(() => Math.max(0, totalDeposited - totalWithdrawn), [totalDeposited, totalWithdrawn]);

  // Reports Timeframe filtering
  const filteredDepositsByTime = useMemo(() => {
    if (reportsTimeframe === 'all') return deposits;
    const now = new Date();
    return deposits.filter(d => {
      const date = new Date(d.created_at || Date.now());
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      if (reportsTimeframe === 'daily') return diffDays <= 1;
      if (reportsTimeframe === 'weekly') return diffDays <= 7;
      if (reportsTimeframe === 'monthly') return diffDays <= 30;
      return true;
    });
  }, [deposits, reportsTimeframe]);

  const filteredWithdrawalsByTime = useMemo(() => {
    if (reportsTimeframe === 'all') return withdrawals;
    const now = new Date();
    return withdrawals.filter(w => {
      const date = new Date(w.created_at || Date.now());
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      if (reportsTimeframe === 'daily') return diffDays <= 1;
      if (reportsTimeframe === 'weekly') return diffDays <= 7;
      if (reportsTimeframe === 'monthly') return diffDays <= 30;
      return true;
    });
  }, [withdrawals, reportsTimeframe]);

  const reportsDepositsTotal = useMemo(() => filteredDepositsByTime.filter(d => d.status === 'approved').reduce((a, d) => a + (parseFloat(d.amount) || 0), 0), [filteredDepositsByTime]);
  const reportsWithdrawalsTotal = useMemo(() => filteredWithdrawalsByTime.filter(w => w.status === 'approved' || w.status === 'paid').reduce((a, w) => a + (parseFloat(w.amount) || 0), 0), [filteredWithdrawalsByTime]);
  const reportsRevenueTotal = useMemo(() => Math.max(0, reportsDepositsTotal - reportsWithdrawalsTotal), [reportsDepositsTotal, reportsWithdrawalsTotal]);

  const sidebarNavItems = [
    { key: 'dashboard', label: '📊 Dashboard', icon: <LayoutDashboard size={18} />, badge: pendingRequestsCount },
    { key: 'deposits', label: '💰 Deposits', icon: <ArrowDownLeft size={18} />, badge: pendingDeposits.length },
    { key: 'withdrawals', label: '📤 Withdrawals', icon: <ArrowUpRight size={18} />, badge: pendingWithdrawals.length },
    { key: 'broadcast', label: '📢 Broadcast', icon: <Send size={18} />, badge: 0 },
    { key: 'reports', label: '📈 Reports', icon: <BarChart3 size={18} />, badge: 0 }
  ];

  return (
    <div style={S.shell}>
      <div style={S.body}>

        {/* ── SIDEBAR NAVIGATION ── */}
        <div style={S.sidebar(sidebarOpen)}>
          <div style={S.sidebarHeader}>
            <ShieldCheck size={22} color="#38bdf8" />
            <span>AflaBingo Admin</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {sidebarNavItems.map(item => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  style={S.navBtn(active)}
                  onClick={() => {
                    setActiveTab(item.key);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                >
                  <div style={S.navBtnInner}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && <span style={S.badge(active)}>{item.badge}</span>}
                </button>
              );
            })}
          </div>

          {onGoToLobby && (
            <button
              onClick={onGoToLobby}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#94a3b8',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: 'auto'
              }}
            >
              🎮 Go to Player Game
            </button>
          )}
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div style={S.content}>

          {/* Top Bar */}
          <div style={S.topBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                {sidebarNavItems.find(i => i.key === activeTab)?.label || 'Admin Panel'}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={fetchAllData}
                disabled={loading}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Flash Messages */}
          {flashMsg.error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {flashMsg.error}
            </div>
          )}
          {flashMsg.success && (
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {flashMsg.success}
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. 📊 DASHBOARD                                             */}
          {/* ============================================================ */}
          {activeTab === 'dashboard' && (
            <>
              {/* 5 Main Cards */}
              <div style={S.grid5}>
                <div style={S.card('rgba(59,130,246,0.3)', 'rgba(59,130,246,0.08)')}>
                  <div style={S.cardTitle}>👥 Total Users</div>
                  <div style={S.cardValue('#38bdf8')}>{metrics?.totalUsers || usersList.length || 0}</div>
                </div>

                <div style={S.card('rgba(16,185,129,0.3)', 'rgba(16,185,129,0.08)')}>
                  <div style={S.cardTitle}>💰 Total Deposits</div>
                  <div style={S.cardValue('#10b981')}>{totalDeposited.toFixed(0)} <span style={{ fontSize: '12px' }}>ETB</span></div>
                </div>

                <div style={S.card('rgba(239,68,68,0.3)', 'rgba(239,68,68,0.08)')}>
                  <div style={S.cardTitle}>📤 Total Withdrawals</div>
                  <div style={S.cardValue('#f87171')}>{totalWithdrawn.toFixed(0)} <span style={{ fontSize: '12px' }}>ETB</span></div>
                </div>

                <div style={S.card('rgba(245,158,11,0.3)', 'rgba(245,158,11,0.08)')}>
                  <div style={S.cardTitle}>📈 Revenue</div>
                  <div style={S.cardValue('#f59e0b')}>{totalRevenue.toFixed(0)} <span style={{ fontSize: '12px' }}>ETB</span></div>
                </div>

                <div style={S.card('rgba(168,85,247,0.3)', 'rgba(168,85,247,0.08)')}>
                  <div style={S.cardTitle}>⏳ Pending Requests</div>
                  <div style={S.cardValue('#c084fc')}>{pendingRequestsCount}</div>
                </div>
              </div>

              {/* Below Cards: 4 Tables / Lists */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

                {/* 1. Recent Deposits */}
                <div style={S.tableWrap}>
                  <div style={{ padding: '12px 16px', fontWeight: '900', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#38bdf8' }}>
                    💰 Recent Deposits
                  </div>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>User</th>
                        <th style={S.th}>Amount</th>
                        <th style={S.th}>Method</th>
                        <th style={S.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.slice(0, 5).map(d => (
                        <tr key={d.id}>
                          <td style={S.td}>{d.username || `User #${d.user_id}`}</td>
                          <td style={{ ...S.td, fontWeight: '800', color: '#10b981' }}>{parseFloat(d.amount).toFixed(2)} ETB</td>
                          <td style={S.td}>{d.method}</td>
                          <td style={S.td}><span style={S.statusBadge(d.status)}>{d.status}</span></td>
                        </tr>
                      ))}
                      {deposits.length === 0 && <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>No deposits yet</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* 2. Recent Withdrawals */}
                <div style={S.tableWrap}>
                  <div style={{ padding: '12px 16px', fontWeight: '900', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#f87171' }}>
                    📤 Recent Withdrawals
                  </div>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>User</th>
                        <th style={S.th}>Amount</th>
                        <th style={S.th}>Account</th>
                        <th style={S.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.slice(0, 5).map(w => (
                        <tr key={w.id}>
                          <td style={S.td}>{w.username || `User #${w.user_id}`}</td>
                          <td style={{ ...S.td, fontWeight: '800', color: '#f87171' }}>{parseFloat(w.amount).toFixed(2)} ETB</td>
                          <td style={S.td}>{w.account_number}</td>
                          <td style={S.td}><span style={S.statusBadge(w.status)}>{w.status}</span></td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>No withdrawals yet</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* 3. Recent Games */}
                <div style={S.tableWrap}>
                  <div style={{ padding: '12px 16px', fontWeight: '900', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#f59e0b' }}>
                    🎮 Live Game Status
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>Status:</span>
                      <strong style={{ color: '#10b981' }}>{metrics?.gameStatus || 'COUNTDOWN'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>Tickets Sold This Round:</span>
                      <strong style={{ color: '#fff' }}>{metrics?.cartellasSoldThisRound || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>Prize Pool:</span>
                      <strong style={{ color: '#f59e0b' }}>{(metrics?.prizePool || 0).toFixed(2)} ETB</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Current Online Users */}
                <div style={S.tableWrap}>
                  <div style={{ padding: '12px 16px', fontWeight: '900', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#c084fc' }}>
                    🟢 Current Online Users
                  </div>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#10b981', marginBottom: '4px' }}>
                      {metrics?.onlinePlayers || 1}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Players Connected Right Now</div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* 2. 💰 DEPOSITS                                              */}
          {/* ============================================================ */}
          {activeTab === 'deposits' && (
            <>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['pending', 'approved', 'rejected', 'all'].map(f => (
                  <button
                    key={f}
                    style={S.filterTabBtn(depositFilter === f)}
                    onClick={() => setDepositFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? deposits.length : deposits.filter(d => d.status === f).length})
                  </button>
                ))}
              </div>

              {/* Deposits Table */}
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>User</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>Payment Method</th>
                      <th style={S.th}>Transaction / SMS Code</th>
                      <th style={S.th}>Screenshot</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits
                      .filter(d => depositFilter === 'all' || d.status === depositFilter)
                      .map(d => (
                        <tr key={d.id}>
                          <td style={S.td}>#{d.id}</td>
                          <td style={S.td}>
                            <strong>{d.username || `User #${d.user_id}`}</strong>
                            {d.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>{d.phone}</div>}
                          </td>
                          <td style={{ ...S.td, fontWeight: '900', color: '#10b981', fontSize: '14px' }}>
                            {parseFloat(d.amount).toFixed(2)} ETB
                          </td>
                          <td style={S.td}>
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                              {d.method}
                            </span>
                          </td>
                          <td style={S.td}>
                            <code style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '6px', color: '#38bdf8', fontSize: '12px' }}>
                              {d.receipt_sms || 'N/A'}
                            </code>
                          </td>
                          <td style={S.td}>
                            {d.proof_image ? (
                              <a href={d.proof_image} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '700', fontSize: '12px' }}>
                                <Eye size={14} /> View
                              </a>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>None</span>
                            )}
                          </td>
                          <td style={S.td}><span style={S.statusBadge(d.status)}>{d.status}</span></td>
                          <td style={S.td}>
                            {d.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleApproveDeposit(d.id)} style={S.btnApprove}>
                                  ✅ Approve
                                </button>
                                <button onClick={() => handleRejectDeposit(d.id)} style={S.btnReject}>
                                  ❌ Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}

                    {deposits.filter(d => depositFilter === 'all' || d.status === depositFilter).length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No {depositFilter} deposits found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* 3. 📤 WITHDRAWALS                                           */}
          {/* ============================================================ */}
          {activeTab === 'withdrawals' && (
            <>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'pending', label: 'Pending' },
                  { key: 'approved', label: 'Approved / Paid' },
                  { key: 'rejected', label: 'Rejected' },
                  { key: 'all', label: 'All' }
                ].map(f => (
                  <button
                    key={f.key}
                    style={S.filterTabBtn(withdrawFilter === f.key)}
                    onClick={() => setWithdrawFilter(f.key)}
                  >
                    {f.label} ({f.key === 'all' ? withdrawals.length : withdrawals.filter(w => f.key === 'approved' ? (w.status === 'approved' || w.status === 'paid') : w.status === f.key).length})
                  </button>
                ))}
              </div>

              {/* Withdrawals Table */}
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>User</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>Method</th>
                      <th style={S.th}>Telebirr / CBE / CBE Birr Account</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals
                      .filter(w => {
                        if (withdrawFilter === 'all') return true;
                        if (withdrawFilter === 'approved') return w.status === 'approved' || w.status === 'paid';
                        return w.status === withdrawFilter;
                      })
                      .map(w => (
                        <tr key={w.id}>
                          <td style={S.td}>#{w.id}</td>
                          <td style={S.td}>
                            <strong>{w.username || `User #${w.user_id}`}</strong>
                            {w.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>{w.phone}</div>}
                          </td>
                          <td style={{ ...S.td, fontWeight: '900', color: '#f87171', fontSize: '14px' }}>
                            {parseFloat(w.amount).toFixed(2)} ETB
                          </td>
                          <td style={S.td}>
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                              {w.method}
                            </span>
                          </td>
                          <td style={S.td}>
                            <code style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '6px', color: '#10b981', fontSize: '13px', fontWeight: '800' }}>
                              {w.account_number}
                            </code>
                          </td>
                          <td style={S.td}><span style={S.statusBadge(w.status)}>{w.status === 'approved' ? 'Approved & Paid' : w.status}</span></td>
                          <td style={S.td}>
                            {w.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleApproveWithdrawal(w.id)} style={S.btnApprove}>
                                  ✅ Mark as Paid & Approve
                                </button>
                                <button onClick={() => handleRejectWithdrawal(w.id)} style={S.btnReject}>
                                  ❌ Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Paid / Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}

                    {withdrawals.filter(w => withdrawFilter === 'all' || (withdrawFilter === 'approved' ? (w.status === 'approved' || w.status === 'paid') : w.status === withdrawFilter)).length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No {withdrawFilter} withdrawals found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* 4. 📢 BROADCAST                                              */}
          {/* ============================================================ */}
          {activeTab === 'broadcast' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              <div style={S.card('rgba(59,130,246,0.3)')}>
                <h3 style={{ margin: '0 0 16px', fontWeight: '900', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="#38bdf8" /> Send Broadcast Announcement
                </h3>

                <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Target Radio / Options */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginBottom: '8px' }}>
                      Select Target Audience:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setBroadcastTarget('both')}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: `1.5px solid ${broadcastTarget === 'both' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                          background: broadcastTarget === 'both' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                          color: broadcastTarget === 'both' ? '#38bdf8' : '#94a3b8',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        📢 Send to All Users
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastTarget('online')}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: `1.5px solid ${broadcastTarget === 'online' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                          background: broadcastTarget === 'online' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                          color: broadcastTarget === 'online' ? '#10b981' : '#94a3b8',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        🟢 Send to Online Users
                      </button>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#94a3b8', marginBottom: '6px' }}>
                      Broadcast Message Content:
                    </label>
                    <textarea
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(5,8,15,0.8)',
                        color: '#fff',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      placeholder="Type announcement message here..."
                      value={broadcastMsg}
                      onChange={e => setBroadcastMsg(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={broadcasting || !broadcastMsg.trim()}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: '#fff',
                      fontWeight: '900',
                      fontSize: '14px',
                      cursor: 'pointer',
                      opacity: broadcasting || !broadcastMsg.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={16} /> {broadcasting ? 'Sending Announcement...' : 'Send Broadcast Now'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. 📈 REPORTS                                                */}
          {/* ============================================================ */}
          {activeTab === 'reports' && (
            <>
              {/* Header & Filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#fff', fontSize: '16px' }}>
                  📈 System Reports & Analytics
                </h3>

                {/* Filter buttons: Daily / Weekly / Monthly / All */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'daily', label: '📅 Daily' },
                    { key: 'weekly', label: '🗓️ Weekly' },
                    { key: 'monthly', label: '📊 Monthly' },
                    { key: 'all', label: '♾️ All Time' }
                  ].map(f => (
                    <button
                      key={f.key}
                      style={S.filterTabBtn(reportsTimeframe === f.key)}
                      onClick={() => setReportsTimeframe(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reports Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={S.card('rgba(16,185,129,0.3)')}>
                  <div style={S.cardTitle}>💰 Total Deposits</div>
                  <div style={S.cardValue('#10b981')}>{reportsDepositsTotal.toFixed(0)} ETB</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{filteredDepositsByTime.filter(d => d.status === 'approved').length} approved deposits</div>
                </div>

                <div style={S.card('rgba(239,68,68,0.3)')}>
                  <div style={S.cardTitle}>📤 Total Withdrawals</div>
                  <div style={S.cardValue('#f87171')}>{reportsWithdrawalsTotal.toFixed(0)} ETB</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{filteredWithdrawalsByTime.filter(w => w.status === 'approved' || w.status === 'paid').length} paid requests</div>
                </div>

                <div style={S.card('rgba(245,158,11,0.3)')}>
                  <div style={S.cardTitle}>📈 Total Revenue</div>
                  <div style={S.cardValue('#f59e0b')}>{reportsRevenueTotal.toFixed(0)} ETB</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Net system earnings</div>
                </div>

                <div style={S.card('rgba(59,130,246,0.3)')}>
                  <div style={S.cardTitle}>🎮 Total Games</div>
                  <div style={S.cardValue('#38bdf8')}>{metrics?.totalGamesPlayed || 1}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Bingo rounds completed</div>
                </div>

                <div style={S.card('rgba(168,85,247,0.3)')}>
                  <div style={S.cardTitle}>👥 Total Players</div>
                  <div style={S.cardValue('#c084fc')}>{usersList.length}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Registered accounts</div>
                </div>

                <div style={S.card('rgba(236,72,153,0.3)')}>
                  <div style={S.cardTitle}>🏆 Total Prizes Paid</div>
                  <div style={S.cardValue('#f472b6')}>{reportsWithdrawalsTotal.toFixed(0)} ETB</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Claimed player winnings</div>
                </div>
              </div>

              {/* Filtered History Log Table */}
              <div style={S.tableWrap}>
                <div style={{ padding: '12px 16px', fontWeight: '900', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#38bdf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📋 Deposit & Withdrawal Transaction History ({reportsTimeframe.toUpperCase()})</span>
                </div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Type</th>
                      <th style={S.th}>User</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>Method / Details</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...filteredDepositsByTime.map(d => ({ ...d, txType: 'DEPOSIT' })),
                      ...filteredWithdrawalsByTime.map(w => ({ ...w, txType: 'WITHDRAWAL' }))
                    ]
                      .sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()))
                      .map((tx, idx) => (
                        <tr key={idx}>
                          <td style={S.td}>
                            <span style={{
                              background: tx.txType === 'DEPOSIT' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: tx.txType === 'DEPOSIT' ? '#10b981' : '#f87171',
                              padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '900'
                            }}>
                              {tx.txType === 'DEPOSIT' ? '📥 DEPOSIT' : '📤 WITHDRAWAL'}
                            </span>
                          </td>
                          <td style={S.td}>
                            <strong>{tx.username || `User #${tx.user_id}`}</strong>
                          </td>
                          <td style={{ ...S.td, fontWeight: '900', color: tx.txType === 'DEPOSIT' ? '#10b981' : '#f87171' }}>
                            {parseFloat(tx.amount).toFixed(2)} ETB
                          </td>
                          <td style={S.td}>{tx.method} {tx.account_number ? `(${tx.account_number})` : tx.receipt_sms ? `(${tx.receipt_sms})` : ''}</td>
                          <td style={S.td}><span style={S.statusBadge(tx.status)}>{tx.status}</span></td>
                          <td style={{ ...S.td, color: '#94a3b8', fontSize: '12px' }}>
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Recent'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
