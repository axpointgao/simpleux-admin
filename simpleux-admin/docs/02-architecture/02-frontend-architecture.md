# 前端架构设计

## 一、技术栈选型

### 1.1 核心框架

**Next.js 14**：
- **版本**：14.x（App Router）
- **选择理由**：
  - 服务端渲染（SSR）和静态生成（SSG）支持
  - App Router提供现代化的路由和布局系统
  - Server Components减少客户端JavaScript
  - Server Actions简化表单处理和数据变更
  - 内置TypeScript支持
  - 优秀的开发体验和性能优化

### 1.2 开发语言

**TypeScript**：
- **版本**：5.x
- **选择理由**：
  - 类型安全，减少运行时错误
  - 更好的IDE支持和代码提示
  - 提高代码可维护性
  - 全栈类型检查

### 1.3 样式方案

**Arco Design 样式系统 + CSS Modules**：
- **Arco Design CSS**：Arco Design 自带的样式系统
- **CSS Modules**：用于自定义样式和组件样式隔离
- **选择理由**：
  - Arco Design 提供完整的样式系统，开箱即用
  - 支持主题定制和暗色模式
  - CSS Modules 提供样式隔离，避免样式冲突
  - 支持响应式设计
  - 与 Arco Design 组件完美集成

### 1.4 UI组件库

**Arco Design React**：
- **版本**：最新稳定版
- **官方文档**：https://arco.design/react/docs/start
- **选择理由**：
  - 字节跳动开源的企业级设计语言和组件库
  - 组件丰富，覆盖常见业务场景
  - TypeScript 支持完整
  - 设计规范统一，用户体验优秀
  - 支持主题定制和国际化
  - 文档完善，社区活跃
  - 性能优秀，体积适中

### 1.5 状态管理

**React Context + Server Components**：
- **选择理由**：
  - Next.js 14的Server Components减少客户端状态需求
  - React Context用于全局状态（如用户信息、主题等）
  - 避免过度使用状态管理库
  - 保持代码简洁

### 1.6 表单处理

**React Hook Form + Zod**：
- **React Hook Form**：高性能表单库
- **Zod**：TypeScript优先的Schema验证库
- **选择理由**：
  - 性能优秀，减少重渲染
  - 与TypeScript完美集成
  - 支持服务端和客户端验证
  - 易于集成到Server Actions

## 二、项目结构

### 2.1 目录结构

```
app/                                    # Next.js App Router
├── (pages)/                           # 页面路由组
│   ├── dashboard/                     # 仪表盘
│   ├── projects/                      # 商业项目
│   ├── performance/                   # 业绩管理
│   ├── presales/                      # 售前支持
│   ├── contributions/                 # 专业贡献
│   ├── tasks/                         # 任务和工时
│   ├── approvals/                     # 审批管理
│   └── settings/                      # 系统设置
├── api/                               # API Routes
│   └── integrations/                  # 第三方集成接口
├── actions/                           # Server Actions
│   ├── projects.ts
│   ├── performance.ts
│   ├── presales.ts
│   ├── contributions.ts
│   ├── tasks.ts
│   ├── approvals.ts
│   └── settings.ts
├── layout.tsx                         # 根布局
└── page.tsx                           # 首页

components/                            # 组件目录
├── ui/                                # 基础UI组件（基于Arco Design封装）
│   ├── button.tsx                     # 按钮组件封装
│   ├── input.tsx                      # 输入框组件封装
│   ├── select.tsx                     # 选择器组件封装
│   ├── table.tsx                      # 表格组件封装
│   ├── modal.tsx                      # 对话框组件封装
│   ├── card.tsx                       # 卡片组件封装
│   ├── form.tsx                       # 表单组件封装
│   └── ...
├── layout/                            # 布局组件
│   ├── main-layout.tsx                # 主布局
│   ├── sidebar.tsx                    # 侧边栏
│   └── header.tsx                     # 头部
├── forms/                             # 表单组件
│   ├── project-form.tsx
│   ├── budget-form.tsx
│   └── ...
├── tables/                            # 表格组件
│   ├── project-table.tsx
│   ├── task-table.tsx
│   └── ...
└── charts/                            # 图表组件
    ├── cost-chart.tsx
    └── ...

lib/                                   # 工具库
├── supabase/                          # Supabase客户端
│   ├── client.ts                      # 客户端
│   ├── server.ts                      # 服务端
│   └── middleware.ts                  # 中间件
├── db/                                # 数据访问层
│   ├── projects.ts
│   ├── performance.ts
│   └── ...
├── utils/                             # 工具函数
│   ├── cn.ts                          # className合并
│   ├── date.ts                        # 日期处理
│   ├── cost-calculation.ts            # 成本计算
│   └── ...
├── validations/                       # 表单验证
│   ├── project-schema.ts
│   ├── budget-schema.ts
│   └── ...
├── constants/                         # 常量定义
│   ├── enums.ts                       # 枚举
│   └── ...
└── types/                             # TypeScript类型
    ├── project.ts
    ├── performance.ts
    └── ...

public/                                # 静态资源
├── images/
└── ...

styles/                                # 全局样式
├── globals.css                        # 全局样式入口
└── arco-theme.css                     # Arco Design 主题定制
```

