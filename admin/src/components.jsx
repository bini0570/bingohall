import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icon, cx, fmt, initials, cap, BALLS, fmtPhone, RANGES, series, smoothPath } from './data';

const STATUS = {
  pending: ['Pending', 'warn'], completed: ['Completed', 'pos'], rejected: ['Rejected', 'neg'],
  online: ['Online', 'pos'], active: ['Active', 'info'], banned: ['Banned', 'neg'],
  deposited: ['Deposited', 'pos'], none: ['No deposit', 'mute'], live: ['Live', 'pos'], disabled: ['Disabled', 'mute']
};

export function Badge({ s }) {
  const st = STATUS[s];
  return (
    <span className={`badge ${st[1]}`}>
      {s === 'online' && <i className="bdot" />}
      {st[0]}
    </span>
  );
}

export function Avatar({ p, size }) { 
  return <span className={cx('av', 'av-' + BALLS[p.id % 5], size === 'lg' && 'av-lg')}>{initials(p.name)}</span>; 
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="phead">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Seg({ value, onChange, options, small }) {
  return (
    <div className={cx('seg', small && 'seg-sm')} role="tablist">
      {options.map((o) => (
        <button 
          key={o.value} role="tab" aria-selected={value === o.value} 
          className={cx('seg-btn', value === o.value && 'on')} 
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label}
          {o.count > 0 && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, text, children }) {
  return (
    <div className="empty">
      <span className="empty-ic"><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Info({ k, v }) { 
  return (
    <div className="info">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  ); 
}

export function Sk({ height }) { 
  return <span className="sk" style={{ height }} />; 
}

export function Sheet({ title, onClose, children, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.focus();
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label || title} tabIndex={-1} ref={ref}>
        <div className="grab" />
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ cfg, onClose }) {
  return (
    <Sheet title={cfg.title} onClose={onClose}>
      <p className="sheet-body">{cfg.body}</p>
      <div className="sheet-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={cx('btn', cfg.tone === 'danger' ? 'btn-solid-danger' : 'btn-primary')} onClick={() => { onClose(); cfg.onConfirm(); }}>{cfg.confirm}</button>
      </div>
    </Sheet>
  );
}

export function Chart({ range }) {
  const s = useMemo(() => series(range), [range]);
  const [active, setActive] = useState(null);
  const box = useRef(null);
  useEffect(() => { setActive(null); }, [range]);
  const n = s.data.length, idx = active == null ? n - 1 : active;
  const max = Math.max.apply(null, s.data), min = Math.min.apply(null, s.data), pad = (max - min) * 0.18 || 1;
  const lo = min - pad, hi = max + pad;
  const pts = s.data.map((v, i) => [(i / (n - 1)) * 100, 46 - ((v - lo) / (hi - lo)) * 42]);
  const line = smoothPath(pts), area = line + ' L100,50 L0,50 Z';
  const move = (e) => {
    if (!box.current) return;
    const r = box.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    setActive(Math.max(0, Math.min(n - 1, Math.round(x * (n - 1)))));
  };
  const mid = Math.floor((n - 1) / 2);
  
  return (
    <div>
      <div className="chart-val">
        {fmt(s.data[idx])} <small>ETB</small>
      </div>
      <div className="chart-when">
        {RANGES[range] && s.when(s.labels[idx])}
      </div>
      <div className="chart" ref={box} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setActive(null)} role="img" aria-label="Revenue chart">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaFill" x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#areaFill)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <line x1={pts[idx][0]} x2={pts[idx][0]} y1={0} y2={50} stroke="var(--faint)" strokeWidth={1} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="dotm" style={{ left: pts[idx][0] + '%', top: (pts[idx][1] / 50) * 100 + '%' }} />
      </div>
      <div className="xl">
        <span>{s.labels[0]}</span>
        <span>{s.labels[mid]}</span>
        <span>{s.labels[n - 1]}</span>
      </div>
    </div>
  );
}
