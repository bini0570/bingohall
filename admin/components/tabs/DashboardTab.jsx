import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Activity, Users, ArrowUp } from 'lucide-react';
import { Card, CardHeader, Button, Badge, Table, Avatar } from '../ui';
import { RevenueChart } from '../charts/RevenueChart';

export function DashboardTab({ metrics, deposits, withdrawals, users, gameState, apiFetch, token, flash, refresh }) {
  const totDep = deposits.filter(d => d.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const totWit = withdrawals.filter(w => w.status === 'approved').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const net = totDep - totWit;
  const pendingDep = deposits.filter(d => d.status === 'pending').length;
  const pendingWit = withdrawals.filter(w => w.status === 'pending').length;

  // Player stats — prefer metrics API, fallback to users array
  const totalUsers    = metrics?.totalUsers    ?? users.length;
  const todayReg      = metrics?.todayRegistered ?? 0;
  const onlinePlayers = metrics?.onlinePlayers   ?? 0;

  return (
    <>
      <div className="kpi-grid">
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

        {/* Total Players card — with today's reg + online dot */}
        <Card className="kpi-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--cyan-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Players</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalUsers.toLocaleString()}</div>
            </div>
          </div>
          {/* Sub-row: today's registrations + online count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
            {/* Today's new registrations — up arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
              <ArrowUp size={12} strokeWidth={2.5} />
              <span>{todayReg} today</span>
            </div>
            {/* Online players — green dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              <span style={{
                display: 'inline-block',
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 6px #22c55e',
                flexShrink: 0,
              }} />
              <span>{onlinePlayers} online</span>
            </div>
          </div>
        </Card>
      </div>

      <RevenueChart deposits={deposits} withdrawals={withdrawals} />



      <Card>
        <CardHeader title="Recent Activities" subtitle="Latest platform transactions" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ...deposits.map(d => ({ ...d, type: 'deposit', time: new Date(d.created_at).getTime() })),
            ...withdrawals.map(w => ({ ...w, type: 'withdrawal', time: new Date(w.created_at).getTime() }))
          ]
          .sort((a, b) => b.time - a.time)
          .slice(0, 6)
          .map((item, i) => (
            <div key={`${item.type}-${item.id}`} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '12px 16px', borderBottom: i < 5 ? '1px solid var(--border-color)' : 'none',
              background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar label={(item.username||'?')[0].toUpperCase()} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{item.username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div style={{ fontWeight: 700, color: item.type === 'deposit' ? 'var(--success)' : 'var(--error)' }}>
                  {item.type === 'deposit' ? '+' : '-'}Br {parseFloat(item.amount).toFixed(0)}
                </div>
                <Badge status={item.status}>{item.status}</Badge>
              </div>
            </div>
          ))}
          {deposits.length === 0 && withdrawals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No recent activities</div>
          )}
        </div>
      </Card>
    </>
  );
}
