# Hướng dẫn Triển khai & Vận hành (Deployment Guide)

Tài liệu hướng dẫn chi tiết các phương thức triển khai ứng dụng Text-to-Speech lên môi trường máy chủ hoặc đám mây (Cloud / VPS / Self-hosted).

---

## 1. Yêu cầu Hệ thống (Prerequisites)
- **Node.js**: Phiên bản `>= 18.0.0` (Khuyến nghị Node 20 LTS)
- **NPM / PNPM / Yarn**: Trình quản lý gói
- **FFmpeg**: Yêu cầu cài đặt trên máy chủ nếu xử lý chuyển đổi định dạng audio chuyên sâu (mp3/aac) hoặc ghép chunk
- **Gemini API Key**: Khóa truy cập Google AI Studio API (`GEMINI_API_KEY`)

---

## 2. Triển khai bằng Docker & Docker Compose (Khuyến nghị)

### 2.1 Tạo `Dockerfile` (nếu chạy container hóa)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache ffmpeg
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### 2.2 Tạo `docker-compose.yml`
```yaml
version: '3.8'

services:
  tts-app:
    build: .
    container_name: gemini-tts-service
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - tts-audio-data:/app/data

volumes:
  tts-audio-data:
```

Chạy bằng lệnh:
```bash
docker-compose up -d --build
```

---

## 3. Triển khai trực tiếp trên VPS với PM2

### 3.1 Cài đặt PM2 toàn cục
```bash
npm install -g pm2
```

### 3.2 Cấu hình tệp `ecosystem.config.js`
```javascript
module.exports = {
  apps: [
    {
      name: "gemini-tts-app",
      script: "npm",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

### 3.3 Khởi chạy ứng dụng
```bash
# Cài đặt thư viện & build ứng dụng
npm install
npm run build

# Khởi động dịch vụ qua PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 4. Cấu hình Nginx Reverse Proxy & SSL

Mẫu cấu hình Nginx với SSL Certbot:

```nginx
server {
    listen 80;
    server_name tts.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tts.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/tts.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tts.yourdomain.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Tăng timeout cho long-form audio generation
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

---

## 5. Triển khai trên Cloud PaaS (Render / Railway / Vercel)

### 5.1 Railway / Render
1. Kết nối kho lưu trữ GitHub với Railway hoặc Render.
2. Thiết lập Environment Variables:
   - `GEMINI_API_KEY`: Khóa API Google AI Studio
   - `NODE_ENV`: `production`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`

---

## 6. Giám sát & Quản lý Log
- **Kiểm tra log thời gian thực với PM2**:
  ```bash
  pm2 logs gemini-tts-app
  ```
- **Kiểm tra trạng thái dịch vụ**:
  ```bash
  curl http://localhost:3000/api/health
  ```
