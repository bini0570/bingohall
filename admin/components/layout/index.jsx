import React, { useState } from 'react';
import { Menu, Sun, Moon, LogOut, RefreshCw, X } from 'lucide-react';
import '../../AdminTheme.css';

export function Sidebar({ navItems, activeTab, setTab, onLogout, open, onClose }) {
  return (
    <>
      {/* Overlay on mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <div className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎯</div>
          <div>
            <div className="sidebar-logo-text">BingoX</div>
          </div>
          <span className="sidebar-logo-badge">ADMIN</span>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (!item.key) return <div key={i} className="nav-section-label">{item.label}</div>;
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <div
                key={item.key}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => { setTab(item.key); onClose(); }}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item" onClick={onLogout} style={{ color: 'var(--error)' }}>
            <LogOut size={17} /> Sign Out
          </div>
        </div>
      </div>
    </>
  );
}

export function Header({ pageInfo, theme, toggleTheme, onRefresh, refreshing, onLogout, onMenuOpen }) {
  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuOpen} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="header-page-title">{pageInfo.title}</div>
          <div className="header-page-sub">{pageInfo.sub}</div>
        </div>
      </div>
      <div className="header-right">
        <button className={`header-icon-btn ${refreshing ? 'spinning' : ''}`} onClick={onRefresh} title="Refresh">
          <RefreshCw size={17} />
        </button>
        <button className="header-icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="header-icon-btn" onClick={onLogout} title="Sign out" style={{ color: 'var(--error)' }}>
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

export function BottomNav({ navItems, activeTab, setTab }) {
  return (
    <nav className="bottom-nav">
      {navItems.filter(item => item.key).map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <div
            key={item.key}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminLayout({
  children, navItems, activeTab, setTab, onLogout,
  pageInfo, theme, toggleTheme, onRefresh, refreshing
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`admin-root theme-${theme}`}>
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        setTab={setTab}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-main">
        <Header
          pageInfo={pageInfo}
          theme={theme}
          toggleTheme={toggleTheme}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onLogout={onLogout}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <div className="admin-content fade-in">
          {children}
        </div>
      </div>

      <BottomNav navItems={navItems} activeTab={activeTab} setTab={setTab} />
    </div>
  );
}
