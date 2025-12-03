# 环境配置

## 一、环境分类

### 1.1 环境类型

**开发环境（Development）**：
- 本地开发环境
- 用于功能开发
- 使用开发数据库

**测试环境（Staging）**：
- 预发布环境
- 用于功能测试
- 使用测试数据库

**生产环境（Production）**：
- 正式环境
- 用户使用
- 使用生产数据库

## 二、环境变量配置

### 2.1 开发环境变量

**.env.local**：
```env
# Supabase（开发）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# 钉钉（开发）
DINGTALK_APP_KEY=xxx
DINGTALK_APP_SECRET=xxx

# 阿里云 OSS（可选，用于大文件存储）
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=your-dev-bucket
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# Teambition（开发，可选）
TEAMBITION_APP_KEY=xxx
TEAMBITION_APP_SECRET=xxx
```

### 2.2 测试环境变量

**.env.staging**：
```env
# Supabase（测试）
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 应用
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
NODE_ENV=production

# 钉钉（测试）
DINGTALK_APP_KEY=xxx
DINGTALK_APP_SECRET=xxx

# 阿里云 OSS（可选，用于大文件存储）
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=your-staging-bucket
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 2.3 生产环境变量

**.env.production**：
```env
# Supabase（生产）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 应用
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# 钉钉（生产）
DINGTALK_APP_KEY=xxx
DINGTALK_APP_SECRET=xxx

# 阿里云 OSS（可选，用于大文件存储）
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=your-prod-bucket
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

## 三、配置文件

### 3.1 Next.js配置

**next.config.js**：
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境相关配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 生产环境优化
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
  }),
};

module.exports = nextConfig;
```

### 3.2 Supabase配置

**lib/supabase/client.ts**：
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**lib/supabase/server.ts**：
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 忽略错误
          }
        },
      },
    }
  );
}
```

### 3.3 文件存储配置（混合方案）

**lib/storage/index.ts**：
```typescript
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

**lib/storage/oss.ts**（可选）：
```typescript
import OSS from 'ali-oss';

const client = new OSS({
  region: process.env.ALIYUN_OSS_REGION!,
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.ALIYUN_OSS_BUCKET!,
});

export { client as ossClient };
```

## 四、环境变量管理

### 4.1 环境变量命名

**命名规范**：
- 使用大写字母和下划线
- 前缀区分作用域：
  - `NEXT_PUBLIC_*`: 客户端可访问
  - `SUPABASE_*`: Supabase相关
  - `ALIYUN_OSS_*`: 阿里云 OSS 相关（可选）
  - `DINGTALK_*`: 钉钉相关

### 4.2 敏感信息管理

**加密存储**：
- 使用环境变量存储敏感信息
- 不在代码中硬编码
- 使用密钥管理服务（如阿里云密钥管理服务 KMS）
- 生产环境敏感信息使用 KMS 加密存储

**访问控制**：
- 限制环境变量访问权限
- 定期轮换密钥
- 记录访问日志

## 五、阿里云 ECS 环境配置

### 5.1 环境变量设置

**在 ECS 实例中配置**：
1. 使用 `.env.production` 文件（推荐）
2. 或通过系统环境变量配置
3. 或使用阿里云密钥管理服务（KMS）存储敏感信息

**配置方式**：
```bash
# 方式1：使用 .env 文件
cp .env.production .env
source .env

# 方式2：系统环境变量
export NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
export SUPABASE_SERVICE_ROLE_KEY=xxx

# 方式3：使用 KMS（生产环境推荐）
# 通过阿里云 SDK 从 KMS 获取加密的环境变量
```

### 5.2 环境变量优先级

**优先级顺序**：
1. 系统环境变量
2. `.env.production`（生产环境）
3. `.env.local`（本地开发）
4. `.env`（默认）

## 六、Docker环境配置

### 6.1 Docker Compose配置

**docker-compose.yml**：
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 6.2 环境变量传递

**通过环境变量文件**：
```bash
# 使用.env文件
docker-compose --env-file .env.production up
```

**通过命令行**：
```bash
docker run -e NEXT_PUBLIC_SUPABASE_URL=... -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... -e SUPABASE_SERVICE_ROLE_KEY=... app
```

## 七、环境切换

### 7.1 本地环境切换

**使用不同环境文件**：
```bash
# 开发环境
cp .env.local .env

# 测试环境
cp .env.staging .env

# 生产环境
cp .env.production .env
```

### 7.2 构建时环境切换

**Next.js自动识别**：
- `NODE_ENV=development`: 开发模式
- `NODE_ENV=production`: 生产模式

**自定义环境**：
```bash
# 使用自定义环境变量
NEXT_PUBLIC_ENV=staging npm run build
```

## 八、配置验证

### 8.1 环境变量验证

**启动时验证**：
```typescript
// lib/config.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### 8.2 配置检查脚本

**检查脚本**：
```bash
#!/bin/bash
# scripts/check-env.sh

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

echo "All required environment variables are set"
```

## 九、配置文档

### 9.1 配置说明文档

**README.md**：
- 环境变量说明
- 配置步骤
- 常见问题

### 9.2 配置模板

**.env.example**：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# 钉钉
DINGTALK_APP_KEY=
DINGTALK_APP_SECRET=

# 阿里云 OSS（可选，用于大文件存储）
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_OSS_BUCKET=
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

## 十、最佳实践

### 10.1 配置管理

**推荐做法**：
- 使用环境变量文件
- 提供配置模板
- 文档化配置说明
- 验证配置完整性

### 10.2 安全建议

**安全措施**：
- 不在代码中硬编码敏感信息
- 使用密钥管理服务
- 定期轮换密钥
- 限制访问权限

