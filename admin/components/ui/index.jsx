import React from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, status = 'default', className = '' }) {
  return (
    <span className={`badge badge-${status.toLowerCase()} ${className}`}>
      {children}
    </span>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className="form-input" {...props} />
    </div>
  );
}

export function Select({ label, options = [], ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-input form-select" {...props}>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Avatar({ label, className = '', variant = 'default' }) {
  return (
    <div className={`avatar ${variant !== 'default' ? `avatar-${variant}` : ''} ${className}`}>
      {label}
    </div>
  );
}

// Table wrapper for responsiveness
export function Table({ headers = [], children, responsive = true }) {
  return (
    <div className="table-container">
      <table className={`admin-table ${responsive ? 'responsive-table' : ''}`}>
        <thead>
          <tr>
            {headers.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function ToastContainer({ messages }) {
  if (!messages || (!messages.error && !messages.success)) return null;
  return (
    <div className="toast-container">
      {messages.error && (
        <div className="toast toast-error">
          <XCircle size={18} /> {messages.error}
        </div>
      )}
      {messages.success && (
        <div className="toast toast-success">
          <CheckCircle2 size={18} /> {messages.success}
        </div>
      )}
    </div>
  );
}
export * from './Card';

export * from './Card';