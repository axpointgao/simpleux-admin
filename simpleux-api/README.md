# SimpleUX API

商业项目管理系统的后端 API 服务，基于 Next.js 14 和 Supabase。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **语言**: TypeScript
- **验证**: Zod

## 环境配置

1. 复制 `.env.local.example` 为 `.env.local`
2. 填写 Supabase 配置信息：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## API 接口

### 项目相关

- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取项目详情
- `GET /api/projects/[id]/budgets` - 获取项目预算
- `GET /api/projects/[id]/expenses` - 获取项目支出
- `GET /api/projects/[id]/stages` - 获取项目阶段

### 框架协议相关

- `GET /api/frameworks` - 获取框架协议列表
- `POST /api/frameworks` - 创建框架协议
- `GET /api/frameworks/[id]` - 获取框架协议详情
- `PUT /api/frameworks/[id]` - 更新框架协议

## 项目结构

```
simpleux-api/
├── app/
│   ├── api/              # API Routes
│   │   ├── projects/     # 项目相关接口
│   │   └── frameworks/   # 框架协议相关接口
│   └── ...
├── lib/
│   ├── db/               # 数据访问层
│   ├── supabase/         # Supabase 客户端
│   └── types/            # 类型定义
└── ...
```

## 注意事项

1. 所有 API 接口都需要用户登录认证
2. 数据库字段使用 snake_case，API 返回使用 camelCase
3. 错误处理统一返回 `{ success: false, error: string }` 格式
4. 成功响应返回 `{ success: true, data: any }` 格式
