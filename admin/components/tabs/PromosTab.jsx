import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Table, Badge, Button, Input } from '../ui';

export function PromosTab({ token, flash, apiFetch }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: '', reward: '', uses_limit: '' });

  const loadPromos = async () => { 
    try { 
      const r = await apiFetch('/api/admin/promos', { headers: { Authorization: `Bearer ${token}` }}); 
      if (r.ok) setPromos(await r.json()); 
    } catch(e) {} 
  };
  
  useEffect(() => { loadPromos(); }, []);

  const add = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      const r = await apiFetch('/api/admin/promos', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, reward: parseFloat(form.reward), uses_limit: parseInt(form.uses_limit) }) 
      }); 
      if (r.ok) { flash('success', 'Promo added!'); setForm({ code: '', reward: '', uses_limit: '' }); loadPromos(); } 
      else flash('error', 'Failed'); 
    } finally { setLoading(false); } 
  };
  
  const remove = async (id) => { 
    await apiFetch(`/api/admin/promos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }}); 
    flash('success', 'Promo deleted'); 
    loadPromos(); 
  };

  return (
    <>
      <Card>
        <CardHeader title="Create Promo Code" subtitle="Generate reward codes for players" />
        <form onSubmit={add} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <Input label="CODE" placeholder="VIP20" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <Input label="REWARD (Br)" type="number" placeholder="20" value={form.reward} onChange={e => setForm({...form, reward: e.target.value})} required />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <Input label="USAGE LIMIT" type="number" placeholder="100" value={form.uses_limit} onChange={e => setForm({...form, uses_limit: e.target.value})} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Button variant="primary" disabled={loading} type="submit">{loading ? 'Adding...' : '+ Add Promo'}</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Active Promos" action={<Badge status="info">{promos.length} active</Badge>} />
        <Table headers={['Code', 'Reward', 'Usage Limit', 'Action']}>
          {promos.map(p => (
            <tr key={p.id}>
              <td data-label="Code"><span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '15px' }}>{p.code}</span></td>
              <td data-label="Reward" style={{ fontWeight: 600, color: 'var(--success)' }}>+Br {p.reward}</td>
              <td data-label="Usage Limit" style={{ color: 'var(--text-secondary)' }}>{p.uses_limit} uses</td>
              <td data-label="Action"><Button variant="danger" onClick={() => remove(p.id)}>Delete</Button></td>
            </tr>
          ))}
          {promos.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No promos available</td></tr>}
        </Table>
      </Card>
    </>
  );
}