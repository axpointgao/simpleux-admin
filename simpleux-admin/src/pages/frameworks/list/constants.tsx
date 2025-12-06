/**
 * 计件项目列表表格列定义
 */
import React from 'react';
import { Button, Space } from '@arco-design/web-react';
import { FrameworkAgreement } from '@/types/framework';

export function getColumns(
  callback: (record: FrameworkAgreement, type: string) => void,
  onDelete: (record: FrameworkAgreement) => Promise<void>
) {
  return [
    {
      title: '计件项目名称',
      dataIndex: 'name',
      width: 250,
      fixed: 'left' as const,
    },
    {
      title: '项目经理',
      dataIndex: 'managerName',
      width: 120,
    },
    {
      title: '归属部门',
      dataIndex: 'group',
      width: 120,
    },
    {
      title: '商务经理',
      dataIndex: 'bizManager',
      width: 120,
    },
    {
      title: '客户部',
      dataIndex: 'clientDept',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: FrameworkAgreement) => {
        return (
          <Space>
            <Button
              type="text"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                callback(record, 'edit');
              }}
            >
              编辑
            </Button>
            <Button
              type="text"
              size="small"
              status="danger"
              onClick={async (e) => {
                e.stopPropagation();
                await onDelete(record);
              }}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];
}
