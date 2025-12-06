# API 服务层

## 概述

本目录包含所有 API 服务函数，用于与后端 API 进行交互。

## 文件结构

- `config.ts` - API 配置文件（axios 实例、拦截器等）
- `projects.ts` - 项目相关 API
- `frameworks.ts` - 计件项目相关 API
- `index.ts` - API 服务入口

## 配置

### 环境变量

在 `.env` 文件中配置：

```env
# API 基础 URL
REACT_APP_API_BASE_URL=http://localhost:3002/api

# 是否使用 Mock 数据（开发环境）
REACT_APP_USE_MOCK=false
```

### API 基础 URL

默认值：`http://localhost:3002/api`

可以通过环境变量 `REACT_APP_API_BASE_URL` 进行配置。

## 使用方式

### 在组件中使用

```typescript
import { getProjects, createProject } from '@/api/projects';

// 获取项目列表
const projects = await getProjects({ current: 1, pageSize: 10 });

// 创建项目
const newProject = await createProject({
  name: '项目名称',
  type: '项目制',
  // ...
});
```

## API 列表

### 项目相关 API

- `getProjects(params)` - 获取项目列表
- `getProjectById(id)` - 获取项目详情
- `createProject(data)` - 创建项目
- `updateProject(id, data)` - 更新项目
- `getProjectBudgets(id)` - 获取项目预算
- `getProjectExpenses(id)` - 获取项目支出
- `getProjectChanges(id)` - 获取项目变更记录
- `submitProjectChange(id, data)` - 提交项目变更申请
- `submitPendingEntry(id, data)` - 提交项目补录申请
- `submitDesignConfirm(id, data)` - 提交设计确认申请
- `submitArchive(id, data)` - 提交项目归档申请
- `cancelArchive(id)` - 取消项目归档
- `updateStageProgress(id, data)` - 更新阶段进度

### 计件项目相关 API

- `getFrameworks(params)` - 获取计件项目列表
- `getFrameworkById(id)` - 获取计件项目详情
- `createFramework(data)` - 创建计件项目
- `updateFramework(id, data)` - 更新计件项目
- `deleteFramework(id)` - 删除计件项目
- `checkFrameworkHasProjects(id)` - 检查计件项目是否有关联的项目

## 错误处理

API 服务层已经配置了统一的错误处理：

- 401: 未登录或登录已过期
- 403: 没有权限
- 404: 请求的资源不存在
- 500: 服务器错误
- 网络错误: 网络连接问题

所有错误都会通过 `Message.error` 显示给用户。

## 认证

API 请求会自动从 `localStorage` 中获取 `token`，并添加到请求头中：

```
Authorization: Bearer <token>
```

## 注意事项

1. 所有 API 函数都是异步的，需要使用 `await` 或 `.then()` 处理
2. API 响应格式统一为 `{ success: boolean, data: any, error?: string }`
3. 如果 `success` 为 `false`，会自动显示错误消息并抛出异常
4. 建议在组件中使用 `try-catch` 处理 API 调用错误
