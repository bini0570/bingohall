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
      
      {/* 1. Referral Link Section at the top */}
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

      {/* 2. Friends Invited Stat */}
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--green)', marginBottom: '4px' }}>
          {user?.referrals?.length || 0}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>
          Friends Invited
        </div>
      </div>

      {/* 3. Invited Friends List */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '16px', marginTop: 0 }}>
          Invited Friends
        </h3>
        
        {(!user?.referrals || user.referrals.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
            <Users size={32} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>You haven't invited anyone yet.</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Share your link above to start earning!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user.referrals.map((friend, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: '800' }}>
                    {friend?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>{friend?.username || 'Unknown User'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Joined recently</div>
                  </div>
                </div>
                <CheckCircle2 size={18} color="#10B981" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
