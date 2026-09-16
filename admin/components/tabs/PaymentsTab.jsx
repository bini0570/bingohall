import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, Table, Badge, Button, Avatar, Input } from '../ui';

export function PaymentsTab({ deposits, withdrawals, token, onRefresh, flash, apiFetch }) {
  const [subTab, setSubTab] = useState('deposits');
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  
  const activeData = subTab === 'deposits' ? deposits : withdrawals;
  const filtered = activeData
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => !search || (d.username||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const handleAction = async (id, action) => {
    try {
      const res = await apiFetch(`/api/admin/${subTab}/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { onRefresh(); flash('success', 'Action completed.'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <Card>
      <CardHeader 
        title="Payments Manager" 
        subtitle={`${filtered.length} records found`} 
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
              {['deposits', 'withdrawals'].map(t => (
                <button key={t} onClick={() => setSubTab(t)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, background: subTab === t ? 'var(--bg-card)' : 'transparent', color: subTab === t ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, background: filter === f ? 'var(--bg-card)' : 'transparent', color: filter === f ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>
        }
      />
      <div style={{ marginBottom: '16px', maxWidth: '300px' }}>
        <Input placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      
      <Table headers={['User', 'Method', 'Amount', subTab === 'withdrawals' ? 'Account' : 'Receipt', 'Date', 'Status', 'Actions'].filter(Boolean)}>
        {filtered.map(item => (
          <tr key={item.id}>
            <td data-label="User">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar label={(item.username||'?')[0].toUpperCase()} /> 
                <div>
                  <div style={{ fontWeight: 600 }}>{item.username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.phone}</div>
                </div>
              </div>
            </td>
            <td data-label="Method"><Badge status="info">{item.method||'—'}</Badge></td>
            <td data-label="Amount" style={{ fontWeight: 600, color: subTab==='deposits'?'var(--success)':'var(--error)' }}>
              {subTab==='deposits'?'+':'-'}Br {parseFloat(item.amount).toFixed(2)}
            </td>
            <td data-label={subTab === 'withdrawals' ? 'Account' : 'Receipt'} style={{ color: 'var(--text-secondary)' }}>
              {subTab === 'withdrawals' ? item.account_number||'—' : item.receipt_sms||'—'}
            </td>
            <td data-label="Date" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
            </td>
            <td data-label="Status"><Badge status={item.status}>{item.status}</Badge></td>
            <td data-label="Actions">
              {item.status === 'pending' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button variant="success" onClick={() => handleAction(item.id, 'approve')}><CheckCircle2 size={14}/> Approve</Button>
                  <Button variant="danger" onClick={() => handleAction(item.id, 'reject')}><XCircle size={14}/> Reject</Button>
                </div>
              )}
            </td>
          </tr>
        ))}
        {filtered.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No records found</td></tr>}
      </Table>
    </Card>
  );
}