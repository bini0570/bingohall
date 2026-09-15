import React, { useState } from 'react';
import { Users, Copy, CheckCircle2, Share2, Check } from 'lucide-react';
import { translations } from '../i18n/i18n';
import './WalletView.css';

export default function InviteView({ lang, user }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = `https://t.me/bingox2019_bot?start=ref_${user?.id || '123'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    const text = 'Join me and play Bingo X to win real money!';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="wallet-wrapper">
      <main className="wallet-card">
        <header className="wallet__header">
          <p className="greeting__label">Referrals</p>
          <p className="greeting__name">Invite Friends</p>
        </header>

        {/* Invite Card styled like TotalCard */}
        <section className="total-card" aria-label="Invite Link">
          <div className="total-card__top">
            <div>
              <p className="total-card__label" style={{ color: 'rgba(255,255,255,0.85)' }}>Your Invite Link</p>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '12px 14px',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'monospace',
                marginTop: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inviteLink}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={copyToClipboard}
              style={{
                flex: 1, padding: '12px', borderRadius: '14px', border: 'none',
                background: copied ? 'rgba(255,255,255,0.2)' : '#fff',
                color: copied ? '#fff' : 'var(--brand-1)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', boxShadow: copied ? 'none' : '0 8px 16px rgba(0,0,0,0.1)'
              }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button 
              onClick={shareLink}
              style={{
                flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent', color: '#fff',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}>
              <Share2 size={18} />
              Share
            </button>
          </div>
        </section>

        <section className="split" aria-label="Referral Stats" style={{ marginTop: '24px' }}>
          <article className="bal bal--locked">
            <div className="bal__head">
              <span className="bal__icon">
                <Users size={13} strokeWidth={2.5} />
              </span>
              <p className="bal__label">Invited Friends</p>
            </div>
            <p className="bal__amount">{user?.referrals?.length || 0}</p>
          </article>
        </section>

        <div className="section-head" style={{ marginTop: '28px' }}>
          <h2>Friends List</h2>
        </div>

        <div className="transactions-wrap" style={{ height: 'auto', paddingBottom: '20px' }}>
          <ul className="transactions">
            {(!user?.referrals || user.referrals.length === 0) ? (
              <li className="tx-empty" style={{ border: 'none' }}>No friends invited yet.</li>
            ) : (
              user.referrals.map((friend, idx) => (
                <li className="tx" key={idx} style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="tx__avatar" style={{ background: 'var(--brand-1)', color: '#fff' }}>
                    {friend?.username ? friend.username.charAt(0).toUpperCase() : '?'}
                  </span>
                  <div className="tx__body">
                    <p className="tx__name" style={{ fontSize: '15px' }}>{friend?.username || 'Unknown User'}</p>
                    <p className="tx__meta" style={{ marginTop: '4px' }}>Joined via your link</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
