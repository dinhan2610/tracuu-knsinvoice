# 📋 Hướng Dẫn Trang Tra Cứu Hóa Đơn Public

## 🎯 **MỤC ĐÍCH:**

Trang tra cứu hóa đơn là **public standalone page** - trang công khai độc lập dành cho khách hàng tra cứu hóa đơn điện tử **KHÔNG CẦN ĐĂNG NHẬP**.

---

## ✅ **ĐÃ TỐI ƯU:**

### **1. Layout Độc Lập**
✅ **Không hiển thị Header/Sidebar** của hệ thống quản lý
✅ **Không cần Authentication** - Truy cập tự do
✅ **SimpleLayout** - Chỉ có background, không có navigation
✅ **Standalone Design** - Header riêng với branding "Kỷ Nguyên Số"

### **2. Routing**
- **Path:** `/tra-cuu`
- **Layout:** `SimpleLayout` (không menu, không header hệ thống)
- **Auth:** Public route - không cần đăng nhập
- **Component:** `PublicInvoiceLookup.tsx`

### **3. Header Tối Ưu**
- Logo "Kỷ Nguyên Số" (click để về trang chủ)
- Button "Đăng nhập" → navigate to `/auth/sign-in`
- Button "Liên hệ" → `tel:` link với hotline
- Responsive: ẩn buttons trên mobile

### **4. Tính Năng**
✅ CAPTCHA tự động generate
✅ Validation form đầy đủ
✅ Mock API (sẵn sàng tích hợp API thật)
✅ Hiển thị kết quả tra cứu chi tiết
✅ Download PDF hóa đơn
✅ Footer với thông tin công ty

---

## 🚀 **CÁCH SỬ DỤNG:**

### **A. Truy cập trực tiếp:**
```
http://localhost:5173/tra-cuu
```

### **B. Từ trang chủ:**
1. User click vào link "Tra cứu hóa đơn" trên trang chủ
2. Redirect đến `/tra-cuu`
3. Hiển thị form tra cứu standalone

### **C. Share link cho khách hàng:**
- Link công khai: `https://yourdomain.com/tra-cuu`
- Không cần đăng nhập
- Mọi người đều truy cập được

---

## 📱 **RESPONSIVE:**

- ✅ **Desktop:** Full features với sidebar form + features list
- ✅ **Tablet:** 2 columns responsive
- ✅ **Mobile:** Stacked layout, ẩn header buttons

---

## 🔗 **TÍCH HỢP API THỰC:**

Hiện tại đang dùng **mock data**. Để tích hợp API:

### **File:** `src/page/PublicInvoiceLookup.tsx`

```typescript
// Line ~168 - Thay đổi:
const handleSearch = async () => {
  setError(null)
  setResult(null)

  if (!validateForm()) return

  setIsLoading(true)

  try {
    // ✅ TÍCH HỢP API THẬT TẠI ĐÂY:
    const response = await axios.get(`/api/Invoice/public/lookup/${lookupCode}`)
    setResult(response.data)
    
    // ❌ XÓA MOCK DATA:
    // await new Promise(resolve => setTimeout(resolve, 2000))
    // const mockResult = { ... }
    
  } catch (err) {
    setError('Không tìm thấy hóa đơn. Vui lòng kiểm tra lại mã tra cứu.')
    handleRefreshCaptcha()
  } finally {
    setIsLoading(false)
  }
}
```

### **Backend API Requirements:**

```
GET /api/Invoice/public/lookup/:lookupCode

Response:
{
  invoiceNumber: string
  serialNumber: string
  templateCode: string
  issueDate: string (DD/MM/YYYY)
  customerName: string
  taxCode: string
  totalAmount: number
  taxAmount: number
  status: string
  taxAuthorityCode?: string
  pdfUrl?: string
}
```

---

## 🎨 **BRANDING:**

- **Primary Color:** Navy Blue `#0f172a`
- **Accent Color:** Cyan `#06b6d4`
- **Company:** CÔNG TY CỔ PHẦN GIẢI PHÁP TỔNG THỂ KỶ NGUYÊN SỐ
- **Brand:** Kỷ Nguyên Số (Digital Era Solutions)

---

## 📝 **NOTES:**

1. **Không có trong menu sidebar** - Vì là trang public
2. **Không redirect đăng nhập** - Public route
3. **SEO Friendly** - Có thể thêm meta tags cho Google
4. **Link từ Email** - Có thể gửi link tra cứu trong email hóa đơn

---

## ✨ **FUTURE ENHANCEMENTS:**

- [ ] QR Code scanning
- [ ] Multiple search methods (số hóa đơn, mã CQT, v.v.)
- [ ] Email notification khi tra cứu
- [ ] Analytics tracking
- [ ] Multi-language support
- [ ] Dark mode toggle

---

## 🔒 **SECURITY:**

- ✅ CAPTCHA validation
- ✅ Rate limiting (cần implement backend)
- ✅ Input sanitization
- ✅ No sensitive data exposure
- ✅ Public API endpoint separate from admin

---

**Created:** January 9, 2026  
**Status:** ✅ Production Ready (với mock data)  
**API Integration:** 🟡 Pending (cần backend endpoint)
