const fs = require('fs');
const content = fs.readFileSync('Admin/AdminView.jsx', 'utf8');
const dashboardStart = content.indexOf('function DashboardTab(');
const paymentsStart = content.indexOf('function PaymentsTab(');

const before = content.substring(0, dashboardStart);
const after = content.substring(paymentsStart);

const dashboardTabContent = `function DashboardTab({ metrics, deposits, withdrawals, users, gameState, token, flash, refresh }) {
  const totDep = deposits.filter(d => d.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const totWit = withdrawals.filter(w => w.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const net = totDep - totWit;
  const pendingDep = deposits.filter(d => d.status === 'pending').length;
  const pendingWit = withdrawals.filter(w => w.status === 'pending').length;
  const isLive = gameState?.status === 'DRAWING';

  const gameAction = async (endpoint, successMsg) => {
    try {
      const r = await apiFetch(endpoint, { method: 'POST', headers: { Authorization: \`Bearer \${token}\` } });
      const d = await r.json();
      r.ok ? flash('success', successMsg) : flash('error', d.error || d.message);
      refresh();
    } catch (e) { flash('error', e.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-soft)' }}><TrendingUp size={20} color="var(--green)" /></div>
          <div className="kpi-label">Total Deposited</div>
          <div className="kpi-value">Br {totDep.toFixed(0)}</div>
          <div className="kpi-sub">{deposits.filter(d=>d.status==='approved').length} transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-soft)' }}><TrendingDown size={20} color="var(--red)" /></div>
          <div className="kpi-label">Total Withdrawn</div>
          <div className="kpi-value">Br {totWit.toFixed(0)}</div>
          <div className="kpi-sub">{withdrawals.filter(w=>w.status==='approved').length} transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--accent-soft)' }}><Wallet size={20} color="var(--accent)" /></div>
          <div className="kpi-label">Net Revenue</div>
          <div className="kpi-value" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>Br {net.toFixed(0)}</div>
          <div className="kpi-sub">Deposits minus withdrawals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--amber-soft)' }}><Activity size={20} color="var(--amber)" /></div>
          <div className="kpi-label">Pending Actions</div>
          <div className="kpi-value">{pendingDep + pendingWit}</div>
          <div className="kpi-sub">{pendingDep} deposits · {pendingWit} withdrawals</div>
        </div>
      </div>

      <SimpleChart deposits={deposits} withdrawals={withdrawals} />

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Game Control</div>
            <div className="card-subtitle">
              {isLive ? \`Drawing — \${gameState?.calledNumbers?.length||0}/75 balls\` : \`Countdown — \${gameState?.secondsLeft??'-'}s remaining\`}
            </div>
          </div>
          <span className={\`badge \${isLive ? 'badge-approved' : 'badge-pending'}\`}>{isLive ? '● LIVE' : '● WAITING'}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="stat-row"><span className="stat-row-label">Prize Pool</span><span className="stat-row-value" style={{ color: 'var(--green)' }}>Br {(gameState?.prizePool||0).toFixed(2)}</span></div>
            <div className="stat-row"><span className="stat-row-label">Tickets Sold</span><span className="stat-row-value">{gameState?.totalTickets||0}</span></div>
            <div className="stat-row"><span className="stat-row-label">System Balance</span><span className="stat-row-value">Br {parseFloat(metrics?.totalSystemBalance||0).toFixed(2)}</span></div>
          </div>
          <div className="game-actions">
            <button className="btn btn-primary" onClick={() => gameAction('/api/admin/game/force-start', 'Draw started!')}><Zap size={14} /> Force Start</button>
            <button className="btn btn-ghost" onClick={() => gameAction('/api/admin/game/restart-countdown', 'Timer reset!')}><RefreshCw size={14} /> Reset Timer</button>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Deposits</div><span className="badge badge-accent">{pendingDep} pending</span></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {deposits.slice(0,5).map(d => (
                  <tr key={d.id}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div className="avatar">{(d.username||'?')[0].toUpperCase()}</div>{d.username}</div></td>
                    <td style={{ fontWeight:600, color:'var(--green)' }}>+Br {parseFloat(d.amount).toFixed(0)}</td>
                    <td><span className={\`badge badge-\${d.status}\`}>{d.status}</span></td>
                  </tr>
                ))}
                {deposits.length===0 && <tr><td colSpan="3"><div className="empty-state"><div className="empty-state-text">No deposits yet</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Withdrawals</div><span className="badge badge-pending">{pendingWit} pending</span></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {withdrawals.slice(0,5).map(w => (
                  <tr key={w.id}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div className="avatar">{(w.username||'?')[0].toUpperCase()}</div>{w.username}</div></td>
                    <td style={{ fontWeight:600, color:'var(--red)' }}>-Br {parseFloat(w.amount).toFixed(0)}</td>
                    <td><span className={\`badge badge-\${w.status}\`}>{w.status}</span></td>
                  </tr>
                ))}
                {withdrawals.length===0 && <tr><td colSpan="3"><div className="empty-state"><div className="empty-state-text">No withdrawals yet</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

`;
fs.writeFileSync('Admin/AdminView.jsx', before + dashboardTabContent + after);
console.log('Patched');
