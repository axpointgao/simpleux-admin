/**
 * 计件项目详情抽屉组件
 */
import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Space,
  Typography,
  Spin,
  Button,
} from '@arco-design/web-react';
import { IconEdit } from '@arco-design/web-react/icon';
import { FrameworkAgreement } from '@/types/framework';
import { getFrameworkById } from '@/api/frameworks';

const { Title } = Typography;

interface FrameworkDetailDrawerProps {
  visible: boolean;
  frameworkId: string | null;
  onClose: () => void;
  onEdit?: (framework: FrameworkAgreement) => void;
}

function FrameworkDetailDrawer({
  visible,
  frameworkId,
  onClose,
  onEdit,
}: FrameworkDetailDrawerProps) {
  const [framework, setFramework] = useState<FrameworkAgreement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && frameworkId) {
      fetchFrameworkDetail();
    } else {
      setFramework(null);
    }
  }, [visible, frameworkId]);

  async function fetchFrameworkDetail() {
    if (!frameworkId) return;
    setLoading(true);
    try {
      const data = await getFrameworkById(frameworkId);
      setFramework(data);
    } catch (error) {
      console.error('获取计件项目详情失败:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!framework && !loading) {
    return null;
  }

  return (
    <Drawer
      width={900}
      title={
        <Space>
          <Title heading={6} style={{ margin: 0 }}>
            {framework?.name || '-'}
          </Title>
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      footer={
        framework && (
          <Space>
            <Button
              type="primary"
              icon={<IconEdit />}
              onClick={() => onEdit?.(framework)}
            >
              编辑
            </Button>
          </Space>
        )
      }
    >
      <Spin loading={loading} style={{ width: '100%' }}>
        {framework && (
          <>
            <Title heading={6}>基本信息</Title>
            <Descriptions
              column={2}
              data={[
                {
                  label: '计件项目名称',
                  value: framework.name,
                },
                {
                  label: '计件项目编号',
                  value: framework.code,
                },
                {
                  label: '项目经理',
                  value: framework.managerName,
                },
                {
                  label: '商务经理',
                  value: framework.bizManager || '-',
                },
                {
                  label: '归属部门',
                  value: framework.group,
                },
                {
                  label: '客户部',
                  value: framework.clientDept || '-',
                },
                {
                  label: '创建时间',
                  value: framework.createdAt
                    ? new Date(framework.createdAt).toLocaleString('zh-CN')
                    : '-',
                },
                {
                  label: '更新时间',
                  value: framework.updatedAt
                    ? new Date(framework.updatedAt).toLocaleString('zh-CN')
                    : '-',
                },
              ]}
              style={{ marginBottom: 24 }}
            />
          </>
        )}
      </Spin>
    </Drawer>
  );
}

export default FrameworkDetailDrawer;
