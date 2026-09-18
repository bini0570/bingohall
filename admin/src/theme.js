export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          background: { default: '#f4f6f8', paper: '#ffffff' },
          primary: { main: '#1976d2', light: '#42a5f5' },
          secondary: { main: '#9c27b0', light: '#ba68c8' },
          text: { primary: '#1e293b', secondary: '#64748b' },
          divider: '#e2e8f0',
          action: { hover: '#f1f5f9', selected: '#e2e8f0' }
        }
      : {
          background: { default: '#121212', paper: '#1e1e1e' },
          primary: { main: '#90caf9', light: '#e3f2fd' },
          secondary: { main: '#ce93d8', light: '#f3e5f5' },
          text: { primary: '#ffffff', secondary: '#aaaaaa' },
          divider: '#333333',
          action: { hover: '#333333', selected: '#444444' }
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: mode === 'light' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
          border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #333333',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        }
      }
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '64px',
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          borderTop: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #333333',
        },
      },
    },
  },
});
