# 混合云部署方案说明

## 一、方案概述

本系统采用**混合云方案**，以 **Supabase** 作为主要后端服务（数据库、认证、基础文件存储），以 **阿里云** 进行应用部署和提供补充服务（大文件存储、CDN 加速），兼顾功能完整性和国内访问速度。

## 二、服务选型

### 2.1 核心服务（Supabase - 主要）

| 服务类型 | Supabase 服务     | 用途                   | 成本            |
| -------- | ----------------- | ---------------------- | --------------- |
| 数据库   | PostgreSQL        | 数据存储               | 免费版/Pro 版   |
| 认证     | Supabase Auth     | 用户认证               | 包含在 Supabase |
| 文件存储 | Supabase Storage  | 基础文件存储           | 包含在 Supabase |
| 实时订阅 | Supabase Realtime | 实时数据更新（不使用） | 包含在 Supabase |

**Supabase 免费版限制**：

- 数据库：500MB 存储
- 文件存储：1GB 存储
- API 请求：50,000 次/月
- 带宽：5GB/月

**Supabase Pro 版**（$25/月）：

- 数据库：8GB 存储
- 文件存储：100GB 存储
- API 请求：无限制
- 带宽：250GB/月

### 2.2 补充服务（阿里云 - 主要部署+可选补充）

| 服务类型 | 阿里云服务        | 用途                 | 成本          |
| -------- | ----------------- | -------------------- | ------------- |
| 应用部署 | ECS               | 应用服务器           | 200-800 元/月 |
| 文件存储 | OSS               | 大文件存储、国内加速 | 按使用量付费  |
| CDN 加速 | CDN               | 静态资源加速         | 按流量付费    |
| 监控日志 | 云监控 + 日志服务 | 监控和日志           | 免费/按量付费 |

**使用场景**：

- **阿里云 ECS**：应用部署，提供国内访问速度快、完全控制部署环境
- **阿里云 OSS**：当文件超过 Supabase Storage 限制，或需要更好的国内访问速度时使用
- **阿里云 CDN**：用于加速静态资源，提升国内用户访问速度

## 三、架构设计

### 3.1 混合架构图

```
                    ┌─────────────┐
                    │   用户浏览器  │
                    └──────┬──────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │      Next.js 14 Application      │
        │  ┌──────────────────────────┐   │
        │  │   App Router (Pages)     │   │
        │  │   Server Actions         │   │
        │  │   API Routes            │   │
        │  └──────────────────────────┘   │
        └──────────┬───────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
┌───────────────┐    ┌───────────────┐
│   Supabase    │    │  第三方服务    │
│  - Database   │    │  - 钉钉       │
│  - Auth       │    │  - Storage    │    │               │
└───────────────┘    └───────────────┘
        │
        ↓
┌───────────────┐
│   阿里云服务   │（应用部署+补充服务）
│  - ECS        │（应用部署）
│  - OSS        │（可选，大文件）
│  - CDN        │（可选，静态资源加速）
└───────────────┘
```

### 3.2 服务选择策略

**文件存储策略**：

- **小文件（< 10MB）**：使用 Supabase Storage
- **大文件（> 10MB）**：使用阿里云 OSS
- **需要国内加速的文件**：使用阿里云 OSS

**CDN 策略**：

- **静态资源**：使用阿里云 CDN 加速（可选）
- **动态内容**：直接从 Supabase 获取

## 四、部署方案

### 4.1 推荐方案：阿里云 ECS + Supabase

**优势**：

- 国内访问速度快
- 完全控制部署环境
- 支持 Docker 容器化部署
- 付费方便（支付宝/微信支付）
- 支持负载均衡和自动扩缩容
- 与 Supabase 集成良好

**部署步骤**：

1. 创建阿里云 ECS 实例
2. 部署 Next.js 应用（Docker 或传统方式）
3. 配置 Nginx 反向代理
4. 配置 SSL 证书
5. 配置环境变量（Supabase URL 和 Keys）

### 4.2 补充服务配置

**架构**：

- 应用部署在阿里云 ECS（主要）
- 静态资源使用阿里云 CDN 加速（可选）
- 大文件使用阿里云 OSS（可选）

## 五、环境变量配置

### 5.1 Supabase 配置（必需）

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 5.2 阿里云配置（可选）

