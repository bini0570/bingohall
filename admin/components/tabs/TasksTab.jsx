import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Table, Badge, Button, Input, Select } from '../ui';

export function TasksTab({ token, flash, apiFetch }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ platform: 'telegram', link: '', reward_amount: '' });

  const loadTasks = async () => { 
    try { 
      const r = await apiFetch('/api/admin/tasks', { headers: { Authorization: `Bearer ${token}` }}); 
      if (r.ok) setTasks(await r.json()); 
    } catch(e) {} 
  };
  
  useEffect(() => { loadTasks(); }, []);

  const add = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      const r = await apiFetch('/api/admin/tasks', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, reward_amount: parseFloat(form.reward_amount) }) 
      }); 
      if (r.ok) { flash('success', 'Task added!'); setForm({ platform: 'telegram', link: '', reward_amount: '' }); loadTasks(); } 
      else flash('error', 'Failed'); 
    } finally { setLoading(false); } 
  };
  
  const remove = async (id) => { 
    await apiFetch(`/api/admin/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }}); 
    flash('success', 'Task deleted'); 
    loadTasks(); 
  };

  return (
    <>
      <Card>
        <CardHeader title="Add New Task" subtitle="Create social engagement tasks for players" />
        <form onSubmit={add} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <Select label="PLATFORM" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} options={[{label: 'Telegram', value: 'telegram'}, {label: 'YouTube', value: 'youtube'}, {label: 'TikTok', value: 'tiktok'}]} />
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <Input label="LINK URL" placeholder="https://..." value={form.link} onChange={e => setForm({...form, link: e.target.value})} required />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <Input label="REWARD (Br)" type="number" placeholder="20" value={form.reward_amount} onChange={e => setForm({...form, reward_amount: e.target.value})} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Button variant="primary" disabled={loading} type="submit">{loading ? 'Adding...' : '+ Add Task'}</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Active Tasks" action={<Badge status="info">{tasks.length} active</Badge>} />
        <Table headers={['Platform', 'Link', 'Reward', 'Action']}>
          {tasks.map(t => (
            <tr key={t.id}>
              <td data-label="Platform"><Badge status="info">{t.platform}</Badge></td>
              <td data-label="Link" style={{ color: 'var(--text-secondary)' }}>{t.link}</td>
              <td data-label="Reward" style={{ fontWeight: 600, color: 'var(--success)' }}>+Br {t.reward_amount}</td>
              <td data-label="Action"><Button variant="danger" onClick={() => remove(t.id)}>Delete</Button></td>
            </tr>
          ))}
          {tasks.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No tasks available</td></tr>}
        </Table>
      </Card>
    </>
  );
}