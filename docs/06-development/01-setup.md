# 开发环境搭建

## 一、环境要求

### 1.1 系统要求

**操作系统**：
- macOS 10.15+
- Windows 10+
- Linux (Ubuntu 20.04+)

**Node.js版本**：
- Node.js 18.x 或更高版本
- 推荐使用 nvm 管理Node.js版本

**包管理器**：
- npm 9.x+ 或
- yarn 1.22+ 或
- pnpm 8.x+（推荐）

### 1.2 开发工具

**必需工具**：
- Git 2.30+
- VS Code（推荐）或其他代码编辑器
- 浏览器（Chrome、Firefox、Edge最新版本）

**推荐VS Code插件**：
- ESLint
- Prettier
- TypeScript
- GitLens
- Arco Design Snippets（可选，提供代码片段）

## 二、项目初始化

### 2.1 克隆项目

```bash
# 克隆项目仓库
git clone <repository-url>
cd simpleux_system
```

### 2.2 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install

# 或使用pnpm（推荐）
pnpm install
```

**主要依赖包**：
- `next`: Next.js 14框架
- `react` & `react-dom`: React库
- `typescript`: TypeScript支持
- `@arco-design/web-react`: Arco Design React组件库
- `@supabase/supabase-js`: Supabase客户端
- `react-hook-form`: 表单处理（可选，如需要）
- `zod`: 数据验证（可选，如需要）

**安装Arco Design**：
```bash
# 如果package.json中未包含，需要单独安装
npm install @arco-design/web-react
# 或
yarn add @arco-design/web-react
# 或
pnpm add @arco-design/web-react
```

### 2.3 环境变量配置

**创建环境变量文件**：
```bash
# 复制环境变量模板
cp .env.example .env.local
```

**配置环境变量**：
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 钉钉配置（可选）
DINGTALK_APP_KEY=your_dingtalk_app_key
DINGTALK_APP_SECRET=your_dingtalk_app_secret

# 阿里云 OSS 配置（可选，用于大文件存储）
ALIYUN_OSS_ACCESS_KEY_ID=your_oss_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
ALIYUN_OSS_BUCKET=your_bucket_name
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# Teambition配置（可选）
TEAMBITION_APP_KEY=your_teambition_app_key
TEAMBITION_APP_SECRET=your_teambition_app_secret

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 三、Arco Design配置

### 3.1 引入Arco Design样式

**在根布局中引入样式**：
```typescript
// app/layout.tsx
import '@arco-design/web-react/dist/css/arco.css';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

### 3.2 配置ConfigProvider（可选）

**全局配置Arco Design**：
```typescript
// app/layout.tsx
import { ConfigProvider } from '@arco-design/web-react';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <ConfigProvider
          locale={zhCN} // 中文语言包
          componentConfig={{
            // 全局组件配置
            Table: {
              border: true,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
```

### 3.3 主题定制（可选）

**创建主题文件**：
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

**在layout.tsx中引入主题**：
```typescript
import './arco-theme.css';
```

### 3.4 按需引入（推荐）

**使用babel-plugin-import实现按需引入**：
```bash
npm install --save-dev babel-plugin-import
```

**配置babel**：
```json
// .babelrc 或 babel.config.js
{
  "plugins": [
    [
      "import",
      {
        "libraryName": "@arco-design/web-react",
        "libraryDirectory": "es",
        "style": true
      }
    ]
  ]
}
```

**或使用Next.js的webpack配置**：
```javascript
// next.config.js
const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@arco-design/web-react': path.resolve(
        __dirname,
        'node_modules/@arco-design/web-react'
      ),
    };
    return config;
  },
};
```

## 四、Supabase配置

### 3.1 创建 Supabase 项目

**步骤**：
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目（选择免费版即可用于开发）
3. 获取项目 URL 和 API Keys
4. 配置环境变量

**配置环境变量**：
```env
# Supabase（开发环境使用免费版）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 3.2 数据库迁移

**运行迁移脚本**：
```bash
# 使用 Supabase CLI
supabase db push

# 或手动执行 SQL 脚本
# 在 Supabase Dashboard 的 SQL Editor 中执行迁移脚本
```

**迁移脚本位置**：
```
supabase/migrations/
```

**注意事项**：
- 开发环境使用 Supabase 免费版
- 生产环境使用 Supabase Pro 版
- 迁移脚本在 Supabase 中执行

## 五、本地开发

### 4.1 启动开发服务器

```bash
# 启动Next.js开发服务器
npm run dev

