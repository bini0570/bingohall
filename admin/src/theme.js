export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          background: { default: '#f8fafc', paper: '#ffffff' },
          primary: { main: '#0f172a', light: '#334155' },
          secondary: { main: '#4f46e5', light: '#6366f1' },
          text: { primary: '#0f172a', secondary: '#64748b' },
          divider: 'rgba(15, 23, 42, 0.06)',
          action: { hover: 'rgba(15, 23, 42, 0.04)', selected: 'rgba(15, 23, 42, 0.08)' }
        }
      : {
          background: { default: '#020617', paper: '#0f172a' },
          primary: { main: '#f8fafc', light: '#cbd5e1' },
          secondary: { main: '#6366f1', light: '#818cf8' },
          text: { primary: '#f8fafc', secondary: '#94a3b8' },
          divider: 'rgba(255, 255, 255, 0.06)',
          action: { hover: 'rgba(255, 255, 255, 0.05)', selected: 'rgba(255, 255, 255, 0.1)' }
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: { fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 800 },
    h4: { fontSize: '1.1rem', fontWeight: 700 },
    h5: { fontSize: '1rem', fontWeight: 700 },
    h6: { fontSize: '0.9rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.8rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.75rem', fontWeight: 700 },
    body1: { fontSize: '0.8125rem' },
    body2: { fontSize: '0.75rem' },
    caption: { fontSize: '0.65rem' },
    button: { fontSize: '0.8rem', fontWeight: 700, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: mode === 'light' ? '0 4px 20px rgba(15, 23, 42, 0.03)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
          border: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.04)' : '1px solid rgba(255, 255, 255, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '6px 16px',
          boxShadow: 'none',
          '&:active': { transform: 'scale(0.96)' },
          transition: 'transform 0.15s ease-in-out, background-color 0.2s, box-shadow 0.2s',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: mode === 'light' ? '0 4px 14px rgba(15, 23, 42, 0.2)' : '0 4px 14px rgba(255, 255, 255, 0.1)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#fff',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          backgroundColor: mode === 'light' ? '#f8fafc' : '#020617',
          '& fieldset': { borderColor: 'transparent' },
          '&:hover fieldset': { borderColor: mode === 'light' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)' },
          '&.Mui-focused fieldset': { borderColor: '#4f46e5', borderWidth: '2px' },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '60px',
          backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderTop: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '4px 0',
          '&.Mui-selected': { color: '#4f46e5' },
        },
      },
    },
  },
});
