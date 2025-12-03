# 部署指南

## 一、部署环境要求

### 1.1 生产环境要求

**服务器要求**：
- CPU: 2核心+
- 内存: 4GB+
- 存储: 20GB+
- 网络: 10Mbps+

**运行环境**：
- Node.js 18.x+
- npm 9.x+ 或 pnpm 8.x+

### 1.2 服务依赖

**必需服务**：
- Supabase（数据库、认证、基础文件存储）
- 阿里云 ECS（应用部署）
- 钉钉开放平台（集成）

**可选服务**：
- 阿里云 OSS（大文件存储，可选）
- 阿里云 CDN（静态资源加速，可选）
- Teambition（工时同步）
- 阿里云日志服务 SLS（日志管理，可选）
- 阿里云云监控（监控告警，可选）

## 二、部署方式

### 2.1 阿里云 ECS 部署（推荐）

**优势**：
- 国内访问速度快
- 完全控制部署环境
- 支持 Docker 容器化部署
- 付费方便（支付宝/微信支付）
- 支持负载均衡和自动扩缩容
- 与 Supabase 集成良好

**部署步骤**：

1. **创建 ECS 实例**：
   - 登录阿里云控制台
   - 选择地域（推荐：华东1-杭州、华东2-上海）
   - 选择实例规格（推荐：2核4GB起步）
   - 选择操作系统（推荐：Ubuntu 22.04 或 CentOS 7）
   - 配置安全组（开放 80、443、3000 端口）
   - 创建并启动实例

2. **连接服务器**：
```bash
ssh root@your-server-ip
```

3. **安装 Node.js**：
```bash
# 使用 nvm 安装 Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

4. **安装 Docker（可选）**：
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

5. **部署应用**：
   - 使用 Git 克隆项目
   - 或使用 Docker 部署（推荐）

### 2.2 Docker 部署（推荐方式）

**Dockerfile**：
```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行应用
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**：
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - DINGTALK_APP_KEY=${DINGTALK_APP_KEY}
      - DINGTALK_APP_SECRET=${DINGTALK_APP_SECRET}
      - ALIYUN_OSS_ACCESS_KEY_ID=${ALIYUN_OSS_ACCESS_KEY_ID}
      - ALIYUN_OSS_ACCESS_KEY_SECRET=${ALIYUN_OSS_ACCESS_KEY_SECRET}
      - ALIYUN_OSS_BUCKET=${ALIYUN_OSS_BUCKET}
      - ALIYUN_OSS_REGION=${ALIYUN_OSS_REGION}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**部署命令**：
```bash
# 构建镜像
docker build -t simpleux-system .

# 运行容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

### 2.3 传统服务器部署（不使用 Docker）

**部署步骤**：

1. **安装 Node.js**：
```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

2. **克隆项目**：
```bash
git clone <repository-url>
cd simpleux_system
```

3. **安装依赖**：
```bash
npm install --production
```

4. **构建应用**：
```bash
npm run build
```

5. **启动应用**：
```bash
npm start
```

6. **使用 PM2 管理进程**：
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "simpleux-system" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看应用状态
pm2 status

# 查看日志
pm2 logs simpleux-system
```

### 2.4 配置 Nginx 反向代理

**安装 Nginx**：
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install nginx
```

**Nginx 配置**：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书配置（使用阿里云 SSL 证书或 Let's Encrypt）
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 反向代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态资源缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

**启动 Nginx**：
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 三、环境变量配置

### 3.1 生产环境变量

**必需变量**：
```env
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 应用
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# 钉钉
DINGTALK_APP_KEY=xxx
DINGTALK_APP_SECRET=xxx

# Teambition（可选）
TEAMBITION_APP_KEY=xxx
TEAMBITION_APP_SECRET=xxx
```

**可选变量（混合方案）**：
```env
# 阿里云 OSS（可选，用于大文件存储）
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# 阿里云 CDN（可选，用于静态资源加速）
ALIYUN_CDN_DOMAIN=cdn.your-domain.com
```

