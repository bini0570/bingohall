const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, 'Admin', 'components', 'tabs');

const paymentsCode = `import React, { useState } from 'react';
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
      const res = await apiFetch(\`/api/admin/\${subTab}/\${id}/\${action}\`, { method: 'POST', headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) { onRefresh(); flash('success', 'Action completed.'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <Card>
      <CardHeader 
        title="Payments Manager" 
        subtitle={\`\${filtered.length} records found\`} 
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
}`;

const usersCode = `import React, { useState } from 'react';
import { Card, CardHeader, Table, Badge, Button, Avatar, Input } from '../ui';

export function UsersTab({ users, token, flash, onRefresh, apiFetch }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => (u.username||'').toLowerCase().includes(search.toLowerCase()) || (u.phone||'').includes(search));

  const adjustBal = async (uid, action) => {
    const amt = prompt(\`Enter amount to \${action}:\`);
    if (!amt || isNaN(amt) || amt <= 0) return;
    try {
      const res = await apiFetch(\`/api/admin/users/\${uid}/balance\`, { 
        method: 'POST', 
        headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action, amount: parseFloat(amt) }) 
      });
      if (res.ok) { onRefresh(); flash('success', 'Balance updated'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <Card>
      <CardHeader title="Players Directory" subtitle={\`\${filtered.length} players found\`} />
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
}`;

const tasksCode = `import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Table, Badge, Button, Input, Select } from '../ui';

export function TasksTab({ token, flash, apiFetch }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ platform: 'telegram', link: '', reward_amount: '' });

  const loadTasks = async () => { 
    try { 
      const r = await apiFetch('/api/admin/tasks', { headers: { Authorization: \`Bearer \${token}\` }}); 
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
        headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, reward_amount: parseFloat(form.reward_amount) }) 
      }); 
      if (r.ok) { flash('success', 'Task added!'); setForm({ platform: 'telegram', link: '', reward_amount: '' }); loadTasks(); } 
      else flash('error', 'Failed'); 
    } finally { setLoading(false); } 
  };
  
  const remove = async (id) => { 
    await apiFetch(\`/api/admin/tasks/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` }}); 
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
}`;

const promosCode = `import React, { useState, useEffect } from 'react';
import { Card, CardHeader, Table, Badge, Button, Input } from '../ui';

export function PromosTab({ token, flash, apiFetch }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: '', reward: '', uses_limit: '' });

  const loadPromos = async () => { 
    try { 
      const r = await apiFetch('/api/admin/promos', { headers: { Authorization: \`Bearer \${token}\` }}); 
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
        headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, reward: parseFloat(form.reward), uses_limit: parseInt(form.uses_limit) }) 
      }); 
      if (r.ok) { flash('success', 'Promo added!'); setForm({ code: '', reward: '', uses_limit: '' }); loadPromos(); } 
      else flash('error', 'Failed'); 
    } finally { setLoading(false); } 
  };
  
  const remove = async (id) => { 
    await apiFetch(\`/api/admin/promos/\${id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${token}\` }}); 
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
}`;

fs.writeFileSync(path.join(tabsDir, 'PaymentsTab.jsx'), paymentsCode);
fs.writeFileSync(path.join(tabsDir, 'UsersTab.jsx'), usersCode);
fs.writeFileSync(path.join(tabsDir, 'TasksTab.jsx'), tasksCode);
fs.writeFileSync(path.join(tabsDir, 'PromosTab.jsx'), promosCode);

fs.writeFileSync(path.join(tabsDir, 'index.jsx'), `
export { DashboardTab } from './DashboardTab';
export { PaymentsTab } from './PaymentsTab';
export { UsersTab } from './UsersTab';
export { TasksTab } from './TasksTab';
export { PromosTab } from './PromosTab';
`);

console.log('Tabs generated');
