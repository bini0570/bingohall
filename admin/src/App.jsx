import React, { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Ctx, useApp, fetcher, setupAxios, revalidateAll } from './AppContext';
import { Icon, cx, fmt } from './data';
import { Dashboard, Payments, Players, Tasks, Promo, Broadcast, Settings } from './pages';
import { Confirm } from './components';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dash' }, 
  { id: 'payments', label: 'Payments', icon: 'wallet' },
  { id: 'players', label: 'Players', icon: 'users' }, 
  { id: 'tasks', label: 'Tasks', icon: 'tasks' }, 
  { id: 'promo', label: 'Promo', icon: 'tag' }
];

const MORE = [
  { id: 'broadcast', label: 'Broadcast', icon: 'mega' }, 
  { id: 'settings', label: 'Settings', icon: 'cog' }
];

const PAGES = { dashboard: Dashboard, payments: Payments, players: Players, tasks: Tasks, promo: Promo, broadcast: Broadcast, settings: Settings };

function Sidebar() {
  const { route, nav, pendingTotal, collapsed, setCollapsed, setDrawer, confirmLogout } = useApp();
  
  const item = (n) => (
    <button 
      key={n.id} 
      className={cx('nav-item', route.page === n.id && 'active')} 
      title={n.label} 
      aria-current={route.page === n.id ? 'page' : undefined} 
      onClick={() => nav(n.id)}
    >
      <Icon name={n.icon} />
      <span className="label">{n.label}</span>
      {n.id === 'payments' && pendingTotal > 0 && <span className="nbadge">{pendingTotal}</span>}
    </button>
  );
  
  return (
    <aside className="sidebar" aria-label="Main menu">
      <div className="sb-head">
        <span className="logo">X</span>
        <span className="wordmark"><b>Bingo X</b><small>Admin</small></span>
        <button className="icon-btn sb-close" aria-label="Close menu" onClick={() => setDrawer(false)}>
          <Icon name="x" />
        </button>
      </div>
      <nav className="sb-nav">
        {NAV.map(item)}
        <div className="sb-sep" />
        {MORE.map(item)}
      </nav>
      <div className="sb-foot">
        <button className="nav-item danger" title="Log out" onClick={confirmLogout}>
          <Icon name="logout" />
          <span className="label">Log out</span>
        </button>
        <button className="nav-item collapse-btn" title={collapsed ? 'Expand menu' : 'Collapse menu'} onClick={() => setCollapsed((c) => !c)}>
          <Icon name="panel" />
          <span className="label">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  const { setDrawer, theme, setTheme, nav } = useApp();
  return (
    <header className="topbar">
      <div className="tb-left">
        <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setDrawer(true)}>
          <Icon name="menu" />
        </button>
        <div className="tb-brand">
          <span className="logo sm">X</span>
          <b>Bingo X</b>
        </div>
      </div>
      <div className="tb-right">
        <button className="icon-btn" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
        </button>
        <button className="avatar-btn" aria-label="Settings" onClick={() => nav('settings')}>A</button>
      </div>
    </header>
  );
}

function TabBar() {
  const { route, nav, pendingTotal } = useApp();
  return (
    <nav className="tabbar" aria-label="Primary">
      {NAV.map((n) => (
        <button 
          key={n.id} 
          className={cx('tab', route.page === n.id && 'active')} 
          aria-current={route.page === n.id ? 'page' : undefined} 
          onClick={() => nav(n.id)}
        >
          <span className="tab-ic">
            <Icon name={n.icon} size={22} />
            {n.id === 'payments' && pendingTotal > 0 && <span className="tbadge">{pendingTotal}</span>}
          </span>
          {n.label}
        </button>
      ))}
    </nav>
  );
}

