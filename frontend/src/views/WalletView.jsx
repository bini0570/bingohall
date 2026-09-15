import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, Clock, Copy, ChevronLeft, AlertCircle } from 'lucide-react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';

const PAYMENT_ACCOUNTS = {
  Telebirr: {
    name: 'Biniyam Eyoel',
    number: '0993994168',
    logo: '/images/telebirr.jpg',
    label: 'Telebirr',
    color: '#f59e0b'
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
  const [activeTab, setActiveTab] = useState(null);

  const [depStep, setDepStep] = useState(1);
  const [depMethod, setDepMethod] = useState('');
  const [depAmount, setDepAmount] = useState('');
  const [receiptSms, setReceiptSms] = useState('');
  const [proofFile, setProofFile] = useState(null);

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
    if (!depMethod && Object.keys(PAYMENT_ACCOUNTS).length > 0) {
      setDepMethod(Object.keys(PAYMENT_ACCOUNTS)[0]);
    }
    if (!withMethod && Object.keys(PAYMENT_ACCOUNTS).length > 0) {
      setWithMethod(Object.keys(PAYMENT_ACCOUNTS)[0]);
    }
  }, [depMethod, withMethod]);

  useEffect(() => {
    if (token) fetchTransactions();
    if (socket) {
      const handleDataChanged = () => fetchTransactions();
      const handleUserTxUpdated = (data) => {
        if (!data.userId || String(data.userId) === String(user?.id)) {
          fetchTransactions();
        }
      };
      const handleBalanceUpdated = data => {
        if (String(data.userId) === String(user?.id) && onBalanceUpdated) {
          onBalanceUpdated(data.newBalance, data.withdrawableBalance);
        }
        fetchTransactions();
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
      setDepStep(2); // Step 2 is now the Success screen
      fetchTransactions();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  const resetDeposit = () => {
    setDepStep(1); 
    setDepMethod(Object.keys(PAYMENT_ACCOUNTS)[0] || ''); 
    setDepAmount(''); 
    setReceiptSms(''); 
    setProofFile(null);
    setMsg({ error: '', success: '' });
  };

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
      setWithStep(2); // Step 2 is now the Success screen
      fetchTransactions();
    } catch (err) {
      setMsg({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  const resetWithdraw = () => {
    setWithStep(1); 
    setWithMethod(Object.keys(PAYMENT_ACCOUNTS)[0] || ''); 
    setWithAccount(''); 
    setWithAccountName(''); 
    setWithAmount('');
    setMsg({ error: '', success: '' });
  };

  const balance = user?.balance || 0;
  const withdrawableBal = user?.withdrawableBalance ?? user?.withdrawable_balance ?? 0;

  const renderStatusBadge = status => {
    const map = {
      pending: { bg: 'rgba(245,158,11,0.2)', color: 'var(--gold)', icon: <Clock size={12} />, label: 'Pending' },
      approved: { bg: 'rgba(16,185,129,0.2)', color: 'var(--green)', icon: <CheckCircle2 size={12} />, label: 'Completed' },
      rejected: { bg: 'rgba(239,68,68,0.2)', color: 'var(--red)', icon: <AlertCircle size={12} />, label: 'Rejected' }
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '480px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '60px 12px 10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!token && (
        <div className="glass-panel" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
          <div style={{ fontWeight: '800', color: '#fca5a5', fontSize: '15px', marginBottom: '6px' }}>Session Not Ready</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Your session is still loading. Please wait a moment and try again, or refresh the page.</div>
        </div>
      )}

      {/* BALANCE BREAKDOWN */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderColor: 'var(--border-cyan)' }}>
        <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', color: 'var(--cyan)', marginBottom: '4px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            💰 Total Balance
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', lineHeight: 1.1 }}>
            {(user?.balance || 0).toFixed(2)} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ETB</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'var(--gold)', marginBottom: '4px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            🏆 Withdrawable
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--gold)', lineHeight: 1.1 }}>
            {(user?.withdrawableBalance ?? user?.withdrawable_balance ?? 0).toFixed(2)} <span style={{ fontSize: '10px', opacity: 0.8 }}>ETB</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="glass-panel" style={{ display: 'flex', padding: '6px', gap: '6px' }}>
        {[['deposit', '📥 Deposit'], ['withdraw', '📤 Withdraw'], ['history', '📋 History']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); resetDeposit(); resetWithdraw(); setMsg({ error: '', success: '' }); }}
            style={{
              flex: 1, padding: '12px 4px', borderRadius: '8px', border: 'none',
              background: activeTab === key ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === key ? '800' : '600',
              cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
              boxShadow: activeTab === key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {msg.error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {msg.error}
        </div>
      )}

      {/* DEPOSIT */}
      {activeTab === 'deposit' && (
        <div className="glass-panel" style={{ padding: '24px 20px', minHeight: '320px' }}>
          {depStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Section 1: Method & Amount */}
              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>1. Payment Method</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                  {Object.entries(PAYMENT_ACCOUNTS).map(([key, acc]) => (
                    <button key={key} onClick={() => setDepMethod(key)}
                      style={{
                        padding: '12px', borderRadius: '12px', border: `2px solid ${depMethod === key ? acc.color : 'transparent'}`,
                        background: depMethod === key ? `${acc.color}12` : 'var(--bg-elevated)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'all 0.2s', boxShadow: depMethod === key ? `0 0 12px ${acc.color}40` : 'none'
                      }}>
                      <img src={acc.logo} alt="" style={{ height: '24px', borderRadius: '4px', background: '#fff', padding: '2px' }} />
                      <span style={{ fontWeight: '800', fontSize: '14px', color: depMethod === key ? acc.color : 'var(--text-secondary)' }}>{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>2. Deposit Amount (ETB)</div>
                <input type="number" className="input-field" style={{ fontSize: '28px', textAlign: 'center', fontWeight: '900', padding: '16px' }} placeholder="0.00" value={depAmount} onChange={e => setDepAmount(e.target.value)} min="10" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                  {['200', '500', '1000'].map(a => (
                    <button key={a} onClick={() => setDepAmount(a)} className="btn-secondary" style={{ borderColor: depAmount === a ? 'var(--gold)' : '', color: depAmount === a ? 'var(--gold)' : '', fontSize: '14px', padding: '8px' }}>
                      +{a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Instructions */}
              {depMethod && PAYMENT_ACCOUNTS[depMethod] && (() => {
                const acc = PAYMENT_ACCOUNTS[depMethod];
                return (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', padding: '20px', border: `1px solid ${acc.color}40` }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={acc.logo} alt="" style={{ height: '20px', borderRadius: '4px', background: '#fff', padding: '2px' }} /> Transfer to {acc.label}:
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ACCOUNT NAME</div>
                      <div style={{ fontWeight: '900', fontSize: '16px' }}>{acc.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ACCOUNT NUMBER</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '900', fontSize: '20px', color: acc.color, letterSpacing: '1px' }}>{acc.number}</span>
                        <button onClick={() => copyToClipboard(acc.number, 'num')} className="btn-secondary" style={{ padding: '6px 12px', minHeight: '32px', fontSize: '13px' }}>
                          {copied === 'num' ? '✅ Copied' : <><Copy size={14} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 3: Verification */}
              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>3. Verify Transfer</div>
                <textarea rows={3} className="input-field" style={{ resize: 'vertical' }} placeholder={`Paste your ${depMethod} SMS receipt or transaction ID here...`} value={receiptSms} onChange={e => setReceiptSms(e.target.value)} />
              </div>

              <button onClick={() => {
                if (!depAmount || parseFloat(depAmount) < 10) { setMsg({ error: 'Minimum deposit is 10 ETB', success: '' }); return; }
                handleDepositSubmit();
              }} disabled={loading || !token} className="btn-gold" style={{ width: '100%', opacity: (!token || loading) ? 0.7 : 1, marginTop: '8px', padding: '16px', fontSize: '18px' }}>
                {loading ? '⏳ Submitting...' : !token ? '🔒 Session Loading...' : 'Submit Deposit'}
              </button>
            </div>
          )}

          {depStep === 2 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>✅</div>
              <h3 style={{ fontWeight: '900', fontSize: '28px', color: 'var(--green)', marginBottom: '16px' }}>Deposit Submitted!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
                Your deposit of <strong style={{ color: 'var(--gold)' }}>{parseFloat(depAmount).toFixed(2)} ETB</strong> via <strong>{depMethod}</strong> has been submitted.<br /><br />
                Admin will verify and credit your wallet shortly. ⚡
              </p>
              <button onClick={resetDeposit} className="btn-secondary" style={{ minWidth: '200px' }}>Make Another Deposit</button>
            </div>
          )}
        </div>
      )}

      {/* WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div className="glass-panel" style={{ padding: '24px 20px', minHeight: '320px' }}>
          {withStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ textAlign: 'center', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>Available Winnings</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--cyan)' }}>{withdrawableBal.toFixed(2)} <span style={{ fontSize: '16px', opacity: 0.8 }}>ETB</span></div>
              </div>

              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>1. Withdrawal Amount (ETB)</div>
                <div style={{ position: 'relative' }}>
                  <input type="number" className="input-field" style={{ fontSize: '24px', textAlign: 'center', fontWeight: '900', padding: '16px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="0.00" value={withAmount} onChange={e => setWithAmount(e.target.value)} min="200" max={withdrawableBal} />
                  <button onClick={() => setWithAmount(String(Math.floor(withdrawableBal)))} className="btn-secondary" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', padding: '6px 12px', fontSize: '12px' }}>
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>2. Withdrawal Method</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                  {Object.entries(PAYMENT_ACCOUNTS).map(([key, acc]) => (
                    <button key={key} onClick={() => setWithMethod(key)}
                      style={{
                        padding: '12px', borderRadius: '12px', border: `2px solid ${withMethod === key ? acc.color : 'transparent'}`,
                        background: withMethod === key ? `${acc.color}12` : 'var(--bg-elevated)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'all 0.2s', boxShadow: withMethod === key ? `0 0 12px ${acc.color}40` : 'none'
                      }}>
                      <img src={acc.logo} alt="" style={{ height: '24px', borderRadius: '4px', background: '#fff', padding: '2px' }} />
                      <span style={{ fontWeight: '800', fontSize: '14px', color: withMethod === key ? acc.color : 'var(--text-secondary)' }}>{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '700' }}>
                  3. Your {withMethod} Account Number / Phone
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder={withMethod === 'Telebirr' ? 'e.g. 0911223344' : 'e.g. 1000123456789'}
                  value={withAccount}
                  onChange={e => setWithAccount(e.target.value)}
                />
              </div>

              <button onClick={() => {
                if (!withAmount || parseFloat(withAmount) < 200) { setMsg({ error: 'Minimum withdrawal is 200 ETB', success: '' }); return; }
                if (parseFloat(withAmount) > withdrawableBal) { setMsg({ error: `Insufficient withdrawable balance. Your withdrawable balance is ${withdrawableBal.toFixed(2)} ETB.`, success: '' }); return; }
                handleWithdrawSubmit();
              }} disabled={loading || !token} className="btn-gold" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: 'var(--shadow-cyan)', color: '#fff', width: '100%', opacity: (!token || loading) ? 0.7 : 1, marginTop: '8px', padding: '16px', fontSize: '18px' }}>
                {loading ? '⏳ Submitting...' : !token ? '🔒 Session Loading...' : 'Submit Request'}
              </button>
            </div>
          )}

          {withStep === 2 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>✅</div>
              <h3 style={{ fontWeight: '900', fontSize: '28px', color: 'var(--cyan)', marginBottom: '16px' }}>Withdrawal Submitted!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
                Your withdrawal of <strong style={{ color: 'var(--cyan)' }}>{parseFloat(withAmount).toFixed(2)} ETB</strong> via <strong>{withMethod}</strong> to account <strong>{withAccount}</strong> has been submitted.<br /><br />
                Admin will process and transfer funds to your account shortly. ⚡
              </p>
              <button onClick={resetWithdraw} className="btn-secondary" style={{ minWidth: '200px' }}>Make Another Withdrawal</button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Deposits</div>
          {(transactions.deposits || []).length === 0
            ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', fontSize: '15px' }}>No deposits yet</div>
            : (transactions.deposits || []).slice().reverse().map(d => (
              <div key={d.id} style={{ background: 'var(--bg-elevated)', borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '900', color: 'var(--green)', fontSize: '16px' }}>+{parseFloat(d.amount).toFixed(2)} ETB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{d.method} · {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                {renderStatusBadge(d.status)}
              </div>
            ))
          }

          <div style={{ fontSize: '14px', fontWeight: '800', margin: '32px 0 16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Withdrawals</div>
          {(transactions.withdrawals || []).length === 0
            ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', fontSize: '15px' }}>No withdrawals yet</div>
            : (transactions.withdrawals || []).slice().reverse().map(w => (
              <div key={w.id} style={{ background: 'var(--bg-elevated)', borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '900', color: 'var(--red)', fontSize: '16px' }}>-{parseFloat(w.amount).toFixed(2)} ETB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{w.method} · {new Date(w.created_at).toLocaleDateString()}</div>
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
