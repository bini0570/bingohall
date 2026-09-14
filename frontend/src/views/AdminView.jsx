import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, CreditCard, Users, Gift, Tag, Radio, 
  Settings, AlertOctagon, Menu, X, ArrowUpRight, ArrowDownLeft, 
  Activity, RefreshCw, LogOut, CheckCircle2, XCircle, Search, Eye
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://bingohall-production.up.railway.app').replace(/\/$/, '');
const apiFetch = async (path, options = {}) => fetch(`${API_BASE}${path}`, options);

// ─── Theme & Shared Styles ──────────────────────────────────────────────
const S = {
  shell: { display: 'flex', minHeight: '100dvh', background: '#0B1120', color: '#F3F4F6', fontFamily: 'system-ui, sans-serif' },
  sidebar: (open, isMobile) => ({
    width: '260px',
    background: '#111827',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', flexDirection: 'column',
    position: isMobile ? 'fixed' : 'relative',
    top: 0, bottom: 0, left: open ? 0 : '-260px',
    transition: 'left 0.3s ease',
    zIndex: 9999,
  }),
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', overflow: 'hidden' },
  topbar: { height: '64px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', background: 'rgba(11,17,32,0.9)', backdropFilter: 'blur(10px)', zIndex: 10 },
  content: { flex: 1, overflowY: 'auto', padding: '24px' },
  
  card: { background: '#111827', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' },
  btn: (v = 'primary') => ({
    background: v === 'primary' ? '#06b6d4' : v === 'success' ? '#10b981' : v === 'danger' ? '#ef4444' : 'rgba(255,255,255,0.05)',
    color: v === 'ghost' ? '#9CA3AF' : '#fff',
    border: v === 'ghost' ? '1px solid rgba(255,255,255,0.1)' : 'none',
    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
    display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
  }),
  pill: (status) => {
    const map = {
      pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      processing: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      cancelled: { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af' },
    };
    const s = map[status?.toLowerCase()] || map.pending;
    return { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color };
  },
  input: { width: '100%', background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#E5E7EB' }
};

export default function AdminView({ token, onLogout, onBack }) {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [metrics, setMetrics] = useState({});
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [mR, dR, wR, uR, gR] = await Promise.all([
        apiFetch('/api/admin/metrics', { headers: h }),
        apiFetch('/api/admin/deposits', { headers: h }),
        apiFetch('/api/admin/withdrawals', { headers: h }),
        apiFetch('/api/admin/users', { headers: h }),
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
    const intv = setInterval(fetchData, 15000);
    return () => clearInterval(intv);
  }, [fetchData]);

  const NAV = [
    { section: 'Overview' },
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { section: 'Payments' },
    { key: 'deposits', label: 'Deposits', icon: <ArrowDownLeft size={18} />, badge: deposits.filter(d=>d.status==='pending').length },
    { key: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpRight size={18} />, badge: withdrawals.filter(w=>w.status==='pending').length },
    { key: 'transactions', label: 'Transactions', icon: <Activity size={18} /> },
    { section: 'Community' },
    { key: 'players', label: 'Players', icon: <Users size={18} /> },
    { section: 'Engagement' },
    { key: 'tasks', label: 'Tasks', icon: <Gift size={18} /> },
    { key: 'promos', label: 'Promo Codes', icon: <Tag size={18} /> },
    { key: 'broadcast', label: 'Broadcast', icon: <Radio size={18} /> },
    { section: 'System' },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { key: 'maintenance', label: 'Maintenance', icon: <AlertOctagon size={18} /> },
  ];

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardTab metrics={metrics} deposits={deposits} withdrawals={withdrawals} users={users} gameState={gameState} />;
      case 'deposits': return <PaymentsTab type="deposits" data={deposits} token={token} onRefresh={fetchData} />;
      case 'withdrawals': return <PaymentsTab type="withdrawals" data={withdrawals} token={token} onRefresh={fetchData} />;
      case 'transactions': return <TransactionsTab token={token} />;
      case 'players': return <PlayersTab users={users} token={token} />;
      case 'tasks': return <TasksTab token={token} />;
      case 'promos': return <PromosTab token={token} />;
      case 'maintenance': return <MaintenanceTab />;
      default: return <div style={{ color: '#9CA3AF' }}>Section under construction.</div>;
    }
  };

  return (
    <div style={S.shell}>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }} />}
      
      <aside style={S.sidebar(sidebarOpen, isMobile)}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: '#06b6d4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>B</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '1px' }}>BINGO X</div>
            <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '2px' }}>Admin Panel</div>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {NAV.map((n, i) => {
            if (n.section) return <div key={i} style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 8px 8px' }}>{n.section}</div>;
            const active = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setTab(n.key); if (isMobile) setSidebarOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: active ? 'rgba(6,182,212,0.1)' : 'transparent',
                  color: active ? '#06b6d4' : '#9CA3AF', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 0.2s', marginBottom: '2px', fontWeight: active ? '700' : '500', fontSize: '13px'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {n.icon} {n.label}
                </div>
                {n.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px' }}>{n.badge}</span>}
              </button>
            );
          })}
        </div>
        
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>System Online</span>
          </div>
          <button onClick={onLogout} style={{ ...S.btn('ghost'), width: '100%', justifyContent: 'center' }}><LogOut size={16} /> Sign Out</button>
        </div>
      </aside>

      <main style={S.main}>
        <header style={S.topbar}>
          <button onClick={() => setSidebarOpen(o=>!o)} style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', marginRight: '16px', display: isMobile ? 'block' : 'none' }}>
            <Menu size={20} />
          </button>
          <div style={{ flex: 1, fontSize: '16px', fontWeight: '700' }}>{NAV.find(n=>n.key===tab)?.label}</div>
          <button onClick={fetchData} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><RefreshCw size={18} /></button>
        </header>
        <div style={S.content}>
          {renderTab()}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTab({ metrics, deposits, withdrawals, users, gameState }) {
  const totDep = deposits.filter(d=>d.status==='approved').reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const totWit = withdrawals.filter(w=>w.status==='approved').reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const net = totDep - totWit;
  const pDep = deposits.filter(d=>d.status==='pending').length;
  const pWit = withdrawals.filter(w=>w.status==='pending').length;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Kpi title="Total Deposits" value={totDep} color="#10b981" />
        <Kpi title="Total Withdrawals" value={totWit} color="#ef4444" />
        <Kpi title="Net Revenue" value={net} color="#06b6d4" />
        <Kpi title="Pending Deposits" value={pDep} color="#f59e0b" suffix="" />
        <Kpi title="Pending Withdrawals" value={pWit} color="#f59e0b" suffix="" />
        <Kpi title="Active Players" value={users.length} color="#8b5cf6" suffix="" />
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: '700', marginBottom: '16px' }}>Recent Activity</div>
        <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Analytics charts will go here...</div>
      </div>
    </div>
  );
}

