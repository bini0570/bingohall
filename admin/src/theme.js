export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          background: { default: '#F8FAFC', paper: '#ffffff' },
          primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
          secondary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
          text: { primary: '#0f172a', secondary: '#64748b' },
          divider: '#e2e8f0',
          action: { hover: '#f1f5f9', selected: '#e2e8f0' }
        }
      : {
          background: { default: '#0B1121', paper: '#1E293B' },
          primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
          secondary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
          text: { primary: '#f8fafc', secondary: '#94a3b8' },
          divider: 'rgba(255,255,255,0.05)',
          action: { hover: 'rgba(255,255,255,0.05)', selected: 'rgba(255,255,255,0.1)' }
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: mode === 'light' ? '0 4px 20px rgba(0, 0, 0, 0.03)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
          border: mode === 'light' ? '1px solid rgba(0,0,0,0.03)' : '1px solid rgba(255,255,255,0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
        }
      }
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '64px',
          backgroundColor: mode === 'light' ? '#ffffff' : '#1E293B',
          borderTop: mode === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
        },
      },
    },
  },
});
