#!/bin/bash

# Script deploy nhanh lên server
# Sửa lại thông tin server của bạn

SERVER_USER="your_user"
SERVER_HOST="your_server_ip"
SERVER_PATH="/var/www/tracuu-invoice/dist"

echo "🚀 Deploying to production..."

# Build
echo "📦 Building..."
npm run build

# Upload
echo "📤 Uploading..."
rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo "✅ Deploy complete!"
echo "🌐 Visit: https://tracuu-knsinvoice.id.vn"
echo ""
echo "⚠️  Nhớ hard refresh browser (Ctrl + Shift + R) để clear cache!"