function Kpi({ title, value, color, suffix = ' ETB' }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits:suffix===''?0:2, maximumFractionDigits:2}) : value}<span style={{ fontSize: '14px', opacity: 0.7 }}>{suffix}</span></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS (Deposits & Withdrawals)
// ─────────────────────────────────────────────────────────────────────────────
function PaymentsTab({ type, data, token, onRefresh }) {
  const [filter, setFilter] = useState('pending');
  const [reviewItem, setReviewItem] = useState(null);

  const filtered = data.filter(d => filter === 'all' || d.status === filter);

  const handleAction = async (id, action) => {
    try {
      const res = await apiFetch(`/api/admin/${type}/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { onRefresh(); setReviewItem(null); }
      else alert((await res.json()).error);
    } catch(e) { alert(e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === f ? '#1F2937' : 'transparent', color: filter === f ? '#fff' : '#6B7280', fontWeight: filter === f ? '700' : '600', cursor: 'pointer', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>User</th>
              <th style={S.th}>Amount</th>
              <th style={S.th}>Method</th>
              <th style={S.th}>Date</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={S.td}><div style={{ fontWeight: '700' }}>{d.username}</div></td>
                <td style={S.td}><div style={{ fontWeight: '800', color: type==='deposits'?'#10b981':'#ef4444' }}>{parseFloat(d.amount).toFixed(2)} ETB</div></td>
                <td style={S.td}>{d.method}</td>
                <td style={S.td}><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{new Date(d.created_at).toLocaleString()}</div></td>
                <td style={S.td}><span style={S.pill(d.status)}>{d.status}</span></td>
                <td style={S.td}>
                  <button onClick={() => setReviewItem(d)} style={S.btn('ghost')}>Review</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No {filter} {type}.</td></tr>}
          </tbody>
        </table>
      </div>

      {reviewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111827', width: '100%', maxWidth: '400px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{type.slice(0,-1)} #{reviewItem.id}</div>
              <button onClick={() => setReviewItem(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Row label="User" value={reviewItem.username} />
              <Row label="Amount" value={`${parseFloat(reviewItem.amount).toFixed(2)} ETB`} valueColor={type==='deposits'?'#10b981':'#ef4444'} />
              <Row label="Method" value={reviewItem.method} />
              {type === 'withdrawals' && <Row label="Account" value={reviewItem.account_number} />}
              <Row label="Submitted" value={new Date(reviewItem.created_at).toLocaleString()} />
              <Row label="Status" value={<span style={S.pill(reviewItem.status)}>{reviewItem.status}</span>} />
              
              {type === 'deposits' && reviewItem.receipt_sms && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Receipt / SMS</div>
                  <div style={{ background: '#1F2937', padding: '12px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{reviewItem.receipt_sms}</div>
                </div>
              )}

              {reviewItem.status === 'pending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => handleAction(reviewItem.id, 'reject')} style={{ ...S.btn('danger'), justifyContent: 'center' }}>Reject</button>
                  <button onClick={() => handleAction(reviewItem.id, 'approve')} style={{ ...S.btn('success'), justifyContent: 'center' }}>Approve</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueColor = '#fff' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '14px', color: '#6B7280' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: valueColor, textAlign: 'right' }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUBS FOR OTHER TABS (Players, Tasks, Promos, Transactions, Maintenance)
// ─────────────────────────────────────────────────────────────────────────────
function PlayersTab() { return <div style={S.card}>Players implementation coming next.</div>; }
function TasksTab() { return <div style={S.card}>Tasks implementation coming next.</div>; }
function PromosTab() { return <div style={S.card}>Promos implementation coming next.</div>; }
function TransactionsTab() { return <div style={S.card}>Transactions Ledger implementation coming next.</div>; }
function MaintenanceTab() { return <div style={S.card}>Emergency Controls coming next.</div>; }
