# 后端架构设计

## 一、技术栈选型

### 1.1 核心框架

**Next.js 14 Server Actions / API Routes**：
- **选择理由**：
  - 与前端统一技术栈，减少学习成本
  - Server Actions简化表单处理和数据变更
  - API Routes处理第三方集成和Webhook
  - 类型安全，支持TypeScript
  - 优秀的开发体验

### 1.2 数据库

**Supabase (PostgreSQL)**：
- **选择理由**：
  - 强大的关系型数据库
  - 自动生成 RESTful API
  - Row Level Security (RLS) 权限控制
  - 内置认证服务
  - 友好的管理界面
  - 完整的 TypeScript 支持
  - 开发体验好

### 1.3 数据访问

**Supabase Client**：
- 客户端：`@supabase/supabase-js`
- 服务端：`@supabase/ssr`
- 类型生成：`supabase gen types typescript`

## 二、架构分层

### 2.1 分层结构

```
┌─────────────────────────────────────┐
│      API层（API Layer）              │
│  Server Actions / API Routes        │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│     业务逻辑层（Business Logic）      │
│  业务规则处理、数据验证、权限检查      │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│     数据访问层（Data Access）         │
│  Supabase Client / Database         │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│     数据存储层（Data Storage）        │
│  PostgreSQL (Supabase)              │
└─────────────────────────────────────┘
```

### 2.2 各层职责

**API层**：
- 接收HTTP请求
- 参数验证
- 调用业务逻辑层
- 返回响应

**业务逻辑层**：
- 业务规则处理
- 数据验证
- 权限检查
- 事务管理

**数据访问层**：
- 数据库查询
- 数据转换
- 错误处理

**数据存储层**：
- 数据持久化
- 数据完整性
- 性能优化

## 三、Server Actions设计

### 3.1 Server Actions结构

**文件组织**：
```
app/actions/
├── projects.ts              # 项目相关操作
├── performance.ts            # 业绩相关操作
├── presales.ts               # 售前支持相关操作
├── contributions.ts          # 专业贡献相关操作
├── tasks.ts                  # 任务相关操作
├── approvals.ts              # 审批相关操作
└── settings.ts               # 系统设置相关操作
```

### 3.2 Server Actions模式

**创建操作**：
```typescript
'use server'
import { createClient } from '@/lib/supabase/server';
import { projectSchema } from '@/lib/validations/project-schema';

export async function createProjectAction(formData: FormData) {
  // 1. 验证用户权限
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: '未登录' };
  }
  
  // 2. 解析和验证表单数据
  const rawData = Object.fromEntries(formData);
  const validatedData = projectSchema.parse(rawData);
  
  // 3. 调用数据访问层
  const project = await createProject(validatedData, user.id);
  
  // 4. 返回结果
  return { success: true, data: project };
}
```

**查询操作**：
```typescript
'use server'
export async function getProjectsAction(filters: ProjectFilters) {
  // 1. 验证用户权限
  // 2. 构建查询条件
  // 3. 执行数据库查询
  // 4. 返回数据
}
```

**更新操作**：
```typescript
'use server'
export async function updateProjectAction(id: string, formData: FormData) {
  // 1. 验证用户权限
  // 2. 验证数据
  // 3. 更新数据库
  // 4. 返回结果
}
```

### 3.3 错误处理

**错误处理模式**：
```typescript
'use server'
export async function createProjectAction(formData: FormData) {
  try {
    // 业务逻辑
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## 四、API Routes设计

### 4.1 API Routes结构

**文件组织**：
```
app/api/
├── integrations/
│   ├── dingtalk/
│   │   ├── sync/route.ts          # 钉钉同步接口
│   │   ├── approval/callback/route.ts  # 审批回调
│   │   └── notification/route.ts  # 通知接口
│   └── teambition/
│       └── sync/route.ts           # Teambition同步接口
└── webhooks/
    └── dingtalk/route.ts           # 钉钉Webhook
```

### 4.2 API Routes模式

**GET请求**：
```typescript
// app/api/integrations/dingtalk/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 处理GET请求
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

**POST请求**：
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 验证请求数据
    // 处理业务逻辑
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## 五、数据访问层设计

### 5.1 数据访问层结构

**文件组织**：
```
lib/db/
├── projects.ts              # 项目数据访问
├── performance.ts            # 业绩数据访问
├── presales.ts               # 售前支持数据访问
├── contributions.ts          # 专业贡献数据访问
├── tasks.ts                  # 任务数据访问
├── approvals.ts              # 审批数据访问
└── settings.ts               # 系统设置数据访问
```

### 5.2 数据访问模式

