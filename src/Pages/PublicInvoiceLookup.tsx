import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Card,
  CardContent,
  IconButton,
  Chip,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SecurityIcon from '@mui/icons-material/Security'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudIcon from '@mui/icons-material/Cloud'
import BoltIcon from '@mui/icons-material/Bolt'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// API Configuration
// Trong development: dùng proxy '/api' -> backend local/proxy
// Trong production: dùng domain mới https://eims.site
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://eims.site/api'

// Interface cho API response - Backend trả về trực tiếp object
interface InvoiceApiResponse {
  invoiceNumber: string
  serialNumber: string
  issueDate: string // ISO 8601 format
  sellerName: string
  buyerName: string
  totalAmount: number
  status: string
  pdfUrl?: string
}

// Interface cho kết quả tra cứu hiển thị
interface InvoiceLookupResult {
  invoiceNumber: string
  serialNumber: string
  issueDate: string // Formatted date
  sellerName: string
  buyerName: string
  totalAmount: number
  status: string
  pdfUrl?: string
}

// Helper function để format ngày tháng
const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (error) {
    return isoString
  }
}

const PublicInvoiceLookup: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Form states
  const [lookupCode, setLookupCode] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InvoiceLookupResult | null>(null)
  const [pdfOpened, setPdfOpened] = useState(false) // Track PDF auto-open status

  // Fetch CAPTCHA từ backend
  const fetchCaptcha = async () => {
    setIsCaptchaLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/Captcha/generate`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Không thể tải mã kiểm tra. Vui lòng thử lại.')
      }

      const data = await response.json()
      
      if (!data.captchaId || !data.imageBase64) {
        throw new Error('Dữ liệu captcha không hợp lệ')
      }
      
      setCaptchaId(data.captchaId)
      setCaptchaImage(data.imageBase64)
      setCaptchaInput('')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải mã kiểm tra. Vui lòng thử lại.'
      setError(errorMsg)
      setCaptchaId('')
      setCaptchaImage('')
    } finally {
      setIsCaptchaLoading(false)
    }
  }

  // Initialize CAPTCHA khi mount
  useEffect(() => {
    fetchCaptcha()
  }, [])

  // Refresh CAPTCHA - gọi API để lấy mã mới
  const handleRefreshCaptcha = () => {
    fetchCaptcha()
  }

  // Validate form - chỉ check trống, backend sẽ validate captcha
  const validateForm = (): boolean => {
    if (!lookupCode.trim()) {
      setError('Vui lòng nhập mã tra cứu hóa đơn')
      return false
    }

    // Skip CAPTCHA validation trong development nếu env var được set
    const skipCaptcha = import.meta.env.VITE_ENABLE_CAPTCHA === 'false'
    
    if (!skipCaptcha) {
      if (!captchaInput.trim()) {
        setError('Vui lòng nhập mã kiểm tra')
        return false
      }

      if (!captchaId) {
        setError('Lỗi hệ thống: Không có mã captcha. Vui lòng thử lại.')
        return false
      }
    }

    return true
  }

  // Handle search
  const handleSearch = async () => {
    setError(null)
    setResult(null)
    setPdfOpened(false) // Reset PDF status

    if (!validateForm()) return

    setIsLoading(true)
    
    // Mở tab trống ngay khi user click để tránh popup blocker
    let pdfWindow: Window | null = null
    const shouldOpenPdf = true // Luôn mở PDF nếu có
    if (shouldOpenPdf) {
      pdfWindow = window.open('about:blank', '_blank')
    }

    try {
      // Call API thực tế với CAPTCHA headers
      const headers: HeadersInit = {
        'accept': '*/*',
      }

      // Thêm CAPTCHA headers nếu không skip
      const skipCaptcha = import.meta.env.VITE_ENABLE_CAPTCHA === 'false'
      if (!skipCaptcha) {
        headers['X-Captcha-ID'] = captchaId
        headers['X-Captcha-Input'] = captchaInput.trim()
      }

      const response = await fetch(
        `${API_BASE_URL}/Invoice/lookup/${lookupCode.trim()}`,
        {
          method: 'GET',
          headers,
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.')
        } else if (response.status === 400) {
          // Backend có thể trả về plain text hoặc JSON
          const contentType = response.headers.get('content-type')
          let errorMessage = ''
          
          if (contentType?.includes('application/json')) {
            const errorData = await response.json().catch(() => ({}))
            errorMessage = errorData.message || 'Yêu cầu không hợp lệ.'
          } else {
            errorMessage = await response.text().catch(() => 'Yêu cầu không hợp lệ.')
          }
          
          // Nếu là lỗi captcha → auto refresh captcha mới
          if (errorMessage.toLowerCase().includes('captcha')) {
            handleRefreshCaptcha()
            throw new Error(errorMessage)
          }
          
          throw new Error(errorMessage)
        } else {
          throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
        }
      }

      const apiResponse: InvoiceApiResponse = await response.json()
      
      if (!apiResponse.invoiceNumber || !apiResponse.serialNumber) {
        throw new Error('Dữ liệu hóa đơn không hợp lệ.')
      }

      // Map API response to display format
      const invoiceResult: InvoiceLookupResult = {
        invoiceNumber: apiResponse.invoiceNumber,
        serialNumber: apiResponse.serialNumber,
        issueDate: formatDate(apiResponse.issueDate),
        sellerName: apiResponse.sellerName,
        buyerName: apiResponse.buyerName || 'Chưa có thông tin',
        totalAmount: apiResponse.totalAmount,
        status: apiResponse.status,
        pdfUrl: apiResponse.pdfUrl || undefined,
      }
      
      setResult(invoiceResult)
      
      // Redirect tab đã mở đến PDF URL
      if (invoiceResult.pdfUrl && pdfWindow && !pdfWindow.closed) {
        pdfWindow.location.href = invoiceResult.pdfUrl
        setPdfOpened(true)
      } else if (invoiceResult.pdfUrl && pdfWindow?.closed) {
        // Tab bị đóng hoặc popup blocker chặn
        console.warn('PDF tab was blocked or closed')
      }
    } catch (err) {
      // Đóng tab trống nếu có lỗi
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close()
      }
      
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: '#0f172a',
          borderBottom: '2px solid #06b6d4'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={2} 
            sx={{ 
              flexGrow: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9,
              },
            }}
            onClick={() => window.location.href = '/'}
          >
            <CloudIcon sx={{ fontSize: 32, color: '#06b6d4' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                Kỷ Nguyên Số
              </Typography>
              <Typography variant="caption" sx={{ color: '#06b6d4' }}>
                Digital Era Solutions
              </Typography>
            </Box>
          </Stack>
          <IconButton
            href="tel:1900xxxx"
            component="a"
            size={isMobile ? "small" : "medium"}
            sx={{ 
              color: '#06b6d4',
              border: '1px solid #06b6d4',
              '&:hover': { 
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
              }
            }}
          >
            <PhoneIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          flexGrow: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 4, md: 8 },
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            alignItems="center"
          >
            {/* Left side - Search Form */}
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper
                elevation={24}
                sx={{
                  p: { xs: 2.5, sm: 3, md: 4 },
                  borderRadius: { xs: 2, md: 3 },
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  boxShadow: { 
                    xs: '0 10px 30px rgba(6, 182, 212, 0.2)',
                    md: '0 20px 60px rgba(6, 182, 212, 0.3)'
                  },
                }}
              >
                <Stack spacing={3}>
                  {/* Title */}
                  <Box>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 800, 
                        color: '#0f172a',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        letterSpacing: '-0.02em',
                        fontFamily: '"Inter", "Noto Sans", sans-serif',
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                      }}
                    >
                      <DescriptionIcon sx={{ fontSize: { xs: 26, md: 32 }, color: '#06b6d4' }} />
                      Tra cứu hóa đơn
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                      }}
                    >
                      Nhập mã tra cứu để xem thông tin chi tiết hóa đơn điện tử
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Error Alert */}
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  {/* Lookup Code Input */}
                  <TextField
                    fullWidth
                    label="Mã nhận hóa đơn / Mã tra cứu"
                    placeholder="Nhập mã số bí mật..."
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    required
                    disabled={isLoading}
                    inputProps={{
                      autoCapitalize: 'off',
                      autoCorrect: 'off',
                      autoComplete: 'off',
                    }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ fontSize: 20, mr: 1, color: '#06b6d4' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#06b6d4',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#06b6d4',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#06b6d4',
                      },
                    }}
                  />

                  {/* CAPTCHA */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      Mã kiểm tra <span style={{ color: '#ef4444' }}>*</span>
                      <Typography 
                        component="span" 
                        variant="caption" 
                        sx={{ ml: 1, color: '#64748b', fontWeight: 400 }}
                      >
                        (Phân biệt chữ hoa/thường)
                      </Typography>
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          flex: 1,
                          border: '2px solid #e5e7eb',
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                          minHeight: { xs: 50, sm: 60 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f9ff',
                        }}
                      >
                        {isCaptchaLoading ? (
                          <Stack alignItems="center" spacing={1}>
                            <CircularProgress size={24} sx={{ color: '#06b6d4' }} />
                            <Typography variant="caption" color="text.secondary">
                              Đang tải...
                            </Typography>
                          </Stack>
                        ) : captchaImage ? (
                          <img
                            src={`data:image/png;base64,${captchaImage}`}
                            alt="CAPTCHA"
                            style={{ 
                              width: '100%', 
                              height: 'auto', 
                              display: 'block',
                            }}
                            onError={() => setError('Không thể hiển thị mã kiểm tra. Vui lòng thử lại.')}
                          />
                        ) : (
                          <Stack alignItems="center" spacing={1} sx={{ p: 2, maxWidth: '100%' }}>
                            <Typography variant="caption" color="error" textAlign="center" sx={{ fontSize: '0.7rem' }}>
                              Chưa tải được mã
                            </Typography>
                            {error && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.7rem', 
                                  color: '#ef4444',
                                  textAlign: 'center',
                                  fontWeight: 500,
                                  px: 1
                                }}
                              >
                                {error}
                              </Typography>
                            )}
                            <Button 
                              size="small" 
                              onClick={handleRefreshCaptcha}
                              sx={{ fontSize: '0.75rem', mt: 1 }}
                            >
                              Thử lại
                            </Button>
                          </Stack>
                        )}
                      </Box>
                      <IconButton
                        onClick={handleRefreshCaptcha}
                        disabled={isLoading || isCaptchaLoading}
                        sx={{
                          backgroundColor: '#f1f5f9',
                          '&:hover': {
                            backgroundColor: '#e2e8f0',
                          },
                          '&:disabled': {
                            backgroundColor: '#f8fafc',
                          },
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: 20, color: '#06b6d4' }} />
                      </IconButton>
                    </Stack>
                    <TextField
                      fullWidth
                      placeholder="Nhập chính xác mã kiểm tra..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      required
                      disabled={isLoading}
                      inputProps={{
                        autoCapitalize: 'off',
                        autoCorrect: 'off',
                        autoComplete: 'off',
                      }}
                      helperText="Nếu không rõ, click nút làm mới để tải mã mới"
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {/* Search Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon sx={{ fontSize: 20 }} />}
                    sx={{
                      py: 1.5,
                      backgroundColor: '#06b6d4',
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: '0 10px 30px rgba(6, 182, 212, 0.4)',
                      '&:hover': {
                        backgroundColor: '#0891b2',
                        boxShadow: '0 15px 40px rgba(6, 182, 212, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isLoading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                  </Button>
                </Stack>
              </Paper>
            </Box>

            {/* Right side - Features/Illustration */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, display: { xs: result ? 'none' : 'block', md: 'block' } }}>
              <Stack spacing={3}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#fff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    mb: 2,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                  }}
                >
                  Giải pháp hóa đơn điện tử
                  <br />
                  <span style={{ color: '#06b6d4' }}>Thời đại số</span>
                </Typography>

                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#94a3b8', 
                    mb: 3,
                    fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                  }}
                >
                  Tra cứu nhanh chóng, chính xác, bảo mật tuyệt đối
                </Typography>

                {/* Features */}
                <Stack spacing={2}>
                  {[
                    { icon: <CheckCircleIcon sx={{ fontSize: 24 }} />, text: 'Tra cứu 24/7 mọi lúc mọi nơi' },
                    { icon: <SecurityIcon sx={{ fontSize: 24 }} />, text: 'Bảo mật dữ liệu tuyệt đối' },
                    { icon: <BoltIcon sx={{ fontSize: 24 }} />, text: 'Kết quả tức thì trong 2 giây' },
                    { icon: <CloudIcon sx={{ fontSize: 24 }} />, text: 'Đồng bộ với Cơ quan Thuế' },
                  ].map((feature, index) => (
                    <Card
                      key={index}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          transform: 'translateX(10px)',
                        },
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ color: '#06b6d4' }}>{feature.icon}</Box>
                          <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                            {feature.text}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Result Section */}
          {result && (
            <Box sx={{ mt: 6 }}>
              {/* Alert thông báo PDF đã mở */}
              {pdfOpened && result.pdfUrl && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid #06b6d4',
                    '& .MuiAlert-icon': {
                      color: '#06b6d4',
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>
                    📄 Hóa đơn PDF đã được mở trong tab mới
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#64748b' }}>
                    Nếu không thấy, vui lòng kiểm tra popup blocker hoặc click nút bên dưới để mở lại
                  </Typography>
                </Alert>
              )}
              
              <Paper
                elevation={12}
                sx={{
                  p: { xs: 2.5, sm: 3, md: 4 },
                  borderRadius: { xs: 2, md: 3 },
                  backgroundColor: '#fff',
                  border: { xs: '1px solid #06b6d4', md: '2px solid #06b6d4' },
                }}
              >
                <Stack spacing={3}>
                  {/* Header: Tiêu đề + Status */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 800, 
                        color: '#0f172a', 
                        letterSpacing: '-0.02em',
                        fontFamily: '"Inter", "Noto Sans", sans-serif',
                        fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.75rem' },
                      }}
                    >
                      Thông tin hóa đơn
                    </Typography>
                    <Chip 
                      label={result.status} 
                      color="success" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
                        height: { xs: 28, sm: 32 },
                        px: 1.5,
                        '& .MuiChip-label': {
                          px: 1,
                        }
                      }} 
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={{ xs: 3, md: 3.5 }}>
                    {/* Row 1: Số hóa đơn + Ký hiệu */}
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 3, sm: 4 }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          sx={{ 
                            color: '#64748b',
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', md: '0.9rem' },
                            mb: 1,
                          }}
                        >
                          Số hóa đơn
                        </Typography>
                        <Typography 
                          sx={{ 
                            fontWeight: 700,
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                            letterSpacing: '-0.02em',
                            color: '#0f172a',
                            fontSize: { xs: '1.5rem', md: '1.65rem' },
                            fontVariantNumeric: 'lining-nums',
                            fontFeatureSettings: '"tnum" 0',
                          }}
                        >
                          {result.invoiceNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          sx={{ 
                            color: '#64748b',
                            fontWeight: 500,
                            fontSize: { xs: '0.875rem', md: '0.9rem' },
                            mb: 1,
                          }}
                        >
                          Ký hiệu
                        </Typography>
                        <Typography 
                          sx={{ 
                            fontWeight: 700,
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                            letterSpacing: '0.05em',
                            color: '#0f172a',
                            fontSize: { xs: '1.5rem', md: '1.65rem' },
                            fontVariantNumeric: 'lining-nums',
                            textTransform: 'uppercase',
                          }}
                        >
                          {result.serialNumber}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Row 2: Ngày phát hành */}
                    <Box>
                      <Typography 
                        sx={{ 
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          mb: 1,
                        }}
                      >
                        Ngày phát hành
                      </Typography>
                      <Typography 
                        sx={{
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                          fontVariantNumeric: 'lining-nums',
                          letterSpacing: '-0.01em',
                          fontWeight: 600,
                          fontSize: { xs: '1.15rem', md: '1.2rem' },
                          color: '#0f172a',
                        }}
                      >
                        {result.issueDate}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Row 3: Người bán */}
                    <Box>
                      <Typography 
                        sx={{ 
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          mb: 1,
                        }}
                      >
                        Người bán
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1.05rem', md: '1.1rem' },
                          color: '#0f172a',
                          lineHeight: 1.5,
                          fontFamily: '"Inter", "Noto Sans", sans-serif',
                        }}
                      >
                        {result.sellerName}
                      </Typography>
                    </Box>

                    {/* Row 4: Người mua */}
                    <Box>
                      <Typography 
                        sx={{ 
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          mb: 1,
                        }}
                      >
                        Người mua
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1.05rem', md: '1.1rem' },
                          color: result.buyerName === 'Chưa có thông tin' ? '#94a3b8' : '#0f172a',
                          lineHeight: 1.5,
                          fontStyle: result.buyerName === 'Chưa có thông tin' ? 'italic' : 'normal',
                          fontFamily: '"Inter", "Noto Sans", sans-serif',
                        }}
                      >
                        {result.buyerName}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Row 5: Tổng tiền */}
                    <Box>
                      <Typography 
                        sx={{ 
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: { xs: '0.875rem', md: '0.9rem' },
                          mb: 1,
                        }}
                      >
                        Tổng tiền
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 800,
                          color: '#06b6d4',
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                          fontSize: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
                          letterSpacing: '-0.03em',
                          fontVariantNumeric: 'lining-nums',
                          fontFeatureSettings: '"tnum" 0',
                        }}
                      >
                        {result.totalAmount.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Box>
                  </Stack>

                  {result.pdfUrl && (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<DescriptionIcon sx={{ fontSize: 22 }} />}
                      onClick={() => window.open(result.pdfUrl, '_blank')}
                      sx={{
                        py: 1.75,
                        backgroundColor: '#06b6d4',
                        color: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                        '&:hover': {
                          backgroundColor: '#0891b2',
                          boxShadow: '0 6px 16px rgba(6, 182, 212, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      📄 Click để xem/tải hóa đơn PDF
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: '#0f172a',
          color: '#fff',
          py: { xs: 4, md: 6 },
          borderTop: '2px solid #06b6d4',
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
          >
            <Box sx={{ flex: 1 }}>
              <Stack spacing={2}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#06b6d4',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                    fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                  }}
                >
                  CÔNG TY CỔ PHẦN GIẢI PHÁP<br />TỔNG THỂ KỶ NGUYÊN SỐ
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <LocationOnIcon sx={{ fontSize: 18, color: '#06b6d4', mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Địa chỉ: Tầng 10, Tòa nhà Diamond Plaza, 34 Lê Duẩn, Quận 1, TP.HCM
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#94a3b8',
                        '& strong': {
                          fontFamily: '"JetBrains Mono", monospace',
                          letterSpacing: '0.05em',
                        }
                      }}
                    >
                      Hotline: <strong>1900 xxxx</strong>
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Email: contact@digitalerasolution.com
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DescriptionIcon sx={{ fontSize: 18, color: '#06b6d4' }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#94a3b8',
                        '& strong': {
                          fontFamily: '"JetBrains Mono", monospace',
                          letterSpacing: '0.05em',
                        }
                      }}
                    >
                      MST: <strong>0123456789</strong>
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack spacing={2} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Box
                  sx={{
                    border: '2px solid #06b6d4',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 40, color: '#06b6d4' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
                    ISO 27001:2013
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Chứng nhận Bảo mật
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
          <Divider sx={{ my: 3, borderColor: 'rgba(6, 182, 212, 0.2)' }} />
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#64748b' }}>
            © 2026 Digital Era Solutions. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default PublicInvoiceLookup
