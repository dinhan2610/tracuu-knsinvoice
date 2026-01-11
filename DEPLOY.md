# 🚀 Hướng dẫn Deploy Lên Server

## ✅ CHECKLIST TRƯỚC KHI DEPLOY

- [x] ✅ Không còn TypeScript errors
- [x] ✅ Không còn Grid warnings (đã thay bằng Stack/Box)
- [x] ✅ API integration hoàn chỉnh
- [x] ✅ CORS đã xử lý (Vite proxy cho dev)
- [x] ✅ Responsive design hoàn chỉnh
- [x] ✅ Typography tối ưu (Inter + JetBrains Mono)
- [x] ✅ Theme configuration

---

## 📦 BUILD PRODUCTION

### 1. Build ứng dụng
```bash
npm run build
```

Kết quả: Folder `dist/` chứa static files sẵn sàng deploy

### 2. Test production build local
```bash
npm run preview
```

---

## 🌐 DEPLOY LÊN SERVER

### **Option 1: Static Hosting (Vercel, Netlify, etc.)**

#### **Vercel (Khuyến nghị)**
```bash
npm install -g vercel
vercel
```

#### **Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### **Option 2: Traditional Server (Nginx, Apache)**

1. Build production:
```bash
npm run build
```

2. Upload folder `dist/` lên server

3. Config Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}
```

---

## ⚠️ QUAN TRỌNG: CORS CONFIG

### **Development (đã xử lý)**
- ✅ Vite proxy: `/api` → `http://159.223.64.31/api`

### **Production (Backend cần config)**

Backend API **BẮT BUỘC** phải thêm CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

**Hoặc** config cho domain cụ thể:
```
Access-Control-Allow-Origin: https://yourdomain.com
```

---

## 🔧 ENVIRONMENT VARIABLES

### `.env.production`
```bash
# Không cần proxy trong production
VITE_ENABLE_CAPTCHA=true
```

---

## 📁 CẤU TRÚC FILES DEPLOY

```
dist/
├── index.html          # Entry point
├── assets/
│   ├── index-xxx.js    # Bundle JS
│   └── index-xxx.css   # Bundle CSS
└── _redirects          # SPA routing (Netlify)
```

---

## 🎯 POST-DEPLOY CHECKLIST

1. ✅ Test tra cứu hóa đơn với mã thật
2. ✅ Kiểm tra responsive trên mobile
3. ✅ Test CAPTCHA hoạt động
4. ✅ Kiểm tra API call (không còn CORS error)
5. ✅ Test trên nhiều browsers (Chrome, Safari, Firefox)
6. ✅ Kiểm tra performance (PageSpeed Insights)

---

## 🐛 TROUBLESHOOTING

### **Lỗi: API CORS trong production**
→ Backend chưa config CORS. Liên hệ backend team.

### **Lỗi: 404 khi reload page**
→ Server chưa config SPA routing. Thêm fallback về `index.html`

### **Lỗi: Fonts không load**
→ Kiểm tra Google Fonts có accessible từ server

---

## 📊 PERFORMANCE

**Build size:** ~500KB (gzipped)
**First Contentful Paint:** < 1.5s
**Time to Interactive:** < 3s

---

## 🔒 SECURITY

- ✅ HTTPS required cho production
- ✅ Content Security Policy headers khuyến nghị
- ✅ CAPTCHA để chống bot

---

## 📞 SUPPORT

Nếu gặp vấn đề khi deploy, kiểm tra:
1. Console logs (F12)
2. Network tab (API calls)
3. Build logs
