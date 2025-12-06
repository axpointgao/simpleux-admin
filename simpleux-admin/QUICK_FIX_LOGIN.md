# 快速修复：跳过登录检查

## 问题

访问前端页面会自动跳转到登录页，无法访问项目列表页。

## 解决方案

### 方案 1：设置环境变量（推荐）

在 `simpleux-admin/.env.development` 或 `.env` 文件中添加：

```env
REACT_APP_USE_MOCK=true
```

然后重启前端服务。

### 方案 2：代码已默认跳过（已实现）

代码已经修改为：**在开发环境（`NODE_ENV=development`）默认跳过登录检查**。

这意味着：

- ✅ 开发环境（`npm start`）会自动跳过登录
- ✅ 不需要设置环境变量也能工作
- ✅ 生产环境（`npm run build`）仍然需要登录

## 验证

1. 确保在开发模式运行：

   ```bash
   npm start
   ```

2. 访问 `http://localhost:3001`
3. 应该直接进入首页，不会跳转到登录页

## 如果还是跳转

1. **清除浏览器缓存**：

   - 按 `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows) 强制刷新
   - 或者清除 localStorage：打开控制台，执行 `localStorage.clear()`

2. **检查控制台**：

   - 打开浏览器开发者工具
   - 查看 Console 标签页
   - 查看是否有错误信息

3. **重启服务**：
   ```bash
   # 停止服务（Ctrl+C）
   # 重新启动
   npm start
   ```

## 当前代码逻辑

- **开发环境**：自动跳过登录检查，直接设置 `localStorage.setItem('userStatus', 'login')`
- **生产环境**：需要登录验证

如果还有问题，请检查：

1. 是否在开发模式运行（`npm start` 而不是 `npm run build`）
2. 浏览器控制台是否有错误
3. 是否清除了旧的 localStorage
