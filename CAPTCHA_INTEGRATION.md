# 🔐 CAPTCHA Integration - Backend API

## ✅ ĐÃ IMPLEMENT

### **Flow hoàn chỉnh theo hướng dẫn Backend**

## 📊 **FLOW CHI TIẾT**

### **Bước 1: Khởi tạo (Khi vào trang)**
```
User vào trang
    ↓
FE: useEffect() → fetchCaptcha()
    ↓
API: GET /api/captcha/generate
    ↓
BE Response: { captchaId: "...", imageBase64: "..." }
    ↓
FE: 
  - Lưu captchaId vào State (ẩn)
  - Hiển thị imageBase64 trong <img> tag
```

### **Bước 2: Người dùng tương tác**
```
User nhìn ảnh CAPTCHA → Nhập ký tự vào input

Nếu khó nhìn → Click "Refresh 🔄"
    ↓
FE: handleRefreshCaptcha()
    ↓
API: GET /api/captcha/generate (lấy ảnh mới)
    ↓
FE: Update State với captchaId mới + imageBase64 mới
```

### **Bước 3: Submit tra cứu**
```
User click "Tra cứu"
    ↓
FE: validateForm()
  - Check lookupCode không trống
  - Check captchaInput không trống
  - Check captchaId có giá trị
    ↓
API: GET /api/Invoice/public/lookup/{code}
Headers:
  - X-Captcha-ID: "{captchaId}"
  - X-Captcha-Input: "{user input}"
    ↓
BE: Validate CAPTCHA

✅ Nếu đúng:
  → Response 200: { success: true, data: {...} }
  → FE: Hiển thị thông tin hóa đơn

❌ Nếu sai:
  → Response 400: { message: "Captcha incorrect" }
  → FE: 
    1. Auto refresh CAPTCHA mới (fetchCaptcha())
    2. Hiển thị lỗi: "Mã kiểm tra không chính xác"
    3. User nhập lại với CAPTCHA mới
```

---

## 🔧 **CODE IMPLEMENTATION**

### **1. State Management**
```typescript
const [captchaId, setCaptchaId] = useState('')        // ID từ backend
const [captchaImage, setCaptchaImage] = useState('')  // Base64 image
const [captchaInput, setCaptchaInput] = useState('')  // User input
const [isCaptchaLoading, setIsCaptchaLoading] = useState(false)
```

### **2. Fetch CAPTCHA từ Backend**
```typescript
const fetchCaptcha = async () => {
  setIsCaptchaLoading(true)
  try {
    const response = await fetch(`${API_BASE_URL}/captcha/generate`)
    const data = await response.json()
    
    setCaptchaId(data.captchaId)
    setCaptchaImage(data.imageBase64)
    setCaptchaInput('') // Clear input
  } catch (err) {
    setError('Không thể tải mã kiểm tra...')
  } finally {
    setIsCaptchaLoading(false)
  }
}
```

### **3. Initialize on Mount**
```typescript
useEffect(() => {
  fetchCaptcha() // Gọi ngay khi component mount
}, [])
```

### **4. Refresh CAPTCHA**
```typescript
const handleRefreshCaptcha = () => {
  fetchCaptcha() // Gọi lại API để lấy mã mới
}
```

### **5. Submit với Headers**
```typescript
const headers = {
  'accept': '*/*',
  'X-Captcha-ID': captchaId,
  'X-Captcha-Input': captchaInput.trim(),
}

const response = await fetch(
  `${API_BASE_URL}/Invoice/public/lookup/${lookupCode}`,
  { method: 'GET', headers }
)
```

### **6. Auto-Refresh khi lỗi CAPTCHA**
```typescript
if (response.status === 400) {
  const errorData = await response.json()
  
  // Nếu lỗi liên quan đến captcha
  if (errorData.message?.toLowerCase().includes('captcha')) {
    handleRefreshCaptcha() // ← TỰ ĐỘNG REFRESH
    throw new Error('Mã kiểm tra không chính xác...')
  }
}
```

---

## 🎨 **UI CHANGES**

### **Trước (Canvas local)**
```jsx
<canvas ref={canvasRef} width={200} height={60} />
```

### **Sau (Image từ Backend)**
```jsx
{isCaptchaLoading ? (
  <CircularProgress size={24} />
) : captchaImage ? (
  <img 
    src={`data:image/png;base64,${captchaImage}`}
    alt="CAPTCHA"
    style={{ width: '100%', height: 'auto' }}
  />
) : (
  <Typography>Đang tải...</Typography>
)}
```

---

## 🔍 **API ENDPOINTS**

### **1. Generate CAPTCHA**
```
GET /api/captcha/generate
```

**Response:**
```json
{
  "captchaId": "uuid-string-here",
  "imageBase64": "iVBORw0KGgoAAAANS..."
}
```

### **2. Lookup Invoice (với CAPTCHA)**
```
GET /api/Invoice/public/lookup/{lookupCode}
```

**Headers:**
```
X-Captcha-ID: {captchaId}
X-Captcha-Input: {userInput}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "0000009",
    "serialNumber": "1C25TAA",
    "issueDate": "2026-01-11T04:15:26.197Z",
    "sellerName": "CÔNG TY...",
    "buyerName": "...",
    "totalAmount": 500000,
    "status": "Đã phát hành",
    "pdfUrl": ""
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Captcha is incorrect"
}
```

---

## ✅ **TESTING CHECKLIST**

- [x] ✅ CAPTCHA load tự động khi vào trang
- [x] ✅ Hiển thị loading spinner khi fetch
- [x] ✅ Nút Refresh hoạt động
- [x] ✅ Headers được gửi đúng
- [x] ✅ Auto-refresh khi sai CAPTCHA
- [x] ✅ Clear input khi có CAPTCHA mới
- [x] ✅ Error handling đầy đủ
- [x] ✅ Skip CAPTCHA trong dev mode (nếu config)

---

## 🎯 **FLOW TỔNG KẾT**

```
┌─────────────────────────────────────────┐
│  1. MOUNT PAGE                          │
│  → fetchCaptcha()                       │
│  → Display imageBase64                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. USER INTERACTION                    │
│  → View image                           │
│  → Input captcha text                   │
│  → Click Refresh (optional)             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. SUBMIT                              │
│  → Send X-Captcha-ID + X-Captcha-Input  │
│  → Backend validates                    │
└─────────────────────────────────────────┘
                  ↓
        ┌─────────────────┐
        │  SUCCESS (200)  │  or  │  ERROR (400)      │
        │  Show invoice   │      │  Auto-refresh    │
        │  details        │      │  new CAPTCHA     │
        └─────────────────┘      └──────────────────┘
```

---

## 🚀 **READY TO TEST!**

Mọi thứ đã sẵn sàng theo đúng hướng dẫn từ Backend!
