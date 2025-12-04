/**
 * 商业项目列表表格列定义
 */
import React from 'react';
import {
  Button,
  Space,
  Tag,
  Progress,
  Dropdown,
  Menu,
} from '@arco-design/web-react';
import { IconEdit, IconMore } from '@arco-design/web-react/icon';
import { Project } from '@/types';

// 格式化金额（万元，保留两位小数）
function formatAmountInWan(amount: number | undefined): string {
  if (!amount || amount === 0) return '-';
  const wan = amount / 10000;
  return `¥${wan.toFixed(2)}`;
}

// 格式化成本明细（预算/支出）
function formatCostDetail(
  budget: number | undefined,
  expense: number | undefined
): string {
  const hasBudget = budget && budget > 0;
  const hasExpense = expense && expense > 0;

  if (!hasBudget && !hasExpense) {
    return '-/-';
  }

  const budgetStr = hasBudget ? formatAmountInWan(budget) : '-';
  const expenseStr = hasExpense ? formatAmountInWan(expense) : '-';
  return `${budgetStr}/${expenseStr}`;
}

export function getColumns(
  t: any,
  callback: (record: Project, type: string) => void
) {
  return [
    {
      title: '项目信息',
      dataIndex: 'projectInfo',
      width: 280,
      fixed: 'left' as const,
      render: (_: any, record: Project) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          项目制: { color: 'blue', text: '项目制' },
          计件制: { color: 'green', text: '计件制' },
          离岸制: { color: 'orange', text: '离岸制' },
          驻场制: { color: 'purple', text: '驻场制' },
        };
        const config = typeMap[record.type] || {
          color: 'gray',
          text: record.type,
        };

        // 计件制显示框架名称，其他显示项目名称
        const displayName =
          record.type === '计件制' && record.frameworkName
            ? record.frameworkName
            : record.name;

        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Tag color={config.color} size="small">
                {config.text}
              </Tag>
            </div>
            <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
              {displayName}
            </div>
            {record.type === '计件制' && record.demandName && (
              <div style={{ fontSize: '12px', color: '#86909c' }}>
                {record.demandName}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      width: 150,
      render: (_: any, record: Project) => {
        return (
          <div>
            <div style={{ marginBottom: 4 }}>{record.managerName}</div>
            <div style={{ fontSize: '12px', color: '#86909c' }}>
              {record.group}
            </div>
          </div>
        );
      },
    },
    {
      title: '项目状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          待启动: { color: 'gray', text: '待启动' },
          进行中: { color: 'blue', text: '进行中' },
          待确认: { color: 'orange', text: '待确认' },
          已确认: { color: 'green', text: '已确认' },
          已归档: { color: '#86909c', text: '已归档' }, // 深灰色
        };
        const config = statusMap[status] || { color: 'gray', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '周期进度',
      dataIndex: 'progress',
      width: 220,
      render: (_: any, record: Project) => {
        const end = new Date(record.planEndDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const isOverdue = days < 0;
        const daysText = isOverdue
          ? `超期${Math.abs(days)}天`
          : `剩余${days}天`;
        const progress = record.progress || 0;
        return (
          <div>
            <div
              style={{ marginBottom: 4, fontSize: '12px', color: '#86909c' }}
            >
              {record.planStartDate} ~ {record.planEndDate}
              <span
                style={{
                  marginLeft: 8,
                  color: isOverdue ? '#f53f3f' : '#86909c',
                }}
              >
                {daysText}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Progress
                percent={progress}
                size="small"
                style={{ flex: 1 }}
                showText={false}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: '#86909c',
                  whiteSpace: 'nowrap',
                }}
              >
                {progress}%
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: '业绩金额',
      dataIndex: 'contractAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => {
        if (!amount) return '-';
        const wan = amount / 10000;
        return (
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1d2129' }}>
            {wan.toFixed(2)}万
          </div>
        );
      },
    },
    {
      title: '利润率',
      dataIndex: 'profitRate',
      width: 120,
      render: (_: any, record: Project) => {
        const actual = record.actualProfitRate || 0;
        // 离岸制和驻场制没有预算概念，只显示实际利润率
        const isNoBudgetType =
          record.type === '离岸制' || record.type === '驻场制';

        if (isNoBudgetType) {
          return (
            <div style={{ color: actual > 0 ? '#00b42a' : '#86909c' }}>
              {actual > 0 ? `${actual.toFixed(1)}%` : '-'}
            </div>
          );
        }

        // 项目制和计件制显示预估和实际
        const estimated = record.estimatedProfitRate || 0;
        return (
          <div>
            <div
              style={{ fontSize: '12px', color: '#86909c', marginBottom: 2 }}
            >
              预估: {estimated > 0 ? `${estimated.toFixed(1)}%` : '-'}
            </div>
            <div style={{ color: actual > 0 ? '#00b42a' : '#86909c' }}>
              实际: {actual > 0 ? `${actual.toFixed(1)}%` : '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: '成本明细(预算/支出)',
      dataIndex: 'costDetails',
      width: 200,
      render: (_: any, record: Project) => {
        return (
          <div style={{ fontSize: '12px', lineHeight: '20px' }}>
            <div>
              人力:{' '}
              {formatCostDetail(
                record.laborBudgetTotal,
                record.laborExpenseTotal
              )}
            </div>
            <div>
              差旅:{' '}
              {formatCostDetail(
                record.travelBudgetTotal,
                record.travelExpenseTotal
              )}
            </div>
            <div>
              外包:{' '}
              {formatCostDetail(
                record.outsourceBudgetTotal,
                record.outsourceExpenseTotal
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'operations',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Project) => {
        // 根据业务规则构建菜单项
        const menuItems: React.ReactNode[] = [];

        // 项目变更：非归档、非待补录标记的项目
        if (record.status !== '已归档' && !record.isPendingEntry) {
          menuItems.push(
            <Menu.Item
              key="change"
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发行点击
                callback(record, 'change');
              }}
            >
              项目变更
            </Menu.Item>
          );
        }

        // 补录申请：待补录标记的计件制项目（已归档除外）
        if (
          record.isPendingEntry &&
          record.type === '计件制' &&
          record.status !== '已归档'
        ) {
          menuItems.push(
            <Menu.Item
              key="pendingEntry"
              onClick={(e) => {
                e.stopPropagation();
                callback(record, 'pendingEntry');
              }}
            >
              提交补录申请
            </Menu.Item>
          );
        }

        // 如果没有菜单项，不显示下拉菜单
        if (menuItems.length === 0) {
          return (
            <Space>
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                onClick={(e) => {
                  e.stopPropagation();
                  callback(record, 'updateProgress');
                }}
                title="更新进度"
              />
            </Space>
          );
        }

        const menu = <Menu>{menuItems}</Menu>;

        return (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={(e) => {
                e.stopPropagation();
                callback(record, 'updateProgress');
              }}
              title="更新进度"
            />
            <Dropdown droplist={menu} trigger="click" position="br">
              <Button
                type="text"
                size="small"
                icon={<IconMore />}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                }}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];
}