### 3.2 环境变量管理

**阿里云 ECS**：
- 使用 `.env.production` 文件（推荐）
- 或通过系统环境变量配置
- 或使用阿里云密钥管理服务（KMS）存储敏感信息

**Docker**：
- 使用 `.env` 文件
- 或通过 `docker-compose.yml` 配置
- 敏感信息使用 Docker Secrets（生产环境推荐）

**安全建议**：
- 敏感信息（Supabase Service Role Key、API密钥）使用阿里云密钥管理服务（KMS）
- 不要将 `.env` 文件提交到 Git 仓库
- 使用 `.env.example` 作为模板

## 四、Supabase 配置

### 4.1 创建 Supabase 项目

**步骤**：
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 API Keys
4. 配置环境变量

### 4.2 数据库迁移

**运行迁移脚本**：
```bash
# 使用 Supabase CLI
supabase db push

# 或手动执行 SQL 脚本
# 在 Supabase Dashboard 的 SQL Editor 中执行迁移脚本
```

**迁移脚本位置**：
```
supabase/migrations/
```

### 4.3 配置 RLS 策略

**启用 RLS**：
```sql
-- 为表启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ... 其他表
```

**创建 RLS 策略**：
```sql
-- 示例：用户只能查看自己的 profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

### 4.4 数据备份

**自动备份**：
- Supabase 提供自动备份功能
- 每日自动备份
- 备份保留 30 天
- 支持时间点恢复

**手动备份**：
```bash
# 使用 Supabase CLI
supabase db dump -f backup.sql

# 或使用 pg_dump
pg_dump -h your-supabase-host -U postgres -d postgres > backup.sql
```

**备份策略**：
- 每日自动备份（Supabase 自动处理）
- 重要操作前手动备份
- 定期测试备份恢复流程

## 五、域名和SSL

### 5.1 域名配置

**域名解析**：
1. 在阿里云域名控制台配置域名解析
2. 添加 A 记录，指向 ECS 公网 IP
3. 或使用 CNAME 记录，指向 CDN 域名

**CDN 配置（推荐）**：
1. 在阿里云 CDN 控制台创建加速域名
2. 配置源站地址（ECS 公网 IP 或内网 IP）
3. 配置回源协议（HTTP/HTTPS）
4. 配置缓存规则（静态资源长期缓存）
5. 将域名 CNAME 指向 CDN 域名

### 5.2 SSL 证书配置

**方案一：使用阿里云 SSL 证书（推荐）**：
1. 在阿里云 SSL 证书控制台申请免费证书（DV SSL）
2. 下载证书文件（Nginx 格式）
3. 上传到服务器并配置 Nginx

**方案二：使用 Let's Encrypt（免费）**：
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期（已自动配置）
sudo certbot renew --dry-run
```

**Nginx SSL 配置**：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... 其他配置
}
```

### 5.3 混合方案：Supabase Storage + 阿里云 OSS（可选）

**文件存储策略**：
- **小文件（< 10MB）**：使用 Supabase Storage
- **大文件（> 10MB）**：使用阿里云 OSS
- **需要国内加速的文件**：使用阿里云 OSS

**Supabase Storage 配置**：
- 在 Supabase Dashboard 中创建 Storage Bucket
- 配置访问策略（公开或私有）
- 使用 Supabase Client 上传文件

**阿里云 OSS 配置（可选）**：
1. 在阿里云 OSS 控制台创建 Bucket
2. 选择地域（推荐：与应用服务器同一地域）
3. 配置访问权限（私有读写，通过应用服务器访问）
4. 配置跨域规则（CORS，如需要）

**配置 OSS 客户端**：
```typescript
// lib/storage/oss.ts
import OSS from 'ali-oss';

const client = new OSS({
  region: process.env.ALIYUN_OSS_REGION,
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_OSS_BUCKET,
});
```

**文件上传选择逻辑**：
```typescript
// lib/storage/index.ts
import { supabase } from '@/lib/supabase/client';
import { ossClient } from '@/lib/storage/oss';

