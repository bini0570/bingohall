import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, CheckCircle2, XCircle, Settings, Send, Ban,
  AlertCircle, Eye, PlusCircle, MinusCircle, DollarSign, Clock,
  LayoutDashboard, Wallet, ArrowDownLeft, ArrowUpRight, Search, Ticket, Menu, X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';
async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

// Socket.io for real-time admin updates
import { io } from 'socket.io-client';
let adminSocket = null;

const S = {
  // Layout
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#020617',
    color: '#f1f5f9',
    fontFamily: '"Inter", system-ui, sans-serif',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Sidebar
  sidebar: (open) => ({
    width: open ? '240px' : '0px',
    minWidth: open ? '240px' : '0px',
    background: 'rgba(15,23,42,0.97)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: open ? '16px 10px' : '0',
    gap: '4px',
    overflow: 'hidden',
    transition: 'all 0.25s ease',
    flexShrink: 0,
    zIndex: 100,
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
    whiteSpace: 'nowrap',
  },
  navBtn: (active) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 12px',
    borderRadius: '12px',
    border: 'none',
    background: active ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'transparent',
    color: active ? '#fff' : '#94a3b8',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.18s',
    width: '100%',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }),
  navBtnInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badge: (active) => ({
    background: active ? '#fff' : '#ef4444',
    color: active ? '#1d4ed8' : '#fff',
    borderRadius: '20px',
    padding: '1px 7px',
    fontSize: '11px',
    fontWeight: '900',
    flexShrink: 0,
  }),

  // Top header bar
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(15,23,42,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  menuBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topbarTitle: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '900',
    color: '#fff',
  },

  // Main content
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    minWidth: 0,
  },

  // Section title
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '16px',
  },

  // Cards
  card: (extraStyle = {}) => ({
    background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '18px',
    ...extraStyle,
  }),
  metricCard: (accentColor) => ({
    background: `linear-gradient(135deg, rgba(${accentColor},0.12) 0%, rgba(15,23,42,0.85) 100%)`,
    border: `1px solid rgba(${accentColor},0.25)`,
    borderRadius: '16px',
    padding: '18px',
  }),
  metricLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  metricValue: (color) => ({
    fontSize: '26px',
    fontWeight: '900',
    color: color || '#fff',
    lineHeight: 1,
  }),
  metricUnit: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: '4px',
  },

  // Row
  row: (justify = 'flex-start', gap = '10px', wrap = false) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: justify,
    gap,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  }),

  // Inputs
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(15,23,42,0.9)',
    color: '#f1f5f9',
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  label: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '700',
    display: 'block',
    marginBottom: '6px',
  },

  // Buttons
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnSuccess: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg,#10b981,#059669)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnDanger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  btnGhost: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },

  // Status badge pill (non-interactive)
  statusPill: (status) => {
    const map = {
      pending:  { bg: 'rgba(245,158,11,0.18)', color: '#f59e0b' },
      approved: { bg: 'rgba(100,116,139,0.18)', color: '#94a3b8' },
      rejected: { bg: 'rgba(239,68,68,0.18)', color: '#ef4444' },
    };
    const s = map[status] || map.pending;
    return {
      fontSize: '11px',
      fontWeight: '800',
      padding: '4px 10px',
      borderRadius: '20px',
      background: s.bg,
      color: s.color,
      cursor: 'default',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    };
  },

  // Alert
  alertError: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '14px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  alertSuccess: {
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#6ee7b7',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '14px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  // Modal overlay
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.82)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#0f172a',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(99,102,241,0.3)',
    width: '100%',
    maxWidth: '400px',
  },
};

