import React, { useState } from 'react';
import { Card, CardHeader, Table, Badge, Button, Avatar, Input } from '../ui';

export function UsersTab({ users, token, flash, onRefresh, apiFetch }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => (u.username||'').toLowerCase().includes(search.toLowerCase()) || (u.phone||'').includes(search));

  const adjustBal = async (uid, action) => {
    const amt = prompt(`Enter amount to ${action}:`);
    if (!amt || isNaN(amt) || amt <= 0) return;
    try {
      const res = await apiFetch(`/api/admin/users/${uid}/balance`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action, amount: parseFloat(amt) }) 
      });
      if (res.ok) { onRefresh(); flash('success', 'Balance updated'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <Card>
      <CardHeader title="Players Directory" subtitle={`${filtered.length} players found`} />
      <div style={{ marginBottom: '16px', maxWidth: '300px' }}>
        <Input placeholder="Search username or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      
      <Table headers={['Player', 'Phone', 'Balance', 'Withdrawable', 'Status', 'Actions']}>
        {filtered.map(u => (
          <tr key={u.id}>
            <td data-label="Player">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar label={(u.username||'?')[0].toUpperCase()} />
                <div>
                  <div style={{ fontWeight: 600 }}>{u.username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                </div>
              </div>
            </td>
            <td data-label="Phone" style={{ color: 'var(--text-secondary)' }}>{u.phone||'—'}</td>
            <td data-label="Balance" style={{ fontWeight: 600, color: 'var(--success)' }}>Br {parseFloat(u.balance||0).toFixed(2)}</td>
            <td data-label="Withdrawable" style={{ color: 'var(--text-secondary)' }}>Br {parseFloat(u.withdrawable_balance||0).toFixed(2)}</td>
            <td data-label="Status"><Badge status={u.is_banned ? 'rejected' : 'active'}>{u.is_banned ? 'Banned' : 'Active'}</Badge></td>
            <td data-label="Actions">
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button variant="success" onClick={() => adjustBal(u.id, 'add')}>+ Add</Button>
                <Button variant="danger" onClick={() => adjustBal(u.id, 'deduct')}>- Deduct</Button>
              </div>
            </td>
          </tr>
        ))}
        {filtered.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No players found</td></tr>}
      </Table>
    </Card>
  );
}