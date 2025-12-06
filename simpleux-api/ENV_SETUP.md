# 环境变量配置说明

## 创建 .env.local 文件

在 `simpleux-api` 目录下创建 `.env.local` 文件，配置以下环境变量：

```bash
# Supabase 配置
# 从 Supabase 项目设置中获取这些值
# https://app.supabase.com/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 环境配置
NODE_ENV=development
```

## 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目（或创建新项目）
3. 进入 **Settings** > **API**
4. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 注意事项

- `.env.local` 文件不会被提交到 Git（已在 `.gitignore` 中）
- 不要将真实的密钥提交到代码仓库
- 生产环境需要在部署平台配置环境变量

