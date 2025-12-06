# 商业项目模块后端开发总结

## 已完成功能

### 1. 项目基础功能
- ✅ 项目列表查询（支持多条件筛选、分页）
- ✅ 项目详情查询
- ✅ 项目创建（支持四种项目类型，自动生成编号）
- ✅ 项目预算查询（人力、差旅、外包）
- ✅ 项目支出查询（差旅、外包）
- ✅ 项目阶段查询和更新

### 2. 项目变更功能
- ✅ 项目变更申请创建
- ✅ 项目变更记录查询

### 3. 补录申请功能
- ✅ 补录申请提交（更新业绩金额和预算）

### 4. 设计确认功能
- ✅ 设计确认申请提交

### 5. 归档功能
- ✅ 项目归档（状态更新为已归档）
- ✅ 取消归档（状态恢复为已确认）

### 6. 支出管理功能
- ✅ 差旅支出创建、更新、删除
- ✅ 外包支出创建、更新、删除

### 7. 框架协议功能
- ✅ 框架协议列表查询（支持多条件筛选、分页）
- ✅ 框架协议详情查询
- ✅ 框架协议创建
- ✅ 框架协议更新（直接编辑，无需审批）
- ✅ 框架协议关联项目查询

## 技术实现

### 技术栈
- **框架**: Next.js 14 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **语言**: TypeScript
- **认证**: Supabase Auth

### 项目结构
```
simpleux-api/
├── app/
│   └── api/                    # API Routes
│       ├── projects/           # 项目相关接口
│       └── frameworks/         # 框架协议相关接口
├── lib/
│   ├── db/                     # 数据访问层
│   │   ├── projects.ts
│   │   ├── project-changes.ts
│   │   └── project-pending-entry.ts
│   ├── supabase/               # Supabase 客户端
│   │   ├── client.ts          # 客户端组件使用
│   │   ├── server.ts          # 服务端使用
│   │   └── admin.ts           # 管理员客户端
│   └── types/                  # 类型定义
│       └── project.ts
└── API.md                      # API 文档
```

### 数据访问层设计
- **分层架构**: API Routes → 数据访问层 → Supabase
- **数据转换**: 数据库 snake_case ↔ API camelCase
- **错误处理**: 统一的错误响应格式
- **类型安全**: 完整的 TypeScript 类型定义

## API 接口列表

### 项目相关（14个接口）
1. `GET /api/projects` - 获取项目列表
2. `POST /api/projects` - 创建项目
3. `GET /api/projects/[id]` - 获取项目详情
4. `GET /api/projects/[id]/budgets` - 获取项目预算
5. `GET /api/projects/[id]/expenses` - 获取项目支出
6. `GET /api/projects/[id]/stages` - 获取项目阶段
7. `PUT /api/projects/[id]/stages/[stageId]` - 更新阶段进度
8. `GET /api/projects/[id]/changes` - 获取变更记录
9. `POST /api/projects/[id]/changes` - 创建变更申请
10. `POST /api/projects/[id]/pending-entry` - 提交补录申请
11. `POST /api/projects/[id]/design-confirm` - 发起设计确认
12. `POST /api/projects/[id]/archive` - 发起归档
13. `DELETE /api/projects/[id]/archive` - 取消归档
14. `POST /api/projects/[id]/expenses/travel` - 创建差旅支出
15. `PUT /api/projects/[id]/expenses/travel/[expenseId]` - 更新差旅支出
16. `DELETE /api/projects/[id]/expenses/travel/[expenseId]` - 删除差旅支出
17. `POST /api/projects/[id]/expenses/outsource` - 创建外包支出
18. `PUT /api/projects/[id]/expenses/outsource/[expenseId]` - 更新外包支出
19. `DELETE /api/projects/[id]/expenses/outsource/[expenseId]` - 删除外包支出

### 框架协议相关（5个接口）
1. `GET /api/frameworks` - 获取框架协议列表
2. `POST /api/frameworks` - 创建框架协议
3. `GET /api/frameworks/[id]` - 获取框架协议详情
4. `PUT /api/frameworks/[id]` - 更新框架协议
5. `GET /api/frameworks/[id]/projects` - 获取关联项目

## 待完善功能

### 1. 审批流程集成
- [ ] 项目变更申请审批流程
- [ ] 补录申请审批流程
- [ ] 设计确认审批流程
- [ ] 归档审批流程

### 2. 财务计算
- [ ] 自动计算项目利润（预估利润、实际利润）
- [ ] 自动计算项目利润率
- [ ] 预算与支出核对逻辑

### 3. 数据统计
- [ ] 项目统计视图（预算总额、支出总额等）
- [ ] 自动更新项目统计字段

### 4. 业务规则验证
- [ ] 项目状态流转验证
- [ ] 归档前预算与支出核对
- [ ] 阶段占比验证（总和必须100%）

### 5. 权限控制
- [ ] RLS (Row Level Security) 策略实现
- [ ] 基于角色的权限验证

## 使用说明

### 1. 环境配置
```bash
# 复制环境变量示例文件
cp .env.local.example .env.local

# 填写 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
npm start
```

## 注意事项

1. **认证**: 所有 API 都需要用户登录认证（通过 Supabase Auth）
2. **数据格式**: 数据库使用 snake_case，API 返回使用 camelCase
3. **金额字段**: 统一使用 numeric 类型，返回时转换为 number
4. **日期字段**: 使用 ISO 8601 格式字符串
5. **错误处理**: 统一返回 `{ success: false, error: string }` 格式
6. **成功响应**: 统一返回 `{ success: true, data: any }` 格式

## 下一步计划

1. 实现审批流程集成
2. 完善财务计算逻辑
3. 实现数据统计和自动更新
4. 添加业务规则验证
5. 实现权限控制（RLS）
6. 编写单元测试和集成测试
7. 性能优化和缓存策略

