#!/bin/bash

# API 触发器测试脚本
# 用于测试预算/支出汇总字段是否自动更新

echo "=== 测试 API 触发器 ==="
echo ""

# 1. 测试创建项目
echo "1. 测试创建项目..."
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3002/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "触发器测试项目",
    "type": "项目制",
    "managerId": "test-manager-id",
    "managerName": "测试经理",
    "group": "测试部门",
    "planStartDate": "2024-12-01",
    "planEndDate": "2024-12-31",
    "contractAmount": 100000
  }')

echo "创建项目响应:"
echo "$PROJECT_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECT_RESPONSE"
echo ""

# 提取项目 ID
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "❌ 创建项目失败，无法继续测试"
  exit 1
fi

echo "✅ 项目创建成功，ID: $PROJECT_ID"
echo ""

# 2. 检查初始汇总字段
echo "2. 检查初始汇总字段..."
INITIAL_DATA=$(curl -s "http://localhost:3002/api/projects/$PROJECT_ID")
echo "初始数据:"
echo "$INITIAL_DATA" | jq '.data | {labor_budget_total, travel_budget_total, estimated_profit_rate}' 2>/dev/null || echo "$INITIAL_DATA"
echo ""

# 3. 测试添加预算（通过 API）
echo "3. 注意：预算/支出数据需要通过数据库直接操作来测试触发器"
echo "   请使用 Supabase Dashboard 执行 test_triggers.sql 文件中的 SQL 语句"
echo ""

echo "=== 测试说明 ==="
echo ""
echo "由于预算/支出数据需要通过数据库操作来触发，建议："
echo "1. 在 Supabase Dashboard 的 SQL Editor 中执行 test_triggers.sql"
echo "2. 或者通过 API 创建预算数据后，检查汇总字段是否自动更新"
echo ""
echo "项目 ID: $PROJECT_ID"
echo "可以使用此 ID 在数据库中测试触发器"

