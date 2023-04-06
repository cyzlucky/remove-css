import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { Theme, ThemeProvider, createTheme } from '@mui/material';

const defaultTheme = createTheme({
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
        }
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          '@media all': {
            minHeight: "55px",
          },
        }
      },
    }
  }
});

interface ButtonAppBarProps {
  MenuComponent?: React.ReactNode;
  theme?: Theme;
}

export default function ButtonAppBar({ MenuComponent, theme = defaultTheme }: ButtonAppBarProps) {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <ThemeProvider theme={theme}>
        <AppBar
          position="static"
        >
          <Toolbar>
            <DeleteSweepIcon />
            <Box sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Remove Css
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {MenuComponent && MenuComponent}
          </Toolbar>
        </AppBar>
      </ThemeProvider>
    </Box>
  );
}
