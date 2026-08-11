import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, Trophy, Share2 } from 'lucide-react';
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
  const refLink = data?.referralLink || `https://t.me/aflabingo_bot?start=${refCode}`;

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '10px 12px' }}>

      {/* ── STATS SUMMARY ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Users size={20} color="#06b6d4" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Invited Friends</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#06b6d4', lineHeight: 1.1 }}>
              {data?.referralsCount || 0}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Trophy size={20} color="#10b981" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Total Earned</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', lineHeight: 1.1 }}>
              {(data?.totalEarned || 0).toFixed(0)} <span style={{ fontSize: '10px', opacity: 0.8 }}>ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COPY CODE & LINK CARD ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '14px',
          padding: '12px 14px',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>YOUR REFERRAL CODE</span>
          <span style={{ fontSize: '14px', fontWeight: '900', color: '#f59e0b', letterSpacing: '0.5px' }}>{refCode}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => copyToClipboard(refCode, 'code')}
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: '10px',
              background: copiedCode ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${copiedCode ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
              color: copiedCode ? '#10b981' : '#fff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>

          <button
            onClick={() => copyToClipboard(refLink, 'link')}
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: '10px',
              background: copiedLink ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            {copiedLink ? 'Copied!' : 'Share Link'}
          </button>
        </div>
      </div>

      {/* ── REFERRALS HISTORY ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '14px',
          padding: '12px 14px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
          Referred Friends
        </div>

        {data?.referrals?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.referrals.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(5, 8, 15, 0.6)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{r.referee_name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {new Date(r.joined_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: r.status === 'qualified' ? '#10b981' : '#f59e0b'
                  }}
                >
                  {r.status === 'qualified' ? '+10 ETB' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '14px 0' }}>
            No referrals yet. Earn 10 ETB for each friend!
          </div>
        )}
      </div>

    </div>
  );
}

