import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, Badge, Button, Avatar } from '../ui';

export function PaymentsTab({ deposits, withdrawals, token, onRefresh, flash, apiFetch }) {
  const [subTab, setSubTab] = useState('deposits');
  
  const activeData = subTab === 'deposits' ? deposits : withdrawals;
  // Focus exclusively on pending requests for processing, or show recent if none
  let pendingOnly = activeData.filter(d => d.status === 'pending');
  let displayData = pendingOnly.length > 0 ? pendingOnly : activeData.slice(0, 15);

  const handleAction = async (id, action) => {
    try {
      const res = await apiFetch(`/api/admin/${subTab}/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { onRefresh(); flash('success', 'Action completed.'); }
      else flash('error', (await res.json()).error);
    } catch(e) { flash('error', e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Toggle Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => setSubTab('deposits')} 
          style={{ 
            flex: 1, padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            borderRadius: '8px', border: '1px solid', transition: 'all 0.2s',
            background: subTab === 'deposits' ? 'var(--primary-soft)' : 'var(--surface-light)',
            borderColor: subTab === 'deposits' ? 'var(--primary)' : 'var(--border-color)',
            color: subTab === 'deposits' ? 'var(--primary)' : 'var(--text-secondary)'
          }}>
          Deposits
        </button>
        <button 
          onClick={() => setSubTab('withdrawals')} 
          style={{ 
            flex: 1, padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            borderRadius: '8px', border: '1px solid', transition: 'all 0.2s',
            background: subTab === 'withdrawals' ? 'var(--primary-soft)' : 'var(--surface-light)',
            borderColor: subTab === 'withdrawals' ? 'var(--primary)' : 'var(--border-color)',
            color: subTab === 'withdrawals' ? 'var(--primary)' : 'var(--text-secondary)'
          }}>
          Withdrawals
        </button>
      </div>

      <Card>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            {subTab === 'deposits' ? 'Deposit Requests' : 'Withdrawal Requests'}
          </h3>
          <Badge status="info">{pendingOnly.length} pending</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {displayData.map((item, index) => (
            <div key={item.id} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
              padding: '16px 20px', borderBottom: index < displayData.length - 1 ? '1px solid var(--border-color)' : 'none'
            }}>
              
              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px' }}>
                <Avatar label={(item.username || '?')[0].toUpperCase()} /> 
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{item.username}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.phone || 'No phone'}</span>
                </div>
              </div>

              {/* Request Details (Compact) */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: subTab === 'deposits' ? 'var(--success)' : 'var(--text-primary)' }}>
                  {subTab === 'deposits' ? '+' : '-'}Br {parseFloat(item.amount).toFixed(2)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {subTab === 'withdrawals' ? (item.account_number || 'No Account') : (item.receipt_sms || 'No Receipt')} • {item.method || 'Unknown'}
                </span>
              </div>

              {/* Status or Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px', justifyContent: 'flex-end' }}>
                {item.status === 'pending' ? (
                  <>
                    <Button variant="danger" onClick={() => handleAction(item.id, 'reject')} style={{ padding: '6px 12px' }}>Reject</Button>
                    <Button variant="success" onClick={() => handleAction(item.id, 'approve')} style={{ padding: '6px 12px' }}>Approve</Button>
                  </>
                ) : (
                  <Badge status={item.status}>{item.status}</Badge>
                )}
              </div>

            </div>
          ))}

          {displayData.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No {subTab} records found.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}