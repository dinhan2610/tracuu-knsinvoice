import React, { useState, useEffect, useRef } from 'react'
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
// Trong development: dùng proxy '/api' -> 'http://159.223.64.31/api'
// Trong production: cần config CORS trên backend hoặc dùng same domain
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://159.223.64.31/api'

// Interface cho API response
interface InvoiceApiResponse {
  success: boolean
  data: {
    invoiceNumber: string
    serialNumber: string
    issueDate: string // ISO 8601 format
    sellerName: string
    buyerName: string
    totalAmount: number
    status: string
    pdfUrl: string
  }
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
  const [captchaText, setCaptchaText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InvoiceLookupResult | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let captcha = ''
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(captcha)
    return captcha
  }

  // Draw CAPTCHA on canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f0f9ff')
    gradient.addColorStop(1, '#e0f2fe')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(6, 182, 212, ${Math.random() * 0.3})`
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // Draw text với font monospace đẹp hơn
    ctx.font = 'bold 36px "JetBrains Mono", "Roboto Mono", "Courier New", monospace'
    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add slight rotation and spacing
    const charWidth = canvas.width / text.length
    for (let i = 0; i < text.length; i++) {
      ctx.save()
      const x = charWidth * i + charWidth / 2
      const y = canvas.height / 2
      ctx.translate(x, y)
      ctx.rotate((Math.random() - 0.5) * 0.3)
      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }

    // Add dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(6, 182, 212, ${Math.random() * 0.5})`
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      )
    }
  }

  // Initialize CAPTCHA
  useEffect(() => {
    const text = generateCaptcha()
    drawCaptcha(text)
  }, [])

  // Refresh CAPTCHA
  const handleRefreshCaptcha = () => {
    const text = generateCaptcha()
    drawCaptcha(text)
    setCaptchaInput('')
  }

  // Validate form
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

      if (captchaInput.toUpperCase() !== captchaText) {
        setError('Mã kiểm tra không chính xác')
        handleRefreshCaptcha()
        return false
      }
    }

    return true
  }

  // Handle search
  const handleSearch = async () => {
    setError(null)
    setResult(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Call API thực tế
      const response = await fetch(
        `${API_BASE_URL}/Invoice/public/lookup/${lookupCode.trim()}`,
        {
          method: 'GET',
          headers: {
            'accept': '*/*',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.')
        } else if (response.status === 400) {
          throw new Error('Mã tra cứu không hợp lệ.')
        } else {
          throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
        }
      }

      const apiResponse: InvoiceApiResponse = await response.json()
      
      if (!apiResponse.success) {
        throw new Error('Không tìm thấy thông tin hóa đơn.')
      }

      // Map API response to display format
      const invoiceResult: InvoiceLookupResult = {
        invoiceNumber: apiResponse.data.invoiceNumber,
        serialNumber: apiResponse.data.serialNumber,
        issueDate: formatDate(apiResponse.data.issueDate),
        sellerName: apiResponse.data.sellerName,
        buyerName: apiResponse.data.buyerName || 'Chưa có thông tin',
        totalAmount: apiResponse.data.totalAmount,
        status: apiResponse.data.status,
        pdfUrl: apiResponse.data.pdfUrl || undefined,
      }
      
      setResult(invoiceResult)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.')
      }
      handleRefreshCaptcha()
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
          {!isMobile && (
            <Button
              href="tel:1900xxxx"
              component="a"
              startIcon={<PhoneIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                color: '#06b6d4', 
                textTransform: 'none',
                border: '1px solid #06b6d4',
                '&:hover': { 
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  borderColor: '#06b6d4'
                }
              }}
            >
              Liên hệ
            </Button>
          )}
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
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  boxShadow: '0 20px 60px rgba(6, 182, 212, 0.3)',
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
                      }}
                    >
                      <DescriptionIcon sx={{ fontSize: 32, color: '#06b6d4' }} />
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
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    required
                    disabled={isLoading}
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
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          flex: 1,
                          border: '2px solid #e5e7eb',
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          width={200}
                          height={60}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </Box>
                      <IconButton
                        onClick={handleRefreshCaptcha}
                        disabled={isLoading}
                        sx={{
                          backgroundColor: '#f1f5f9',
                          '&:hover': {
                            backgroundColor: '#e2e8f0',
                          },
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: 20, color: '#06b6d4' }} />
                      </IconButton>
                    </Stack>
                    <TextField
                      fullWidth
                      placeholder="Nhập mã kiểm tra..."
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      required
                      disabled={isLoading}
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
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Stack spacing={3}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#fff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    mb: 2,
                  }}
                >
                  Giải pháp hóa đơn điện tử
                  <br />
                  <span style={{ color: '#06b6d4' }}>Thời đại số</span>
                </Typography>

                <Typography variant="h6" sx={{ color: '#94a3b8', mb: 3 }}>
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
              <Paper
                elevation={12}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  backgroundColor: '#fff',
                  border: '2px solid #06b6d4',
                }}
              >
                <Stack spacing={3}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 800, 
                        color: '#0f172a', 
                        mb: 1,
                        letterSpacing: '-0.01em',
                        fontFamily: '"Inter", "Noto Sans", sans-serif',
                      }}
                    >
                      Thông tin hóa đơn
                    </Typography>
                    <Chip label={result.status} color="success" />
                  </Box>

                  <Divider />

                  <Stack spacing={3}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={3}
                    >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Số hóa đơn</Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                          letterSpacing: '0.05em',
                          color: '#0f172a',
                        }}
                      >
                        {result.invoiceNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">Ký hiệu</Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                          letterSpacing: '0.05em',
                          color: '#0f172a',
                        }}
                      >
                        {result.serialNumber}
                      </Typography>
                    </Box>
                    </Stack>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ngày phát hành</Typography>
                      <Typography 
                        variant="body1"
                        sx={{
                          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '0.02em',
                          fontWeight: 600,
                        }}
                      >
                        {result.issueDate}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Người bán</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: '#0f172a',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {result.sellerName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Người mua</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.05rem',
                          color: result.buyerName === 'Chưa có thông tin' ? '#94a3b8' : '#0f172a',
                          letterSpacing: '0.01em',
                          fontStyle: result.buyerName === 'Chưa có thông tin' ? 'italic' : 'normal',
                        }}
                      >
                        {result.buyerName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Tổng tiền</Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#06b6d4',
                          fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                          fontSize: '1.5rem',
                          letterSpacing: '0.02em',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {result.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </Typography>
                    </Box>
                  </Stack>

                  {result.pdfUrl && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DescriptionIcon sx={{ fontSize: 20 }} />}
                      sx={{
                        borderColor: '#06b6d4',
                        color: '#06b6d4',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#0891b2',
                          backgroundColor: 'rgba(6, 182, 212, 0.05)',
                        },
                      }}
                    >
                      Tải hóa đơn PDF
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
          py: 6,
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
                  }}
                >
                  CÔNG TY CỔ PHẦN GIẢI PHÁP TỔNG THỂ KỶ NGUYÊN SỐ
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
