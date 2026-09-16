import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Table, Badge, Button, Input, Select } from '../ui';
import { Plus } from 'lucide-react';

export function TasksTab({ token, flash, apiFetch }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const initialForm = {
    type: 'Join Telegram',
    title: '',
    url: '',
    button_name: 'Join Now',
    reward: '',
    target: 'All Players'
  };
  
  const [form, setForm] = useState(initialForm);

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
      const payload = { ...form, reward: parseFloat(form.reward) || 0 };
      const r = await apiFetch('/api/admin/tasks', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      }); 
      if (r.ok) { 
        flash('success', 'Task published!'); 
        setForm(initialForm); 
        setIsCreating(false);
        loadTasks(); 
      } 
      else {
        const d = await r.json();
        flash('error', d.error || 'Failed to create task'); 
      }
    } catch (e) {
      flash('error', e.message);
    } finally { setLoading(false); } 
  };
  
  const remove = async (id) => { 
    try {
      await apiFetch(`/api/admin/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }}); 
      flash('success', 'Task deleted'); 
      loadTasks(); 
    } catch(e) {
      flash('error', e.message);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {!isCreating && (
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            <Plus size={16} style={{ marginRight: '4px' }} /> Create Task
          </Button>
        )}
      </div>

      {isCreating && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader title="Create New Task" subtitle="Setup an engagement bounty for players" />
          <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0 8px 0' }}>
            {/* Row 1: Type + Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Select 
                label="TYPE" 
                value={form.type} 
                onChange={e => setForm({...form, type: e.target.value})} 
                options={[
                  {label: 'Join Telegram', value: 'Join Telegram'}, 
                  {label: 'Deposit', value: 'Deposit'}, 
                  {label: 'Play Game', value: 'Play Game'},
                  {label: 'Custom', value: 'Custom'}
                ]} 
              />
              <Input 
                label="TITLE" 
                placeholder="e.g. Join GameZoneETH" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                required 
              />
            </div>
            
            {/* Telegram link — full width when shown */}
            {(form.type === 'Join Telegram' || form.type === 'Custom') && (
              <Input 
                label="LINK" 
                placeholder="https://t.me/..." 
                value={form.url} 
                onChange={e => setForm({...form, url: e.target.value})} 
                required 
              />
            )}

            {/* Row 2: Button name + Reward */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input 
                label="BUTTON" 
                placeholder="Join Now" 
                value={form.button_name} 
                onChange={e => setForm({...form, button_name: e.target.value})} 
                required 
              />
              <Input 
                label="REWARD (ETB)" 
                type="number" 
                placeholder="50" 
                value={form.reward} 
                onChange={e => setForm({...form, reward: e.target.value})} 
                required 
              />
            </div>

            {/* Row 3: Target full width */}
            <Select 
              label="TARGET" 
              value={form.target} 
              onChange={e => setForm({...form, target: e.target.value})} 
              options={[
                {label: 'All Players', value: 'All Players'}, 
                {label: 'New Players', value: 'New Players'}, 
                {label: 'Active Players', value: 'Active Players'},
                {label: 'VIP Depositors', value: 'VIP Depositors'}
              ]} 
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Publishing...' : 'Create Task'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Active Tasks" action={<Badge status="info">{tasks.length} active</Badge>} />
        <Table headers={['Task', 'Reward', 'Target', 'Action']}>
          {tasks.map(t => (
            <tr key={t.id}>
              <td data-label="Task">
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title || 'Untitled'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge status="info">{t.type || t.platform}</Badge>
                  {(t.url || t.link) && <span style={{ opacity: 0.8 }}>{t.url || t.link}</span>}
                </div>
              </td>
              <td data-label="Reward" style={{ fontWeight: 600, color: 'var(--success)' }}>+Br {t.reward || t.reward_amount}</td>
              <td data-label="Target" style={{ color: 'var(--text-secondary)' }}>{t.target || 'All Players'}</td>
              <td data-label="Action"><Button variant="danger" onClick={() => remove(t.id)}>Delete</Button></td>
            </tr>
          ))}
          {tasks.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No active tasks</td></tr>}
        </Table>
      </Card>
    </>
  );
}