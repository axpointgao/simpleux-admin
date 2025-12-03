# 开发指南

## 一、项目结构说明

### 1.1 目录结构

```
simpleux_system/
├── app/                      # Next.js App Router
│   ├── (pages)/             # 页面路由组
│   ├── api/                 # API Routes
│   ├── actions/             # Server Actions
│   └── layout.tsx           # 根布局
├── components/              # React组件
│   ├── ui/                  # 基础UI组件
│   ├── layout/              # 布局组件
│   ├── forms/               # 表单组件
│   └── tables/              # 表格组件
├── lib/                     # 工具库
│   ├── supabase/            # Supabase客户端
│   ├── db/                  # 数据访问层（基于 Supabase）
│   ├── storage/             # 文件存储（Supabase Storage + 阿里云 OSS）
│   ├── utils/               # 工具函数
│   └── validations/         # 验证Schema
├── public/                  # 静态资源
├── styles/                  # 全局样式
└── docs/                    # 文档
```

### 1.2 关键目录说明

**app目录**：
- 使用Next.js 14 App Router
- 每个文件夹代表一个路由
- `page.tsx` 是页面组件
- `layout.tsx` 是布局组件

**components目录**：
- 可复用的React组件
- 按功能分类组织
- 使用TypeScript

**lib目录**：
- 工具函数和业务逻辑
- 数据访问层
- 第三方服务封装

## 二、开发流程

### 2.1 功能开发流程

**1. 创建功能分支**：
```bash
git checkout -b feature/feature-name
```

**2. 开发功能**：
- 创建页面组件
- 实现业务逻辑
- 编写数据访问层
- 添加表单验证

**3. 编写测试**：
- 单元测试
- 集成测试（如需要）

**4. 代码审查**：
- 提交Pull Request
- 等待代码审查
- 解决审查意见

**5. 合并代码**：
- 审查通过后合并
- 删除功能分支

### 2.2 页面开发流程

**1. 创建页面文件**：
```typescript
// app/(pages)/projects/page.tsx
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
```

**2. 创建组件**：
```typescript
// components/tables/project-table.tsx
export function ProjectTable({ projects }: ProjectTableProps) {
  // ...
}
```

**3. 实现数据获取**：
```typescript
// lib/db/projects.ts
export async function getProjects(filters: ProjectFilters) {
  // ...
}
```

**4. 添加Server Actions**：
```typescript
// app/actions/projects.ts
'use server'
export async function createProjectAction(formData: FormData) {
  // ...
}
```

## 三、数据访问层

### 3.1 数据访问模式

**查询操作**：
```typescript
// lib/db/projects.ts
import { createClient } from '@/lib/supabase/server';

export async function getProjects(filters: ProjectFilters) {
  const supabase = await createClient();
  
  let query = supabase
    .from('projects')
    .select('*');
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
```

**创建操作**：
```typescript
export async function createProject(projectData: ProjectData) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3.2 错误处理

**统一错误处理**：
```typescript
export async function getProjectById(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting project:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

## 四、Server Actions

### 4.1 Server Actions使用

**创建Server Action**：
```typescript
// app/actions/projects.ts
'use server'

import { createProject } from '@/lib/db/projects';
import { projectSchema } from '@/lib/validations/project-schema';

export async function createProjectAction(formData: FormData) {
  // 1. 解析表单数据
  const rawData = Object.fromEntries(formData);
  
  // 2. 验证数据
  const validatedData = projectSchema.parse(rawData);
  
  // 3. 创建项目
  const project = await createProject(validatedData);
  
  return { success: true, data: project };
}
```

**在组件中使用**：
```typescript
// components/forms/project-form.tsx
'use client'

import { createProjectAction } from '@/app/actions/projects';

export function ProjectForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createProjectAction(formData);
    if (result.success) {
      // 处理成功
    } else {
      // 处理错误
    }
  }
  
  return <form action={handleSubmit}>...</form>;
}
```

## 五、表单处理

### 5.1 React Hook Form集成

**表单组件**：
```typescript
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema } from '@/lib/validations/project-schema';

export function ProjectForm() {
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      type: '项目制',
    }
  });
  
  const onSubmit = async (data: ProjectFormData) => {
    const result = await createProjectAction(data);
    if (result.success) {
      // 处理成功
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* 表单字段 */}
    </form>
  );
}
```

### 5.2 Zod验证

**Schema定义**：
```typescript
// lib/validations/project-schema.ts
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  type: z.enum(['项目制', '计件制', '离岸制', '驻场制']),
  contractAmount: z.number().positive('合同金额必须大于0'),
});
```

## 六、权限控制

### 6.1 权限检查

**在Server Actions中检查权限**：
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
  
  const hasPermission = await checkPermission(user.id, 'project:create');
  if (!hasPermission) {
    return { success: false, error: '无权限' };
  }
  
  // 继续处理...
}
```

### 6.2 RLS策略

**数据库级权限控制**：
```sql
-- 用户只能查看自己的profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 部门主管可以查看本部门的项目
CREATE POLICY "Department heads can view department projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.department = projects.group
    AND profiles.position = '管理'
  )
);
```

## 七、常见问题

### 7.1 数据获取问题

**问题**：Server Component中无法获取数据
**解决方案**：
- 确保使用`async`函数
- 使用`await`等待异步操作
- 检查Supabase客户端配置

### 7.2 表单提交问题

**问题**：表单提交后页面刷新
**解决方案**：
- 使用`preventDefault()`阻止默认行为
- 使用Server Actions处理提交
- 使用`useRouter`进行导航

### 7.3 权限问题

**问题**：权限检查失败
**解决方案**：
- 检查用户是否登录
- 验证权限配置
- 检查RLS策略

## 八、最佳实践

### 8.1 代码组织

**单一职责原则**：
- 每个函数只做一件事
- 组件保持简洁
- 逻辑分离清晰

**DRY原则**：
- 避免重复代码
- 提取公共逻辑
- 使用工具函数

### 8.2 性能优化

**使用Server Components**：
- 默认使用Server Components
- 只在需要交互时使用Client Components
- 减少客户端JavaScript

**代码分割**：
- 使用动态导入
- 按路由分割代码
- 优化包大小

### 8.3 错误处理

**统一错误处理**：
- 使用统一的错误格式
- 记录错误日志
- 提供友好的错误提示

