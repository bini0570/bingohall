import React from 'react';
import { ClipboardList, CheckCircle2, Gift } from 'lucide-react';
import { translations } from '../i18n/i18n';

export default function TasksView({ lang }) {
  return (
    <div style={{ maxWidth: '1100px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '20px 16px 20px' }}>
      {/* Daily Claim Streak Section */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '900', color: '#fff' }}>Daily Check-In</h3>
        
        <div style={{ 
          display: 'flex', gap: '4px', width: '100%', justifyContent: 'space-between'
        }}>
          {[1, 2, 3, 4, 5, 6, 7].map(day => {
            const isToday = day === 1; // Just for visual preview
            const reward = day === 7 ? 10 : day; // Increments 1 to 6, then 10 for mystery
            const isMystery = day === 7;

            return (
              <div key={day} style={{ 
                flex: 1,
                minWidth: 0,
                padding: '8px 2px',
                borderRadius: '8px',
                background: isToday ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--bg-input)',
                border: isToday ? 'none' : '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                boxShadow: isToday ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <div style={{ fontSize: '9px', fontWeight: '800', color: isToday ? '#fff' : 'var(--text-muted)' }}>DAY{day}</div>
                {isMystery ? (
                  <Gift size={16} color={isToday ? '#fff' : '#F59E0B'} />
                ) : (
                  <div style={{ fontSize: '13px', fontWeight: '900', color: isToday ? '#fff' : 'var(--gold)' }}>+{reward}</div>
                )}
                <div style={{ fontSize: '8px', fontWeight: '700', color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>
                  {isMystery ? 'BOX' : 'ETB'}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => alert('1 ETB has been added to your wallet!')}
          style={{ 
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: '#fff',
            fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '16px',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
          }}>
          Claim
        </button>
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
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ 
        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
        background: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
        border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
        color: isCompleted ? '#10b981' : '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '800', color: isCompleted ? 'var(--text-muted)' : '#fff' }}>
          {title}
        </h4>
        <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '700' }}>+{reward}</div>
      </div>
      <div>
        {isCompleted ? (
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
            Done
          </span>
        ) : (
          <button style={{ 
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
            transition: 'all 0.2s'
          }}>
            {status === 'in_progress' ? progress : 'Go'}
          </button>
        )}
      </div>
    </div>
  );
}
