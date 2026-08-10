import React, { useState, useEffect } from 'react';
import { Wallet, Gift, Copy, Share2, ShieldCheck, Check, Phone, User, Link as LinkIcon } from 'lucide-react';
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

    // Fetch correct referral link from the API
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
  // Use Telegram bot link (set by API), fallback to bot link built from refCode
  const telegramRefLink = refLink || `https://t.me/aflabingo_bot?start=${refCode}`;
  // Display a short version of the username (max 14 chars)
  const displayName = (p?.username || 'Player').length > 14
    ? (p?.username || 'Player').substring(0, 14) + '…'
    : (p?.username || 'Player');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(telegramRefLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AflaFit Bingo - Join & Win!',
        text: `Play Ethiopian Multiplayer Bingo using my referral code ${refCode}!`,
        url: telegramRefLink
      }).catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '16px auto', padding: '0 16px' }}>

      {/* ── USER ACCOUNT HEADER CARD (NO AVATAR PICTURE) ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ACCOUNT PROFILE
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: '4px 0 2px' }}>
              {p?.username || 'Player'}
            </h2>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} /> {p?.phone || 'N/A'}
            </div>
          </div>

          {p?.isAdmin && (
            <div
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                color: '#a78bfa',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShieldCheck size={16} /> Administrator
            </div>
          )}
        </div>
      </div>

      {/* ── WALLET & REFERRAL EARNINGS 2-CARD GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Wallet Balance */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1.5px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <Wallet size={15} color="#10b981" /> Wallet Balance
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', marginTop: '6px' }}>
            {(p?.balance || 0).toFixed(2)} <span style={{ fontSize: '12px' }}>ETB</span>
          </div>
        </div>

        {/* Referral Earnings */}
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1.5px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <Gift size={15} color="#a78bfa" /> Referral Rewards
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#a78bfa', marginTop: '6px' }}>
            {(p?.referralEarnings || 0).toFixed(2)} <span style={{ fontSize: '12px' }}>ETB</span>
          </div>
        </div>
      </div>

      {/* ── REFERRAL PROGRAM & SHARE LINK CARD ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          borderRadius: '20px',
          padding: '22px',
          border: '1.5px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <LinkIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#fff', margin: 0 }}>
              Your Referral Link
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Earn 10 ETB bonus for every friend who signs up & deposits!
            </p>
          </div>
        </div>

        {/* Code & Link display */}
        <div
          style={{
            background: 'rgba(3, 7, 18, 0.7)',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '14px',
            wordBreak: 'break-all'
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>
            REFERRAL CODE: <strong style={{ color: '#f59e0b', fontSize: '13px' }}>{refCode}</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '700' }}>
            {telegramRefLink}
          </div>
        </div>

        {/* Copy & Share Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={copyToClipboard}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: copied ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: '#fff',
              fontWeight: '900',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Link!' : 'Copy Link'}
          </button>

          <button
            onClick={shareLink}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: '900',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Share2 size={16} /> Share Link
          </button>
        </div>
      </div>

    </div>
  );
}
