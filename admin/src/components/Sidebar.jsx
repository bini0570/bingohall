import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Users, CheckSquare, Gift, Radio, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/players', label: 'Players', icon: Users },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/promos', label: 'Promos', icon: Gift },
  { to: '/broadcast', label: 'Broadcast', icon: Radio },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-50/50 dark:bg-slate-950/50 border-r border-slate-200/50 dark:border-slate-800/50 h-screen sticky top-0 transition-colors backdrop-blur-xl">
      <div className="p-8 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30 rounded-2xl flex items-center justify-center font-black text-white text-lg">B</div>
        <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Bingo</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              'flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95',
              isActive 
                ? 'bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            )}
          >
            <item.icon className={clsx("w-5 h-5", "transition-transform")} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
