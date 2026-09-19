import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { useApp, useReady, fetcher } from './AppContext';
import { PageHead, Sk, Badge, Avatar, Seg, Empty, Info, Sheet, Confirm, Chart } from './components';
import { Icon, cx, fmt, fmtPhone, cap, TYPES, TARGETS } from './data';

const ACT_ICON = { play: 'play', tasks: 'tasks', down: 'down', up: 'up' };

export function Dashboard() {
  const { deposits, withdrawals, adj, nav } = useApp();
  const [range, setRange] = useState('7D');
  const ready = useReady('dashboard');
  
  if (!ready || !metrics) {
    return (
      <div className="dash">
        <div className="wide"><PageHead title="Dashboard" /></div>
        <Sk height={190} />
        <Sk height={110} />
        <div className="wide"><Sk height={280} /></div>
        <div className="wide"><Sk height={130} /></div>
      </div>
    );
  }
  
  const td = metrics.totalDeposits || 0, tw = metrics.totalWithdrawals || 0, profit = td - tw;
  const pd = metrics.pendingDeposits || 0;
  const pw = metrics.pendingWithdrawals || 0;
  
  const tile = (kind, count) => (
    <button className="tile" onClick={() => nav('payments', { tab: kind })}>
      <span className={cx('ico', kind === 'deposit' ? 'd' : 'w')}>
        <Icon name={kind === 'deposit' ? 'down' : 'up'} size={20} />
      </span>
      <span className="t">
        <b>{count}</b>
        <span>{kind === 'deposit' ? 'Deposit' : 'Withdraw'}{count === 1 ? ' request' : ' requests'}</span>
      </span>
      <span className="go"><Icon name="chev" size={18} /></span>
    </button>
  );
  
  return (
    <div className="dash">
      <div className="wide"><PageHead title="Dashboard" /></div>
      
      <section className="card hero">
        <div className="top">
          <span className="lbl">Revenue</span>
          <span className="hint">Deposits − Withdrawals</span>
        </div>
        <div className="hero-num">{fmt(profit)}<small>ETB</small></div>
        <div className="hero-split">
          <div>
            <div className="lbl"><span className="up"><Icon name="down" size={14} /></span>Total deposits</div>
            <div className="v">{fmt(td)}</div>
          </div>
          <span className="minus">−</span>
          <div>
            <div className="lbl"><span className="down"><Icon name="up" size={14} /></span>Total withdrawals</div>
            <div className="v">{fmt(tw)}</div>
          </div>
        </div>
      </section>
      
      <section className="stats">
        <div className="card stat">
          <span className="lbl">Total players</span>
          <span className="n">{fmt(metrics.totalUsers)}</span>
        </div>
        <div className="card stat">
          <span className="lbl">Today registered</span>
          <span className="n">{fmt(metrics.todayUsers)}<span className="up" aria-label="up"><Icon name="up" size={16} /></span></span>
        </div>
        <div className="card stat">
          <span className="lbl">Online players</span>
          <span className="n">{fmt(metrics.onlineUsers)}<i className="live" aria-label="live" /></span>
        </div>
      </section>
      
      <section className="card wide">
        <div className="chart-head">
          <div><div className="lbl">Revenue trend</div></div>
          <Seg small value={range} onChange={setRange} options={['24h', '7D', '30D', '90D'].map((v) => ({ value: v, label: v }))} />
        </div>
        <Chart range={range} />
      </section>
      
      <section className="card wide payov">
        <div className="head"><span className="lbl">Pending requests</span></div>
        <div className="row">
          {tile('deposit', pd)}
          {tile('withdraw', pw)}
        </div>
      </section>
    </div>
  );
}

function ReqCard({ r, kind }) {
  const { nav, decideConfirm } = useApp();
  const isDep = kind === 'deposit';
  const pName = r.username || 'Player ' + r.user_id;
  
  return (
    <article className="card req">
      <div className="req-top">
        <button className="who" onClick={() => nav('players', { profile: r.user_id })}>
          <Avatar p={{ id: r.user_id, name: pName }} />
          <span className="pname"><strong>{pName}</strong><span className="muted sm">ID {r.user_id}</span></span>
        </button>
        <div className="amt"><b>{fmt(r.amount)}</b><small>ETB</small></div>
      </div>
      
      <div className="req-meta">
        <span className="mchip">{r.method || (isDep ? 'Deposit' : 'Withdraw')}</span>
        <span className="mono">{isDep ? r.ref : r.account}</span>
        <span className="muted sm time">{r.doneAt || new Date(r.created_at).toLocaleDateString()}</span>
      </div>
      
      {r.status === 'pending' ? (
        <div className="req-actions">
          <button className="btn btn-danger btn-sm" onClick={() => decideConfirm(kind, r, 'reject')}>
            <Icon name="x" size={16} />Reject
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => decideConfirm(kind, r, 'approve')}>
            <Icon name="check" size={16} />Approve
          </button>
        </div>
      ) : (
        <div className="req-done">
          <Badge s={r.status} />
          <span className="muted sm">{isDep ? 'Deposit ' + r.id : 'Withdrawal ' + r.id}</span>
        </div>
      )}
    </article>
  );
}