### 2.2 路由设计

**App Router路由规则**：
- 使用文件夹结构定义路由
- `(pages)` 路由组用于组织页面，不影响URL
- `layout.tsx` 用于共享布局
- `page.tsx` 用于页面内容
- `loading.tsx` 用于加载状态
- `error.tsx` 用于错误处理

**路由示例**：
- `/` → `app/page.tsx`（重定向到dashboard）
- `/dashboard` → `app/(pages)/dashboard/page.tsx`
- `/projects` → `app/(pages)/projects/page.tsx`
- `/projects/[id]` → `app/(pages)/projects/[id]/page.tsx`
- `/projects/create` → `app/(pages)/projects/create/page.tsx`

## 三、组件设计

### 3.1 组件分类

**基础UI组件（Arco Design）**：
- Button、Input、Select、Table、Modal、Card、Badge、Form、DatePicker等
- 位置：`components/ui/`
- 特点：基于 Arco Design 组件封装，可复用、类型安全、样式统一
- 使用方式：直接使用 Arco Design 组件或进行业务封装

**业务组件**：
- 项目表单、预算表格、工时日历等
- 位置：`components/forms/`、`components/tables/`等
- 特点：业务逻辑封装、可复用

**布局组件**：
- 主布局、侧边栏、头部等
- 位置：`components/layout/`
- 特点：页面结构、导航菜单

### 3.2 组件设计原则

**1. 单一职责**：
- 每个组件只负责一个功能
- 保持组件简洁和可维护

**2. 可复用性**：
- 提取通用逻辑到可复用组件
- 使用Props传递配置

**3. 类型安全**：
- 所有组件使用TypeScript
- Props定义明确的类型

**4. 性能优化**：
- 使用React.memo避免不必要的重渲染
- 使用useMemo和useCallback优化计算

**5. 无障碍性**：
- 使用语义化HTML
- 支持键盘导航
- 提供ARIA标签

### 3.3 组件示例

**表单组件**：
```typescript
// components/forms/project-form.tsx
import { Form, Input, Select, Button } from '@arco-design/web-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema } from '@/lib/validations/project-schema';

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormData) => Promise<void>;
}

export function ProjectForm({ project, onSubmit }: ProjectFormProps) {
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: project || {}
  });
  
  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      layout="vertical"
    >
      <Form.Item label="项目名称" field="name">
        <Input placeholder="请输入项目名称" />
      </Form.Item>
      <Form.Item label="项目类型" field="type">
        <Select placeholder="请选择项目类型">
          <Select.Option value="项目制">项目制</Select.Option>
          <Select.Option value="计件制">计件制</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  );
}
```