# 或
yarn dev

# 或
pnpm dev
```

**访问应用**：
- 打开浏览器访问 `http://localhost:3000`

### 4.2 开发工具

**代码检查**：
```bash
# ESLint检查
npm run lint

# TypeScript类型检查
npm run type-check
```

**代码格式化**：
```bash
# Prettier格式化
npm run format

# 自动修复ESLint错误
npm run lint:fix
```

## 六、数据库开发

### 5.1 本地 Supabase（可选，用于本地开发）

**使用 Supabase CLI 启动本地实例**：
```bash
# 安装 Supabase CLI
npm install -g supabase

# 初始化项目
supabase init

# 启动本地 Supabase
supabase start
```

**本地 Supabase 配置**：
- 本地数据库：PostgreSQL（通过 Docker）
- 本地 API：自动生成
- 本地 Dashboard：http://localhost:54323

**注意**：开发环境推荐直接使用 Supabase 云服务（免费版），本地 Supabase 主要用于测试和调试。

### 5.2 数据库工具

**推荐工具**：
- pgAdmin（桌面应用，功能强大）
- DBeaver（跨平台，免费）
- TablePlus（macOS/Windows，界面美观）
- DataGrip（JetBrains，付费，功能最全）
- VS Code 插件：PostgreSQL（简单查询）

## 七、调试配置

### 6.1 VS Code调试配置

**创建 `.vscode/launch.json`**：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 6.2 浏览器调试

**Chrome DevTools**：
- 使用React DevTools扩展
- 使用Next.js DevTools
- 查看Network、Console、Sources等

## 八、测试环境

### 7.1 运行测试

```bash
# 运行单元测试
npm run test

# 运行测试（watch模式）
npm run test:watch

# 运行E2E测试
npm run test:e2e
```

### 7.2 测试数据

**种子数据**：
```bash
# 运行种子脚本
npm run seed

# 或手动执行SQL
# 在Supabase Dashboard的SQL Editor中执行seed.sql
```

## 九、常见问题

### 8.1 依赖安装问题

**问题**：依赖安装失败
**解决方案**：
```bash
# 清除缓存
npm cache clean --force
# 或
yarn cache clean

# 删除node_modules和lock文件
rm -rf node_modules package-lock.json
npm install
```

### 8.2 环境变量问题

**问题**：环境变量未生效
**解决方案**：
- 确保 `.env.local` 文件在项目根目录
- 重启开发服务器
- 检查环境变量名称是否正确

### 8.3 数据库连接问题

**问题**：无法连接Supabase
**解决方案**：
- 检查Supabase URL和API Key是否正确
- 检查网络连接
- 查看Supabase Dashboard的项目状态

### 8.4 Arco Design样式问题

**问题**：Arco Design组件样式未生效
**解决方案**：
- 确保在 `app/layout.tsx` 中引入了 `@arco-design/web-react/dist/css/arco.css`
- 检查CSS文件是否正确加载
- 清除浏览器缓存并重启开发服务器
- 检查是否有其他CSS覆盖了Arco Design样式

**问题**：按需引入不生效
**解决方案**：
- 检查babel配置是否正确
- 确保使用了正确的导入方式：`import { Button } from '@arco-design/web-react'`
- 如果使用Next.js，可能需要配置webpack

## 十、开发工作流

### 9.1 Git工作流

**分支策略**：
- `main`: 主分支（生产环境）
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

**提交规范**：
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 9.2 代码审查

**Pull Request流程**：
1. 创建功能分支
2. 开发并提交代码
3. 创建Pull Request
4. 代码审查
5. 合并到主分支

## 十一、性能优化

### 10.1 开发环境优化

**Next.js配置**：
```javascript
// next.config.js
module.exports = {
  // 开发环境优化
  ...(process.env.NODE_ENV === 'development' && {
    // 禁用某些优化以加快开发速度
  }),
};
```

### 10.2 构建优化

**生产构建**：
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 十二、文档

### 11.1 代码文档

**JSDoc注释**：
```typescript
/**
 * 创建项目
 * @param data - 项目数据
 * @returns 创建的项目
 */
export async function createProject(data: ProjectData): Promise<Project> {
  // ...
}
```

### 11.2 API文档

**接口文档**：
- 使用OpenAPI/Swagger规范
- 提供接口描述和示例
- 支持在线测试

