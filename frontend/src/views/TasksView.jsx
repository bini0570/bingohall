import React from 'react';
import { ClipboardList, CheckCircle2, Gift } from 'lucide-react';
import { translations } from '../i18n/i18n';

export default function TasksView({ lang }) {
  const t = translations[lang] || {};

  return (
    <div style={{ padding: '20px 16px', paddingBottom: '100px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '20px', 
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(29,78,216,0.2))', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(59,130,246,0.15)'
        }}>
          <ClipboardList size={32} color="#60a5fa" />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '900', color: '#fff' }}>Daily Tasks</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Complete tasks to earn free ETB rewards!</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <TaskCard icon={<CheckCircle2 />} title="Join Telegram Channel" reward="5 ETB" status="pending" />
        <TaskCard icon={<Gift />} title="Play 5 Bingo Games" reward="10 ETB" status="in_progress" progress="2/5" />
        <TaskCard icon={<ClipboardList />} title="Deposit First Time" reward="20 ETB" status="completed" />
      </div>
    </div>
  );
}

function TaskCard({ icon, title, reward, status, progress }) {
  const isCompleted = status === 'completed';
  return (
    <div style={{ 
      background: 'rgba(15,23,42,0.6)', borderRadius: '16px', padding: '16px',
      border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px'
    }}>
      <div style={{ 
        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
        background: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
        color: isCompleted ? '#10b981' : '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '800', color: isCompleted ? '#94a3b8' : '#fff' }}>
          {title}
        </h4>
        <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: '700' }}>+{reward}</div>
      </div>
      <div>
        {isCompleted ? (
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
            Done
          </span>
        ) : (
          <button style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer'
          }}>
            {status === 'in_progress' ? progress : 'Go'}
          </button>
        )}
      </div>
    </div>
  );
}