**查询操作**：
```typescript
// lib/db/projects.ts
import { createClient } from '@/lib/supabase/server';

export async function getProjects(filters: ProjectFilters) {
  const supabase = await createClient();
  
  let query = supabase
    .from('projects')
    .select('*');
  
  // 应用筛选条件
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.group) {
    query = query.eq('group', filters.group);
  }
  
  // 添加分页
  if (filters.page && filters.pageSize) {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
```

**创建操作**：
```typescript
export async function createProject(projectData: ProjectData, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      created_by: userId,
      status: projectData.status || 'pending_start',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

**更新操作**：
```typescript
export async function updateProject(id: string, updates: Partial<ProjectData>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

## 六、业务逻辑处理

### 6.1 业务规则验证

**验证位置**：
- Server Actions中验证
- 使用Zod Schema验证
- 数据库约束验证

**验证示例**：
```typescript
'use server'
import { projectSchema } from '@/lib/validations/project-schema';

export async function createProjectAction(formData: FormData) {
  // 1. 解析表单数据
  const rawData = Object.fromEntries(formData);
  
  // 2. Zod验证
  const validatedData = projectSchema.parse(rawData);
  
  // 3. 业务规则验证
  if (validatedData.type === '项目制' && !validatedData.budget) {
    return { success: false, error: '项目制必须录入预算' };
  }
  
  // 4. 创建项目
  const project = await createProject(validatedData);
  return { success: true, data: project };
}
```

### 6.2 权限检查

**权限检查模式**：
```typescript
'use server'
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/utils/permissions';

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: '未登录' };
  }
  
  // 检查权限
  const hasPermission = await checkPermission(user.id, 'project:create');
  if (!hasPermission) {
    return { success: false, error: '无权限' };
  }
  
  // 继续处理...
}
```

### 6.3 事务处理

**事务处理模式**：
```typescript
import { createClient } from '@/lib/supabase/server';

export async function createProjectWithBudget(projectData: ProjectData, budgetData: BudgetData) {
  const supabase = await createClient();
  
  // Supabase 使用 RPC 函数处理事务
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
  
  if (projectError) throw projectError;
  
  // 创建预算
  const { error: budgetError } = await supabase
    .from('project_budgets_labor')
    .insert(budgetData.map(item => ({ ...item, project_id: project.id })));
  
  if (budgetError) {
    // 回滚：删除已创建的项目
    await supabase.from('projects').delete().eq('id', project.id);
    throw budgetError;
  }
  
  return project;
}
```

## 七、错误处理

### 7.1 错误类型

**错误分类**：
- 验证错误（400）
- 权限错误（403）
- 未找到（404）
- 服务器错误（500）

### 7.2 错误处理策略

**统一错误处理**：
```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }
  
  console.error('Unexpected error:', error);
  return { success: false, error: 'Internal Server Error' };
}
```

## 八、性能优化

### 8.1 数据库查询优化

**优化策略**：
- 使用索引优化查询
- 避免N+1查询问题
- 使用批量查询
- 分页查询

### 8.2 缓存策略

**缓存位置**：
- Next.js缓存（Server Components）
- 数据库查询缓存
- API响应缓存

### 8.3 异步处理

**异步任务**：
- 使用队列处理耗时任务
- 使用后台任务处理同步操作
- 使用Webhook处理回调

## 九、安全设计

### 9.1 认证和授权

**认证流程**：
- Supabase Auth 处理用户认证
- JWT Token 存储在 HttpOnly Cookie
- 中间件验证 Token

**授权检查**：
- Row Level Security (RLS)：数据库级别的权限控制
- 应用层权限检查：Server Actions 和 API Routes 中的权限验证
- 前端权限：UI 层面的权限控制

### 9.2 数据验证

**验证策略**：
- 输入验证（Zod Schema）
- SQL注入防护（参数化查询）
- XSS防护（数据转义）

### 9.3 API安全

**安全措施**：
- HTTPS传输
- API限流
- CORS配置
- 请求签名验证（第三方API）

## 十、日志和监控

### 10.1 日志记录

**日志类型**：
- 操作日志
- 错误日志
- 性能日志

**日志位置**：
- 控制台输出（开发环境）
- 文件日志（生产环境）
- 日志服务（可选）

### 10.2 监控指标

**监控内容**：
- API响应时间
- 错误率
- 数据库查询性能
- 系统资源使用

## 十一、测试策略

### 11.1 单元测试

**测试内容**：
- 业务逻辑函数
- 数据访问函数
- 工具函数

### 11.2 集成测试

**测试内容**：
- Server Actions流程
- API Routes流程
- 数据库操作

### 11.3 E2E测试

**测试内容**：
- 完整业务流程
- 用户交互流程

