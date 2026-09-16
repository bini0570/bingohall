import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from '../ui';

export function RevenueChart({ deposits, withdrawals }) {
  // Process the last 7 days of data
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const data = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d,
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      deposits: 0,
      withdrawals: 0
    };
  });

  deposits.filter(d => d.status === 'approved').forEach(d => {
    const t = new Date(d.created_at);
    const day = data.find(x => x.date.getDate() === t.getDate() && x.date.getMonth() === t.getMonth());
    if (day) day.deposits += parseFloat(d.amount) || 0;
  });

  withdrawals.filter(w => w.status === 'approved').forEach(w => {
    const t = new Date(w.created_at);
    const day = data.find(x => x.date.getDate() === t.getDate() && x.date.getMonth() === t.getMonth());
    if (day) day.withdrawals += parseFloat(w.amount) || 0;
  });

  return (
    <Card>
      <CardHeader 
        title="Weekly Revenue Flow" 
        subtitle="Deposits (Inflow) vs Withdrawals (Outflow)"
        action={
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} /> Deposits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }} /> Withdrawals
            </div>
          </div>
        }
      />
      <div style={{ width: '100%', height: 250, marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Br ${val}`} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 600 }}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="deposits" name="Deposits" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorDep)" />
            <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="var(--error)" strokeWidth={2} fillOpacity={1} fill="url(#colorWit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
