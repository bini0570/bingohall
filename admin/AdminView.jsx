import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, CreditCard, Users, Gift, Tag } from 'lucide-react';
import { io } from 'socket.io-client';
import './AdminTheme.css';

import { AdminLayout } from './components/layout';
import { ToastContainer } from './components/ui';
import { DashboardTab, PaymentsTab, UsersTab, TasksTab, PromosTab } from './components/tabs';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiFetch = async (path, options = {}) => fetch(`${API_BASE}${path}`, options);
let adminSocket = null;

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Overview of your platform' },
  payments:  { title: 'Payments',  sub: 'Manage deposits & withdrawals' },
  users:     { title: 'Players',   sub: 'Player accounts & balances' },
  tasks:     { title: 'Tasks',     sub: 'Social engagement tasks' },
  promos:    { title: 'Promos',    sub: 'Promo codes & bonuses' },
};

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'payments',  icon: CreditCard,      label: 'Payments' },
  { key: 'users',     icon: Users,           label: 'Players' },
  { key: 'tasks',     icon: Tag,             label: 'Tasks' },
  { key: 'promos',    icon: Gift,            label: 'Promos' },
];

export default function AdminView({ token, onLogout }) {
  const [tab, setTab] = useState('dashboard');
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

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <DashboardTab metrics={metrics} deposits={deposits} withdrawals={withdrawals} users={users} gameState={gameState} token={token} flash={flash} refresh={manualRefresh} apiFetch={apiFetch} />;
      case 'payments':  return <PaymentsTab deposits={deposits} withdrawals={withdrawals} token={token} onRefresh={manualRefresh} flash={flash} apiFetch={apiFetch} />;
      case 'users':     return <UsersTab users={users} token={token} flash={flash} onRefresh={manualRefresh} apiFetch={apiFetch} />;
      case 'tasks':     return <TasksTab token={token} flash={flash} apiFetch={apiFetch} />;
      case 'promos':    return <PromosTab token={token} flash={flash} apiFetch={apiFetch} />;
      default: return null;
    }
  };

  return (
    <AdminLayout
      navItems={NAV_ITEMS}
      activeTab={tab}
      setTab={setTab}
      onLogout={onLogout}
      pageInfo={PAGE_TITLES[tab] || PAGE_TITLES.dashboard}
      theme={theme}
      toggleTheme={toggleTheme}
      onRefresh={manualRefresh}
      refreshing={refreshing}
    >
      <ToastContainer messages={msg} />
      {renderTab()}
    </AdminLayout>
  );
}