**表格组件**：
```typescript
// components/tables/project-table.tsx
import { Table } from '@arco-design/web-react';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
  const columns = [
    { title: '项目名称', dataIndex: 'name' },
    { title: '项目类型', dataIndex: 'type' },
    { title: '操作', render: (_, record) => (
      <>
        <Button onClick={() => onEdit(record.id)}>编辑</Button>
        <Button onClick={() => onDelete(record.id)}>删除</Button>
      </>
    )}
  ];
  
  return <Table columns={columns} data={projects} />;
}
```

## 四、状态管理

### 4.1 状态管理策略

**Server Components（默认）**：
- 数据获取在服务端完成
- 减少客户端JavaScript
- 提升首屏加载速度

**Client Components（需要时）**：
- 交互性组件（表单、按钮等）
- 使用'use client'指令
- 最小化客户端代码

**React Context（全局状态）**：
- 用户信息
- 主题设置
- 通知状态

**URL状态（查询参数）**：
- 列表筛选条件
- 分页信息
- 排序信息

### 4.2 状态管理实现

**用户状态**：
```typescript
// lib/contexts/user-context.tsx
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // 提供用户信息
}
```

**主题状态**：
```typescript
// lib/contexts/theme-context.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // 提供主题切换
}
```

## 五、数据获取

### 5.1 Server Components数据获取

**直接获取**：
```typescript
// app/(pages)/projects/page.tsx
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
```

**使用Server Actions**：
```typescript
// app/actions/projects.ts
'use server'
export async function getProjects(filters: ProjectFilters) {
  // 从数据库获取数据
  return projects;
}
```

### 5.2 Client Components数据获取

**使用SWR或React Query（如需要）**：
- 用于需要实时更新的数据
- 用于客户端交互的数据

## 六、表单处理

### 6.1 Arco Design Form集成

**方式一：使用 Arco Design Form（推荐）**：
```typescript
'use client'
import { Form, Input, Button } from '@arco-design/web-react';
import { useRef } from 'react';

export function ProjectForm() {
  const formRef = useRef();
  
  const onSubmit = async () => {
    try {
      const values = await formRef.current.validate();
      await createProjectAction(values);
    } catch (error) {
      console.error('表单验证失败', error);
    }
  };
  
  return (
    <Form ref={formRef} layout="vertical">
      <Form.Item label="项目名称" field="name" rules={[{ required: true }]}>
        <Input placeholder="请输入项目名称" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={onSubmit}>提交</Button>
      </Form.Item>
    </Form>
  );
}
```

**方式二：使用 React Hook Form + Arco Design（需要适配）**：
```typescript
'use client'
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button } from '@arco-design/web-react';
import { projectSchema } from '@/lib/validations/project-schema';

export function ProjectForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { /* ... */ }
  });
  
  const onSubmit = async (data: ProjectFormData) => {
    await createProjectAction(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => <Input {...field} placeholder="请输入项目名称" />}
      />
      <Button type="primary" htmlType="submit">提交</Button>
    </form>
  );
}
```

### 6.2 Zod验证

**Schema定义**：
```typescript
// lib/validations/project-schema.ts
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  type: z.enum(['项目制', '计件制', '离岸制', '驻场制']),
  contractAmount: z.number().positive('合同金额必须大于0'),
  // ...
});
```

## 七、样式设计

### 7.1 Arco Design 主题配置

**配置文件**：`styles/arco-theme.css`
- 使用 CSS 变量自定义主题颜色
- 自定义组件样式
- 支持暗色模式

**主题定制示例**：
```css
/* styles/arco-theme.css */
:root {
  --color-primary: #1890ff;
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-danger: #f5222d;
}

/* 暗色模式 */
[data-theme='dark'] {
  --color-bg: #1a1a1a;
  --color-text: #ffffff;
}
```

### 7.2 响应式设计

**Arco Design 响应式断点**：
- `xs`: < 576px
- `sm`: ≥ 576px
- `md`: ≥ 768px
- `lg`: ≥ 992px
- `xl`: ≥ 1200px
- `xxl`: ≥ 1600px

