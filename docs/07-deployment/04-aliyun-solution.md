# 阿里云纯方案说明（历史文档）

> **注意**：本文档描述的是纯阿里云方案（不使用 Supabase）。当前系统实际采用的是**混合方案**（Supabase + 阿里云 ECS），请参考 `05-hybrid-solution.md`。

## 一、方案概述

本系统采用**阿里云服务**作为基础设施，确保国内用户访问速度快、付费方便、性能可靠、性价比高。

**当前推荐方案**：请使用混合方案（Supabase + 阿里云 ECS），详见 `05-hybrid-solution.md`。

## 二、服务选型

### 2.1 核心服务

| 服务类型 | 阿里云服务 | 用途 | 预估成本 |
|---------|-----------|------|---------|
| 数据库 | RDS PostgreSQL | 数据存储 | 200-500元/月 |
| 应用部署 | ECS | 应用服务器 | 200-800元/月 |
| 文件存储 | OSS | 文件存储 | 50-200元/月（按使用量） |
| CDN加速 | CDN | 静态资源加速 | 50-200元/月（按流量） |
| 监控日志 | 云监控 + 日志服务 | 监控和日志 | 免费/50-100元/月 |

**总计：约 500-1800元/月**

### 2.2 服务优势

**访问速度**：
- ✅ 所有服务都在国内，延迟低
- ✅ 与钉钉（阿里产品）集成更方便
- ✅ CDN 加速，静态资源加载快

**付费方便**：
- ✅ 支持支付宝、微信支付
- ✅ 支持企业账户
- ✅ 支持按量付费和包年包月

**性能可靠**：
- ✅ 阿里云在国内有完善的网络基础设施
- ✅ 服务稳定，SLA 保证
- ✅ 自动备份和恢复

**性价比高**：
- ✅ 价格合理，且有各种优惠活动
- ✅ 按需购买，不浪费资源
- ✅ 技术支持好（中文支持）

## 三、架构变更

### 3.1 数据库变更

**从 Supabase 迁移到阿里云 RDS PostgreSQL**：

**变更内容**：
- 数据库连接：从 Supabase 客户端改为 PostgreSQL 原生客户端（`pg`）
- 认证服务：从 Supabase Auth 改为 NextAuth.js（支持钉钉 OAuth）
- 权限控制：不使用 RLS，在应用层实现权限控制
- 实时订阅：移除 Supabase Realtime（企业应用不需要）

**迁移工作量**：
- 数据库迁移：1-2 天（导出数据、导入数据、验证）
- 代码适配：3-5 天（修改数据库连接、认证服务、文件存储）
- 测试验证：2-3 天（功能测试、性能测试）
- **总计：约 6-10 个工作日**

### 3.2 文件存储变更

**从 Supabase Storage 迁移到阿里云 OSS**：

**变更内容**：
- 文件上传：使用阿里云 OSS SDK
- 文件访问：使用 OSS 的公开访问或签名 URL
- 文件管理：通过 OSS 控制台或 SDK

**迁移工作量**：
- 代码适配：1-2 天
- 文件迁移：根据文件数量，可能需要 1-3 天

### 3.3 应用部署变更

**从 Vercel 迁移到阿里云 ECS**：

**变更内容**：
- 部署方式：从 Vercel 自动部署改为 ECS 手动/CI-CD 部署
- 反向代理：使用 Nginx 作为反向代理
- SSL 证书：使用阿里云 SSL 证书或 Let's Encrypt

**部署方式**：
- 推荐：Docker 容器化部署
- 或：传统服务器部署（使用 PM2）

## 四、技术栈变更

### 4.1 数据库访问

**变更前（Supabase）**：
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data } = await supabase.from('projects').select('*');
```

**变更后（PostgreSQL）**：
```typescript
import { db } from '@/lib/db/client';

const result = await db.query('SELECT * FROM projects');
const data = result.rows;
```

### 4.2 认证服务

**变更前（Supabase Auth）**：
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

**变更后（NextAuth.js）**：
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const session = await getServerSession(authOptions);
const user = session?.user;
```

### 4.3 文件存储

**变更前（Supabase Storage）**：
```typescript
const { data } = await supabase.storage
  .from('bucket')
  .upload('path/to/file.jpg', file);
```

**变更后（阿里云 OSS）**：
```typescript
import { ossClient } from '@/lib/storage/oss';

const result = await ossClient.put('path/to/file.jpg', fileBuffer);
const url = result.url;
```

## 五、环境变量变更

### 5.1 主要变更

**移除的环境变量**：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**新增的环境变量**：
- `DATABASE_URL`：PostgreSQL 连接字符串
- `NEXTAUTH_SECRET`：NextAuth.js 密钥
- `NEXTAUTH_URL`：应用 URL
- `ALIYUN_OSS_ACCESS_KEY_ID`：OSS AccessKey ID
- `ALIYUN_OSS_ACCESS_KEY_SECRET`：OSS AccessKey Secret
- `ALIYUN_OSS_BUCKET`：OSS Bucket 名称
- `ALIYUN_OSS_REGION`：OSS 地域
- `ALIYUN_OSS_ENDPOINT`：OSS 端点

