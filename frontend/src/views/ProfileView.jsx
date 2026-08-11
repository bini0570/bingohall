import React, { useState, useEffect } from 'react';
import { Wallet, Gift, Copy, Share2, ShieldCheck, Check, Phone } from 'lucide-react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';

export default function ProfileView({ lang, user, token }) {
  const t = translations[lang];
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refLink, setRefLink] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => setProfile(d.user))
      .catch(e => console.error(e));

    apiFetch('/api/referrals', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        if (d.referralLink) setRefLink(d.referralLink);
      })
      .catch(() => {});
  }, [token]);

  const p = profile || user;
  const refCode = p?.referralCode || p?.referral_code || '';
  const telegramRefLink = refLink || `https://t.me/aflabingo_bot?start=${refCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(telegramRefLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'አፍላ BINGO - Join & Win!',
        text: `Play Ethiopian Multiplayer Bingo using my referral code ${refCode}!`,
        url: telegramRefLink
      }).catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 12px 10px' }}>

      {/* ── COMPACT USER PROFILE CARD ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          borderRadius: '14px',
          padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: '900',
              fontSize: '16px'
            }}
          >
            {(p?.username || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
              {p?.username || 'Player'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Phone size={11} color="#38bdf8" /> {p?.phone || 'N/A'}
            </div>
          </div>
        </div>

        {p?.isAdmin && (
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShieldCheck size={13} /> Admin
          </div>
        )}
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {/* Wallet Balance */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '10px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
            <Wallet size={12} color="#10b981" /> Balance
          </div>
          <div style={{ fontSize: '17px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
            {(p?.balance || 0).toFixed(2)} <span style={{ fontSize: '10px', opacity: 0.8 }}>ETB</span>
          </div>
        </div>

        {/* Referral Earnings */}
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            padding: '10px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
            <Gift size={12} color="#a78bfa" /> Rewards
          </div>
          <div style={{ fontSize: '17px', fontWeight: '900', color: '#a78bfa', marginTop: '2px' }}>
            {(p?.referralEarnings || 0).toFixed(2)} <span style={{ fontSize: '10px', opacity: 0.8 }}>ETB</span>
          </div>
        </div>
      </div>

      {/* ── REFERRAL CARD ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>REFERRAL CODE</span>
          <span style={{ fontSize: '14px', fontWeight: '900', color: '#f59e0b', letterSpacing: '0.5px' }}>{refCode}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyToClipboard}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${copied ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
              color: copied ? '#10b981' : '#fff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={shareLink}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

    </div>
  );
}
