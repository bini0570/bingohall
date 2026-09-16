import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { translations } from '../i18n/i18n';
import { apiFetch } from '../api';
import './WalletView.css';

/* ============================================================
   Constants & helpers
   ============================================================ */
let SYS_SETTINGS = {
  MIN_DEPOSIT: 10,
  MAX_DEPOSIT: 100000,
  MIN_WITHDRAW: 10,
  telebirr_name: 'Biniyam Eyoel',
  telebirr_number: '0993994168',
  cbebirr_name: 'Biniyam Eyoel',
  cbebirr_number: '0993994168'
};

// Fetch dynamic settings from backend
apiFetch('/api/public/settings').then(r => r.json()).then(d => {
  if (d.min_deposit) SYS_SETTINGS.MIN_DEPOSIT = parseFloat(d.min_deposit);
  if (d.min_withdraw) SYS_SETTINGS.MIN_WITHDRAW = parseFloat(d.min_withdraw);
  if (d.telebirr_name) SYS_SETTINGS.telebirr_name = d.telebirr_name;
  if (d.telebirr_number) SYS_SETTINGS.telebirr_number = d.telebirr_number;
  if (d.cbebirr_name) SYS_SETTINGS.cbebirr_name = d.cbebirr_name;
  if (d.cbebirr_number) SYS_SETTINGS.cbebirr_number = d.cbebirr_number;
}).catch(e => console.error("Error loading settings:", e));

const fmt = n => n.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const W_METHODS = {
  telebirr: { name: 'Telebirr', numberLabel: 'Telebirr phone number',
              placeholder: 'e.g. 0911223344', type: 'tel' },
  cbebirr:  { name: 'CBE Birr', numberLabel: 'CBE Birr account number',
              placeholder: 'e.g. 1000123456789', type: 'text' }
};

const getDMethods = () => ({
  telebirr: { name: 'Telebirr', sysName: SYS_SETTINGS.telebirr_name, sysNumber: SYS_SETTINGS.telebirr_number,
              smsPlaceholder: 'Paste the SMS you received from Telebirr here…' },
  cbebirr: { name: 'CBE Birr', sysName: SYS_SETTINGS.cbebirr_name, sysNumber: SYS_SETTINGS.cbebirr_number,
              smsPlaceholder: 'Paste the SMS you received from CBE Birr here…' }
});

// Map backend method strings to keys used in design
const methodKeyMap = {
  'Telebirr': 'telebirr',
  'CBEBirr': 'cbebirr',
  'telebirr': 'telebirr',
  'cbebirr': 'cbebirr'
};
const methodKeyMapRev = {
  'telebirr': 'Telebirr',
  'cbebirr': 'CBEBirr'
};

/* ============================================================
   Icons (small, reusable)
   ============================================================ */
