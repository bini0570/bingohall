import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    primary: {
      main: '#0f172a',
      light: '#334155',
    },
    secondary: {
      main: '#4f46e5',
      light: '#6366f1',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: 'rgba(15, 23, 42, 0.06)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13, // Smaller base font size
    h1: { fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 800 }, // Used for page headers
    h4: { fontSize: '1.1rem', fontWeight: 700 },
    h5: { fontSize: '1rem', fontWeight: 700 }, // Used for card titles
    h6: { fontSize: '0.9rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.8rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.75rem', fontWeight: 700 },
    body1: { fontSize: '0.8125rem' },
    body2: { fontSize: '0.75rem' },
    caption: { fontSize: '0.65rem' },
    button: { fontSize: '0.8rem', fontWeight: 700, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12, // Slightly smaller border radius for compactness
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          border: '1px solid rgba(15, 23, 42, 0.04)',
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
          borderRadius: '10px',
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
          height: '60px', // Tighter bottom nav
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
          padding: '4px 0',
          '&.Mui-selected': {
            color: '#4f46e5',
          },
        },
      },
    },
  },
});
