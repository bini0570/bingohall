import React, { useState } from 'react';
import { Card, CardHeader, Badge } from '../ui';
import { Search, ChevronRight, ArrowLeft, User, Phone, Calendar, Shield, Wallet, Banknote, AtSign, MessageCircle } from 'lucide-react';

export function UsersTab({ users, token, flash, apiFetch, onRefresh }) {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const hasSearched = query.trim().length > 0;
  
  const filtered = hasSearched ? users.filter(u => {
    const q = query.toLowerCase().trim();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.id && u.id.toString() === q)
    );
  }) : [];

  const toggleBan = async (uid) => {
    try {
      const res = await apiFetch(`/api/admin/users/${uid}/ban`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { 
        const d = await res.json();
        if (onRefresh) onRefresh(); 
        flash('success', `Player has been ${d.isBanned ? 'blocked' : 'unblocked'}`); 
        // Update local state for immediate feedback
        if (selectedUser && selectedUser.id === uid) {
          setSelectedUser({ ...selectedUser, is_banned: d.isBanned });
        }
      } else {
        flash('error', (await res.json()).error || 'Failed to update player status');
      }
    } catch(e) { 
      flash('error', e.message); 
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (selectedUser) {
    const u = selectedUser;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <button 
            onClick={() => setSelectedUser(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Back to Search
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                {(u.name || u.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{u.name || u.username || 'Unknown'}</h2>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>Player ID #{u.id}</div>
              </div>
            </div>
            
            <button 
              onClick={() => toggleBan(u.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: u.is_banned ? 'var(--surface-high)' : 'var(--error-soft)',
                color: u.is_banned ? 'var(--text-primary)' : 'var(--error)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.target.style.opacity = 0.8}
              onMouseOut={(e) => e.target.style.opacity = 1}
            >
              <Shield size={16} />
              {u.is_banned ? 'Unblock Player' : 'Block Player'}
            </button>
          </div>
        </div>

        <Card>
          <CardHeader title="Profile Details" subtitle="Structured player information" />
          <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><User size={14} /> Full Name</span>
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || u.username || '—'}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><AtSign size={14} /> Username</span>
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.username || '—'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><Phone size={14} /> Phone Number</span>
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.phone || '—'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><MessageCircle size={14} /> Telegram ID</span>
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.telegram_id || 'Not Linked'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><Calendar size={14} /> Registration Date</span>
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(u.created_at)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><Shield size={14} /> Account Status</span>
                <div><Badge status={u.is_banned ? 'rejected' : 'active'}>{u.is_banned ? 'Blocked' : 'Active'}</Badge></div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><Wallet size={14} /> Total Balance</span>
                <span style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 700 }}>Br {parseFloat(u.balance || 0).toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}><Banknote size={14} /> Withdrawable Balance</span>
                <span style={{ fontSize: '20px', color: 'var(--success)', fontWeight: 700 }}>Br {parseFloat(u.withdrawable_balance || u.balance || 0).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ position: 'relative', maxWidth: '600px' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search by ID, phone number, name or username"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-light)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }}
          />
        </div>
      </div>

      {hasSearched && (
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Search Results</h3>
          {filtered.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
              {filtered.map(u => (
                <div 
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--surface-light)',
                    border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'border-color 0.2s, background-color 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-soft)'; e.currentTarget.style.backgroundColor = 'var(--surface-high)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--surface-light)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {(u.name || u.username || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{u.name || u.username || 'Unknown Player'}</span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={20} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '15px', fontWeight: 500 }}>No players found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}