export function Payments() {
  const { route, deposits, withdrawals } = useApp();
  const [tab, setTab] = useState(route.tab || 'deposit');
  const [filter, setFilter] = useState('pending');
  const ready = useReady('payments');
  
  const list = tab === 'deposit' ? deposits : withdrawals;
  const counts = { pending: 0, completed: 0, rejected: 0 };
  list.forEach((r) => { counts[r.status]++; });
  const pd = deposits.filter((r) => r.status === 'pending').length;
  const pw = withdrawals.filter((r) => r.status === 'pending').length;
  const shown = list.filter((r) => r.status === filter);
  const noun = tab === 'deposit' ? 'deposits' : 'withdrawals';
  
  return (
    <div>
      <PageHead title="Payments" />
      <Seg value={tab} onChange={setTab} options={[
        { value: 'deposit', label: 'Deposit', count: pd }, 
        { value: 'withdraw', label: 'Withdraw', count: pw }
      ]} />
      
      <div className="chips filters">
        {['pending', 'completed', 'rejected'].map((k) => (
          <button key={k} className={cx('chip', filter === k && 'on')} onClick={() => setFilter(k)}>
            {cap(k)}<span>{counts[k]}</span>
          </button>
        ))}
      </div>
      
      {!ready ? (
        <div className="grid-list"><Sk height={150} /><Sk height={150} /><Sk height={150} /></div>
      ) : shown.length ? (
        <div className="grid-list">
          {shown.map((r) => <ReqCard key={r.id} r={r} kind={tab} />)}
        </div>
      ) : (
        <Empty 
          icon="inbox" 
          title={filter === 'pending' ? 'No pending ' + noun : 'No ' + filter + ' ' + noun} 
          text={filter === 'pending' ? 'New requests will show up here.' : 'Processed requests will show up here.'} 
        />
      )}
    </div>
  );
}

function PlayerCard({ p }) {
  const { nav } = useApp();
  return (
    <article className="card pcard">
      <button className="pcard-head" onClick={() => nav('players', { profile: p.id })}>
        <Avatar p={p} />
        <span className="pname"><strong>{p.username || 'Player ' + p.id}</strong></span>
        <Badge s={p.is_banned ? 'banned' : 'active'} />
        <span className="chev"><Icon name="chev" size={18} /></span>
      </button>
      
      <div className="infos">
        <Info k="Player ID" v={p.id} />
        <Info k="Phone" v={fmtPhone(p.phone)} />
        <Info k="Balance" v={fmt(p.balance) + ' ETB'} />
        <Info k="Registered" v={new Date(p.created_at).toLocaleDateString()} />
      </div>
    </article>
  );
}

function PlayerSearch() {
  const { query, setQuery, players } = useApp();
  const q = query.trim();
  
  return (
    <div>
      <PageHead title="Players" />
      <div className="search">
        <Icon name="search" size={20} />
        <input 
          className="input" type="text" inputMode="search" autoComplete="off" 
          placeholder="Search by ID, phone, name or username" 
          aria-label="Search players" value={query} onChange={(e) => setQuery(e.target.value)} 
        />
        {q && (
          <button className="clear" aria-label="Clear search" onClick={() => setQuery('')}>
            <Icon name="x" size={18} />
          </button>
        )}
      </div>
      
      {!q ? (
        <Empty icon="search" title="Find a player" text="Enter a player ID, phone number, name or username. Try “abel” or “10482”." />
      ) : players.length ? (
        <div>
          <p className="result-count">{players.length + (players.length === 1 ? ' player found' : ' players found')}</p>
          <div className="grid-list">
            {players.map((p) => <PlayerCard key={p.id} p={p} />)}
          </div>
        </div>
      ) : (
        <Empty icon="user" title="No player found" text="Check the ID, phone number or spelling and try again." />
      )}
    </div>
  );
}