### 5.2 环境变量模板

**.env.example**：
```env
# 数据库
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# 认证
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# 钉钉 OAuth
DINGTALK_APP_KEY=
DINGTALK_APP_SECRET=
DINGTALK_CORP_ID=

# 阿里云 OSS
ALIYUN_OSS_ACCESS_KEY_ID=
ALIYUN_OSS_ACCESS_KEY_SECRET=
ALIYUN_OSS_BUCKET=
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 六、部署步骤

### 6.1 准备工作

1. **注册阿里云账号**：
   - 访问 [阿里云官网](https://www.aliyun.com)
   - 完成实名认证
   - 选择支付方式（支付宝/微信支付）

2. **创建所需服务**：
   - 创建 RDS PostgreSQL 实例
   - 创建 ECS 实例
   - 创建 OSS Bucket
   - 创建 CDN 加速域名（可选）

### 6.2 数据库迁移

1. **导出 Supabase 数据**（如果已有数据）：
```bash
pg_dump -h supabase-host -U postgres -d database > backup.sql
```

2. **导入到阿里云 RDS**：
```bash
psql -h rds-host -U username -d database < backup.sql
```

3. **执行数据库迁移脚本**：
```bash
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
```

### 6.3 应用部署

1. **配置环境变量**：
   - 在 ECS 实例中配置 `.env.production`
   - 或使用阿里云密钥管理服务（KMS）

2. **部署应用**：
   - 使用 Docker 部署（推荐）
   - 或使用传统方式部署

3. **配置 Nginx**：
   - 配置反向代理
   - 配置 SSL 证书

4. **配置 CDN**（可选）：
   - 创建 CDN 加速域名
   - 配置源站地址
   - 配置缓存策略

## 七、成本优化建议

### 7.1 资源优化

- **按需购买**：根据实际使用量选择配置
- **预留实例**：长期使用可购买预留实例，享受折扣
- **自动扩缩容**：使用 Serverless 或自动扩缩容，按需付费

### 7.2 流量优化

- **CDN 缓存**：提高 CDN 命中率，减少回源流量
- **数据压缩**：启用 Gzip/Brotli 压缩，减少传输量
- **图片优化**：使用 WebP 格式，压缩图片大小

### 7.3 存储优化

- **生命周期管理**：配置 OSS 生命周期，自动删除过期文件
- **数据归档**：将不常用的数据归档到冷存储，降低成本

## 八、监控和运维

### 8.1 监控服务

**阿里云云监控**（免费）：
- 监控 ECS CPU、内存、磁盘使用率
- 监控 RDS 连接数、查询性能
- 配置告警规则（邮件、短信、钉钉）

**阿里云应用实时监控服务 ARMS**（可选）：
- 应用性能监控（APM）
- 前端监控
- 自定义监控指标

### 8.2 日志服务

**阿里云日志服务 SLS**：
- 日志采集、存储、查询、分析
- 支持日志告警
- 支持日志投递到 OSS（长期存储）

## 九、迁移检查清单

### 9.1 迁移前

- [ ] 注册阿里云账号并完成实名认证
- [ ] 创建 RDS PostgreSQL 实例
- [ ] 创建 ECS 实例
- [ ] 创建 OSS Bucket
- [ ] 配置 CDN（如需要）
- [ ] 导出 Supabase 数据（如已有数据）
- [ ] 准备环境变量配置

### 9.2 迁移中

- [ ] 导入数据到 RDS
- [ ] 执行数据库迁移脚本
- [ ] 修改代码（数据库连接、认证、文件存储）
- [ ] 配置环境变量
- [ ] 部署应用到 ECS
- [ ] 配置 Nginx 和 SSL
- [ ] 迁移文件到 OSS（如已有文件）

### 9.3 迁移后

- [ ] 功能测试
- [ ] 性能测试
- [ ] 配置监控和告警
- [ ] 配置日志收集
- [ ] 验证备份和恢复流程
- [ ] 更新文档

## 十、技术支持

### 10.1 阿里云支持

- **工单系统**：通过阿里云控制台提交工单
- **技术支持**：中文技术支持，响应速度快
- **文档中心**：完善的文档和教程
- **社区支持**：活跃的开发者社区

### 10.2 钉钉集成优势

- **同属阿里生态**：钉钉是阿里产品，集成更方便
- **技术支持**：统一的技术支持渠道
- **生态协同**：可以更好地利用阿里云和钉钉的协同能力

## 十一、总结

采用阿里云方案的优势：

1. **访问速度快**：所有服务都在国内，延迟低
2. **付费方便**：支持支付宝、微信支付
3. **性能可靠**：阿里云在国内有完善的网络基础设施
4. **性价比高**：价格合理，且有各种优惠活动
5. **技术支持好**：中文技术支持，响应速度快
6. **与钉钉集成好**：钉钉是阿里产品，集成更方便

迁移复杂度：**中等**，预计 6-10 个工作日可以完成迁移。

