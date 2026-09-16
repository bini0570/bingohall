import React, { useState } from 'react';
import { Card, CardHeader, Table, Badge, Avatar } from '../ui';
import { Search } from 'lucide-react';

export function UsersTab({ users }) {
  const [query, setQuery] = useState('');
  
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Players</h2>
        <div style={{ position: 'relative', maxWidth: '600px' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search by ID, phone, name or username..."
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
        <Card>
          <CardHeader title="Search Results" subtitle={`${filtered.length} players found`} />
          <Table headers={['Player', 'Phone', 'Balance', 'Withdrawable', 'Status']}>
            {filtered.map(u => (
              <tr key={u.id}>
                <td data-label="Player">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar label={(u.username || u.name || '?')[0].toUpperCase()} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username || u.name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>ID #{u.id}</div>
                    </div>
                  </div>
                </td>
                <td data-label="Phone" style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                <td data-label="Balance" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Br {parseFloat(u.balance||0).toFixed(2)}</td>
                <td data-label="Withdrawable" style={{ color: 'var(--text-secondary)' }}>Br {parseFloat(u.withdrawable_balance||0).toFixed(2)}</td>
                <td data-label="Status">
                  <Badge status={u.is_banned ? 'rejected' : 'active'}>{u.is_banned ? 'Banned' : 'Active'}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><Search size={28} style={{ opacity: 0.4 }} /></div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>No players found</div>
                </td>
              </tr>
            )}
          </Table>
        </Card>
      )}
    </div>
  );
}