function Profile({ id }) {
  const { players, nav, banConfirm } = useApp();
  // Try to find in current search results, otherwise fetch
  const found = players.find((x) => x.id === id);
  const { data: fetched } = useSWR(!found ? `/api/admin/users?search=${id}` : null, fetcher);
  
  const back = (
    <button className="back" onClick={() => nav('players')}>
      <Icon name="back" size={18} />Players
    </button>
  );
  
  const p = found || (fetched && fetched[0]);
  if (!p) return <div>{back}<Sk height={200} /></div>;
  
  const banned = p.is_banned;
  
  return (
    <div>
      {back}
      <div className="stack">
        <section className="card prof-head">
          <Avatar p={{ id: p.id, name: p.username || 'Player' }} size="lg" />
          <div>
            <h1>{p.username || 'Player ' + p.id}</h1>
            <div className="row">
              <span className="idchip">ID {p.id}</span>
              <Badge s={p.is_banned ? 'banned' : 'active'} />
            </div>
          </div>
        </section>
        
        {banned && (
          <div className="notice">
            <Icon name="ban" size={20} />This player is banned and can’t play or withdraw.
          </div>
        )}
        
        <div className="prof-grid stack">
          <section className="card">
            <h2 className="sec-title">Balance</h2>
            <div className="bal2">
              <div className="bal">
                <span className="lbl">Balance</span>
                <div className="v">{fmt(p.balance)}<small>ETB</small></div>
              </div>
            </div>
          </section>
          
          <section className="card">
            <h2 className="sec-title">Account</h2>
            <div className="kv">
              <div><span>Username</span><span>@{p.username}</span></div>
              <div><span>Phone</span><span>{fmtPhone(p.phone)}</span></div>
              <div><span>Registered</span><span>{new Date(p.created_at).toLocaleDateString()}</span></div>
            </div>
          </section>
        </div>
        
        {banned ? (
          <button className="btn btn-ghost btn-block" onClick={() => banConfirm(p, false)}>
            <Icon name="check" size={18} />Unban player
          </button>
        ) : (
          <button className="btn btn-danger btn-block" onClick={() => banConfirm(p, true)}>
            <Icon name="ban" size={18} />Ban player
          </button>
        )}
      </div>
    </div>
  );
}

export function Players() {
  const { route } = useApp();
  return route.profile ? <Profile id={route.profile} /> : <PlayerSearch />;
}

