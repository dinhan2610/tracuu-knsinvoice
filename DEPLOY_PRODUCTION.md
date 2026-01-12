# Hướng dẫn Deploy Frontend lên Server

## 📋 Yêu cầu
- Server có nginx
- Domain: `tracuu-knsinvoice.id.vn` đã trỏ về server IP
- SSL certificate (khuyến nghị dùng Let's Encrypt)

## 🚀 Các bước deploy

### 1. Build production
```bash
npm run build
```
➡️ Tạo folder `dist/` chứa static files

### 2. Upload lên server
```bash
# Tạo folder trên server
ssh user@server "mkdir -p /var/www/tracuu-invoice"

# Upload dist folder
scp -r dist/* user@server:/var/www/tracuu-invoice/dist/

# Hoặc dùng rsync (tốt hơn)
rsync -avz --delete dist/ user@server:/var/www/tracuu-invoice/dist/
```

### 3. Cấu hình nginx

**Copy file cấu hình:**
```bash
scp nginx.conf user@server:/etc/nginx/sites-available/tracuu-invoice
```

**Enable site:**
```bash
ssh user@server
cd /etc/nginx/sites-enabled
ln -s /etc/nginx/sites-available/tracuu-invoice .
```

**Test config:**
```bash
nginx -t
```

**Reload nginx:**
```bash
systemctl reload nginx
# hoặc
service nginx reload
```

### 4. Setup SSL (Let's Encrypt)
```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Tạo certificate
certbot --nginx -d tracuu-knsinvoice.id.vn

# Auto-renew
certbot renew --dry-run
```

## 🔧 Troubleshooting

### Captcha không load
1. Check nginx logs:
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

2. Test API proxy:
```bash
curl -v https://tracuu-knsinvoice.id.vn/api/captcha/generate
```

3. Check backend health:
```bash
curl http://159.223.64.31/api/captcha/generate
```

### CORS errors
- Nginx config đã add CORS headers
- Nếu vẫn lỗi, yêu cầu backend team enable CORS cho domain `tracuu-knsinvoice.id.vn`

### Mixed Content errors  
- Đảm bảo SSL đã được cài đặt đúng
- Frontend sẽ gọi `/api` (relative path) → nginx proxy sang backend

## 📝 Backend Requirements

Yêu cầu backend team:
1. **Enable CORS** cho domain `tracuu-knsinvoice.id.vn` và `www.tracuu-knsinvoice.id.vn`
2. **Allow custom headers**: `X-Captcha-ID`, `X-Captcha-Input`
3. **Support preflight** OPTIONS requests

Hoặc có thể để nginx handle CORS (đã config trong nginx.conf)

## ✅ Verify deployment

1. Truy cập: `https://tracuu-knsinvoice.id.vn`
2. Check captcha có hiển thị không
3. Test tra cứu hóa đơn
4. Check console không có lỗi

## 🔄 Update sau này

Khi có code mới:
```bash
# 1. Build lại
npm run build

# 2. Upload
rsync -avz --delete dist/ user@server:/var/www/tracuu-invoice/dist/

# 3. Clear browser cache (Ctrl + Shift + R)
```

Không cần restart nginx nếu chỉ update static files!
