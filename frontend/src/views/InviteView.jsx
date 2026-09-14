import React, { useState } from 'react';
import { Users, Copy, CheckCircle2, Share2 } from 'lucide-react';
import { translations } from '../i18n/i18n';

export default function InviteView({ lang, user }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = `https://t.me/bingox2019_bot?start=ref_${user?.id || '123'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Play Bingo X',
        text: 'Join me and play Bingo X to win real money!',
        url: inviteLink,
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div style={{ maxWidth: '1100px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '20px 16px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '20px', 
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))', 
          border: '1px solid var(--border-purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <Users size={32} color="#A78BFA" />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '900', color: '#fff' }}>Invite Friends</h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Get 10 ETB for every friend that joins and deposits!</p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Your Referral Link
        </div>
        
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          background: 'var(--bg-input)', padding: '12px', borderRadius: '12px',
          border: '1px solid var(--border-subtle)', marginBottom: '16px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <div style={{ flex: 1, fontSize: '14px', color: '#38BDF8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
            {inviteLink}
          </div>
          <button onClick={copyToClipboard} style={{ 
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            {copied ? <CheckCircle2 size={16} color="#10B981" /> : <Copy size={16} />}
          </button>
        </div>

        <button onClick={shareLink} style={{ 
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: '#fff',
          fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
        }}>
          <Share2 size={18} /> Share with Friends
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--green)', marginBottom: '4px' }}>0</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Friends Invited</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gold)', marginBottom: '4px' }}>0</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>ETB Earned</div>
        </div>
      </div>
    </div>
  );
}