// ─────────────────────────────────────────────────────────────
// AdminView — used only inside the standalone admin SPA
// Props: token (admin JWT), onLogout (callback)
// ─────────────────────────────────────────────────────────────
export default function AdminView({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [metrics, setMetrics]       = useState(null);
  const [deposits, setDeposits]     = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [usersList, setUsersList]   = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [settings, setSettings]     = useState({ ticket_price:'10', commission_pct:'20', countdown_sec:'40' });
  const [bTarget, setBTarget]       = useState('both');
  const [bMessage, setBMessage]     = useState('');
  const [msg, setMsg]               = useState({ error:'', success:'' });
  const [showAll, setShowAll]       = useState({ deposits:false, withdrawals:false });
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [mR, dR, wR, uR, sR] = await Promise.all([
        apiFetch('/api/admin/metrics',     { headers: { Authorization:`Bearer ${token}` } }),
        apiFetch('/api/admin/deposits',    { headers: { Authorization:`Bearer ${token}` } }),
        apiFetch('/api/admin/withdrawals', { headers: { Authorization:`Bearer ${token}` } }),
        apiFetch('/api/admin/users',       { headers: { Authorization:`Bearer ${token}` } }),
        apiFetch('/api/admin/settings',    { headers: { Authorization:`Bearer ${token}` } }),
      ]);
      if (mR.ok) setMetrics(await mR.json());
      if (dR.ok) setDeposits(await dR.json());
      if (wR.ok) setWithdrawals(await wR.json());
      if (uR.ok) setUsersList(await uR.json());
      if (sR.ok) setSettings(await sR.json());
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchAdminData();
    // Fallback poll every 30s
    const interval = setInterval(fetchAdminData, 30000);

    // Real-time socket — instant updates when deposits/withdrawals arrive
    adminSocket = io(API_BASE, { transports: ['websocket', 'polling'], path: '/socket.io' });
    adminSocket.on('admin_data_changed', () => fetchAdminData());
    adminSocket.on('balance_updated',    () => fetchAdminData());

    return () => {
      clearInterval(interval);
      if (adminSocket) { adminSocket.disconnect(); adminSocket = null; }
    };
  }, [token]);

  // On small screens, collapse sidebar by default
  useEffect(() => {
    const check = () => setSidebarOpen(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const flash = (key, text) => {
    setMsg({ error:'', success:'', [key]: text });
    setTimeout(() => setMsg({ error:'', success:'' }), 4000);
  };

  const approveDeposit = async id => {
    setDeposits(p => p.map(d => String(d.id)===String(id) ? {...d,status:'approved'} : d));
    const r = await fetch(`${API_BASE}/api/admin/deposits/${id}/approve`, { method:'POST', headers:{Authorization:`Bearer ${token}`} });
    const data = await r.json();
    if (!r.ok) { flash('error', data.error); fetchAdminData(); }
    else { flash('success','Deposit approved — balance credited!'); fetchAdminData(); }
  };

  const approveWithdrawal = async id => {
    setWithdrawals(p => p.map(w => String(w.id)===String(id) ? {...w,status:'approved'} : w));
    const r = await fetch(`${API_BASE}/api/admin/withdrawals/${id}/approve`, { method:'POST', headers:{Authorization:`Bearer ${token}`} });
    const data = await r.json();
    if (!r.ok) { flash('error', data.error); fetchAdminData(); }
    else { flash('success','Withdrawal approved!'); fetchAdminData(); }
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    const { type, id } = rejectModal;
    if (type==='deposit') setDeposits(p => p.map(d => String(d.id)===String(id)?{...d,status:'rejected'}:d));
    else setWithdrawals(p => p.map(w => String(w.id)===String(id)?{...w,status:'rejected'}:w));
    await fetch(`${API_BASE}/api/admin/${type==='deposit'?'deposits':'withdrawals'}/${id}/reject`,{
      method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify({reason:rejectReason})
    });
    flash('success', `${type==='deposit'?'Deposit':'Withdrawal'} rejected.`);
    fetchAdminData();
    setRejectModal(null); setRejectReason('');
  };

  const adjustBalance = async () => {
    if (!balanceModal || !balanceAmount || parseFloat(balanceAmount)<0) return;
    const { user, action } = balanceModal;
    const r = await fetch(`${API_BASE}/api/admin/users/${user.id}/balance`,{
      method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify({action, amount: parseFloat(balanceAmount)})
    });
    const data = await r.json();
    if (!r.ok) flash('error', data.error);
    else { flash('success', `${user.username}'s balance updated!`); fetchAdminData(); }
    setBalanceModal(null); setBalanceAmount('');
  };

  const toggleBan = async userId => {
    await fetch(`${API_BASE}/api/admin/users/${userId}/ban`,{ method:'POST', headers:{Authorization:`Bearer ${token}`} });
    fetchAdminData();
  };

  const saveSettings = async e => {
    e.preventDefault();
    const r = await apiFetch('/api/admin/settings',{
      method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify(settings)
    });
    const data = await r.json();
    if (!r.ok) flash('error',data.error); else flash('success','Settings saved!');
  };

  const sendBroadcast = async e => {
    e.preventDefault();
    const r = await apiFetch('/api/admin/broadcast',{
      method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify({target:bTarget,message:bMessage})
    });
    const data = await r.json();
    if (!r.ok) flash('error',data.error); else { flash('success','Broadcast sent!'); setBMessage(''); }
  };

  const pendingDep = deposits.filter(d=>d.status==='pending').length;
  const pendingWit = withdrawals.filter(w=>w.status==='pending').length;
  const filteredUsers = usersList.filter(u =>
    (u.username||'').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.phone||'').includes(userSearch)
  );

  const NAV = [
    { key:'dashboard',   label:'Dashboard',           icon:<LayoutDashboard size={17}/>, badge:0 },
    { key:'live_game',   label:'Live Game Control',   icon:<Clock size={17}/>,           badge:0 },
    { key:'deposits',    label:'Deposits',             icon:<ArrowDownLeft size={17}/>,   badge:pendingDep },
    { key:'withdrawals', label:'Withdrawals',          icon:<ArrowUpRight size={17}/>,    badge:pendingWit },
    { key:'users',       label:'User Management',      icon:<Users size={17}/>,           badge:0 },
    { key:'settings',    label:'Game Settings',        icon:<Settings size={17}/>,        badge:0 },
    { key:'broadcast',   label:'Broadcast',            icon:<Send size={17}/>,            badge:0 },
  ];

  // ── Grid for dashboard metrics
  const metricsGrid = {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))',
    gap:'12px',
  };

  return (
    <div style={S.shell}>

      {/* ── TOP BAR ── */}
      <div style={S.topbar}>
        <button style={S.menuBtn} onClick={() => setSidebarOpen(o=>!o)} title="Toggle Sidebar">
          {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <span style={S.topbarTitle}>
          🛡️ BodBingo Admin &nbsp;·&nbsp; {NAV.find(n=>n.key===activeTab)?.label || 'Dashboard'}
        </span>

        {/* Right side controls */}
        <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
          <button
            style={{...S.btnDanger,padding:'6px 12px',fontSize:'12px',whiteSpace:'nowrap'}}
            onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── BODY: SIDEBAR + MAIN ── */}
      <div style={S.body}>

        {/* SIDEBAR */}
        <aside style={S.sidebar(sidebarOpen)}>
          <div style={S.sidebarHeader}>
            <ShieldCheck size={20} color="#3b82f6"/>
            ADMIN PANEL
          </div>

          {NAV.map(item => {
            const active = activeTab===item.key;
            return (
              <button
                key={item.key}
                style={S.navBtn(active)}
                onClick={() => { setActiveTab(item.key); if(window.innerWidth<768) setSidebarOpen(false); }}
              >
                <div style={S.navBtnInner}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge>0 && <span style={S.badge(active)}>{item.badge}</span>}
              </button>
            );
          })}
        </aside>

        {/* MAIN CONTENT */}
        <main style={S.main}>

          {/* ALERTS */}
          {msg.error   && <div style={S.alertError}><AlertCircle size={16}/>{msg.error}</div>}
          {msg.success && <div style={S.alertSuccess}><CheckCircle2 size={16}/>{msg.success}</div>}

          {/* REJECT MODAL */}
          {rejectModal && (
            <div style={S.overlay}>
              <div style={{...S.modal, border:'1px solid rgba(239,68,68,0.3)'}}>
                <div style={{fontSize:'16px',fontWeight:'900',color:'#ef4444',marginBottom:'10px'}}>
                  ❌ Reject {rejectModal.type==='deposit'?'Deposit':'Withdrawal'}
                </div>
                <div style={{fontSize:'13px',color:'#94a3b8',marginBottom:'10px'}}>
                  Reason sent to user via Telegram:
                </div>
                <textarea rows={3} style={{...S.input,resize:'vertical'}}
                  placeholder="e.g. Invalid transaction ID"
                  value={rejectReason} onChange={e=>setRejectReason(e.target.value)}/>
                <div style={{...S.row('flex-end','10px'),marginTop:'14px'}}>
                  <button style={S.btnGhost} onClick={()=>setRejectModal(null)}>Cancel</button>
                  <button style={S.btnDanger} onClick={submitReject}>Confirm Reject</button>
                </div>
              </div>
            </div>
          )}

          {/* BALANCE MODAL */}
          {balanceModal && (
            <div style={S.overlay}>
              <div style={S.modal}>
                <div style={{fontSize:'16px',fontWeight:'900',color:'#3b82f6',marginBottom:'8px'}}>
                  {balanceModal.action==='add'?'➕ Add':balanceModal.action==='deduct'?'➖ Deduct':'⚙️ Set'} Balance
                </div>
                <div style={{fontSize:'13px',color:'#94a3b8',marginBottom:'14px'}}>
                  User: <strong style={{color:'#fff'}}>{balanceModal.user.username}</strong><br/>
                  Current: <strong style={{color:'#10b981'}}>{(balanceModal.user.balance||0).toFixed(2)} ETB</strong>
                </div>
                <label style={S.label}>Amount (ETB):</label>
                <input type="number" style={{...S.input,fontSize:'22px',fontWeight:'900',textAlign:'center'}}
                  placeholder="100" min="1" value={balanceAmount} onChange={e=>setBalanceAmount(e.target.value)}/>
                <div style={{...S.row('flex-end','10px'),marginTop:'16px'}}>
                  <button style={S.btnGhost} onClick={()=>setBalanceModal(null)}>Cancel</button>
                  <button style={S.btnPrimary} onClick={adjustBalance}>Confirm</button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────── DASHBOARD ──────────── */}
          {activeTab==='dashboard' && (() => {
            const totalDeposited  = deposits.filter(d=>d.status==='approved').reduce((s,d)=>s+parseFloat(d.amount||0),0);
            const totalWithdrawn  = withdrawals.filter(w=>w.status==='approved').reduce((s,w)=>s+parseFloat(w.amount||0),0);
            const revenue         = totalDeposited - totalWithdrawn;
            return (
              <>
                <div style={S.sectionTitle}>🏠 System Overview</div>
                <div style={metricsGrid}>

                  <div style={S.metricCard('16,185,129')}>
                    <div style={S.metricLabel}>💰 Total System Balance</div>
                    <div style={S.metricValue('#10b981')}>
                      {(metrics?.totalSystemBalance||0).toFixed(0)}
                      <span style={S.metricUnit}>ETB</span>
                    </div>
                  </div>

                  <div style={S.card()}>
                    <div style={S.metricLabel}>👥 Registered Users</div>
                    <div style={S.metricValue('#fff')}>{metrics?.totalUsers||0}</div>
                  </div>

                  <div style={S.metricCard('16,185,129')}>
                    <div style={S.metricLabel}>📈 Revenue</div>
                    <div style={S.metricValue(revenue>=0?'#10b981':'#ef4444')}>
                      {revenue.toFixed(0)}
                      <span style={S.metricUnit}>ETB</span>
                    </div>
                  </div>

                  <div style={S.metricCard('239,68,68')}>
                    <div style={S.metricLabel}>📉 Payouts</div>
                    <div style={S.metricValue('#ef4444')}>
                      {totalWithdrawn.toFixed(0)}
                      <span style={S.metricUnit}>ETB</span>
                    </div>
                  </div>

                </div>
              </>
            );
          })()}

          {/* ──────────── LIVE GAME CONTROL ──────────── */}
          {activeTab==='live_game' && (
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div style={S.sectionTitle}>⚡ Live Game Control & Monitor</div>

              <div style={S.metricCard('59,130,246')}>
                <div style={{...S.row('space-between','10px',true),marginBottom:'12px'}}>
                  <div>
                    <div style={S.metricLabel}>Current Game Status</div>
                    <div style={{fontSize:'22px',fontWeight:'900',color:'#fff',display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{
                        padding:'4px 12px',borderRadius:'20px',fontSize:'13px',fontWeight:'800',
                        background:metrics?.gameStatus==='DRAWING'?'#10b981':metrics?.gameStatus==='COUNTDOWN'?'#3b82f6':'#f59e0b',
                        color:'#fff'
                      }}>
                        {metrics?.gameStatus || 'COUNTDOWN'}
                      </span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={S.metricLabel}>Countdown Left</div>
                    <div style={{fontSize:'28px',fontWeight:'900',color:'#06b6d4'}}>
                      {metrics?.countdownSec ?? 40}s
                    </div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'10px',marginTop:'12px'}}>
                  <div style={{background:'rgba(0,0,0,0.3)',padding:'10px',borderRadius:'10px'}}>
                    <div style={{fontSize:'11px',color:'#94a3b8'}}>Tickets Sold</div>
                    <div style={{fontSize:'18px',fontWeight:'800',color:'#fff'}}>{metrics?.cartellasSoldThisRound || 0}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.3)',padding:'10px',borderRadius:'10px'}}>
                    <div style={{fontSize:'11px',color:'#94a3b8'}}>Prize Pool</div>
                    <div style={{fontSize:'18px',fontWeight:'800',color:'#10b981'}}>{(metrics?.prizePool || 0).toFixed(0)} ETB</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.3)',padding:'10px',borderRadius:'10px'}}>
                    <div style={{fontSize:'11px',color:'#94a3b8'}}>Online Players</div>
                    <div style={{fontSize:'18px',fontWeight:'800',color:'#06b6d4'}}>{metrics?.onlinePlayers || 1}</div>
                  </div>
                </div>
              </div>

              <div style={S.card()}>
                <div style={{fontSize:'14px',fontWeight:'800',color:'#fff',marginBottom:'12px'}}>
                  🕹️ Admin Quick Actions
                </div>
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                  <button
                    style={S.btnPrimary}
                    onClick={async () => {
                      try {
                        const r = await apiFetch('/api/admin/game/force-start', { method:'POST', headers:{Authorization:`Bearer ${token}`} });
                        const d = await r.json();
                        if (!r.ok) throw new Error(d.error);
                        flash('success', d.message);
                        fetchAdminData();
                      } catch (e) { flash('error', e.message); }
                    }}
                  >
                    ⚡ Force Start Draw Now
                  </button>

                  <button
                    style={S.btnSuccess}
                    onClick={async () => {
                      try {
                        const r = await apiFetch('/api/admin/game/restart-countdown', { method:'POST', headers:{Authorization:`Bearer ${token}`} });
                        const d = await r.json();
                        if (!r.ok) throw new Error(d.error);
                        flash('success', d.message);
                        fetchAdminData();
                      } catch (e) { flash('error', e.message); }
                    }}
                  >
                    🔄 Reset Countdown Timer
                  </button>

                  <button style={S.btnGhost} onClick={fetchAdminData}>
                    🔁 Refresh Game State
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────── DEPOSITS ──────────── */}
          {activeTab==='deposits' && (
            <div style={S.card()}>
              <div style={{...S.row('space-between','10px',true),marginBottom:'16px'}}>
                <div style={S.sectionTitle}>💳 Deposits</div>
                <button style={S.btnGhost} onClick={()=>setShowAll(s=>({...s,deposits:!s.deposits}))}>
                  {showAll.deposits?'Pending Only':'Show All'}
                </button>
              </div>

              {(showAll.deposits ? deposits : deposits.filter(d=>d.status==='pending')).length===0 && (
                <div style={{textAlign:'center',color:'#475569',padding:'32px',fontSize:'13px'}}>
                  ✅ No pending deposits
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {(showAll.deposits ? deposits : deposits.filter(d=>d.status==='pending')).map(d=>(
                <div key={d.id} style={{
                  padding:'16px',borderRadius:'14px',
                  background:d.status==='pending'?'rgba(245,158,11,0.06)':'rgba(30,41,59,0.4)',
                  border:`1px solid ${d.status==='pending'?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.06)'}`,
                  display:'flex',flexDirection:'column',gap:'10px'
                }}>
                  <div style={{...S.row('space-between','8px'),flexWrap:'wrap',gap:'8px'}}>
                    <div style={{fontSize:'17px',fontWeight:'900',color:'#10b981'}}>
                      +{d.amount} ETB
                      <span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'600',marginLeft:'6px'}}>({d.method})</span>
                    </div>
                    <span style={S.statusPill(d.status)}>
                      {d.status==='approved'?'COMPLETED':d.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{fontSize:'13px',color:'#cbd5e1'}}>
                    User: <strong style={{color:'#fff'}}>{d.username}</strong>
                    {d.phone && <span style={{color:'#64748b'}}> · {d.phone}</span>}
                  </div>

                  <div style={{fontSize:'12px',color:'#94a3b8',background:'rgba(0,0,0,0.3)',padding:'8px 12px',borderRadius:'8px',fontFamily:'monospace',wordBreak:'break-word'}}>
                    {d.receipt_sms||'No SMS provided'}
                  </div>

                  {d.status==='pending' && (
                    <div style={{...S.row('flex-start','8px'),flexWrap:'wrap'}}>
                      {d.proof_image && (
                        <a href={`${API_BASE}${d.proof_image}`} target="_blank" rel="noreferrer"
                          style={{...S.btnGhost,textDecoration:'none',flex:'1',minWidth:'120px'}}>
                          <Eye size={15}/> Screenshot
                        </a>
                      )}
                      <button style={{...S.btnSuccess,flex:'1',minWidth:'120px'}}
                        onClick={()=>approveDeposit(d.id)}>
                        <CheckCircle2 size={15}/> Approve
                      </button>
                      <button style={{...S.btnDanger,flex:'1',minWidth:'100px'}}
                        onClick={()=>{setRejectModal({type:'deposit',id:d.id});setRejectReason('');}}>
                        <XCircle size={15}/> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* ──────────── WITHDRAWALS ──────────── */}
          {activeTab==='withdrawals' && (
            <div style={S.card()}>
              <div style={{...S.row('space-between','10px',true),marginBottom:'16px'}}>
                <div style={S.sectionTitle}>💸 Withdrawals</div>
                <button style={S.btnGhost} onClick={()=>setShowAll(s=>({...s,withdrawals:!s.withdrawals}))}>
                  {showAll.withdrawals?'Pending Only':'Show All'}
                </button>
              </div>

              {(showAll.withdrawals ? withdrawals : withdrawals.filter(w=>w.status==='pending')).length===0 && (
                <div style={{textAlign:'center',color:'#475569',padding:'32px',fontSize:'13px'}}>
                  ✅ No pending withdrawals
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {(showAll.withdrawals ? withdrawals : withdrawals.filter(w=>w.status==='pending')).map(w=>(
                <div key={w.id} style={{
                  padding:'16px',borderRadius:'14px',
                  background:w.status==='pending'?'rgba(99,102,241,0.06)':'rgba(30,41,59,0.4)',
                  border:`1px solid ${w.status==='pending'?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.06)'}`,
                  display:'flex',flexDirection:'column',gap:'10px'
                }}>
                  <div style={{...S.row('space-between','8px'),flexWrap:'wrap',gap:'8px'}}>
                    <div style={{fontSize:'17px',fontWeight:'900',color:'#ef4444'}}>
                      -{w.amount} ETB
                      <span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'600',marginLeft:'6px'}}>({w.method})</span>
                    </div>
                    <span style={S.statusPill(w.status)}>
                      {w.status==='approved'?'COMPLETED':w.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{fontSize:'13px',color:'#cbd5e1'}}>
                    User: <strong style={{color:'#fff'}}>{w.username}</strong>
                    {w.phone && <span style={{color:'#64748b'}}> · {w.phone}</span>}
                  </div>
                  <div style={{fontSize:'13px',color:'#06b6d4'}}>
                    To: <strong>{w.method}</strong> → <strong>{w.account_number||'N/A'}</strong>
                  </div>
                  {w.created_at && (
                    <div style={{fontSize:'11px',color:'#475569'}}>
                      Requested: {new Date(w.created_at).toLocaleString()}
                    </div>
                  )}

                  {w.status==='pending' && (
                    <div style={{...S.row('flex-start','8px'),flexWrap:'wrap'}}>
                      <button style={{...S.btnSuccess,flex:'1',minWidth:'120px'}}
                        onClick={()=>approveWithdrawal(w.id)}>
                        <CheckCircle2 size={15}/> Approve & Pay
                      </button>
                      <button style={{...S.btnDanger,flex:'1',minWidth:'100px'}}
                        onClick={()=>{setRejectModal({type:'withdrawal',id:w.id});setRejectReason('');}}>
                        <XCircle size={15}/> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* ──────────── USERS ──────────── */}
          {activeTab==='users' && (
            <div style={S.card()}>
              <div style={{...S.row('space-between','10px',true),marginBottom:'14px'}}>
                <div style={S.sectionTitle}>👤 Users ({filteredUsers.length})</div>
                <div style={{...S.row('flex-start','8px'),background:'rgba(15,23,42,0.9)',padding:'8px 12px',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.1)',minWidth:'200px'}}>
                  <Search size={15} color="#64748b"/>
                  <input type="text" placeholder="Search name or phone…"
                    value={userSearch} onChange={e=>setUserSearch(e.target.value)}
                    style={{background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:'13px',flex:1,minWidth:0,fontFamily:'inherit'}}/>
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filteredUsers.length===0 && (
                <div style={{textAlign:'center',color:'#475569',padding:'24px',fontSize:'13px'}}>No users found.</div>
              )}
              {filteredUsers.map(u=>(
                <div key={u.id} style={{
                  padding:'14px 16px',borderRadius:'14px',
                  background:u.is_banned?'rgba(239,68,68,0.06)':'rgba(30,41,59,0.5)',
                  border:`1px solid ${u.is_banned?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.07)'}`,
                  display:'flex',flexDirection:'column',gap:'10px'
                }}>
                  <div style={S.row('space-between','8px')}>
                    <div>
                      <div style={{...S.row('flex-start','8px'),marginBottom:'4px'}}>
                        <span style={{fontWeight:'800',fontSize:'14px',color:'#fff'}}>{u.username}</span>
                        <span style={{
                          fontSize:'11px',padding:'2px 8px',borderRadius:'20px',fontWeight:'800',
                          background:u.is_banned?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)',
                          color:u.is_banned?'#ef4444':'#22c55e'
                        }}>
                          {u.is_banned?'BANNED':'ACTIVE'}
                        </span>
                      </div>
                      <div style={{fontSize:'12px',color:'#64748b'}}>{u.phone||'No phone'}</div>
                      <div style={{fontSize:'13px',fontWeight:'800',color:'#10b981',marginTop:'3px'}}>
                        {(u.balance||0).toFixed(2)} ETB
                      </div>
                    </div>
                  </div>

                  <div style={{...S.row('flex-start','8px'),flexWrap:'wrap'}}>
                    <button
                      style={{...S.btnSuccess,padding:'8px 12px',flex:'1',minWidth:'110px'}}
                      onClick={()=>{setBalanceModal({user:u,action:'add'});setBalanceAmount('');}}>
                      <PlusCircle size={14}/> Add
                    </button>
                    <button
                      style={{...S.btnGhost,color:'#f59e0b',border:'1px solid rgba(245,158,11,0.3)',padding:'8px 12px',flex:'1',minWidth:'110px'}}
                      onClick={()=>{setBalanceModal({user:u,action:'deduct'});setBalanceAmount('');}}>
                      <MinusCircle size={14}/> Deduct
                    </button>
                    <button
                      style={{...u.is_banned?S.btnSuccess:S.btnDanger,padding:'8px 12px',flex:'1',minWidth:'80px'}}
                      onClick={()=>toggleBan(u.id)}>
                      <Ban size={14}/> {u.is_banned?'Unban':'Ban'}
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* ──────────── SETTINGS ──────────── */}
          {activeTab==='settings' && (
            <div style={S.card({maxWidth:'480px'})}>
              <div style={S.sectionTitle}>⚙️ Game Settings</div>
              <form onSubmit={saveSettings} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div>
                  <label style={S.label}>Cartella Ticket Price (ETB):</label>
                  <input type="number" style={S.input}
                    value={settings.ticket_price||'10'}
                    onChange={e=>setSettings({...settings,ticket_price:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>House Commission (%):</label>
                  <input type="number" style={S.input}
                    value={settings.commission_pct||'20'}
                    onChange={e=>setSettings({...settings,commission_pct:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Round Countdown (Seconds):</label>
                  <input type="number" style={S.input}
                    value={settings.countdown_sec||'40'}
                    onChange={e=>setSettings({...settings,countdown_sec:e.target.value})}/>
                </div>
                <button type="submit" style={{...S.btnPrimary,padding:'12px',fontSize:'14px',marginTop:'4px'}}>
                  Save Settings
                </button>
              </form>
            </div>
          )}

          {/* ──────────── BROADCAST ──────────── */}
          {activeTab==='broadcast' && (
            <div style={S.card({maxWidth:'480px'})}>
              <div style={S.sectionTitle}>📢 Broadcast Message</div>
              <form onSubmit={sendBroadcast} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div>
                  <label style={S.label}>Target Audience:</label>
                  <select style={{...S.input,cursor:'pointer'}}
                    value={bTarget} onChange={e=>setBTarget(e.target.value)}>
                    <option value="both">Both Telegram & Web App</option>
                    <option value="telegram">Telegram Bot Users Only</option>
                    <option value="web">Web App Users Only</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Message:</label>
                  <textarea rows={4} style={{...S.input,resize:'vertical'}}
                    placeholder="Enter your announcement…"
                    value={bMessage} onChange={e=>setBMessage(e.target.value)}/>
                </div>
                <button type="submit" style={{...S.btnPrimary,padding:'12px',fontSize:'14px',marginTop:'4px'}}>
                  <Send size={16}/> Send Broadcast
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder, textarea::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}