function TaskForm({ onClose, onCreate }) {
  const [type, setType] = useState('Telegram');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [btn, setBtn] = useState('');
  const [reward, setReward] = useState('');
  const [target, setTarget] = useState('All Players');
  const [err, setErr] = useState({});
  const tp = TYPES.find((t) => t.v === type);
  
  const submit = () => {
    const e = {};
    if (!title.trim()) e.title = 'Add a title.';
    if (type === 'Telegram' && !/^(https?:\/\/)?(t\.me|telegram\.me)\/\S+/i.test(link.trim())) e.link = 'Enter a Telegram link, like https://t.me/yourchannel.';
    if (!(Number(reward) > 0)) e.reward = 'Enter a reward above 0.';
    setErr(e);
    if (Object.keys(e).length) return;
    
    onCreate({ 
      type, title: title.trim(), button_name: btn.trim() || tp.btn, 
      reward: Number(reward), target, telegram_link: link.trim()
    });
  };
  
  return (
    <Sheet title="New task" onClose={onClose}>
      <div className="form">
        <div className="field">
          <span className="lbl">Type</span>
          <Seg value={type} onChange={setType} options={TYPES.map((t) => ({ value: t.v, label: t.v }))} />
        </div>
        
        <div className="field">
          <label htmlFor="tf-title">Title</label>
          <input id="tf-title" className={cx('input', err.title && 'bad')} value={title} placeholder={tp.ph} onChange={(e) => setTitle(e.target.value)} />
          {err.title && <span className="err">{err.title}</span>}
        </div>
        
        {type === 'Telegram' && (
          <div className="field">
            <label htmlFor="tf-link">Telegram link</label>
            <input id="tf-link" className={cx('input', err.link && 'bad')} inputMode="url" value={link} placeholder="https://t.me/yourchannel" onChange={(e) => setLink(e.target.value)} />
            {err.link && <span className="err">{err.link}</span>}
          </div>
        )}
        
        <div className="two">
          <div className="field">
            <label htmlFor="tf-btn">Button name</label>
            <input id="tf-btn" className="input" value={btn} placeholder={tp.btn} onChange={(e) => setBtn(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="tf-rw">Reward</label>
            <div className="suffix-wrap">
              <input id="tf-rw" className={cx('input', err.reward && 'bad')} type="number" inputMode="numeric" min={1} value={reward} placeholder="50" onChange={(e) => setReward(e.target.value)} />
              <span className="suffix">ETB</span>
            </div>
            {err.reward && <span className="err">{err.reward}</span>}
          </div>
        </div>
        
        <div className="field">
          <span className="lbl">Target</span>
          <div className="tgt">
            {TARGETS.map((t) => (
              <button key={t} className={cx('chip', target === t && 'on')} onClick={() => setTarget(t)}>{t}</button>
            ))}
          </div>
        </div>
        
        <div className="actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create task</button>
        </div>
      </div>
    </Sheet>
  );
}

function TaskCard({ t }) {
  const { toggleTask, deleteTaskConfirm } = useApp();
  const tp = TYPES.find((x) => x.v === t.type) || TYPES[0];
  const isActive = t.status === 'active';
  
  return (
    <article className={cx('card task', !isActive && 'off')}>
      <div className="task-top">
        <div style={{ minWidth: 0 }}>
          <h3>{t.title}</h3>
          <div className="tags">
            <span className="mchip"><Icon name={tp.icon} size={13} />&nbsp;{t.type}</span>
            <span className="muted sm">{t.target}</span>
            {!isActive && <Badge s="disabled" />}
          </div>
        </div>
        <div className="reward">{fmt(t.reward)}<small>ETB reward</small></div>
      </div>
      
      <div className="claims" aria-label="Claims">
        {['Total', 'Today', '7 days'].map((l, i) => (
          <React.Fragment key={l}>
            {i > 0 && <i>/</i>}
            <div><b>{fmt(i === 0 ? (t.claim_count || 0) : 0)}</b><span>{l}</span></div>
          </React.Fragment>
        ))}
      </div>
      
      <div className="task-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => toggleTask(t.id, t.status)}>{t.status === 'active' ? 'Disable' : 'Enable'}</button>
        <button className="btn btn-danger btn-sm" aria-label="Delete task" onClick={() => deleteTaskConfirm(t)}>
          <Icon name="trash" size={17} />Delete
        </button>
      </div>
    </article>
  );
}

export function Tasks() {
  const { tasks, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const ready = useReady('tasks');
  
  return (
    <div>
      <PageHead title="Tasks">
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          <Icon name="plus" size={18} />New task
        </button>
      </PageHead>
      
      {!ready ? (
        <div className="grid-list"><Sk height={190} /><Sk height={190} /></div>
      ) : tasks.length ? (
        <div className="grid-list">
          {tasks.map((t) => <TaskCard key={t.id} t={t} />)}
        </div>
      ) : (
        <Empty icon="tasks" title="No tasks yet" text="Create a task to give players something to earn." />
      )}
      
      {open && <TaskForm onClose={() => setOpen(false)} onCreate={(t) => { addTask(t); setOpen(false); }} />}
    </div>
  );
}

export function Promo() {
  const { promos, addPromo, deletePromoConfirm } = useApp();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(''); 
  const [reward, setReward] = useState(''); 
  const [limit, setLimit] = useState('');
  const [err, setErr] = useState({});
  const ready = useReady('promo');
  
  const reset = () => { setCode(''); setReward(''); setLimit(''); setErr({}); };
  const submit = () => {
    const e = {}; const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,16}$/.test(c)) e.code = 'Use 3 to 16 letters or numbers.';
    else if (promos.some((p) => p.code === c)) e.code = 'That code already exists.';
    if (!(Number(reward) > 0)) e.reward = 'Enter a reward above 0.';
    if (!(parseInt(limit, 10) >= 1)) e.limit = 'Enter a limit of 1 or more.';
    
    setErr(e); 
    if (Object.keys(e).length) return;
    
    addPromo({ code: c, reward: Number(reward), usage_limit: parseInt(limit, 10) });
    reset(); 
    setOpen(false);
  };
  
  return (
    <div>
      <PageHead title="Promo">
        {open ? (
          <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); reset(); }}>
            <Icon name="x" size={18} />Close
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} />Create Promo
          </button>
        )}
      </PageHead>
      
      {open && (
        <section className="card formcard">
          <div className="form">
            <div className="field">
              <label htmlFor="pf-code">Promo code</label>
              <input id="pf-code" className={cx('input', err.code && 'bad')} style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase' }} value={code} placeholder="BINGOX50" maxLength={16} autoCapitalize="characters" onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))} />
              {err.code && <span className="err">{err.code}</span>}
            </div>
            
            <div className="two">
              <div className="field">
                <label htmlFor="pf-rw">Reward</label>
                <div className="suffix-wrap">
                  <input id="pf-rw" className={cx('input', err.reward && 'bad')} type="number" inputMode="numeric" min={1} value={reward} placeholder="50" onChange={(e) => setReward(e.target.value)} />
                  <span className="suffix">ETB</span>
                </div>
                {err.reward && <span className="err">{err.reward}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-lim">Usage limit</label>
                <input id="pf-lim" className={cx('input', err.limit && 'bad')} type="number" inputMode="numeric" min={1} value={limit} placeholder="1000" onChange={(e) => setLimit(e.target.value)} />
                {err.limit && <span className="err">{err.limit}</span>}
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={submit}>Create promo</button>
          </div>
        </section>
      )}
      
      {!ready ? (
        <Sk height={260} />
      ) : promos.length ? (
        <section className="card plist">
          <div className="phdr">
            <span>Code</span><span className="n">Reward</span><span className="n">Limit</span><span />
          </div>
          {promos.map((p) => (
            <div className="prow" key={p.id}>
              <span className="code">{p.code}</span>
              <span className="n">{fmt(p.reward)} ETB</span>
              <span className="n">{fmt(p.usage_limit)}</span>
              <button className="trash" aria-label={'Delete ' + p.code} onClick={() => deletePromoConfirm(p)}>
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))}
        </section>
      ) : (
        <Empty icon="tag" title="No promo codes" text="Press Create Promo to add your first code." />
      )}
    </div>
  );
}

