import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input } from '../ui';

export function PromosTab({ token, flash, apiFetch }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: '', reward: '', max_uses: '' });

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
        body: JSON.stringify({ code: form.code, reward: parseFloat(form.reward), max_uses: parseInt(form.max_uses) }) 
      }); 
      if (r.ok) { flash('success', 'Promo added!'); setForm({ code: '', reward: '', max_uses: '' }); loadPromos(); } 
      else flash('error', 'Failed'); 
    } finally { setLoading(false); } 
  };
  
  const remove = async (id) => { 
    await apiFetch(`/api/admin/promos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }}); 
    flash('success', 'Promo deleted'); 
    loadPromos(); 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <form onSubmit={add} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--surface-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <input 
          placeholder="Code (e.g. VIP20)" 
          value={form.code} 
          onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
          required 
          style={{ flex: 2, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <input 
          type="number" 
          placeholder="Reward (Br)" 
          value={form.reward} 
          onChange={e => setForm({...form, reward: e.target.value})} 
          required 
          style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <input 
          type="number" 
          placeholder="Usage Limit" 
          value={form.max_uses} 
          onChange={e => setForm({...form, max_uses: e.target.value})} 
          required 
          style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <Button variant="primary" disabled={loading} type="submit" style={{ padding: '10px 24px', height: 'auto' }}>
          {loading ? 'Adding...' : 'Create'}
        </Button>
      </form>

      <Card>
        <Table headers={['Code', 'Reward', 'Limit', '']}>
          {promos.map(p => (
            <tr key={p.id}>
              <td data-label="Code"><span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '15px' }}>{p.code}</span></td>
              <td data-label="Reward" style={{ fontWeight: 600, color: 'var(--success)' }}>Br {p.reward}</td>
              <td data-label="Limit" style={{ color: 'var(--text-secondary)' }}>{p.max_uses || p.uses_limit} uses</td>
              <td style={{ textAlign: 'right' }}><Button variant="danger" onClick={() => remove(p.id)}>Delete</Button></td>
            </tr>
          ))}
          {promos.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No promos active</td></tr>}
        </Table>
      </Card>
      
    </div>
  );
}