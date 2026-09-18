import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Users, CheckSquare, Gift, Radio, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
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

export default function MobileNav() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">B</div>
          <span className="font-bold text-lg tracking-tight text-gray-900">Bingo Admin</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay & Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-30 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-sm h-full bg-white shadow-xl animate-in slide-in-from-left">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-xl text-gray-900">Menu</span>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 active:bg-gray-50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
