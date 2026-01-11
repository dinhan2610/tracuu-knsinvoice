import { createTheme } from '@mui/material/styles';

// Tạo custom theme với typography được tối ưu
const theme = createTheme({
  typography: {
    // Font family chính - Inter cho UI, Noto Sans cho tiếng Việt
    fontFamily: '"Inter", "Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    
    // Headings
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0em',
    },
    
    // Body text
    body1: {
      letterSpacing: '0.01em',
      fontWeight: 400,
    },
    body2: {
      letterSpacing: '0.01em',
      fontWeight: 400,
    },
    
    // Buttons
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none', // Không viết hoa tự động
    },
  },
  
  // Custom palette
  palette: {
    primary: {
      main: '#06b6d4', // Cyan
      dark: '#0891b2',
      light: '#22d3ee',
    },
    secondary: {
      main: '#0f172a', // Dark blue
    },
    success: {
      main: '#10b981',
    },
    error: {
      main: '#ef4444',
    },
  },
  
  // Shape
  shape: {
    borderRadius: 8,
  },
  
  // Components customization
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontWeight: 500,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          // Tối ưu rendering cho tất cả text
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
  },
});

export default theme;
