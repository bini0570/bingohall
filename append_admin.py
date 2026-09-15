import sys

components = """
// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
function TasksTab({ token, flash }) {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ platform: 'telegram', link: '', reward_amount: '' });

  const loadTasks = async () => {
    try {
      const r = await fetch(API_BASE + '/api/admin/tasks', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setTasks(d);
    } catch(e) {}
  };
  
  React.useEffect(() => { loadTasks(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(API_BASE + '/api/admin/tasks', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, reward_amount: parseFloat(form.reward_amount) }) });
      if (r.ok) { flash('success', 'Task added!'); setForm({ platform: 'telegram', link: '', reward_amount: '' }); loadTasks(); }
      else flash('error', 'Failed to add');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    await fetch(API_BASE + `/api/admin/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    flash('success', 'Task deleted');
    loadTasks();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <form onSubmit={add} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>Add New Task</h3>
        <select value={form.platform} onChange={e=>setForm({...form, platform: e.target.value})} className="input-field" style={{ width: '100%' }}>
          <option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option>
        </select>
        <input placeholder="Link URL" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} className="input-field" required />
        <input type="number" placeholder="Reward ETB" value={form.reward_amount} onChange={e=>setForm({...form, reward_amount: e.target.value})} className="input-field" required />
        <button style={S.btn('primary')} disabled={loading}>+ Add Task</button>
      </form>

      <ul className="transactions" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tasks.map(t => (
          <li className="tx" key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '8px' }}>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.platform.toUpperCase()}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', wordBreak: 'break-all' }}>{t.link}</p>
              <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>{t.reward_amount} ETB</p>
            </div>
            <button style={{ ...S.btn('danger'), width: 'auto', padding: '6px 12px', fontSize: '11px' }} onClick={() => remove(t.id)}>Delete</button>
          </li>
        ))}
        {tasks.length === 0 && <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No active tasks.</p>}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOS
// ─────────────────────────────────────────────────────────────────────────────
function PromosTab({ token, flash }) {
  const [promos, setPromos] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ code: '', reward: '', uses_limit: '' });

  const loadPromos = async () => {
    try {
      const r = await fetch(API_BASE + '/api/admin/promos', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setPromos(d);
    } catch(e) {}
  };
  
  React.useEffect(() => { loadPromos(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(API_BASE + '/api/admin/promos', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, reward: parseFloat(form.reward), uses_limit: parseInt(form.uses_limit) }) });
      if (r.ok) { flash('success', 'Promo added!'); setForm({ code: '', reward: '', uses_limit: '' }); loadPromos(); }
      else flash('error', 'Failed to add');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    await fetch(API_BASE + `/api/admin/promos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    flash('success', 'Promo deleted');
    loadPromos();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <form onSubmit={add} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>Add Promo Code</h3>
        <input placeholder="Code (e.g. VIP20)" value={form.code} onChange={e=>setForm({...form, code: e.target.value.toUpperCase()})} className="input-field" required />
        <input type="number" placeholder="Reward ETB" value={form.reward} onChange={e=>setForm({...form, reward: e.target.value})} className="input-field" required />
        <input type="number" placeholder="Usage Limit (e.g. 100)" value={form.uses_limit} onChange={e=>setForm({...form, uses_limit: e.target.value})} className="input-field" required />
        <button style={S.btn('primary')} disabled={loading}>+ Add Promo</button>
      </form>

      <ul className="transactions" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {promos.map(p => (
          <li className="tx" key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '8px' }}>
            <div>
              <p style={{ fontWeight: 'bold', color: 'var(--gold)', fontSize: '15px' }}>{p.code}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Usage Limit: {p.uses_limit}</p>
              <p style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>{p.reward} ETB</p>
            </div>
            <button style={{ ...S.btn('danger'), width: 'auto', padding: '6px 12px', fontSize: '11px' }} onClick={() => remove(p.id)}>Delete</button>
          </li>
        ))}
        {promos.length === 0 && <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No active promo codes.</p>}
      </ul>
    </div>
  );
}
"""

with open("c:/Users/User/Videos/Platform/Platform/frontend/src/views/AdminView.jsx", "a", encoding="utf-8") as f:
    f.write(components)

print("Appended")
