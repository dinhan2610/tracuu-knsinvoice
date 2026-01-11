import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import PublicInvoiceLookup from './Pages/PublicInvoiceLookup'
import theme from './theme'
import './App.css'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PublicInvoiceLookup />
    </ThemeProvider>
  )
}

export default App