```env
# 阿里云 OSS（可选，用于大文件）
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# 阿里云 CDN（可选，用于静态资源加速）
ALIYUN_CDN_DOMAIN=cdn.your-domain.com
```

### 5.3 应用配置

```env
# 应用
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# 钉钉
DINGTALK_APP_KEY=xxx
DINGTALK_APP_SECRET=xxx
```

## 六、文件存储实现

### 6.1 文件存储选择逻辑

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

### 6.2 文件访问

```typescript
// Supabase Storage 文件访问
const { data } = supabase.storage
  .from('bucket')
  .getPublicUrl('path/to/file.jpg');

// 阿里云 OSS 文件访问
const url = ossClient.signatureUrl('path/to/file.jpg', {
  expires: 3600, // 1小时有效期
});
```

## 七、成本估算

### 7.1 Supabase 成本

**免费版**：

- 适合开发和小规模使用
- 成本：$0/月

**Pro 版**：

- 适合生产环境
- 成本：$25/月（约 180 元/月）

### 7.2 阿里云成本

**ECS 服务器**：

- 2 核 4GB：约 200-400 元/月
- 4 核 8GB：约 400-800 元/月

**OSS 存储**（可选）：

- 标准存储：0.12 元/GB/月
- 流量费用：0.5 元/GB（下行流量）
- 预估：50-200 元/月（按使用量）

**CDN 加速**（可选）：

- 流量费用：0.24 元/GB（国内流量）
- 预估：50-200 元/月（按流量）

### 7.3 总成本

**方案：Supabase + 阿里云 ECS + 可选补充服务**：

- Supabase Pro：$25/月（约 180 元/月）
- 阿里云 ECS：200-800 元/月
- 阿里云 OSS + CDN（可选）：100-400 元/月
- **总计：约 480-1380 元/月**

## 八、迁移建议

### 8.1 从 Vercel + Supabase 迁移到阿里云 ECS + Supabase

**迁移步骤**：

1. 保持 Supabase 作为后端服务（无需变更）
2. 创建阿里云 ECS 实例
3. 部署 Next.js 应用到 ECS
4. 配置 Nginx 反向代理和 SSL
5. 配置环境变量（Supabase URL 和 Keys）
6. 配置阿里云 OSS（可选，用于大文件）
7. 配置阿里云 CDN（可选，用于静态资源加速）

### 8.2 从纯阿里云迁移到混合方案

**迁移步骤**：

1. 创建 Supabase 项目
2. 迁移数据库到 Supabase
3. 迁移认证到 Supabase Auth
4. 迁移小文件到 Supabase Storage
5. 保留应用部署在阿里云 ECS
6. 保留大文件在阿里云 OSS（可选）

## 九、最佳实践

### 9.1 服务选择建议

**使用 Supabase**：

- ✅ 数据库和认证（主要服务）
- ✅ 小文件存储（< 10MB）
- ✅ 开发环境（免费版足够）

**使用阿里云**：

- ✅ 应用部署（ECS）
- ✅ 大文件存储（> 10MB，OSS）
- ✅ 需要国内加速的文件（OSS）
- ✅ 静态资源 CDN 加速（可选）

### 9.2 成本优化

- **开发环境**：使用 Supabase 免费版 + 本地开发服务器
- **生产环境**：使用 Supabase Pro 版 + 阿里云 ECS
- **按需使用阿里云补充服务**：只在需要时使用 OSS 和 CDN
- **监控使用量**：定期检查 Supabase 和阿里云的使用量
- **ECS 规格选择**：根据实际负载选择合适的 ECS 规格

### 9.3 性能优化

- **静态资源**：使用阿里云 CDN 加速
- **文件存储**：根据文件大小选择存储位置
- **数据库查询**：优化查询，减少 Supabase API 调用

## 十、总结

混合云方案的优势：

1. **功能完整**：Supabase 提供完整的后端服务
2. **开发效率高**：Supabase 开发体验好，集成简单
3. **成本可控**：Supabase 免费版适合开发，Pro 版价格合理
4. **灵活扩展**：可以根据需要添加阿里云服务
5. **国内优化**：可以使用阿里云 CDN 和 OSS 优化国内访问速度

**推荐方案**：

- **开发环境**：Supabase 免费版 + 本地开发服务器
- **生产环境**：Supabase Pro + 阿里云 ECS + 阿里云 CDN（可选）
- **部署平台**：阿里云 ECS（推荐）