const SvgBase = ({ size = 15, sw = 2.2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw}
       strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ArrowUp   = ({ size }) => <SvgBase size={size}><path d="M12 19V5M5 12l7-7 7 7" /></SvgBase>;
const ArrowDown = ({ size }) => <SvgBase size={size}><path d="M12 5v14M19 12l-7 7-7-7" /></SvgBase>;
const BackIcon  = () => <SvgBase><path d="M19 12H5M12 19l-7-7 7-7" /></SvgBase>;
const CloseIcon = () => <SvgBase><path d="M18 6 6 18M6 6l12 12" /></SvgBase>;
const Check     = ({ size = 12, sw = 3.4 }) => <SvgBase size={size} sw={sw}><path d="M20 6 9 17l-5-5" /></SvgBase>;
const CopyIcon  = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const InfoIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </svg>
);
const EyeIcon = ({ off }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <path d="M1 1l22 22" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

/* ============================================================
   Components
   ============================================================ */
function WalletHeader({ user }) {
  return (
    <header className="wallet__header">
      <p className="greeting__label">Wallet</p>
      <p className="greeting__name">{user?.username || 'Your account'}</p>
    </header>
  );
}

function TotalCard({ hidden, onToggle, balance }) {
  return (
    <section className="total-card" aria-label="Total wallet balance">
      <div className="total-card__top">
        <div>
          <p className="total-card__label">Total balance</p>
          <p className={'total-card__amount' + (hidden ? ' is-hidden' : '')}>
            <span>Br</span><span>{fmt(balance)}</span>
            <button className="reveal-btn" onClick={onToggle}
                    aria-label={hidden ? 'Show balances' : 'Hide balances'}>
              <EyeIcon off={hidden} />
            </button>
          </p>
        </div>
      </div>
      <div className="total-card__meta">
        <div className="total-card__chip" aria-hidden="true" />
        <span className="total-card__number">Wallet Account</span>
      </div>
    </section>
  );
}

function BalanceCard({ variant, label, amount, hidden, footer }) {
  const icon = variant === 'withdraw'
    ? <ArrowUp size={13} />
    : (
      <SvgBase size={13}>
        <rect x="4" y="10" width="16" height="11" rx="2.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </SvgBase>
    );

  return (
    <article className={'bal bal--' + variant}>
      <div className="bal__head">
        <span className="bal__icon">{icon}</span>
        <p className="bal__label">{label}</p>
      </div>
      <p className={'bal__amount js-balance' + (hidden ? ' is-hidden' : '')}>
        Br {fmt(amount)}
      </p>
      {footer}
    </article>
  );
}

function BalanceSplit({ hidden, withdrawable, nonWithdrawable, totalBalance }) {
  const progressPercent = totalBalance > 0 ? ((nonWithdrawable / totalBalance) * 100).toFixed(0) : 0;
  return (
    <section className="split" aria-label="Balance breakdown">
      <BalanceCard
        variant="withdraw"
        label="Withdrawable"
        amount={withdrawable}
        hidden={hidden}
        footer={
          <div className="bal__foot">
            <span className="badge badge--ready">
              <Check size={8} sw={3.6} /> Ready
            </span>
          </div>
        }
      />
      <BalanceCard
        variant="locked"
        label="Non-withdrawable"
        amount={nonWithdrawable}
        hidden={hidden}
        footer={
          <>
            <div className="bal__progress" aria-hidden="true"><i style={{ width: `${progressPercent}%` }} /></div>
            <div className="bal__foot" style={{ marginTop: 5 }}>
              <span className="badge badge--locked">
                <SvgBase size={8} sw={2.4}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </SvgBase>
                Locked
              </span>
            </div>
          </>
        }
      />
    </section>
  );
}

function QuickActions({ onWithdraw, onDeposit }) {
  return (
    <nav className="actions" aria-label="Quick actions">
      <button className="action action--primary" onClick={onWithdraw}>
        <span className="action__icon"><ArrowUp /></span>
        Withdraw
      </button>
      <button className="action action--deposit" onClick={onDeposit}>
        <span className="action__icon"><ArrowDown /></span>
        Deposit
      </button>
    </nav>
  );
}

function Transactions({ txList }) {
  return (
    <>
      <div className="section-head">
        <h2>Recent activity</h2>
        <button className="link" style={{opacity: 0, pointerEvents: 'none'}}>See all</button>
      </div>
      <div className="transactions-wrap">
        <ul className="transactions">
          {txList.length === 0 ? (
            <li className="tx-empty">No transactions yet.</li>
          ) : txList.map(t => (
            <li className="tx" key={t.id}>
              <span className="tx__avatar" style={{ background: t.bg }}>{t.avatar}</span>
              <div className="tx__body">
                <p className="tx__name">{t.name}</p>
                <p className="tx__meta">
                  {t.meta} <span className="dot" /> {t.date}
                </p>
              </div>
              <span className={'tx__amount tx__amount--' + t.cls}>{t.amount}</span>
            </li>
          ))}
        </ul>
        <div className="list-fade" />
      </div>
    </>
  );
}

/* ============================================================
   Sheet primitives
   ============================================================ */
function useSheetMount(open) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen]   = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => setIsOpen(true), 20);
      return () => clearTimeout(t);
    }
    setIsOpen(false);
    const t = setTimeout(() => setMounted(false), 420);
    return () => clearTimeout(t);
  }, [open]);

  return { mounted, isOpen };
}

