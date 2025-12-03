# 测试指南

## 一、测试策略

### 1.1 测试金字塔

**测试层次**：
```
        /\
       /  \      E2E测试（少量）
      /____\
     /      \    集成测试（适量）
    /________\
   /          \  单元测试（大量）
  /____________\
```

**测试比例**：
- 单元测试：70%
- 集成测试：20%
- E2E测试：10%

### 1.2 测试工具

**测试框架**：
- Jest：单元测试和集成测试
- React Testing Library：React组件测试
- Playwright：E2E测试（可选）

**测试工具**：
- @testing-library/react：React组件测试工具
- @testing-library/jest-dom：DOM断言
- @testing-library/user-event：用户交互模拟

## 二、单元测试

### 2.1 工具函数测试

**测试示例**：
```typescript
// lib/utils/__tests__/date.test.ts
import { formatDate, calculateWorkdays } from '../date';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});

describe('calculateWorkdays', () => {
  it('should calculate workdays excluding weekends', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-07');
    expect(calculateWorkdays(start, end)).toBe(5);
  });
});
```

### 2.2 业务逻辑测试

**测试示例**：
```typescript
// lib/utils/__tests__/cost-calculation.test.ts
import { calculateLaborCost } from '../cost-calculation';

describe('calculateLaborCost', () => {
  it('should calculate labor cost correctly', () => {
    const hours = 40;
    const dailyCost = 2000;
    const expected = (hours / 8) * dailyCost;
    
    expect(calculateLaborCost(hours, dailyCost)).toBe(expected);
  });
});
```

## 三、组件测试

### 3.1 React组件测试

**测试示例**：
```typescript
// components/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3.2 表单组件测试

**测试示例**：
```typescript
// components/forms/__tests__/project-form.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from '../project-form';

describe('ProjectForm', () => {
  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    render(<ProjectForm onSubmit={onSubmit} />);
    
    await user.type(screen.getByLabelText('项目名称'), '测试项目');
    await user.click(screen.getByRole('button', { name: '提交' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: '测试项目',
        // ...
      });
    });
  });
  
  it('should show validation errors', async () => {
    const user = userEvent.setup();
    
    render(<ProjectForm />);
    
    await user.click(screen.getByRole('button', { name: '提交' }));
    
    expect(await screen.findByText('项目名称不能为空')).toBeInTheDocument();
  });
});
```

## 四、集成测试

### 4.1 API集成测试

**测试示例**：
```typescript
// app/api/__tests__/projects.test.ts
import { createMocks } from 'node-mocks-http';
import { GET } from '../projects/route';

describe('/api/projects', () => {
  it('should return projects list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    await GET(req);
    
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.items)).toBe(true);
  });
});
```

### 4.2 Server Actions测试

**测试示例**：
```typescript
// app/actions/__tests__/projects.test.ts
import { createProjectAction } from '../projects';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

describe('createProjectAction', () => {
  it('should create project successfully', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', name: '测试项目' },
        error: null,
      }),
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    
    const formData = new FormData();
    formData.append('name', '测试项目');
    
    const result = await createProjectAction(formData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('测试项目');
  });
});
```

## 五、E2E测试

### 5.1 Playwright测试

**测试示例**：
```typescript
// e2e/projects.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('should create project', async ({ page }) => {
    await page.goto('/projects');
    
    await page.click('text=创建项目');
    
    await page.fill('[name="name"]', '测试项目');
    await page.selectOption('[name="type"]', '项目制');
    await page.fill('[name="contractAmount"]', '100000');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=测试项目')).toBeVisible();
  });
});
```

### 5.2 测试配置

**playwright.config.ts**：
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 六、测试数据

### 6.1 Mock数据

**创建Mock数据**：
```typescript
// lib/mocks/projects.ts
export const mockProjects = [
  {
    id: '1',
    name: '测试项目1',
    type: '项目制',
    status: '进行中',
  },
  {
    id: '2',
    name: '测试项目2',
    type: '计件制',
    status: '待启动',
  },
];
```

### 6.2 测试数据库

**使用测试数据库**：
```typescript
// 测试前设置
beforeAll(async () => {
  // 连接测试数据库
  // 清理测试数据
});

afterEach(async () => {
  // 清理测试数据
});

afterAll(async () => {
  // 关闭数据库连接
});
```

## 七、测试覆盖率

### 7.1 覆盖率目标

**覆盖率要求**：
- 整体覆盖率：> 80%
- 核心业务逻辑：> 90%
- 工具函数：> 95%

### 7.2 覆盖率报告

**生成覆盖率报告**：
```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

## 八、测试最佳实践

### 8.1 测试编写原则

**AAA模式**：
- Arrange：准备测试数据
- Act：执行被测试的操作
- Assert：断言结果

**测试独立性**：
- 每个测试应该独立
- 不依赖其他测试的执行顺序
- 测试之间不共享状态

### 8.2 测试命名

**命名规范**：
```typescript
describe('ComponentName', () => {
  it('should do something when condition', () => {
    // ...
  });
});
```

**命名示例**：
```typescript
describe('ProjectForm', () => {
  it('should submit form with valid data', () => {});
  it('should show error when name is empty', () => {});
  it('should disable submit button when form is invalid', () => {});
});
```

## 九、持续集成

### 9.1 CI配置

**GitHub Actions示例**：
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run test:e2e
```

### 9.2 测试自动化

**自动化流程**：
1. 代码提交触发测试
2. 运行单元测试
3. 运行集成测试
4. 运行E2E测试（可选）
5. 生成覆盖率报告
6. 发布测试结果

## 十、调试测试

### 10.1 调试技巧

**使用debugger**：
```typescript
it('should do something', () => {
  debugger; // 断点
  // 测试代码
});
```

**使用console.log**：
```typescript
it('should do something', () => {
  console.log('Test data:', data);
  // 测试代码
});
```

### 10.2 测试工具

**VS Code调试**：
- 使用Jest扩展
- 设置断点
- 单步调试

