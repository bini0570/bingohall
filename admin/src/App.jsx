import React, { useState, useEffect, useCallback } from 'react';
import { Ctx, useApp } from './AppContext';
import { Icon, cx, fmt, BASE, PLAYERS, DEP, WD, TASKS, PROMOS } from './data';
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
  const { pwd, login } = useApp();
  const [v, setV] = useState(''); 
  const [e, setE] = useState('');
  
  const go = () => { 
    if (v === pwd) login(); 
    else setE('Incorrect password. Try again.'); 
  };
  
  return (
    <div className="login">
      <section className="card">
        <div className="brand">
          <span className="logo">X</span>
          <h1>Bingo X Admin</h1>
        </div>
        <div className="field">
          <label htmlFor="lp">Password</label>
          <input 
            id="lp" type="password" className={cx('input', e && 'bad')} 
            value={v} autoFocus 
            onChange={(x) => { setV(x.target.value); setE(''); }} 
            onKeyDown={(x) => { if (x.key === 'Enter') go(); }} 
          />
          {e && <span className="err">{e}</span>}
        </div>
        <button className="btn btn-primary btn-block" onClick={go}>Sign in</button>
        <p className="muted sm">Demo password: admin123</p>
      </section>
    </div>
  );
}

export default function App() {
  const [theme, setThemeState] = useState(() => { try { return localStorage.getItem('bx-theme') || 'dark'; } catch (e) { return 'dark'; } });
  const [authed, setAuthed] = useState(true);
  const [pwd, setPwd] = useState('admin123');
  const [route, setRoute] = useState({ page: 'dashboard' });
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  
  const [players, setPlayers] = useState(PLAYERS);
  const [deposits, setDeposits] = useState(DEP);
  const [withdrawals, setWithdrawals] = useState(WD);
  const [tasks, setTasks] = useState(TASKS);
  const [promos, setPromos] = useState(PROMOS);
  
  const [query, setQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [adj, setAdj] = useState({ dep: 0, wd: 0 });

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

  const decide = (kind, r, decision) => {
    const set = kind === 'deposit' ? setDeposits : setWithdrawals;
    set((l) => l.map((x) => (x.id === r.id ? Object.assign({}, x, { status: decision === 'approve' ? 'completed' : 'rejected', doneAt: 'Just now' }) : x)));
    if (decision === 'approve') {
      setAdj((a) => (kind === 'deposit' ? { dep: a.dep + r.amount, wd: a.wd } : { dep: a.dep, wd: a.wd + r.amount }));
      if (kind === 'deposit') setPlayers((ps) => ps.map((p) => (p.id === r.pid ? Object.assign({}, p, { balance: p.balance + r.amount, dep: 'deposited' }) : p)));
    }
    toast((kind === 'deposit' ? 'Deposit ' : 'Withdrawal ') + (decision === 'approve' ? 'approved' : 'rejected'), decision === 'approve' ? 'ok' : 'bad');
  };
  
  const decideConfirm = (kind, r, decision) => {
    const p = players.find((x) => x.id === r.pid); 
    const amt = fmt(r.amount) + ' ETB';
    const isDep = kind === 'deposit', ok = decision === 'approve';
    setDialog({
      title: (ok ? 'Approve ' : 'Reject ') + (isDep ? 'deposit?' : 'withdrawal?'),
      body: ok
        ? (isDep ? 'Add ' + amt + ' to ' + p.name + '’s balance. Check the ' + r.method + ' payment first.' : 'Confirm you have sent ' + amt + ' to ' + r.method + ' ' + r.account + '.')
        : (isDep ? p.name + '’s ' + amt + ' deposit will be marked as not accepted.' : amt + ' stays in ' + p.name + '’s balance.'),
      confirm: ok ? 'Approve' : 'Reject', tone: ok ? 'primary' : 'danger', onConfirm: () => decide(kind, r, decision)
    });
  };
  
  const banConfirm = (p, ban) => setDialog({
    title: (ban ? 'Ban ' : 'Unban ') + p.name + '?',
    body: ban ? 'They will be signed out and blocked from playing and withdrawing until you unban them.' : 'They will be able to play and withdraw again.',
    confirm: ban ? 'Ban player' : 'Unban player', tone: ban ? 'danger' : 'primary',
    onConfirm: () => { 
      setPlayers((ps) => ps.map((x) => (x.id === p.id ? Object.assign({}, x, { status: ban ? 'banned' : 'active' }) : x))); 
      toast(ban ? 'Player banned' : 'Player unbanned', ban ? 'bad' : 'ok'); 
    }
  });
  
  const toggleTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    setTasks((ts) => ts.map((x) => (x.id === id ? Object.assign({}, x, { on: !x.on }) : x)));
    toast(t.on ? 'Task disabled' : 'Task enabled');
  };
  
  const deleteTaskConfirm = (t) => setDialog({ title: 'Delete task?', body: '“' + t.title + '” will be removed for all players. This can’t be undone.', confirm: 'Delete', tone: 'danger', onConfirm: () => { setTasks((ts) => ts.filter((x) => x.id !== t.id)); toast('Task deleted'); } });
  const addTask = (t) => { setTasks((ts) => [t].concat(ts)); toast('Task created'); };
  const addPromo = (p) => { setPromos((ps) => [p].concat(ps)); toast('Promo created'); };
  const deletePromoConfirm = (p) => setDialog({ title: 'Delete ' + p.code + '?', body: 'Players will no longer be able to redeem this code.', confirm: 'Delete', tone: 'danger', onConfirm: () => { setPromos((ps) => ps.filter((x) => x.id !== p.id)); toast('Promo deleted'); } });
  const sendBroadcast = (clear) => setDialog({ title: 'Send to all players?', body: 'This message goes to ' + fmt(BASE.players) + ' players right away and can’t be recalled.', confirm: 'Send', tone: 'primary', onConfirm: () => { clear(); toast('Message sent'); } });
  
  const confirmLogout = () => { 
    setDrawer(false); 
    setDialog({ 
      title: 'Log out?', body: 'You will need your password to sign in again.', 
      confirm: 'Log out', tone: 'danger', 
      onConfirm: () => { setAuthed(false); setRoute({ page: 'dashboard' }); toast('Logged out'); } 
    }); 
  };
  
  const login = () => { setAuthed(true); };

  const pendingTotal = deposits.filter((r) => r.status === 'pending').length + withdrawals.filter((r) => r.status === 'pending').length;
  const setTheme = (t) => setThemeState(t);
  
  const ctx = { 
    theme, setTheme, route, nav, collapsed, setCollapsed, setDrawer, 
    players, deposits, withdrawals, tasks, promos, query, setQuery, adj, 
    pendingTotal, pwd, setPwd, toast, decideConfirm, banConfirm, toggleTask, 
    deleteTaskConfirm, addTask, addPromo, deletePromoConfirm, sendBroadcast, 
    confirmLogout, login 
  };
  
  const Page = PAGES[route.page];

  return (
    <Ctx.Provider value={ctx}>
      {authed ? (
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