export function Broadcast() {
  const { sendBroadcast } = useApp();
  const [msg, setMsg] = useState('');
  const MAX = 1000;
  
  return (
    <div>
      <PageHead title="Broadcast" sub="Send one message to every player." />
      <section className="card">
        <div className="field">
          <label htmlFor="bc">Message</label>
          <textarea id="bc" className="input" maxLength={MAX} placeholder="Write your message…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
        <div className="counter"><span>Plain text</span><span>{msg.length} / {MAX}</span></div>
        <button className="btn btn-primary btn-block" disabled={!msg.trim()} onClick={() => sendBroadcast(msg, () => setMsg(''))}>
          <Icon name="send" size={18} />Send to all players
        </button>
      </section>
    </div>
  );
}

function PasswordSheet({ onClose }) {
  const { changePassword } = useApp();
  const [cur, setCur] = useState(''); 
  const [nw, setNw] = useState(''); 
  const [cf, setCf] = useState(''); 
  const [err, setErr] = useState({});
  
  const submit = async () => {
    const e = {};
    if (!cur) e.cur = 'Current password is required.';
    if (nw.length < 8) e.nw = 'Use at least 8 characters.';
    if (cf !== nw) e.cf = 'Passwords don’t match.';
    setErr(e); 
    if (Object.keys(e).length) return;
    
    const success = await changePassword(cur, nw);
    if (success) onClose();
  };
  
  const f = (id, label, val, set, k) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="password" className={cx('input', err[k] && 'bad')} value={val} autoComplete="off" onChange={(e) => set(e.target.value)} />
      {err[k] && <span className="err">{err[k]}</span>}
    </div>
  );
  
  return (
    <Sheet title="Change password" onClose={onClose}>
      <div className="form">
        {f('pw-cur', 'Current password', cur, setCur, 'cur')}
        {f('pw-new', 'New password', nw, setNw, 'nw')}
        {f('pw-cf', 'Confirm new password', cf, setCf, 'cf')}
        <div className="actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Update password</button>
        </div>
      </div>
    </Sheet>
  );
}

export function Settings() {
  const { theme, setTheme, confirmLogout } = useApp();
  const [pw, setPw] = useState(false);
  
  return (
    <div>
      <PageHead title="Settings" />
      
      <div className="group">
        <div className="lbl">Account</div>
        <section className="card rows">
          <button className="srow" onClick={() => setPw(true)}>
            <span className="ico"><Icon name="lock" size={19} /></span>
            <span className="t">Change password<span>Update your admin login</span></span>
            <span className="go"><Icon name="chev" size={18} /></span>
          </button>
        </section>
      </div>
      
      <div className="group">
        <div className="lbl">Appearance</div>
        <section className="card pad">
          <Seg 
            value={theme} onChange={setTheme} 
            options={[
              { value: 'dark', label: 'Dark', icon: 'moon' }, 
              { value: 'light', label: 'Light', icon: 'sun' }
            ]} 
          />
        </section>
      </div>
      
      <div className="group">
        <div className="lbl">Session</div>
        <section className="card rows">
          <button className="srow danger" onClick={confirmLogout}>
            <span className="ico"><Icon name="logout" size={19} /></span>
            Log out
          </button>
        </section>
      </div>
      
      {pw && <PasswordSheet onClose={() => setPw(false)} />}
    </div>
  );
}
