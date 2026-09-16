import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity, Zap, RefreshCw } from 'lucide-react';
import { Card, CardHeader, Button, Badge, Table, Avatar } from '../ui';
import { RevenueChart } from '../charts/RevenueChart';

export function DashboardTab({ metrics, deposits, withdrawals, users, gameState, apiFetch, token, flash, refresh }) {
  const totDep = deposits.filter(d => d.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const totWit = withdrawals.filter(w => w.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const net = totDep - totWit;
  const pendingDep = deposits.filter(d => d.status === 'pending').length;
  const pendingWit = withdrawals.filter(w => w.status === 'pending').length;
  const isLive = gameState?.status === 'DRAWING';

  const gameAction = async (endpoint, successMsg) => {
    try {
      const r = await apiFetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      r.ok ? flash('success', successMsg) : flash('error', d.error || d.message);
      refresh();
    } catch (e) { flash('error', e.message); }
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card className="kpi-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deposited</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Br {totDep.toFixed(0)}</div>
            </div>
          </div>
        </Card>
        
        <Card className="kpi-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--error-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
              <TrendingDown size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Withdrawn</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Br {totWit.toFixed(0)}</div>
            </div>
          </div>
        </Card>

        <Card className="kpi-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Wallet size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Revenue</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: net >= 0 ? 'var(--success)' : 'var(--error)' }}>Br {net.toFixed(0)}</div>
            </div>
          </div>
        </Card>

        <Card className="kpi-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{pendingDep + pendingWit}</div>
            </div>
          </div>
        </Card>
      </div>

      <RevenueChart deposits={deposits} withdrawals={withdrawals} />

      <Card>
        <CardHeader 
          title="Live Game Control" 
          subtitle={isLive ? `Drawing — ${gameState?.calledNumbers?.length||0}/75 balls` : `Countdown — ${gameState?.secondsLeft??'-'}s remaining`}
          action={<Badge status={isLive ? 'active' : 'pending'}>{isLive ? '● LIVE' : '● WAITING'}</Badge>}
        />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prize Pool</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>Br {(gameState?.prizePool||0).toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tickets Sold</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{gameState?.totalTickets||0}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>System Balance</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Br {parseFloat(metrics?.totalSystemBalance||0).toFixed(2)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => gameAction('/api/admin/game/force-start', 'Draw started!')}><Zap size={14} /> Force Start</Button>
            <Button variant="secondary" onClick={() => gameAction('/api/admin/game/restart-countdown', 'Timer reset!')}><RefreshCw size={14} /> Reset Timer</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card>
          <CardHeader title="Recent Deposits" action={<Badge status="info">{pendingDep} pending</Badge>} />
          <Table headers={['User', 'Amount', 'Status']}>
            {deposits.slice(0, 5).map(d => (
              <tr key={d.id}>
                <td data-label="User">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar label={(d.username||'?')[0].toUpperCase()} /> {d.username}
                  </div>
                </td>
                <td data-label="Amount" style={{ fontWeight: 600, color: 'var(--success)' }}>+Br {parseFloat(d.amount).toFixed(0)}</td>
                <td data-label="Status"><Badge status={d.status}>{d.status}</Badge></td>
              </tr>
            ))}
            {deposits.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No deposits yet</td></tr>}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Recent Withdrawals" action={<Badge status="pending">{pendingWit} pending</Badge>} />
          <Table headers={['User', 'Amount', 'Status']}>
            {withdrawals.slice(0, 5).map(w => (
              <tr key={w.id}>
                <td data-label="User">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar label={(w.username||'?')[0].toUpperCase()} /> {w.username}
                  </div>
                </td>
                <td data-label="Amount" style={{ fontWeight: 600, color: 'var(--error)' }}>-Br {parseFloat(w.amount).toFixed(0)}</td>
                <td data-label="Status"><Badge status={w.status}>{w.status}</Badge></td>
              </tr>
            ))}
            {withdrawals.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No withdrawals yet</td></tr>}
          </Table>
        </Card>
      </div>
    </>
  );
}