const MAX_SUPABASE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(file: File, path: string) {
  // 小文件使用 Supabase Storage
  if (file.size < MAX_SUPABASE_SIZE) {
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, file);
    
    if (error) throw error;
    return data;
  }
  
  // 大文件使用阿里云 OSS
  const buffer = await file.arrayBuffer();
  const result = await ossClient.put(path, Buffer.from(buffer));
  return { path: result.name, url: result.url };
}
```

## 六、性能优化

### 6.1 构建优化

**Next.js配置**：
```javascript
// next.config.js
module.exports = {
  output: 'standalone', // 独立输出模式
  compress: true, // 启用压缩
  poweredByHeader: false, // 移除X-Powered-By头
};
```

### 6.2 缓存策略

**静态资源缓存**：
- 使用CDN缓存静态资源
- 设置合理的缓存时间

**API缓存**：
- 使用Next.js缓存机制
- 配置缓存策略

## 七、监控和日志

### 7.1 应用监控

**阿里云云监控**：
- 免费，功能完善
- 监控 ECS CPU、内存、磁盘使用率
- 监控 RDS 连接数、查询性能
- 配置告警规则（邮件、短信、钉钉）

**阿里云应用实时监控服务 ARMS（可选）**：
- 应用性能监控（APM）
- 前端监控
- 自定义监控指标
- 告警通知

**第三方监控（可选）**：
- Sentry（错误监控）
- 自建 Prometheus + Grafana

### 7.2 日志管理

**阿里云日志服务 SLS**：
- 功能完善，价格合理
- 支持日志采集、存储、查询、分析
- 支持日志告警
- 支持日志投递到 OSS（长期存储）

**应用日志配置**：
```typescript
// 使用 winston 或 pino 记录日志
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

**日志收集**：
- 使用阿里云 Logtail 采集应用日志
- 或使用文件日志，定期上传到 SLS
- 配置日志保留策略（建议：30-90天）

## 八、安全配置

### 8.1 安全头设置

**Next.js安全头**：
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};
```

### 8.2 环境变量安全

**敏感信息**：
- 不在代码中硬编码
- 使用环境变量
- 加密存储敏感数据

## 九、回滚策略

### 9.1 版本管理

**Git标签**：
```bash
# 创建发布标签
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 9.2 回滚步骤

**Docker 回滚**：
```bash
# 使用之前的镜像
docker-compose down
docker-compose up -d --no-deps app

# 或使用 Git 回滚代码后重新构建
git checkout <previous-commit>
docker-compose build
docker-compose up -d
```

**传统部署回滚**：
```bash
# 使用 Git 回滚代码
git checkout <previous-commit>

# 重新构建和部署
npm run build
pm2 restart simpleux-system
```

**数据库回滚**：
```bash
# 恢复数据库备份
pg_restore -h your-rds-host -U username -d database backup.dump
```

## 十、部署检查清单

### 10.1 部署前检查

- [ ] 代码已通过测试
- [ ] Supabase 项目已创建
- [ ] 环境变量已配置（Supabase URL 和 Keys）
- [ ] 数据库迁移已完成
- [ ] RLS 策略已配置
- [ ] 域名和SSL已配置
- [ ] 阿里云 OSS 已配置（如使用混合方案）
- [ ] CDN 已配置（如使用）
- [ ] 监控和日志已配置

### 10.2 部署后检查

- [ ] 应用正常启动
- [ ] Supabase 连接正常
- [ ] API接口正常
- [ ] 认证功能正常（Supabase Auth）
- [ ] 文件上传功能正常（Supabase Storage 或 OSS）
- [ ] RLS 权限控制正常
- [ ] 监控和日志正常
- [ ] CDN 加速正常（如使用）
- [ ] SSL 证书正常
- [ ] 钉钉集成正常

