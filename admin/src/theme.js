export const getDesignTokens = (mode) => {
  const isLight = mode === 'light';
  
  return {
    palette: {
      mode,
      primary: { main: '#5B5CE2', light: '#7C7DED', dark: '#4647C0' },
      secondary: { main: '#737780', light: '#9699A3', dark: '#50545C' },
      background: { 
        default: isLight ? '#F4F5F8' : '#101114', 
        paper: isLight ? '#FFFFFF' : '#17181D',
        elevated: isLight ? '#FFFFFF' : '#1E2026'
      },
      text: { 
        primary: isLight ? '#15161A' : '#F5F6F8', 
        secondary: isLight ? '#737780' : '#9699A3' 
      },
      divider: isLight ? '#E4E5EA' : '#2A2C33',
      action: { 
        hover: isLight ? 'rgba(21,22,26,0.04)' : 'rgba(245,246,248,0.04)', 
        selected: isLight ? 'rgba(91,92,226,0.08)' : 'rgba(91,92,226,0.15)' 
      },
      success: { main: '#20B26B' },
      warning: { main: '#E9A23B' },
      error: { main: '#E05252' },
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica", sans-serif',
      h1: { fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' },
      h2: { fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' },
      h3: { fontSize: '20px', fontWeight: 600 },
      h4: { fontSize: '18px', fontWeight: 600 },
      h5: { fontSize: '16px', fontWeight: 600 },
      h6: { fontSize: '15px', fontWeight: 600 },
      subtitle1: { fontSize: '15px', fontWeight: 500 },
      subtitle2: { fontSize: '13px', fontWeight: 500 },
      body1: { fontSize: '15px', fontWeight: 400 },
      body2: { fontSize: '14px', fontWeight: 400 },
      caption: { fontSize: '12px', fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '15px' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '18px',
            boxShadow: 'none',
            border: isLight ? '1px solid #E4E5EA' : '1px solid #2A2C33',
            backgroundColor: isLight ? '#FFFFFF' : '#17181D',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: 'none',
            padding: '10px 20px',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            backgroundColor: '#5B5CE2',
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#4647C0' }
          },
          outlined: {
            borderColor: isLight ? '#E4E5EA' : '#2A2C33',
            color: isLight ? '#15161A' : '#F5F6F8',
            '&:hover': { backgroundColor: isLight ? 'rgba(21,22,26,0.04)' : 'rgba(245,246,248,0.04)' }
          }
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            backgroundColor: isLight ? '#FFFFFF' : '#17181D',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? '#E4E5EA' : '#2A2C33',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#5B5CE2',
            },
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          }
        }
      }
    },
  };
};
