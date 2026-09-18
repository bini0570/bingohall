import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Users, CheckSquare, Gift, Radio, Settings, LogOut, Menu, X, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../AuthContext';
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
  const { logout } = useAuth();
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
      {/* Top Header */}
      <div className="md:hidden flex items-center justify-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-colors">
        <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100">{getPageTitle()}</span>
      </div>

      {/* Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20 transition-colors">
        <div className="flex items-center justify-around h-16 px-2 pb-1">
          {bottomTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Slide-up Menu (More) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 w-full rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom pb-4 transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">More</span>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="p-4 grid grid-cols-2 gap-3">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors border',
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' 
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 active:bg-gray-50 dark:active:bg-gray-700'
                  )}
                >
                  <item.icon className="w-6 h-6" />
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
