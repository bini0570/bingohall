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
      
      {/* 1. Referral Link, Copy, Share */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{ 
          flex: 1, 
          background: 'var(--bg-input)', 
          padding: '12px 14px', 
          borderRadius: '8px', 
          border: '1px solid var(--border-subtle)', 
          color: '#38BDF8', 
          fontSize: '14px', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          fontFamily: 'monospace',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {inviteLink}
        </div>
        <button onClick={copyToClipboard} style={{ 
          padding: '12px 16px', 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '8px', 
          color: '#fff', 
          cursor: 'pointer',
          fontWeight: '800',
          fontSize: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <button onClick={shareLink} style={{ 
          padding: '12px 16px', 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '8px', 
          color: '#fff', 
          cursor: 'pointer',
          fontWeight: '800',
          fontSize: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}>
          SHARE
        </button>
      </div>

      {/* 2. Friends Invited Count */}
      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
        INVITED FRIENDS [{user?.referrals?.length || 0}]
      </div>

      {/* 3. Invited Friends List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(!user?.referrals || user.referrals.length === 0) ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '12px 0' }}>
            No friends invited yet.
          </div>
        ) : (
          user.referrals.map((friend, idx) => (
            <div key={idx} style={{ 
              background: 'var(--bg-card)', 
              padding: '14px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700'
            }}>
              {friend?.username || 'Unknown User'}
            </div>
          ))
        )}
      </div>
      
    </div>
  );
}
