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
    <div style={{ padding: '20px 16px', paddingBottom: '100px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '20px', 
          background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.2))', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(139,92,246,0.15)'
        }}>
          <Users size={32} color="#a78bfa" />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '900', color: '#fff' }}>Invite Friends</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Get 10 ETB for every friend that joins and deposits!</p>
      </div>

      <div style={{ 
        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', 
        borderRadius: '20px', padding: '24px', marginBottom: '24px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#cbd5e1', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Your Referral Link
        </div>
        
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px'
        }}>
          <div style={{ flex: 1, fontSize: '14px', color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
            {inviteLink}
          </div>
          <button onClick={copyToClipboard} style={{ 
            background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer'
          }}>
            {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
          </button>
        </div>

        <button onClick={shareLink} style={{ 
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff',
          fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(139,92,246,0.3)'
        }}>
          <Share2 size={18} /> Share with Friends
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginBottom: '4px' }}>0</div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Friends Invited</div>
        </div>
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', marginBottom: '4px' }}>0</div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>ETB Earned</div>
        </div>
      </div>
    </div>
  );
}
