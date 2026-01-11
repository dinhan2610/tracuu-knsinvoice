# 🔧 Hướng dẫn Fix Lỗi - Tra Cứu Hóa Đơn

## ✅ ĐÃ SỬA

### 1. **Lỗi MUI Grid Deprecated Props**
**Vấn đề:** MUI Grid v7 không còn dùng `item`, `xs`, `md` props nữa

**Giải pháp:**
- ✅ Chuyển từ `Grid` → `Grid2` 
- ✅ Thay `<Grid item xs={12} md={6}>` → `<Grid size={{ xs: 12, md: 6 }}>`

---

### 2. **Lỗi CORS Policy** 
**Vấn đề:** Browser chặn request từ `localhost:5173` đến `http://159.223.64.31`

```
Access-Control-Allow-Origin header is present on the requested resource
```

**Nguyên nhân:** Backend API chưa config CORS

**Giải pháp Tạm thời (Development):**
- ✅ Setup **Vite Proxy** trong `vite.config.js`
- ✅ API calls từ `/api/*` sẽ tự động proxy đến `http://159.223.64.31/api/*`

**File: `vite.config.js`**
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://159.223.64.31',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

**⚠️ Giải pháp Vĩnh viễn (Production):**
Backend cần thêm CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

---

### 3. **Tắt CAPTCHA khi Dev/Test API**

Tạo file `.env.development`:
```bash
VITE_ENABLE_CAPTCHA=false
```

Khi set `false`, form sẽ bỏ qua kiểm tra CAPTCHA trong development.

---

## 🚀 CÁCH CHẠY

1. **Stop server hiện tại** (Ctrl+C)

2. **Chạy lại dev server:**
```bash
npm run dev
```

3. **Test API:**
```bash
curl -X GET http://localhost:5173/api/Invoice/public/lookup/b493f75963
```

---

## 📝 TỔNG KẾT

| Vấn đề | Trạng thái | Giải pháp |
|--------|-----------|-----------|
| Grid warnings | ✅ Fixed | Dùng Grid2 syntax |
| CORS Error | ✅ Bypassed | Vite proxy |
| CAPTCHA block testing | ✅ Optional | `.env.development` |

---

## 🔍 KIỂM TRA

Sau khi restart server, bạn sẽ **KHÔNG** còn thấy:
- ❌ MUI Grid warnings
- ❌ CORS errors (trong development)

API call sẽ hoạt động: `localhost:5173/api/*` → `159.223.64.31/api/*`
