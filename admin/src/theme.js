import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    primary: {
      main: '#0f172a', // slate-900
      light: '#334155',
    },
    secondary: {
      main: '#4f46e5', // indigo-600
      light: '#6366f1',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b', // slate-500
    },
    divider: 'rgba(15, 23, 42, 0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04)',
          border: '1px solid rgba(15, 23, 42, 0.04)',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          padding: '10px 24px',
          boxShadow: 'none',
          '&:active': {
            transform: 'scale(0.96)',
          },
          transition: 'transform 0.15s ease-in-out, background-color 0.2s, box-shadow 0.2s',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
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
          borderRadius: '16px',
          backgroundColor: '#f8fafc',
          '& fieldset': {
            borderColor: 'transparent',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(15, 23, 42, 0.1)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#4f46e5',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '70px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '8px 0',
          '&.Mui-selected': {
            color: '#4f46e5',
          },
        },
      },
    },
  },
});