function Toasts({ items }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={cx('toast', t.tone === 'bad' && 'bad')}>
          <span className="ti">
            <Icon name={t.tone === 'bad' ? 'x' : 'check'} size={15} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Login() {
  const { login } = useApp();
  const [v, setV] = useState(''); 
  const [p, setP] = useState('');
  const [e, setE] = useState('');
  
  const go = async () => { 
    if (!v || !p) return setE('Enter username and password.'); 
    const success = await login(v, p);
    if (!success) setE('Invalid credentials. Try again.');
  };
  
  return (
    <div className="login">
      <section className="card">
        <div className="brand">
          <span className="logo">X</span>
          <h1>Bingo X Admin</h1>
        </div>
        <div className="field">
          <label htmlFor="lu">Username</label>
          <input 
            id="lu" type="text" className={cx('input', e && 'bad')} 
            value={v} autoFocus 
            onChange={(x) => { setV(x.target.value); setE(''); }} 
            onKeyDown={(x) => { if (x.key === 'Enter') go(); }} 
          />
        </div>
        <div className="field">
          <label htmlFor="lp">Password</label>
          <input 
            id="lp" type="password" className={cx('input', e && 'bad')} 
            value={p} 
            onChange={(x) => { setP(x.target.value); setE(''); }} 
            onKeyDown={(x) => { if (x.key === 'Enter') go(); }} 
          />
          {e && <span className="err">{e}</span>}
        </div>
        <button className="btn btn-primary btn-block" onClick={go}>Sign in</button>
      </section>
    </div>
  );
}

export default function App() {
  const [theme, setThemeState] = useState(() => { try { return localStorage.getItem('bx-theme') || 'dark'; } catch (e) { return 'dark'; } });
  const [token, setTokenState] = useState(() => { try { return localStorage.getItem('adminToken') || null; } catch (e) { return null; } });
  const [route, setRoute] = useState({ page: 'dashboard' });
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  
  const [query, setQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  // Setup axios token
  useEffect(() => {
    setupAxios(token);
    if (token) revalidateAll();
  }, [token]);

  // SWR fetches
  const { data: metrics, mutate: mutateMetrics } = useSWR(token ? '/api/admin/metrics' : null, fetcher, { refreshInterval: 10000 });
  const { data: depositsData, mutate: mutateDeposits } = useSWR(token ? '/api/admin/deposits' : null, fetcher, { refreshInterval: 10000 });
  const { data: withdrawalsData, mutate: mutateWithdrawals } = useSWR(token ? '/api/admin/withdrawals' : null, fetcher, { refreshInterval: 10000 });
  const { data: tasksData, mutate: mutateTasks } = useSWR(token ? '/api/admin/tasks' : null, fetcher);
  const { data: promosData, mutate: mutatePromos } = useSWR(token ? '/api/admin/promos' : null, fetcher);
  const { data: usersData, mutate: mutateUsers } = useSWR((token && query.length > 2) ? '/api/admin/users?search=' + encodeURIComponent(query) : null, fetcher);

  const deposits = depositsData || [];
  const withdrawals = withdrawalsData || [];
  const tasks = tasksData || [];
  const promos = promosData || [];
  const players = usersData || [];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bx-theme', theme); } catch (e) {}
  }, [theme]);
  
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const toast = useCallback((msg, tone) => {
    const id = Date.now() + Math.random();
    setToasts((t) => t.concat([{ id, msg, tone: tone || 'ok' }]));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  
  const nav = (page, opts) => { 
    setRoute(Object.assign({ page }, opts || {})); 
    setDrawer(false); 
    window.scrollTo({ top: 0 }); 
  };
  
  const closeDialog = () => setDialog(null);

  const decide = async (kind, r, decision) => {
    try {
      await axios.post(`/api/admin/${kind === 'deposit' ? 'deposits' : 'withdrawals'}/${r.id}/${decision}`);
      toast((kind === 'deposit' ? 'Deposit ' : 'Withdrawal ') + (decision === 'approve' ? 'approved' : 'rejected'), decision === 'approve' ? 'ok' : 'bad');
      if (kind === 'deposit') mutateDeposits(); else mutateWithdrawals();
      mutateMetrics();
    } catch (err) {
      toast('Failed to ' + decision + ' ' + kind, 'bad');
    }
  };
  
  const decideConfirm = (kind, r, decision) => {
    const pName = r.username || 'Player';
    const amt = fmt(r.amount) + ' ETB';
    const isDep = kind === 'deposit', ok = decision === 'approve';
    setDialog({
      title: (ok ? 'Approve ' : 'Reject ') + (isDep ? 'deposit?' : 'withdrawal?'),
      body: ok
        ? (isDep ? 'Add ' + amt + ' to ' + pName + '’s balance. Check the ' + (r.method || 'payment') + ' payment first.' : 'Confirm you have sent ' + amt + ' to ' + pName + '.')
        : (isDep ? pName + '’s ' + amt + ' deposit will be marked as rejected.' : amt + ' stays in ' + pName + '’s balance.'),
      confirm: ok ? 'Approve' : 'Reject', tone: ok ? 'primary' : 'danger', onConfirm: () => decide(kind, r, decision)
    });
  };
  
  const banConfirm = (p, ban) => setDialog({
    title: (ban ? 'Ban ' : 'Unban ') + p.username + '?',
    body: ban ? 'They will be signed out and blocked from playing and withdrawing until you unban them.' : 'They will be able to play and withdraw again.',
    confirm: ban ? 'Ban player' : 'Unban player', tone: ban ? 'danger' : 'primary',
    onConfirm: async () => { 
      try {
        await axios.post(`/api/admin/users/${p.id}/ban`); // Assume endpoint toggles or we rely on backend logic
        toast(ban ? 'Player banned' : 'Player unbanned', ban ? 'bad' : 'ok');
        mutateUsers();
      } catch (e) {
        toast('Action failed', 'bad');
      }
    }
  });
  
  const toggleTask = async (id, currentStatus) => {
    try {
      await axios.put(`/api/admin/tasks/${id}/status`, { status: currentStatus === 'active' ? 'disabled' : 'active' });
      mutateTasks();
      toast(currentStatus === 'active' ? 'Task disabled' : 'Task enabled');
    } catch (e) { toast('Failed to update task', 'bad'); }
  };
  
  const deleteTaskConfirm = (t) => setDialog({ 
    title: 'Delete task?', body: '“' + t.title + '” will be removed for all players. This can’t be undone.', confirm: 'Delete', tone: 'danger', 
    onConfirm: async () => { 
      try {
        await axios.delete(`/api/admin/tasks/${t.id}`);
        mutateTasks();
        toast('Task deleted');
      } catch (e) { toast('Failed to delete', 'bad'); }
    } 
  });
  
  const addTask = async (t) => { 
    try {
      await axios.post('/api/admin/tasks', t);
      mutateTasks();
      toast('Task created'); 
    } catch (e) { toast('Failed to create task', 'bad'); }
  };
  
  const addPromo = async (p) => { 
    try {
      await axios.post('/api/admin/promos', p);
      mutatePromos();
      toast('Promo created'); 
    } catch (e) { toast('Failed to create promo', 'bad'); }
  };
  
  const deletePromoConfirm = (p) => setDialog({ 
    title: 'Delete ' + p.code + '?', body: 'Players will no longer be able to redeem this code.', confirm: 'Delete', tone: 'danger', 
    onConfirm: async () => { 
      try {
        await axios.delete(`/api/admin/promos/${p.id}`);
        mutatePromos();
        toast('Promo deleted'); 
      } catch (e) { toast('Failed to delete', 'bad'); }
    } 
  });
  
  const sendBroadcast = (msgContent, clear) => setDialog({ 
    title: 'Send to all players?', body: 'This message goes to all players right away and can’t be recalled.', confirm: 'Send', tone: 'primary', 
    onConfirm: async () => { 
      try {
        await axios.post('/api/admin/broadcast', { message: msgContent });
        clear(); toast('Message sent'); 
      } catch (e) { toast('Failed to send broadcast', 'bad'); }
    } 
  });
  
  const confirmLogout = () => { 
    setDrawer(false); 
    setDialog({ 
      title: 'Log out?', body: 'You will need your password to sign in again.', 
      confirm: 'Log out', tone: 'danger', 
      onConfirm: () => { 
        localStorage.removeItem('adminToken');
        setTokenState(null); 
        setRoute({ page: 'dashboard' }); 
        toast('Logged out'); 
      } 
    }); 
  };
  
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post('/api/admin/change-password', { currentPassword, newPassword });
      toast('Password updated successfully');
      return true;
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update password', 'bad');
      return false;
    }
  };
  
  const login = async (username, password) => { 
    try {
      const res = await axios.post('/api/admin/login', { username, password });
      const token = res.data.token;
      localStorage.setItem('adminToken', token);
      setTokenState(token);
      return true;
    } catch (err) {
      return false;
    }
  };

  const pendingTotal = deposits.filter((r) => r.status === 'pending').length + withdrawals.filter((r) => r.status === 'pending').length;
  const setTheme = (t) => setThemeState(t);
  
  const ctx = { 
    theme, setTheme, route, nav, collapsed, setCollapsed, setDrawer, 
    players, deposits, withdrawals, tasks, promos, query, setQuery, metrics,
    pendingTotal, toast, decideConfirm, banConfirm, toggleTask, 
    deleteTaskConfirm, addTask, addPromo, deletePromoConfirm, sendBroadcast, 
    confirmLogout, login, changePassword
  };
  
  const Page = PAGES[route.page];

  return (
    <Ctx.Provider value={ctx}>
      {token ? (
        <div className={cx('app', collapsed && 'is-collapsed', drawer && 'drawer-open')}>
          <Sidebar />
          <div className="scrim" onClick={() => setDrawer(false)} />
          <div className="main">
            <Topbar />
            <main className="page">
              <Page key={route.page} />
            </main>
          </div>
          <TabBar />
        </div>
      ) : (
        <Login />
      )}
      
      {dialog && <Confirm cfg={dialog} onClose={closeDialog} />}
      <Toasts items={toasts} />
    </Ctx.Provider>
  );
}
