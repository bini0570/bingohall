import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, Trophy } from 'lucide-react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';

export default function ReferralView({ lang, user, token }) {
  const t = translations[lang];
  const [data, setData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/referrals', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, [token]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const refCode = data?.referralCode || user?.referralCode || 'BEN1234';
  const refLink = data?.referralLink || `https://bingoplatform.com/register?ref=${refCode}`;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 16px' }}>
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
          marginBottom: '24px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 24px var(--accent-gold-glow)'
          }}
        >
          <Gift size={36} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', marginBottom: '6px' }}>
          {t.referralTitle}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '480px', margin: '0 auto' }}>
          {t.howStep2}
        </p>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '24px',
            textAlign: 'left'
          }}
        >
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.totalReferred}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#06b6d4', marginTop: '4px' }}>
              {data?.referralsCount || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.totalEarned}</div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
              {(data?.totalEarned || 0).toFixed(2)} ETB
            </div>
          </div>
        </div>
      </div>

      {/* Copy Code & Link */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
            {t.yourReferralCode}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="glass-input" value={refCode} readOnly style={{ fontWeight: '800', letterSpacing: '1px' }} />
            <button className="glass-button" onClick={() => copyToClipboard(refCode, 'code')}>
              {copiedCode ? <Check size={16} /> : <Copy size={16} />} {copiedCode ? 'Copied' : t.copyCode}
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
            {t.yourReferralLink}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="glass-input" value={refLink} readOnly />
            <button className="glass-button" onClick={() => copyToClipboard(refLink, 'link')}>
              {copiedLink ? <Check size={16} /> : <Copy size={16} />} {copiedLink ? 'Copied' : t.copyLink}
            </button>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
          Referred Friends History
        </h3>

        {data?.referrals?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.referrals.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{r.referee_name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Joined: {new Date(r.joined_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: r.status === 'qualified' ? '#10b981' : '#f59e0b'
                  }}
                >
                  {r.status === 'qualified' ? '+10 ETB Paid' : 'Pending 1st Deposit'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
            No referred friends yet. Share your code to earn 10 ETB per friend!
          </div>
        )}
      </div>
    </div>
  );
}
