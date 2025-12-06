# 开发规范

## 一、代码规范

### 1.1 TypeScript规范

**类型定义**：
- 使用明确的类型，避免使用`any`
- 优先使用接口（interface）定义对象类型
- 使用类型别名（type）定义联合类型、工具类型
- 导出类型时使用`export type`

**示例**：
```typescript
// ✅ 好的做法
export interface User {
  id: string;
  name: string;
  email: string;
}

export type UserStatus = 'active' | 'inactive';

// ❌ 不好的做法
export const user: any = { ... };
```

**命名规范**：
- 接口和类型：PascalCase（`User`, `ProjectData`）
- 变量和函数：camelCase（`userName`, `getUserById`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- 组件：PascalCase（`UserProfile`, `ProjectList`）

### 1.2 React组件规范

**组件结构**：
```typescript
// 1. 导入
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. 类型定义
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. 组件定义
export function Component({ title, onAction }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState<string>('');
  
  // 5. 事件处理
  const handleClick = () => {
    // ...
  };
  
  // 6. 渲染
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

**组件命名**：
- 组件文件名：PascalCase（`UserProfile.tsx`）
- 组件函数名：与文件名一致
- 默认导出组件

**Props类型**：
- 使用接口定义Props
- 必需属性不使用`?`
- 可选属性使用`?`

### 1.3 文件组织规范

**目录结构**：
```
components/
├── ui/                    # 基础UI组件
├── layout/                # 布局组件
├── forms/                 # 表单组件
└── tables/                # 表格组件

lib/
├── supabase/              # Supabase客户端
├── db/                    # 数据访问层
├── utils/                 # 工具函数
└── validations/           # 验证Schema
```

**文件命名**：
- 组件文件：PascalCase（`UserProfile.tsx`）
- 工具文件：camelCase（`formatDate.ts`）
- 类型文件：camelCase（`user.types.ts`）

## 二、Git工作流

### 2.1 分支策略

**主分支**：
- `main`: 生产环境代码，保持稳定
- `develop`: 开发分支，集成所有功能

**功能分支**：
- `feature/功能名称`: 新功能开发
- `fix/问题描述`: Bug修复
- `refactor/重构内容`: 代码重构
- `docs/文档内容`: 文档更新

**分支命名**：
```
feature/user-authentication
fix/project-list-pagination
refactor/database-queries
docs/api-documentation
```

### 2.2 提交规范

**提交信息格式**：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型**：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例**：
```
feat(projects): 添加项目创建功能

- 实现项目创建表单
- 添加表单验证
- 集成审批流程

Closes #123
```

### 2.3 Pull Request规范

**PR标题**：
- 使用提交信息格式
- 简洁明了，描述变更内容

**PR描述**：
- 变更内容说明
- 相关Issue链接
- 测试说明
- 截图（如适用）

**代码审查**：
- 至少一人审查通过
- 解决所有审查意见
- 通过CI检查

## 三、代码审查

### 3.1 审查清单

**功能审查**：
- [ ] 功能实现正确
- [ ] 边界情况处理
- [ ] 错误处理完善
- [ ] 性能考虑

**代码质量**：
- [ ] 代码风格一致
- [ ] 命名清晰
- [ ] 注释充分
- [ ] 无重复代码

**测试**：
- [ ] 单元测试覆盖
- [ ] 集成测试通过
- [ ] 手动测试完成

### 3.2 审查原则

**审查重点**：
- 代码逻辑正确性
- 性能和安全性
- 可维护性和可读性
- 符合项目规范

**审查态度**：
- 建设性反馈
- 尊重开发者
- 共同学习进步

## 四、ESLint配置

### 4.1 规则配置

**推荐规则**：
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 4.2 Prettier配置

**格式化规则**：
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 五、注释规范

### 5.1 函数注释

**JSDoc格式**：
```typescript
/**
 * 根据ID获取用户信息
 * @param userId - 用户ID
 * @returns 用户信息
 * @throws {Error} 当用户不存在时抛出错误
 */
export async function getUserById(userId: string): Promise<User> {
  // ...
}
```

### 5.2 复杂逻辑注释

**说明复杂业务逻辑**：
```typescript
// 计算项目利润：
// 归档前：业绩金额 - 预计支出
// 归档时：业绩金额 - 实际支出
const profit = project.status === '已归档'
  ? contractAmount - actualCost
  : contractAmount - estimatedCost;
```

## 六、错误处理

### 6.1 错误处理规范

**统一错误处理**：
```typescript
try {
  // 业务逻辑
  return { success: true, data: result };
} catch (error) {
  console.error('Error:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

**错误类型**：
- 使用自定义错误类
- 提供错误码和错误信息
- 记录错误日志

### 6.2 日志规范

**日志级别**：
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

**日志格式**：
```typescript
console.error('[Module] Error message', { context });
```

## 七、性能规范

### 7.1 性能要求

**响应时间**：
- 页面加载：< 2秒
- API响应：< 1秒
- 数据库查询：< 500ms

**优化策略**：
- 使用Server Components
- 代码分割和懒加载
- 图片优化
- 数据库查询优化

### 7.2 性能监控

**监控指标**：
- 页面加载时间
- API响应时间
- 数据库查询时间
- 错误率

## 八、安全规范

### 8.1 安全要求

**输入验证**：
- 所有用户输入必须验证
- 使用Zod Schema验证
- 防止SQL注入和XSS攻击

**权限控制**：
- 所有接口进行权限验证
- 使用RLS进行数据级权限控制
- 敏感操作需要额外验证

### 8.2 敏感信息

**禁止提交**：
- API密钥
- 密码和Token
- 数据库连接字符串
- 个人隐私信息

**安全存储**：
- 使用环境变量存储敏感信息
- 加密存储敏感数据
- 定期更新密钥

## 九、测试规范

### 9.1 测试要求

**测试覆盖**：
- 核心业务逻辑必须有测试
- 测试覆盖率 > 80%
- 关键功能必须有E2E测试

**测试类型**：
- 单元测试：测试函数和组件
- 集成测试：测试模块交互
- E2E测试：测试完整流程

### 9.2 测试编写

**测试结构**：
```typescript
describe('FunctionName', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionName(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## 十、文档规范

### 10.1 代码文档

**必需文档**：
- README.md：项目说明
- API文档：接口说明
- 业务逻辑文档：业务规则

### 10.2 文档更新

**更新时机**：
- 功能变更时更新文档
- API变更时更新接口文档
- 业务规则变更时更新业务文档

