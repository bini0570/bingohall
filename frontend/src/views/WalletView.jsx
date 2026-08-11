import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Copy, ChevronRight, ChevronLeft, Phone, CreditCard, AlertCircle } from 'lucide-react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';

// =============================================
// ADMIN PAYMENT ACCOUNTS
// =============================================
const PAYMENT_ACCOUNTS = {
  Telebirr: {
    name: 'Biniyam Eyoel',
    number: '0993994168',
    logo: '/images/telebirr.jpg',
    label: 'Telebirr',
    color: '#f59e0b'
  },
  CBE: {
    name: 'Biniyam Eyoel',
    number: '1000483719853',
    logo: '/images/cbe.jpg',
    label: 'CBE',
    color: '#3b82f6'
  },
  CBEBirr: {
    name: 'Biniyam Eyoel',
    number: '0993994168',
    logo: '/images/cbe_birr.jpg',
    label: 'CBE Birr',
    color: '#10b981'
  }
};

export default function WalletView({ lang, user, token, socket, onBalanceUpdated }) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState('deposit');

  // DEPOSIT: step 1=choose method, 2=enter amount, 3=show bank info & receipt, 4=success
  const [depStep, setDepStep] = useState(1);
  const [depMethod, setDepMethod] = useState('');
  const [depAmount, setDepAmount] = useState('');
  const [receiptSms, setReceiptSms] = useState('');
  const [proofFile, setProofFile] = useState(null);

  // WITHDRAW: step 1=enter amount, 2=choose method, 3=fill account info, 4=success
  const [withStep, setWithStep] = useState(1);
  const [withMethod, setWithMethod] = useState('');
  const [withAccount, setWithAccount] = useState('');
  const [withAccountName, setWithAccountName] = useState('');
  const [withAmount, setWithAmount] = useState('');

  const [transactions, setTransactions] = useState({ deposits: [], withdrawals: [] });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });
  const [copied, setCopied] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await apiFetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data);
    } catch (e) {}
  };

  useEffect(() => {
    if (token) fetchTransactions();
    if (socket) {
      // Re-fetch when any admin action happens
      const handleDataChanged = () => fetchTransactions();
      // Instantly update this user's transactions when admin approve/rejects their request
      const handleUserTxUpdated = (data) => {
        if (!data.userId || String(data.userId) === String(user?.id)) {
          fetchTransactions();
        }
      };
      // Instantly update balance when admin approves
      const handleBalanceUpdated = data => {
        if (String(data.userId) === String(user?.id) && onBalanceUpdated) {
          onBalanceUpdated(data.newBalance);
        }
        fetchTransactions(); // also refresh transactions to show new status
      };
      socket.on('admin_data_changed', handleDataChanged);
      socket.on('user_transaction_updated', handleUserTxUpdated);
      socket.on('balance_updated', handleBalanceUpdated);
      return () => {
        socket.off('admin_data_changed', handleDataChanged);
        socket.off('user_transaction_updated', handleUserTxUpdated);
        socket.off('balance_updated', handleBalanceUpdated);
      };
    }
  }, [token, socket, user]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // ---------- DEPOSIT ----------
  const handleDepositSubmit = async () => {
    if (!receiptSms.trim()) {
      setMsg({ error: 'Please enter your transaction SMS or confirmation text', success: '' });
      return;
    }
    setLoading(true);
    setMsg({ error: '', success: '' });
    try {
      const formData = new FormData();
      formData.append('method', depMethod);
      formData.append('amount', depAmount);
      formData.append('receiptSms', receiptSms);
      if (proofFile) formData.append('proofImage', proofFile);

      const res = await apiFetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deposit failed');
      setDepStep(4);
      fetchTransactions();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  const resetDeposit = () => {
    setDepStep(1); setDepMethod(''); setDepAmount(''); setReceiptSms(''); setProofFile(null);
    setMsg({ error: '', success: '' });
  };

  // ---------- WITHDRAW ----------
  const handleWithdrawSubmit = async () => {
    if (!withAccount.trim()) {
      setMsg({ error: 'Please enter your account number', success: '' });
      return;
    }
    setLoading(true);
    setMsg({ error: '', success: '' });
    try {
      const res = await apiFetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: withMethod,
          accountNumber: withAccount,
          accountName: withAccountName,
          amount: withAmount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
      setWithStep(4);
      fetchTransactions();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  const resetWithdraw = () => {
    setWithStep(1); setWithMethod(''); setWithAccount(''); setWithAccountName(''); setWithAmount('');
    setMsg({ error: '', success: '' });
  };

  const balance = user?.balance || 0;
  const withdrawableBal = user?.withdrawableBalance ?? user?.withdrawable_balance ?? 0;
  const panelStyle = { background: 'rgba(13,20,38,0.8)', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.07)' };
  const btnPrimary = { width: '100%', padding: '13px', borderRadius: '13px', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer', marginTop: '8px', minHeight: '48px' };
  const btnGhost = { padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#94a3b8', fontWeight: '700', cursor: 'pointer', fontSize: '13px' };
  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(5,8,15,0.7)', color: '#fff', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', marginTop: '6px', outline: 'none' };

  const renderStatusBadge = status => {
    const map = {
      pending: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b', icon: <Clock size={12} />, label: 'Pending' },
      approved: { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', icon: <CheckCircle2 size={12} />, label: 'Completed' },
      rejected: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444', icon: <AlertCircle size={12} />, label: 'Rejected' }
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 12px 10px' }}>

      {/* No token guard */}
      {!token && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
          <div style={{ fontWeight: '800', color: '#fca5a5', fontSize: '15px', marginBottom: '6px' }}>Session Not Ready</div>
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>Your session is still loading. Please wait a moment and try again, or refresh the page.</div>
        </div>
      )}

      {/* ── 3-WAY CLEAN BALANCE BREAKDOWN ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>

        {/* 1. TOTAL BALANCE */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,35,75,0.95) 0%, rgba(5,8,15,0.98) 100%)',
          borderRadius: '12px', padding: '10px 8px',
          border: '1px solid rgba(59,130,246,0.25)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '8.5px', color: '#38bdf8', marginBottom: '2px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            💰 TOTAL
          </div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#fff', lineHeight: 1.1 }}>
            {(user?.balance || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '8.5px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>ETB</div>
        </div>

        {/* 2. WITHDRAWABLE (Winnings) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(5,8,15,0.98) 100%)',
          borderRadius: '12px', padding: '10px 8px',
          border: '1px solid rgba(16,185,129,0.35)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '8.5px', color: '#10b981', marginBottom: '2px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            🏆 WITHDRAWABLE
          </div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#10b981', lineHeight: 1.1 }}>
            {(user?.withdrawableBalance ?? user?.withdrawable_balance ?? 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '8.5px', color: '#10b981', opacity: 0.8, fontWeight: '700', marginTop: '2px' }}>ETB Winnings</div>
        </div>

        {/* 3. BONUS (Rewards) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(5,8,15,0.98) 100%)',
          borderRadius: '12px', padding: '10px 8px',
          border: '1px solid rgba(245,158,11,0.3)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '8.5px', color: '#f59e0b', marginBottom: '2px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            🎁 BONUS
          </div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#f59e0b', lineHeight: 1.1 }}>
            {(user?.bonusBalance ?? user?.referralEarnings ?? 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '8.5px', color: '#f59e0b', opacity: 0.8, fontWeight: '700', marginTop: '2px' }}>ETB Rewards</div>
        </div>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(8,14,28,0.8)', borderRadius: '10px', padding: '3px', marginBottom: '10px', gap: '3px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[['deposit','📥 Deposit'],['withdraw','📤 Withdraw'],['history','📋 History']].map(([key, label]) => (
          <button key={key} onClick={() => { setActiveTab(key); resetDeposit(); resetWithdraw(); setMsg({ error: '', success: '' }); }}
            style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none', background: activeTab === key ? 'rgba(255,255,255,0.10)' : 'transparent', color: activeTab === key ? '#f1f5f9' : '#475569', fontWeight: activeTab === key ? '800' : '600', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {msg.error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {msg.error}
        </div>
      )}

      {/* ==================== DEPOSIT ==================== */}
      {activeTab === 'deposit' && (
        <>
          {/* Progress indicator */}
          {depStep < 4 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px',
                    background: depStep >= s ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.07)',
                    color: depStep >= s ? '#000' : '#64748b' }}>{s}</div>
                  {s < 3 && <div style={{ flex: 1, height: '2px', background: depStep > s ? '#f59e0b' : 'rgba(255,255,255,0.07)', borderRadius: '2px' }} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* STEP 1: Choose Payment Method */}
          {depStep === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '12px', fontWeight: '800', color: '#fff', fontSize: '14px' }}>Select Deposit Method</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {Object.entries(PAYMENT_ACCOUNTS).map(([key, acc]) => (
                  <button key={key} onClick={() => { setDepMethod(key); setDepStep(2); }}
                    style={{ padding: '10px 4px', borderRadius: '14px', border: `1.5px solid ${acc.color}40`, background: `${acc.color}12`, color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                    <div style={{ background: '#fff', padding: '4px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', width: '100%', boxSizing: 'border-box' }}>
                      <img src={acc.logo} alt={acc.label} style={{ maxHeight: '32px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '11px', color: acc.color }}>{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Enter Amount */}
          {depStep === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <button onClick={() => setDepStep(1)} style={btnGhost}><ChevronLeft size={16} /></button>
                <h3 style={{ fontWeight: '800', color: '#fff', margin: 0 }}>Enter Deposit Amount</h3>
              </div>
              <div style={{ ...panelStyle, textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Selected: <img src={PAYMENT_ACCOUNTS[depMethod]?.logo} alt="" style={{ height: '20px', borderRadius: '4px', background: '#fff', padding: '2px' }} /> <strong style={{ color: PAYMENT_ACCOUNTS[depMethod]?.color }}>{depMethod}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Amount (ETB)</div>
                <input type="number" style={{ ...inputStyle, fontSize: '24px', textAlign: 'center', fontWeight: '900' }} placeholder="Enter Amount" value={depAmount} onChange={e => setDepAmount(e.target.value)} min="10" />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {['200','500','1000'].map(a => (
                    <button key={a} onClick={() => setDepAmount(a)}
                      style={{ flex: '1 1 auto', padding: '8px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', background: depAmount === a ? 'rgba(245,158,11,0.2)' : 'transparent', color: '#f59e0b', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                      {a} ETB
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { if (!depAmount || parseFloat(depAmount) < 10) { setMsg({ error: 'Minimum deposit is 10 ETB', success: '' }); return; } setMsg({ error:'', success:'' }); setDepStep(3); }}
                style={{ ...btnPrimary, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 3: Show Bank Info + Receipt */}
          {depStep === 3 && (() => {
            const acc = PAYMENT_ACCOUNTS[depMethod];
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <button onClick={() => setDepStep(2)} style={btnGhost}><ChevronLeft size={16} /></button>
                  <h3 style={{ fontWeight: '800', color: '#fff', margin: 0 }}>Send Payment & Confirm</h3>
                </div>

                {/* Amount summary */}
                <div style={{ background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>You are depositing</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b' }}>{parseFloat(depAmount).toFixed(2)} ETB</div>
                </div>

                {/* Bank details to send TO */}
                <div style={{ ...panelStyle, border: `1.5px solid ${acc.color}40` }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={acc.logo} alt="" style={{ height: '22px', borderRadius: '4px', background: '#fff', padding: '2px' }} /> Send to this {acc.label} Account:
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ACCOUNT NAME</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '900', fontSize: '16px', color: '#fff' }}>{acc.name}</span>
                      <button onClick={() => copyToClipboard(acc.name, 'name')} style={{ ...btnGhost, padding: '6px 10px', fontSize: '11px' }}>
                        {copied === 'name' ? '✅ Copied' : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ACCOUNT NUMBER</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '900', fontSize: '20px', color: acc.color, letterSpacing: '1px' }}>{acc.number}</span>
                      <button onClick={() => copyToClipboard(acc.number, 'num')} style={{ ...btnGhost, padding: '6px 10px', fontSize: '11px' }}>
                        {copied === 'num' ? '✅ Copied' : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Receipt SMS input */}
                <div style={panelStyle}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700' }}>
                    📋 After sending, paste your SMS confirmation or transaction code:
                  </div>
                  <textarea
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="e.g. Telebirr transaction 9AB4857 confirmed for 200 ETB..."
                    value={receiptSms}
                    onChange={e => setReceiptSms(e.target.value)}
                  />
                </div>

                <button onClick={handleDepositSubmit} disabled={loading || !token}
                  style={{ ...btnPrimary, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', opacity: (!token || loading) ? 0.6 : 1 }}>
                  {loading ? '⏳ Submitting...' : !token ? '🔒 Session Loading...' : '✅ Submit Payment & Wait for Approval'}
                </button>
              </div>
            );
          })()}

          {/* STEP 4: Success */}
          {depStep === 4 && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontWeight: '900', fontSize: '20px', color: '#10b981', marginBottom: '8px' }}>Payment Submitted!</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                Your deposit of <strong style={{ color: '#f59e0b' }}>{parseFloat(depAmount).toFixed(2)} ETB</strong> via <strong>{depMethod}</strong> has been submitted.<br /><br />
                Admin will verify and credit your wallet shortly. ⚡
              </p>
              <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '14px', padding: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="#f59e0b" />
                <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '700' }}>Waiting for Admin Approval...</span>
              </div>
              <button onClick={resetDeposit} style={{ ...btnPrimary, background: 'rgba(255,255,255,0.08)', color: '#fff', maxWidth: '200px', margin: '0 auto' }}>Make Another Deposit</button>
            </div>
          )}
        </>
      )}

      {/* ==================== WITHDRAW ==================== */}
      {activeTab === 'withdraw' && (
        <>
          {withStep < 4 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[1,2,3].map(s => (
                <React.Fragment key={s}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px',
                    background: withStep >= s ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.07)',
                    color: withStep >= s ? '#fff' : '#64748b' }}>{s}</div>
                  {s < 3 && <div style={{ flex: 1, height: '2px', background: withStep > s ? '#6366f1' : 'rgba(255,255,255,0.07)', borderRadius: '2px' }} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* STEP 1: Enter Amount */}
          {withStep === 1 && (
            <div>
              <h3 style={{ textAlign: 'center', marginBottom: '18px', fontWeight: '800', color: '#fff' }}>Enter Withdrawal Amount</h3>
              <div style={{ ...panelStyle, textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Available Withdrawable Winnings</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', marginBottom: '16px' }}>{withdrawableBal.toFixed(2)} ETB</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Amount to Withdraw (ETB)</div>
                <input type="number" style={{ ...inputStyle, fontSize: '28px', textAlign: 'center', fontWeight: '900' }}
                  placeholder="100" value={withAmount} onChange={e => setWithAmount(e.target.value)} min="10" max={withdrawableBal} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {['50','100','200','500'].map(a => (
                    <button key={a} onClick={() => setWithAmount(a)}
                      style={{ flex: '1 1 auto', padding: '8px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: withAmount === a ? 'rgba(99,102,241,0.2)' : 'transparent', color: '#818cf8', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                      {a} ETB
                    </button>
                  ))}
                  <button onClick={() => setWithAmount(String(Math.floor(withdrawableBal)))}
                    style={{ flex: '1 1 auto', padding: '8px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: 'transparent', color: '#818cf8', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                    All
                  </button>
                </div>
              </div>
              <button onClick={() => {
                if (!withAmount || parseFloat(withAmount) < 10) { setMsg({ error: 'Minimum withdrawal is 10 ETB', success: '' }); return; }
                if (parseFloat(withAmount) > withdrawableBal) { setMsg({ error: `Insufficient withdrawable balance. Your withdrawable balance is ${withdrawableBal.toFixed(2)} ETB.`, success: '' }); return; }
                setMsg({ error:'', success:'' }); setWithStep(2);
              }} style={{ ...btnPrimary, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff' }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2: Choose Payment Method */}
          {withStep === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <button onClick={() => setWithStep(1)} style={btnGhost}><ChevronLeft size={16} /></button>
                <h3 style={{ fontWeight: '800', color: '#fff', margin: 0 }}>Choose Withdrawal Method</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {Object.entries(PAYMENT_ACCOUNTS).map(([key, acc]) => (
                  <button key={key} onClick={() => { setWithMethod(key); setWithStep(3); }}
                    style={{ padding: '10px 4px', borderRadius: '14px', border: `1.5px solid ${acc.color}40`, background: `${acc.color}12`, color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                    <div style={{ background: '#fff', padding: '4px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', width: '100%', boxSizing: 'border-box' }}>
                      <img src={acc.logo} alt={acc.label} style={{ maxHeight: '32px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '11px', color: acc.color }}>{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Fill Account Info */}
          {withStep === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <button onClick={() => setWithStep(2)} style={btnGhost}><ChevronLeft size={16} /></button>
                <h3 style={{ fontWeight: '800', color: '#fff', margin: 0 }}>Your {withMethod} Account</h3>
              </div>

              <div style={{ background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Withdrawing</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#818cf8' }}>{parseFloat(withAmount).toFixed(2)} ETB</div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                  via <img src={PAYMENT_ACCOUNTS[withMethod]?.logo} alt="" style={{ height: '18px', borderRadius: '4px', background: '#fff', padding: '2px' }} /> {withMethod}
                </div>
              </div>

              <div style={panelStyle}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: '700' }}>
                  Your {withMethod} Account Number / Phone
                </div>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder={withMethod === 'Telebirr' ? 'e.g. 0911223344' : 'e.g. 1000123456789'}
                  value={withAccount}
                  onChange={e => setWithAccount(e.target.value)}
                />
              </div>

              <button onClick={handleWithdrawSubmit} disabled={loading || !token}
                style={{ ...btnPrimary, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', opacity: (!token || loading) ? 0.6 : 1 }}>
                {loading ? '⏳ Submitting...' : !token ? '🔒 Session Loading...' : '✅ Submit Withdrawal Request'}
              </button>
            </div>
          )}

          {/* STEP 4: Success */}
          {withStep === 4 && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontWeight: '900', fontSize: '20px', color: '#10b981', marginBottom: '8px' }}>Withdrawal Submitted!</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                Your withdrawal of <strong style={{ color: '#818cf8' }}>{parseFloat(withAmount).toFixed(2)} ETB</strong> via <strong>{withMethod}</strong> to account <strong>{withAccount}</strong> has been submitted.<br /><br />
                Admin will process and transfer funds to your account shortly. ⚡
              </p>
              <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '14px', padding: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="#818cf8" />
                <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '700' }}>Waiting for Admin Approval...</span>
              </div>
              <button onClick={resetWithdraw} style={{ ...btnPrimary, background: 'rgba(255,255,255,0.08)', color: '#fff', maxWidth: '220px', margin: '0 auto' }}>Make Another Withdrawal</button>
            </div>
          )}
        </>
      )}

      {/* ==================== HISTORY ==================== */}
      {activeTab === 'history' && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase' }}>Deposits</div>
          {(transactions.deposits || []).length === 0
            ? <div style={{ color: '#64748b', textAlign: 'center', padding: '14px', fontSize: '12px' }}>No deposits yet</div>
            : (transactions.deposits || []).slice().reverse().map(d => (
              <div key={d.id} style={{ background: 'rgba(13,20,38,0.8)', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#10b981', fontSize: '13px' }}>+{parseFloat(d.amount).toFixed(2)} ETB</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{d.method} · {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                {renderStatusBadge(d.status)}
              </div>
            ))
          }

          <div style={{ fontSize: '11px', fontWeight: '800', margin: '14px 0 8px', color: '#94a3b8', textTransform: 'uppercase' }}>Withdrawals</div>
          {(transactions.withdrawals || []).length === 0
            ? <div style={{ color: '#64748b', textAlign: 'center', padding: '14px', fontSize: '12px' }}>No withdrawals yet</div>
            : (transactions.withdrawals || []).slice().reverse().map(w => (
              <div key={w.id} style={{ background: 'rgba(13,20,38,0.8)', borderRadius: '10px', padding: '8px 12px', marginBottom: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '13px' }}>-{parseFloat(w.amount).toFixed(2)} ETB</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{w.method} · {new Date(w.created_at).toLocaleDateString()}</div>
                </div>
                {renderStatusBadge(w.status)}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
