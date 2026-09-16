import React from 'react';
import '../../AdminTheme.css';

export function Card({ children, className = '' }) {
  return (
    <div className={`admin-card ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`admin-card-header ${className}`}>
      <div>
        <h3 className="admin-card-title">{title}</h3>
        {subtitle && <p className="admin-card-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="admin-card-action">{action}</div>}
    </div>
  );
}
