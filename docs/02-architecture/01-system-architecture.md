# 系统架构设计

## 一、架构概述

### 1.1 架构模式

本系统采用**前后端一体化架构**（Full-Stack Framework），使用 Next.js 14 作为全栈框架，结合 **Supabase** 作为主要后端服务（数据库、认证），并采用**混合云方案**，使用阿里云服务进行应用部署和补充服务（文件存储、CDN加速等）。

**架构特点**：
- **服务端渲染（SSR）**：提升首屏加载速度和SEO
- **API路由**：Next.js API Routes 处理服务端逻辑
- **Server Actions**：Next.js Server Actions 处理表单提交和数据变更
- **混合云方案**：Supabase（后端服务）+ 阿里云（应用部署+补充服务），兼顾功能完整性和国内访问速度
- **类型安全**：TypeScript 全栈类型检查

### 1.2 技术选型

**前端技术栈**：
- **框架**：Next.js 14（App Router）
- **语言**：TypeScript
- **样式**：Arco Design 样式系统 + CSS Modules
- **UI组件库**：Arco Design React
- **状态管理**：React Context + Server Components
- **表单处理**：React Hook Form + Zod

**后端技术栈**：
- **框架**：Next.js 14 Server Actions / API Routes
- **数据库**：Supabase (PostgreSQL) - **主要服务**
- **认证**：Supabase Auth - **主要服务**
- **文件存储**：Supabase Storage（主要） + 阿里云 OSS（可选，用于大文件或国内加速）
- **CDN加速**：阿里云 CDN（可选，用于静态资源加速）

**第三方集成**：
- **钉钉开放平台**：组织架构同步、通知、待办
- **Teambition**：工时同步（可选）

### 1.3 系统分层

```
┌─────────────────────────────────────┐
│         表现层（Presentation）        │
│  Next.js Pages / Components         │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│         业务逻辑层（Business Logic）   │
│  Server Actions / API Routes        │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│         数据访问层（Data Access）     │
│  Supabase Client / Database         │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│         数据存储层（Data Storage）    │
│  PostgreSQL (Supabase)              │
└─────────────────────────────────────┘
```

## 二、系统架构图

### 2.1 整体架构

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
        │  │   - SSR / SSG            │   │
        │  │   - Server Components    │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │   Server Actions         │   │
        │  │   - Form Submissions     │   │
        │  │   - Data Mutations       │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │   API Routes            │   │
        │  │   - Third-party APIs    │   │
        │  │   - Webhooks            │   │
        │  └──────────────────────────┘   │
        └──────────┬───────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
┌───────────────┐    ┌───────────────┐
│   Supabase    │    │  第三方服务    │
│  - Database   │    │  - 钉钉       │
│  - Auth       │    │  - Teambition │
│  - Storage    │    │               │
└───────────────┘    └───────────────┘
        │
        ↓
┌───────────────┐
│   阿里云服务   │（补充服务）
│  - OSS        │（可选，大文件存储）
│  - CDN        │（可选，静态资源加速）
└───────────────┘
```

### 2.2 数据流架构

```
用户操作
  ↓
前端组件（React）
  ↓
Server Action / API Route
  ↓
业务逻辑处理
  ↓
Supabase Client
  ↓
PostgreSQL Database (Supabase)
  ↓
返回数据
  ↓
Server Component / Client Component
  ↓
