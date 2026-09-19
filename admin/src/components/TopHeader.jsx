import React from 'react';
import { Box, IconButton, InputBase, Avatar, Typography, Badge } from '@mui/material';
import { Search, Notifications, Menu, KeyboardArrowDown } from '@mui/icons-material';
import { useThemeMode } from '../ThemeContext';

export default function TopHeader() {
  const { mode } = useThemeMode();

  return (
    <Box sx={{ 
      display: { xs: 'none', md: 'flex' },
      alignItems: 'center', 
      justifyContent: 'space-between',
      p: 2, px: 4,
      bgcolor: mode === 'dark' ? '#1E293B' : '#ffffff',
      borderBottom: '1px solid',
      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    }}>
      {/* Left side: Toggle & Search */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <IconButton sx={{ color: 'text.secondary' }}>
          <Menu />
        </IconButton>
        
        <Box sx={{ 
          display: 'flex', alignItems: 'center', 
          bgcolor: mode === 'dark' ? '#0F172A' : '#F1F5F9',
          borderRadius: '8px', px: 2, py: 0.5,
          width: 320
        }}>
        <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
        <InputBase 
          placeholder="Search anything..." 
          sx={{ ml: 1, flex: 1, color: 'text.primary', fontSize: '0.9rem' }} 
        />
      </Box>

        </Box>

      {/* Right Side */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <IconButton sx={{ color: 'text.secondary' }}>
          <Badge badgeContent={2} color="error" variant="dot">
            <Notifications />
          </Badge>
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366f1' }}>JD</Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>John Doe</Typography>
            <Typography variant="caption" color="text.secondary">Admin</Typography>
          </Box>
          <KeyboardArrowDown sx={{ color: 'text.secondary', ml: 0.5 }} />
        </Box>
      </Box>
    </Box>
  );
}
