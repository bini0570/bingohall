import React from 'react';
import { Box, IconButton, Avatar, Typography } from '@mui/material';
import { Notifications, Settings } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeMode } from '../ThemeContext';

export default function MobileHeader() {
  const { mode } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();
  const isLight = mode === 'light';

  const getPageContext = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard', context: 'Overview' };
      case '/payments': return { title: 'Payments', context: 'Finance' };
      case '/players': return { title: 'Players', context: 'Users' };
      case '/tasks': return { title: 'Tasks', context: 'Operations' };
      case '/promos': return { title: 'Promos', context: 'Marketing' };
      default: return { title: 'Bingo X', context: 'Admin' };
    }
  };

  const { title, context } = getPageContext();

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'space-between',
      px: { xs: 3, md: 4 },
      py: 3,
      bgcolor: 'transparent',
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 0.5 }}>
          {context}
        </Typography>
        <Typography variant="h1" sx={{ color: 'text.primary', lineHeight: 1 }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton 
          sx={{ 
            bgcolor: isLight ? '#FFFFFF' : '#17181D',
            border: isLight ? '1px solid #E4E5EA' : '1px solid #2A2C33',
            color: 'text.primary',
            width: 44, height: 44,
            borderRadius: '12px',
          }}
        >
          <Notifications fontSize="small" />
        </IconButton>
        <IconButton 
          onClick={() => navigate('/settings')}
          sx={{ 
            bgcolor: isLight ? '#FFFFFF' : '#17181D',
            border: isLight ? '1px solid #E4E5EA' : '1px solid #2A2C33',
            color: 'text.primary',
            width: 44, height: 44,
            borderRadius: '12px',
          }}
        >
          <Settings fontSize="small" />
        </IconButton>
        <Avatar 
          sx={{ 
            width: 44, height: 44, 
            borderRadius: '12px', 
            bgcolor: '#5B5CE2', 
            fontWeight: 700,
            ml: 0.5
          }}
        >
          JD
        </Avatar>
      </Box>
    </Box>
  );
}