function MethodRow({ method, meta, selected, onSelect }) {
  const cls = 'method' + (selected ? ' is-selected' : '');
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
  };
  return (
    <li className={cls} tabIndex={0} role="button"
        aria-pressed={selected}
        onClick={onSelect} onKeyDown={handleKey}>
      <span className={'method__icon method__icon--' + method}>
        {method === 'telebirr' ? <img src="/images/telebirr.jpg" alt="TB" /> : <img src="/images/cbe_birr.jpg" alt="CB" />}
      </span>
      <div className="method__body">
        <p className="method__name">{method === 'telebirr' ? 'Telebirr' : 'CBE Birr'}</p>
        <p className="method__meta">
          {meta.split('·').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part.trim()}
              {i < arr.length - 1 && <span className="dot" />}
            </React.Fragment>
          ))}
        </p>
      </div>
      <span className="method__check"><Check /></span>
    </li>
  );
}

const stepClass = (i, active) => {
  const num = i + 1;
  if (num === active) return 'sheet-step is-active';
  if (num < active)   return 'sheet-step is-past';
  return 'sheet-step';
};

/* ============================================================
   Withdraw Sheet
   ============================================================ */
function WithdrawSheet({ open, onClose, available, onSubmit, loading, reqError }) {
  const { mounted, isOpen } = useSheetMount(open);
  

  const [step, setStep]         = useState(1);
  const [selected, setSelected] = useState(null);
  const [acctName, setAcctName] = useState('');
  const [acctNumber, setAcctNumber] = useState('');
  const [amount, setAmount]     = useState('');
  const [errors, setErrors]     = useState({ name:'', number:'', amount:'', global:'' });
  const [success, setSuccess]   = useState({ amount:'', method:'', name:'', number:'', ref:'' });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelected(null);
    setAcctName('');
    setAcctNumber('');
    setAmount('');
    setErrors({ name:'', number:'', amount:'', global:'' });
  }, [open]);

  useEffect(() => {
    if (reqError) {
      setErrors(p => ({ ...p, global: reqError }));
    }
  }, [reqError]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (step === 2) setStep(1); else if (step === 1) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, onClose]);

  if (!mounted) return null;

  const amt = parseFloat(amount) || 0;
  const canContinue2 = acctName.trim() && acctNumber.trim() && amount.trim() && !loading;

  const handleAmount = (v) => {
    let s = v.replace(/[^0-9.]/g, '');
    const dot = s.indexOf('.');
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
    const [i, d] = s.split('.');
    if (d !== undefined && d.length > 2) s = i + '.' + d.slice(0, 2);
    setAmount(s);
    setErrors(prev => ({ ...prev, amount: '', global: '' }));
  };

  const submit = async () => {
    const name = acctName.trim();
    const num  = acctNumber.trim();
    const digits = num.replace(/\D/g, '');
    const e = { name:'', number:'', amount:'', global:'' };
    let ok = true;

    if (!name) { e.name = 'Enter the account holder name'; ok = false; }
    else if (name.length < 3) { e.name = 'Name looks too short'; ok = false; }

    if (!num) { e.number = 'Enter the account number'; ok = false; }
    
    if (!amt) { e.amount = 'Enter an amount to withdraw'; ok = false; }
    else if (amt < SYS_SETTINGS.MIN_WITHDRAW) { e.amount = 'Minimum withdrawal is Br ' + fmt(SYS_SETTINGS.MIN_WITHDRAW); ok = false; }
    else if (amt > available) { e.amount = 'Amount exceeds your balance of Br ' + fmt(available); ok = false; }

    setErrors(e);
    if (!ok) { return; }

    const resSuccess = await onSubmit({
      method: methodKeyMapRev[selected] || selected,
      accountNumber: num,
      accountName: name,
      amount: amt.toString()
    });

    if (resSuccess) {
      setSuccess({
        amount: 'Br ' + fmt(amt),
        method: W_METHODS[selected].name,
        name: name,
        number: num,
        ref: ''
      });
      setStep(3);
    }
  };

  const cfg = selected ? W_METHODS[selected] : null;

  return (
    <section className={'sheet' + (isOpen ? ' is-open' : '')}
             role="dialog" aria-modal="true" aria-hidden={!isOpen}>
      <button className="sheet__close-absolute" onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>
      <div className="sheet__handle" />

      <div className="sheet__steps" >

        {/* ---------- Step 1 : method ---------- */}
        <div className={stepClass(0, step)}>
          <header className="sheet__head">
            <div>
              <h3 className="sheet__title">Withdraw funds</h3>
              <p className="sheet__sub">Choose how you'd like to receive your money</p>
            </div>
            
          </header>

          <div className="sheet__available">
            <span>Available to withdraw</span>
            <strong>Br {fmt(available)}</strong>
          </div>

          <ul className="methods">
            <MethodRow method="telebirr" meta="Instant · No fee"
                       selected={selected === 'telebirr'}
                       onSelect={() => setSelected('telebirr')} />
            <MethodRow method="cbebirr" meta="Within minutes · No fee"
                       selected={selected === 'cbebirr'}
                       onSelect={() => setSelected('cbebirr')} />
          </ul>

          <button className="sheet__cta" disabled={!selected}
                  onClick={() => setStep(2)}>
            Continue
          </button>
        </div>

        {/* ---------- Step 2 : details ---------- */}
        <div className={stepClass(1, step)}>
          <header className="sheet__head">
            <div className="sheet__head-left">
              <button className="sheet__back" onClick={() => setStep(1)} aria-label="Back">
                <BackIcon />
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img src={`/images/${selected === 'cbebirr' ? 'cbe_birr' : 'telebirr'}.jpg`} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                <div>
                  <h3 className="sheet__title">
                    Withdraw to <span>{cfg ? cfg.name : 'Telebirr'}</span>
                  </h3>
                  <p className="sheet__sub">Enter the receiving account details</p>
                </div>
              </div>
            </div>
            
          </header>

          {errors.global && (
             <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
               {errors.global}
             </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="wName">Account name</label>
            <input id="wName" className={'field__input' + (errors.name ? ' is-invalid' : '')}
                   type="text" placeholder="e.g. Abebe Bekele" autoComplete="name"
                   value={acctName}
                   onChange={e => { setAcctName(e.target.value); setErrors(p => ({ ...p, name: '' })); }} />
            <p className={'field__error' + (errors.name ? ' is-show' : '')}>{errors.name}</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="wNum">
              {cfg ? cfg.numberLabel : 'Account number'}
            </label>
            <input id="wNum" className={'field__input' + (errors.number ? ' is-invalid' : '')}
                   type={cfg ? cfg.type : 'text'}
                   placeholder={cfg ? cfg.placeholder : ''}
                   value={acctNumber}
                   onChange={e => { setAcctNumber(e.target.value); setErrors(p => ({ ...p, number: '' })); }} />
            <p className={'field__error' + (errors.number ? ' is-show' : '')}>{errors.number}</p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="wAmt">Amount</label>
            <div className={'amount-input' + (errors.amount ? ' is-invalid' : '')}>
              <span className="amount-input__prefix">Br</span>
              <input id="wAmt" className="amount-input__field"
                     type="text" inputMode="decimal" placeholder="0.00"
                     autoComplete="off" value={amount}
                     onChange={e => handleAmount(e.target.value)} />
              <button className="amount-input__max" type="button"
                      onClick={() => { setAmount(available.toString());
                                       setErrors(p => ({ ...p, amount: '' })); }}>
                Max
              </button>
            </div>
            <p className={'field__error' + (errors.amount ? ' is-show' : '')}>{errors.amount}</p>
          </div>

          <div className="summary">
            <div className="summary__row"><span>Fee</span><strong>Br 0.00</strong></div>
            <div className="summary__row summary__row--total">
              <span>You'll receive</span>
              <strong>Br {fmt(amt)}</strong>
            </div>
          </div>

          <button className="sheet__cta" disabled={!canContinue2 || loading} onClick={submit}>
            {loading ? 'Processing...' : (amt > 0 ? 'Withdraw Br ' + fmt(amt) : 'Withdraw')}
          </button>
        </div>

        {/* ---------- Step 3 : success ---------- */}
        <div className={stepClass(2, step)}>
          <div className="success">
            <div className="success__icon">
              <SvgBase size={30} sw={3}><path d="M20 6 9 17l-5-5" /></SvgBase>
            </div>
            <h3 className="success__title">Withdrawal submitted</h3>
            <p className="success__text">
              <strong>{success.amount}</strong> is on its way to your{' '}
              <span>{success.method}</span> account.
            </p>
            <div className="success__details">
              <div className="summary__row"><span>Account name</span><strong>{success.name}</strong></div>
              <div className="summary__row"><span>Account number</span><strong>{success.number}</strong></div>
              <div className="summary__row"><span>Reference</span><strong>{success.ref || 'Pending'}</strong></div>
            </div>
          </div>
          <button className="sheet__cta" onClick={onClose}>Done</button>
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   Deposit Sheet
   ============================================================ */
function DepositSheet({ open, onClose, onCopy, onSubmit, loading, reqError }) {
  const { mounted, isOpen } = useSheetMount(open);
  

  const [step, setStep]         = useState(1);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount]     = useState('');
  const [sms, setSms]           = useState('');
  const [errors, setErrors]     = useState({ amount:'', sms:'', global:'' });
  const [copied, setCopied]     = useState({ name:false, number:false });
  const [success, setSuccess]   = useState({ amount:'', method:'', ref:'' });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelected(null);
    setAmount('');
    setSms('');
    setErrors({ amount:'', sms:'', global:'' });
    setCopied({ name:false, number:false });
  }, [open]);

  useEffect(() => {
    if (reqError) {
      setErrors(p => ({ ...p, global: reqError }));
    }
  }, [reqError]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (step > 1 && step < 3) setStep(step - 1); else if (step === 1) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, onClose]);

  if (!mounted) return null;

  const cfg = selected ? getDMethods()[selected] : null;
  const amt = parseFloat(amount) || 0;
  const hasSms = sms.trim().length >= 8;
  const canSubmit = amt > 0 && hasSms && !loading;

  const handleAmount = (v) => {
    let s = v.replace(/[^0-9.]/g, '');
    const dot = s.indexOf('.');
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
    const [i, d] = s.split('.');
    if (d !== undefined && d.length > 2) s = i + '.' + d.slice(0, 2);
    setAmount(s);
    setErrors(p => ({ ...p, amount: '', global: '' }));
  };

  const handleCopy = async (which, text) => {
    const done = () => {
      setCopied(p => ({ ...p, [which]: true }));
      onCopy('Copied: ' + text);
      setTimeout(() => setCopied(p => ({ ...p, [which]: false })), 1400);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const copiedSuccessfully = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!copiedSuccessfully) throw new Error('Copy command failed');
      }
    } catch (e) {
      onCopy('Copy failed — please copy it manually');
      return;
    }
    done();
  };

  const submit = async () => {
    const e = { amount:'', sms:'', global:'' };
    let ok = true;
    const smsTrim = sms.trim();

    if (!amt) { e.amount = 'Enter the amount you sent'; ok = false; }
    else if (amt < SYS_SETTINGS.MIN_DEPOSIT) { e.amount = 'Minimum deposit is Br ' + fmt(SYS_SETTINGS.MIN_DEPOSIT); ok = false; }
    else if (amt > SYS_SETTINGS.MAX_DEPOSIT) { e.amount = 'Maximum deposit is Br ' + fmt(SYS_SETTINGS.MAX_DEPOSIT); ok = false; }

    if (!smsTrim) { e.sms = 'Paste the SMS you received from your bank'; ok = false; }
    else if (smsTrim.length < 8) { e.sms = 'That SMS looks too short — paste the full message'; ok = false; }

    setErrors(e);
    if (!ok) { return; }

    const resSuccess = await onSubmit({
      method: methodKeyMapRev[selected] || selected,
      amount: amt.toString(),
      receiptSms: smsTrim
    });

    if (resSuccess) {
      setSuccess({
        amount: 'Br ' + fmt(amt),
        method: getDMethods()[selected].name,
        ref: ''
      });
      setStep(3);
    }
  };

  return (
    <section className={'sheet' + (isOpen ? ' is-open' : '')}
             role="dialog" aria-modal="true" aria-hidden={!isOpen}>
      <button className="sheet__close-absolute" onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>
      <div className="sheet__handle" />

      <div className="sheet__steps" >

        {/* ---------- Step 1 : method ---------- */}
        <div className={stepClass(0, step)}>
          <header className="sheet__head">
            <div>
              <h3 className="sheet__title">Deposit funds</h3>
              <p className="sheet__sub">Choose how you'd like to add money</p>
            </div>
            
          </header>

          <ul className="methods">
            <MethodRow method="telebirr" meta="Send to our Telebirr account"
                       selected={selected === 'telebirr'}
                       onSelect={() => setSelected('telebirr')} />
            <MethodRow method="cbebirr" meta="Send to our CBE Birr account"
                       selected={selected === 'cbebirr'}
                       onSelect={() => setSelected('cbebirr')} />
          </ul>

          <button className="sheet__cta sheet__cta--deposit"
                  disabled={!selected}
                  onClick={() => setStep(2)}>
            Continue
          </button>
        </div>

        {/* ---------- Step 2 : amount + system card + SMS ---------- */}
        <div className={stepClass(1, step)}>
          <header className="sheet__head">
            <div className="sheet__head-left">
              <button className="sheet__back" onClick={() => setStep(1)} aria-label="Back">
                <BackIcon />
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img src={`/images/${selected === 'cbebirr' ? 'cbe_birr' : 'telebirr'}.jpg`} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                <div>
                  <h3 className="sheet__title">
                    Deposit via <span className="is-green">{cfg ? cfg.name : 'Telebirr'}</span>
                  </h3>
                  <p className="sheet__sub">Send the amount, then paste your bank SMS</p>
                </div>
              </div>
            </div>
            
          </header>

          {errors.global && (
             <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
               {errors.global}
             </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="dAmt">Amount you'll send</label>
            <div className={'amount-input' + (errors.amount ? ' is-invalid' : '')}>
              <span className="amount-input__prefix">Br</span>
              <input id="dAmt" className="amount-input__field"
                     type="text" inputMode="decimal" placeholder="0.00"
                     autoComplete="off" value={amount}
                     onChange={e => handleAmount(e.target.value)} />
            </div>
            <p className={'field__error' + (errors.amount ? ' is-show' : '')}>{errors.amount}</p>
          </div>

          <div className="copy-card">
            <div className="copy-card__title">
              <ShieldIcon /> Send your payment to
            </div>
            <div className="copy-card__row">
              <span className="copy-card__label">Account name</span>
              <span className="copy-card__value">{cfg && cfg.sysName ? cfg.sysName : 'Not configured'}</span>
              <button type="button"
                      className={'copy-card__btn' + (copied.name ? ' is-copied' : '')}
                      aria-label="Copy account name"
                      disabled={!cfg || !cfg.sysName}
                      onClick={() => handleCopy('name', cfg.sysName)}>
                <CopyIcon />
              </button>
            </div>
            <div className="copy-card__row">
              <span className="copy-card__label">Account number</span>
              <span className="copy-card__value">{cfg && cfg.sysNumber ? cfg.sysNumber : 'Not configured'}</span>
              <button type="button"
                      className={'copy-card__btn' + (copied.number ? ' is-copied' : '')}
                      aria-label="Copy account number"
                      disabled={!cfg || !cfg.sysNumber}
                      onClick={() => handleCopy('number', cfg.sysNumber)}>
                <CopyIcon />
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="dSms">Bank SMS confirmation</label>
            <textarea id="dSms" spellCheck="false"
                      className={'sms-box' + (errors.sms ? ' is-invalid' : '')}
                      placeholder={cfg ? cfg.smsPlaceholder : 'Paste the SMS…'}
                      value={sms}
                      onChange={e => { setSms(e.target.value); setErrors(p => ({ ...p, sms: '' })); }} />
            <p className="field__hint">
              <InfoIcon /> Copy the full SMS including the transaction ID.
            </p>
            <p className={'field__error' + (errors.sms ? ' is-show' : '')}>{errors.sms}</p>
          </div>

          <button className="sheet__cta sheet__cta--deposit"
                  disabled={!canSubmit || loading} onClick={submit}>
            {loading ? 'Verifying...' : (amt > 0 ? 'Deposit Br ' + fmt(amt) : 'Deposit')}
          </button>
        </div>

        {/* ---------- Step 3 : success ---------- */}
        <div className={stepClass(2, step)}>
          <div className="success">
            <div className="success__icon">
              <SvgBase size={30} sw={3}><path d="M20 6 9 17l-5-5" /></SvgBase>
            </div>
            <h3 className="success__title">Deposit submitted</h3>
            <p className="success__text">
              Your <strong>{success.amount}</strong> deposit via{' '}
              <span>{success.method}</span> is awaiting confirmation.
            </p>
            <div className="success__details">
              <div className="summary__row"><span>Method</span><strong>{success.method}</strong></div>
              <div className="summary__row"><span>Reference</span><strong>{success.ref || 'Pending'}</strong></div>
              <div className="summary__row">
                <span>Status</span>
                <strong style={{ color: 'var(--amber)' }}>Pending review</strong>
              </div>
            </div>
          </div>
          <button className="sheet__cta sheet__cta--deposit" onClick={onClose}>Done</button>
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   Toast
   ============================================================ */
function Toast({ message, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const t1 = setTimeout(() => setShow(false), 1600);
    const t2 = setTimeout(onDone, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return <div className={'toast' + (show ? ' is-show' : '')}>{message}</div>;
}

/* ============================================================
   App Export
   ============================================================ */
export default function WalletView({ lang, user, token, socket, onBalanceUpdated }) {
  const t = translations[lang];
  const [hidden, setHidden]           = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  const [toast, setToast]             = useState(null);
  const [transactions, setTransactions] = useState({ deposits: [], withdrawals: [] });
  const [loading, setLoading] = useState(false);
  const [reqError, setReqError] = useState('');

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

  const handleDepositSubmit = async ({ method, amount, receiptSms }) => {
    setLoading(true);
    setReqError('');
    try {
      const formData = new FormData();
      formData.append('method', method);
      formData.append('amount', amount);
      formData.append('receiptSms', receiptSms);

      const res = await apiFetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deposit failed');
      fetchTransactions();
      return true;
    } catch (err) {
      setReqError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async ({ method, accountNumber, accountName, amount }) => {
    setLoading(true);
    setReqError('');
    try {
      const res = await apiFetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          accountNumber,
          accountName,
          amount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
      fetchTransactions();
      return true;
    } catch (err) {
      setReqError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => setToast({ msg, id: Date.now() });

  const balance = user?.balance || 0;
  const withdrawableBal = user?.withdrawableBalance ?? user?.withdrawable_balance ?? 0;
  const nonWithdrawableBal = balance - withdrawableBal;

  // Process and merge transactions
  const txList = [
    ...(transactions.deposits || []).map(d => ({
      id: 'd_' + d.id,
      type: 'deposit',
      name: 'Deposit via ' + d.method,
      meta: d.status,
      date: new Date(d.created_at).toLocaleDateString(),
      amount: '+Br ' + parseFloat(d.amount).toFixed(2),
      rawDate: new Date(d.created_at),
      bg: 'var(--green-soft)',
      cls: 'in',
      avatar: <ArrowDown size={18} />
    })),
    ...(transactions.withdrawals || []).map(w => ({
      id: 'w_' + w.id,
      type: 'withdraw',
      name: 'Withdraw to ' + w.method,
      meta: w.status,
      date: new Date(w.created_at).toLocaleDateString(),
      amount: '-Br ' + parseFloat(w.amount).toFixed(2),
      rawDate: new Date(w.created_at),
      bg: 'var(--amber-soft)',
      cls: 'out',
      avatar: <ArrowUp size={18} />
    }))
  ].sort((a, b) => b.rawDate - a.rawDate);

  return (
    <div className="wallet-wrapper">
      <main className="wallet-card">
        <WalletHeader user={user} />
        
        <TotalCard 
          hidden={hidden} 
          onToggle={() => setHidden(h => !h)} 
          balance={balance} 
        />
        
        <BalanceSplit 
          hidden={hidden} 
          totalBalance={balance}
          withdrawable={withdrawableBal}
          nonWithdrawable={nonWithdrawableBal}
        />
        
        <QuickActions
          onWithdraw={() => { setReqError(''); setActiveSheet('withdraw'); }}
          onDeposit={() => { setReqError(''); setActiveSheet('deposit'); }}
        />
        
        <Transactions txList={txList} />
      </main>

      <div
        className={'sheet-backdrop' + (activeSheet ? ' is-open' : '')}
        onClick={() => setActiveSheet(null)}
      />

      <WithdrawSheet
        open={activeSheet === 'withdraw'}
        onClose={() => setActiveSheet(null)}
        available={withdrawableBal}
        onSubmit={handleWithdrawSubmit}
        loading={loading}
        reqError={reqError}
      />
      
      <DepositSheet
        open={activeSheet === 'deposit'}
        onClose={() => setActiveSheet(null)}
        onCopy={showToast}
        onSubmit={handleDepositSubmit}
        loading={loading}
        reqError={reqError}
      />

      {toast && (
        <Toast
          key={toast.id}
          message={toast.msg}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
