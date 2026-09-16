import React, { useState, useEffect } from 'react';
import { Card, Table, Button } from '../ui';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  WebkitAppearance: 'none',
};

const focusStyle = (e) => {
  e.target.style.borderColor = 'var(--primary)';
  e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)';
};
const blurStyle = (e) => {
  e.target.style.borderColor = 'var(--border-color)';
  e.target.style.boxShadow = 'none';
};

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Create Promo Form — wraps to 2 lines on mobile */}
      <form onSubmit={add} style={{
        background: 'var(--bg-card)',
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Top row: code + create button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            placeholder="Code (e.g. VIP20)"
            value={form.code}
            onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
            required
            style={{ ...inputStyle, flex: 1 }}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          <Button variant="primary" disabled={loading} type="submit" style={{ height: '42px', padding: '0 20px', flexShrink: 0 }}>
            {loading ? '...' : 'Create'}
          </Button>
        </div>

        {/* Bottom row: reward + limit side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input
            type="number"
            placeholder="Reward (Br)"
            value={form.reward}
            onChange={e => setForm({...form, reward: e.target.value})}
            required
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          <input
            type="number"
            placeholder="Usage Limit"
            value={form.max_uses}
            onChange={e => setForm({...form, max_uses: e.target.value})}
            required
            style={inputStyle}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>
      </form>

      {/* Promo List */}
      <Card>
        <Table headers={['Code', 'Reward', 'Limit', '']}>
          {promos.map(p => (
            <tr key={p.id}>
              <td data-label="Code">
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.5px' }}>
                  {p.code}
                </span>
              </td>
              <td data-label="Reward" style={{ fontWeight: 600, color: 'var(--success)' }}>Br {p.reward}</td>
              <td data-label="Limit" style={{ color: 'var(--text-secondary)' }}>{p.max_uses || p.uses_limit} uses</td>
              <td style={{ textAlign: 'right' }}>
                <Button variant="danger" onClick={() => remove(p.id)}>Delete</Button>
              </td>
            </tr>
          ))}
          {promos.length === 0 && (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No promos active</td></tr>
          )}
        </Table>
      </Card>
      
    </div>
  );
}