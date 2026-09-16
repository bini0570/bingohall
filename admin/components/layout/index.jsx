import React from 'react';
import { Menu, Sun, Moon, LogOut, RefreshCw } from 'lucide-react';
import '../../AdminTheme.css';

export function Sidebar({ navItems, activeTab, setTab, onLogout }) {
  return (
    <div className={`admin-sidebar open`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎯</div>
        <div>
          <div className="sidebar-logo-text">BingoX</div>
          <div className="text-muted" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>ADMINISTRATION</div>
        </div>
      </div>
      <nav className="sidebar-nav" style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
        <div className="nav-section-label" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '12px' }}>MAIN MENU</div>
        {navItems.map((item) => {
          if (!item.key) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <div
              key={item.key}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer',
                borderRadius: 'var(--radius-sm)', marginBottom: '4px',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-soft)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'all var(--transition)'
              }}
              onClick={() => setTab(item.key)}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </div>
          );
        })}
        
        <div className="nav-section-label" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '24px', marginBottom: '8px', paddingLeft: '12px' }}>ACCOUNT</div>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer',
            borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontWeight: 500
          }}
          onClick={onLogout}
        >
          <LogOut size={18} />
          Sign Out
        </div>
      </nav>
    </div>
  );
}

export function Header({ pageInfo, theme, toggleTheme, onRefresh, refreshing, onLogout }) {
  return (
    <header className="admin-header" style={{
      height: 'var(--header-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', zIndex: 10
    }}>
      <div>
        <h1 className="h-title">{pageInfo.title}</h1>
        <p className="h-sub">{pageInfo.sub}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className={`btn btn-ghost ${refreshing ? 'spinning' : ''}`} onClick={onRefresh} style={{ padding: '0 8px' }}>
          <RefreshCw size={18} />
        </button>
        <button className="btn btn-ghost" onClick={toggleTheme} style={{ padding: '0 8px' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {/* Mobile logout inside header since sidebar hides */}
        <button className="btn btn-ghost" onClick={onLogout} style={{ padding: '0 8px', color: 'var(--error)', display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export function BottomNav({ navItems, activeTab, setTab }) {
  return (
    <div style={{
      display: window.innerWidth <= 768 ? 'flex' : 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 'var(--bottom-nav-h)',
      background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
      zIndex: 100, justifyContent: 'space-around', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {navItems.map((item) => {
        if (!item.key) return null;
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <div
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flex: 1, height: '100%', gap: '4px', cursor: 'pointer',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '10px', transition: 'color var(--transition)'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminLayout({ children, navItems, activeTab, setTab, onLogout, pageInfo, theme, toggleTheme, onRefresh, refreshing }) {
  return (
    <div className={`admin-root theme-${theme}`}>
      {window.innerWidth > 768 && (
        <Sidebar navItems={navItems} activeTab={activeTab} setTab={setTab} onLogout={onLogout} />
      )}
      <div className="admin-main">
        <Header pageInfo={pageInfo} theme={theme} toggleTheme={toggleTheme} onRefresh={onRefresh} refreshing={refreshing} onLogout={onLogout} />
        <div className="admin-content fade-in">
          {children}
        </div>
      </div>
      <BottomNav navItems={navItems} activeTab={activeTab} setTab={setTab} />
    </div>
  );
}