渲染到浏览器
```

## 三、模块划分

### 3.1 前端模块

**页面模块**：
- `app/(pages)/dashboard/`：仪表盘
- `app/(pages)/projects/`：商业项目管理
- `app/(pages)/performance/`：业绩管理
- `app/(pages)/presales/`：售前支持
- `app/(pages)/contributions/`：专业贡献
- `app/(pages)/tasks/`：任务和工时管理
- `app/(pages)/approvals/`：审批管理
- `app/(pages)/settings/`：系统设置

**组件模块**：
- `components/ui/`：基础UI组件（Arco Design React）
- `components/layout/`：布局组件
- `components/forms/`：表单组件
- `components/tables/`：表格组件
- `components/charts/`：图表组件

**工具模块**：
- `lib/utils/`：工具函数
- `lib/validations/`：表单验证（Zod）
- `lib/constants/`：常量定义
- `lib/types/`：TypeScript类型定义

### 3.2 后端模块

**Server Actions**：
- `app/actions/projects.ts`：项目相关操作
- `app/actions/performance.ts`：业绩相关操作
- `app/actions/presales.ts`：售前支持相关操作
- `app/actions/contributions.ts`：专业贡献相关操作
- `app/actions/tasks.ts`：任务相关操作
- `app/actions/approvals.ts`：审批相关操作
- `app/actions/settings.ts`：系统设置相关操作

**API Routes**：
- `app/api/integrations/dingtalk/`：钉钉集成接口
- `app/api/integrations/teambition/`：Teambition集成接口
- `app/api/webhooks/`：Webhook处理

**数据访问层**：
- `lib/supabase/client.ts`：Supabase客户端
- `lib/supabase/server.ts`：Supabase服务端
- `lib/db/`：数据访问函数（基于 Supabase）
- `lib/storage/`：文件存储服务（Supabase Storage + 阿里云 OSS 可选）

### 3.3 数据库模块

**核心表**：
- 用户和部门表
- 角色和权限表

**业务表**：
- 项目相关表
- 业绩相关表
- 售前支持相关表
- 专业贡献相关表
- 任务和工时相关表
- 审批相关表
- 系统设置相关表

## 四、技术架构决策

### 4.1 为什么选择 Next.js 14？

**优势**：
- **全栈框架**：前后端一体化，减少技术栈复杂度
- **App Router**：现代化的路由和布局系统
- **Server Components**：减少客户端JavaScript，提升性能
- **Server Actions**：简化表单处理和数据变更
- **TypeScript支持**：完整的类型安全
- **生态丰富**：大量社区组件和工具

### 4.2 为什么选择 Supabase？

**优势**：
- **PostgreSQL**：强大的关系型数据库
- **认证服务**：内置用户认证和授权
- **Row Level Security**：数据库级别的权限控制
- **API自动生成**：自动生成RESTful API
- **管理界面**：友好的数据库管理界面
- **开发体验好**：完整的 TypeScript 支持，开发效率高
- **生态丰富**：丰富的工具和库支持

### 4.3 为什么采用混合云方案？

**混合方案优势**：
- **Supabase 作为主要服务**：提供数据库、认证、基础文件存储，功能完整，开发效率高
- **阿里云作为补充服务**：
  - **OSS**：用于大文件存储或需要国内加速的文件
  - **CDN**：用于静态资源加速，提升国内用户访问速度
- **灵活选择**：可以根据实际需求选择使用哪些服务
- **成本优化**：Supabase 免费版足够开发和小规模使用，阿里云按需付费

### 4.4 为什么选择 Arco Design？

**优势**：
- **企业级组件库**：字节跳动开源，组件丰富，覆盖常见业务场景
- **TypeScript支持**：完整的类型支持
- **设计规范统一**：用户体验优秀
- **主题定制**：支持主题定制和国际化
- **文档完善**：中文文档，易于上手
- **性能优秀**：体积适中，性能优秀

## 五、部署架构

### 5.1 部署方案

**主要方案：阿里云 ECS 部署（推荐）**：
- 国内访问速度快
- 完全控制部署环境
- 支持 Docker 容器化部署
- 支持负载均衡和自动扩缩容
- 付费方便（支付宝/微信支付）
- 与 Supabase 集成良好

**补充服务**：
- 静态资源使用阿里云 CDN 加速（可选）
- 大文件使用阿里云 OSS（可选）

### 5.2 环境配置

**开发环境**：
- 本地开发服务器
- Supabase 开发项目（免费版）

**测试环境**：
- 阿里云 ECS 测试实例
- Supabase 测试项目

**生产环境**：
- 阿里云 ECS 生产实例（主要）
- Supabase 生产项目
- 阿里云 OSS（可选，用于大文件）
- 阿里云 CDN（可选，用于静态资源加速）

### 5.3 监控和日志

**监控工具**：
- 阿里云云监控（免费，功能完善）
- Supabase Dashboard（数据库监控）
- Sentry（错误追踪，可选）
- 阿里云应用实时监控服务 ARMS（可选）

**日志管理**：
- 应用日志：阿里云日志服务 SLS
- 数据库日志：Supabase Logs
- 错误日志：Sentry 或阿里云日志服务

## 六、安全架构

### 6.1 认证和授权

**认证流程**：
1. 用户通过钉钉登录或系统内登录
2. Supabase Auth 处理认证
3. 生成 JWT Token
4. Token 存储在 HttpOnly Cookie 中

**授权机制**：
- **Row Level Security (RLS)**：数据库级别的权限控制
- **应用层权限**：Server Actions 和 API Routes 中的权限检查
- **前端权限**：UI 层面的权限控制

### 6.2 数据安全

**数据加密**：
- 传输加密：HTTPS
- 存储加密：敏感数据加密存储
- 数据库加密：Supabase 自动加密

**数据备份**：
- 自动备份：Supabase 每日自动备份
- 手动备份：支持手动备份和恢复
- 时间点恢复：支持时间点恢复

### 6.3 API安全

**API认证**：
- 所有API需要身份认证
- 使用 Supabase JWT Token 验证

**API限流**：
- 防止恶意请求
- 支持IP限流和用户限流

**输入验证**：
- 所有用户输入进行验证
- 使用Zod进行数据验证
- 防止SQL注入、XSS攻击

## 七、性能优化

### 7.1 前端优化

**代码分割**：
- Next.js自动代码分割
- 动态导入（Dynamic Import）
- 路由级别的代码分割

**缓存策略**：
- 静态资源缓存
- API响应缓存
- 浏览器缓存

**图片优化**：
- Next.js Image组件自动优化
- WebP格式支持
- 懒加载

### 7.2 后端优化

**数据库优化**：
- 索引优化
- 查询优化
- 连接池管理

**API优化**：
- 响应缓存
- 批量查询
- 分页查询

**Server Components**：
- 减少客户端JavaScript
- 服务端数据获取
- 减少网络请求

## 八、扩展性设计

### 8.1 水平扩展

**多实例部署**：
- 支持多实例部署
- 负载均衡
- 无状态设计

**数据库扩展**：
- 支持读写分离
- 支持分库分表（未来）
- 支持数据库集群

### 8.2 功能扩展

**模块化设计**：
- 功能模块独立
- 支持插件机制
- 支持功能开关

**接口扩展**：
- API版本控制
- 向后兼容
- 接口扩展

## 九、技术债务和风险

### 9.1 技术债务

**已知问题**：
- 部分功能需要优化性能
- 部分代码需要重构
- 文档需要完善

**改进计划**：
- 定期代码审查
- 性能优化计划
- 重构计划

### 9.2 技术风险

**依赖风险**：
- Next.js版本升级风险
- Supabase服务稳定性
- 第三方API变更（钉钉、Teambition）

**应对措施**：
- 版本锁定
- 备用方案
- 监控和告警

## 十、架构演进路线

### 10.1 第一阶段（当前）

- Next.js 14 + Supabase 基础架构
- 混合云方案（Supabase + 阿里云补充）
- 核心功能实现
- 基础性能优化

### 10.2 第二阶段（3-6个月）

- 性能优化
- 功能完善
- 监控和日志完善

### 10.3 第三阶段（6-12个月）

- 微服务化（可选）
- 更多第三方集成
- 移动端支持

