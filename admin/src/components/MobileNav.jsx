import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Users, CheckSquare, Gift, Radio, Settings, Menu, X } from 'lucide-react';
import clsx from 'clsx';

const bottomTabs = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/players', label: 'Players', icon: Users },
];

const moreItems = [
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/promos', label: 'Promos', icon: Gift },
  { to: '/broadcast', label: 'Broadcast', icon: Radio },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/payments': return 'Payments';
      case '/players': return 'Players';
      case '/tasks': return 'Tasks';
      case '/promos': return 'Promos';
      case '/broadcast': return 'Broadcast';
      case '/settings': return 'Settings';
      default: return 'Admin';
    }
  };

  return (
    <>
      <div className="md:hidden flex items-center justify-center p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20 transition-colors">
        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">{getPageTitle()}</span>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-20 transition-colors">
        <div className="flex items-center justify-around h-20 px-2 pb-4">
          {bottomTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-transform active:scale-95',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <div className={clsx("p-1.5 rounded-xl transition-colors", "isActive && 'bg-indigo-50 dark:bg-indigo-900/30'")}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 dark:text-slate-400 transition-transform active:scale-95"
          >
            <div className="p-1.5">
              <Menu className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold">Menu</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom pb-8 transition-colors">
            <div className="p-6 pb-2 flex items-center justify-between">
              <span className="font-bold text-2xl text-slate-900 dark:text-white">More</span>
              <button onClick={() => setIsOpen(false)} className="p-3 -mr-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 active:scale-95 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="p-6 grid grid-cols-2 gap-4">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex flex-col items-center justify-center gap-3 p-6 rounded-3xl text-sm font-bold transition-all active:scale-95',
                    isActive 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800'
                  )}
                >
                  <item.icon className="w-8 h-8" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