**响应式策略**：
- 使用 Arco Design 的 `Grid` 组件实现响应式布局
- 使用 `useBreakpoint` Hook 获取当前断点
- 移动端优先设计
- 测试不同屏幕尺寸

**响应式示例**：
```typescript
import { Grid, useBreakpoint } from '@arco-design/web-react';

export function ResponsiveLayout() {
  const breakpoint = useBreakpoint();
  const span = breakpoint === 'xs' ? 24 : breakpoint === 'sm' ? 12 : 8;
  
  return (
    <Grid.Row>
      <Grid.Col span={span}>内容</Grid.Col>
    </Grid.Row>
  );
}
```

### 7.3 暗色模式

**实现方式**：
- 使用 Arco Design 的 `ConfigProvider` 组件
- 通过 `theme` 属性切换主题
- 支持系统主题检测

**暗色模式示例**：
```typescript
import { ConfigProvider } from '@arco-design/web-react';

export function App({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
```

## 八、性能优化

### 8.1 代码分割

**自动代码分割**：
- Next.js自动按路由分割代码
- 使用动态导入（Dynamic Import）
- 减少初始包大小

### 8.2 图片优化

**Next.js Image组件**：
- 自动图片优化
- 懒加载
- WebP格式支持

### 8.3 缓存策略

**静态资源缓存**：
- 使用Next.js缓存机制
- 配置缓存头
- 优化重复请求

## 九、错误处理

### 9.1 错误边界

**Error Boundary**：
- 使用Next.js error.tsx
- 捕获组件错误
- 显示友好错误页面

### 9.2 表单错误

**Arco Design Form 验证错误**：
- 使用 Form.Item 的 `rules` 属性进行验证
- 自动显示字段级错误提示
- 支持自定义验证规则
- 提交错误处理

**验证示例**：
```typescript
<Form.Item
  label="项目名称"
  field="name"
  rules={[
    { required: true, message: '项目名称不能为空' },
    { minLength: 2, message: '项目名称至少2个字符' }
  ]}
>
  <Input placeholder="请输入项目名称" />
</Form.Item>
```

**通知提示**：
```typescript
import { Notification } from '@arco-design/web-react';

// 成功提示
Notification.success({ title: '操作成功', content: '项目创建成功' });

// 错误提示
Notification.error({ title: '操作失败', content: '项目创建失败' });
```

## 十、开发工具

### 10.1 开发环境

**工具**：
- VS Code
- ESLint
- Prettier
- TypeScript

### 10.2 调试工具

**调试**：
- React DevTools
- Next.js DevTools
- 浏览器开发者工具

## 十一、测试策略

### 11.1 单元测试

**测试框架**：
- Jest + React Testing Library
- 测试组件逻辑和工具函数

### 11.2 集成测试

**测试内容**：
- 表单提交流程
- 数据获取和显示
- 用户交互流程

### 11.3 E2E测试

**测试工具**：
- Playwright（可选）
- 测试关键用户流程

## 十二、构建和部署

### 12.1 构建配置

**Next.js配置**：
- `next.config.js` 配置文件
- 环境变量配置
- 输出模式配置

### 12.2 部署优化

**优化策略**：
- 静态资源优化
- 代码压缩
- 图片优化
- 缓存策略

## 十三、最佳实践

### 13.1 代码组织

**原则**：
- 按功能模块组织代码
- 保持文件结构清晰
- 避免过度嵌套

### 13.2 性能优化

**建议**：
- 使用Server Components优先
- 最小化Client Components
- 优化图片和资源加载
- 使用代码分割
- Arco Design 组件按需引入，减少打包体积
- 使用 `React.memo` 优化组件渲染
- 合理使用 Arco Design 的虚拟滚动（Table、Select等）

### 13.3 可维护性

**建议**：
- 编写清晰的注释
- 使用有意义的变量名
- 保持函数简洁
- 遵循单一职责原则

