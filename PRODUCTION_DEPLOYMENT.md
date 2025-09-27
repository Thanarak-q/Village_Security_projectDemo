# Production Deployment Guide

## 🚀 การ Deploy สำหรับการเข้าถึงจากภายนอก

### ปัญหาที่แก้ไขแล้ว:
- ✅ WebSocket ทำงานผ่าน HTTPS/WSS
- ✅ Automatic SSL certificates ผ่าน Let's Encrypt
- ✅ Proper WebSocket proxy headers
- ✅ Production-ready docker-compose
- ✅ Security headers และ compression

## 📋 ขั้นตอนการ Deploy

### 1. เตรียม Server
```bash
# ติดตั้ง Docker และ Docker Compose
sudo apt update
sudo apt install docker.io docker-compose-plugin

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 2. ตั้งค่า Domain และ DNS
- ซื้อ domain name หรือใช้ subdomain
- ตั้งค่า DNS A record ชี้ไปที่ IP ของ server
- รอให้ DNS propagate (5-30 นาที)

### 3. แก้ไข Configuration Files

#### แก้ไข `Caddyfile.production`:
```bash
# แทนที่ 'your-domain.com' ด้วย domain จริง
sed -i 's/your-domain.com/youractual-domain.com/g' Caddyfile.production
```

#### สร้าง `.env` file สำหรับ backend:
```bash
# ใน backend/.env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-here
DATABASE_URL=postgresql://admin:1234@db:5432/SOFEWARE_EN
```

### 4. Deploy Application
```bash
# สร้าง logs directory
mkdir -p logs/caddy

# Build และ start services
docker compose -f docker-compose-server.yml build
docker compose -f docker-compose-server.yml up -d

# ตรวจสอบ status
docker compose -f docker-compose-server.yml ps
```

### 5. ตรวจสอบการทำงาน

#### ตรวจสอบ Services:
```bash
# ตรวจสอบ logs
docker compose -f docker-compose-server.yml logs caddy
docker compose -f docker-compose-server.yml logs websocket
docker compose -f docker-compose-server.yml logs backend

# ตรวจสอบ SSL certificate
curl -I https://your-domain.com
```

#### ทดสอบ WebSocket:
```javascript
// ใน browser console
const ws = new WebSocket('wss://your-domain.com/ws');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onmessage = (e) => console.log('📨 Message:', e.data);
ws.onerror = (e) => console.log('❌ WebSocket error:', e);
```

## 🔧 การแก้ไขปัญหา

### WebSocket ไม่ทำงาน:
1. ตรวจสอบ Caddy logs: `docker compose logs caddy`
2. ตรวจสอบ WebSocket service: `docker compose logs websocket`
3. ตรวจสอบว่า SSL certificate ทำงาน
4. ตรวจสอบ browser developer tools

### SSL Certificate ไม่ทำงาน:
1. ตรวจสอบว่า domain ชี้ไปที่ server ถูกต้อง
2. ตรวจสอบ port 80 และ 443 เปิดอยู่
3. ดู Caddy logs สำหรับ Let's Encrypt errors

### Performance Issues:
```bash
# ตรวจสอบ resource usage
docker stats

# ตรวจสอบ disk space
df -h

# ตรวจสอบ memory
free -h
```

## 🔒 Security Considerations

### Firewall:
```bash
# เปิดเฉพาะ port ที่จำเป็น
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Database Security:
- เปลี่ยน default password ใน production
- ใช้ environment variables สำหรับ sensitive data
- จำกัดการเข้าถึง database port

### Regular Updates:
```bash
# อัปเดต Docker images
docker compose -f docker-compose-server.yml pull
docker compose -f docker-compose-server.yml up -d

# อัปเดต system
sudo apt update && sudo apt upgrade
```

## 📊 Monitoring

### Log Files:
- Caddy: `/var/log/caddy/access.log`
- Application logs: `docker compose logs`

### Health Checks:
- API: `https://your-domain.com/api/health`
- WebSocket: ดูใน browser developer tools

## 🚨 Backup Strategy

### Database Backup:
```bash
# สร้าง backup script
#!/bin/bash
docker exec village_security_db_1 pg_dump -U admin SOFEWARE_EN > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Full System Backup:
- Backup configuration files
- Backup database
- Backup uploaded files (ถ้ามี)
