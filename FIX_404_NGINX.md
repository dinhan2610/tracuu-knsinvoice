# 🚨 LỖI 404 - NGINX CHƯA ĐƯỢC CẤU HÌNH

## ❌ Vấn đề hiện tại:
Frontend gọi: `https://tracuu-knsinvoice.id.vn/api/Captcha/generate`
→ Server trả về: **404 Not Found**

## ✅ Nguyên nhân:
Nginx trên server `tracuu-knsinvoice.id.vn` chưa được cấu hình để **proxy** request `/api/*` sang backend `http://159.223.64.31/api/*`

## 🔧 GIẢI PHÁP - Cấu hình Nginx:

### 1. SSH vào server
```bash
ssh user@tracuu-knsinvoice.id.vn
```

### 2. Tạo/Sửa file nginx config
```bash
sudo nano /etc/nginx/sites-available/tracuu-invoice
```

### 3. Thêm config này:
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name tracuu-knsinvoice.id.vn;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/tracuu-knsinvoice.id.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tracuu-knsinvoice.id.vn/privkey.pem;

    # Root directory cho frontend build
    root /var/www/tracuu-invoice/dist;
    index index.html;

    # ⭐ QUAN TRỌNG: Proxy API requests sang backend
    location /api/ {
        proxy_pass http://159.223.64.31/api/;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, X-Captcha-ID, X-Captcha-Input' always;
        
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Enable site (nếu chưa)
```bash
sudo ln -s /etc/nginx/sites-available/tracuu-invoice /etc/nginx/sites-enabled/
```

### 5. Test config
```bash
sudo nginx -t
```

### 6. Reload nginx
```bash
sudo systemctl reload nginx
```

## ✅ Verify

Test từ máy local:
```bash
curl -I https://tracuu-knsinvoice.id.vn/api/Captcha/generate
```

Nếu thành công sẽ thấy:
```
HTTP/1.1 200 OK
Content-Type: application/json
```

## 📋 Checklist

- [ ] SSH vào server
- [ ] Tạo/sửa file nginx config
- [ ] Thêm location /api/ proxy
- [ ] Test config: `nginx -t`
- [ ] Reload nginx
- [ ] Test từ browser: `https://tracuu-knsinvoice.id.vn`
- [ ] Captcha load thành công ✅

## 🔥 Nếu không có quyền server

Gửi file `nginx.conf` cho admin server và yêu cầu:
1. Cấu hình nginx theo file
2. Reload nginx
3. Test endpoint

---

**Sau khi nginx được cấu hình, trang web sẽ hoạt động bình thường!** 🚀
