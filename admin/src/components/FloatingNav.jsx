import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard } from '@mui/icons-material';
import { useThemeMode } from '../ThemeContext';

const navItems = [
  { to: '/', label: 'Home', icon: <Dashboard fontSize="small" /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard fontSize="small" /> },
  { to: '/players', label: 'Players', icon: <People fontSize="small" /> },
  { to: '/tasks', label: 'Tasks', icon: <Assignment fontSize="small" /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard fontSize="small" /> },
];

export default function FloatingNav() {
  const location = useLocation();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  return (
    <Box sx={{
      position: 'fixed',
      bottom: { xs: 20, md: 30 },
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1,
      borderRadius: '24px',
      bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(23, 24, 29, 0.85)',
      backdropFilter: 'blur(16px)',
      border: isLight ? '1px solid rgba(228, 229, 234, 0.5)' : '1px solid rgba(42, 44, 51, 0.5)',
      boxShadow: isLight 
        ? '0 10px 40px -10px rgba(0,0,0,0.1)' 
        : '0 10px 40px -10px rgba(0,0,0,0.5)',
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Box
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isActive ? 1 : 0,
              px: isActive ? 2 : 1.5,
              py: 1.2,
              borderRadius: '16px',
              textDecoration: 'none',
              color: isActive 
                ? (isLight ? '#FFFFFF' : '#FFFFFF')
                : (isLight ? '#737780' : '#9699A3'),
              bgcolor: isActive ? '#5B5CE2' : 'transparent',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: isActive ? '#5B5CE2' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'),
              }
            }}
          >
            {item.icon}
            {isActive && (
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                {item.label}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
