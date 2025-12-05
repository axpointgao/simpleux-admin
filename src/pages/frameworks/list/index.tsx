/**
 * 计件项目列表页面
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  Card,
  PaginationProps,
  Button,
  Space,
  Typography,
  Message,
  Modal,
} from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useHistory } from 'react-router-dom';
import SearchForm from './form';
import { getColumns } from './constants';
import { getFrameworks, deleteFramework } from './mock';
import { FrameworkAgreement } from '@/types/framework';
import './mock';
import styles from './style/index.module.less';

const { Title } = Typography;

function FrameworkList() {
  const history = useHistory();

  // 检查是否有关联的需求（项目）
  async function checkHasAssociatedProjects(
    frameworkId: string
  ): Promise<boolean> {
    try {
      // TODO: 调用API检查是否有项目使用该计件项目
      // 这里先用mock数据模拟
      const mockProjects = [{ frameworkId: 'fram1' }, { frameworkId: 'fram2' }];
      return mockProjects.some((p) => p.frameworkId === frameworkId);
    } catch (error) {
      console.error('检查关联项目失败:', error);
      return false;
    }
  }

  // 处理删除操作
  const handleDelete = useCallback(async (record: FrameworkAgreement) => {
    // 先检查是否有关联的需求
    const hasProjects = await checkHasAssociatedProjects(record.id);
    if (hasProjects) {
      Modal.error({
        title: '无法删除',
        content: `计件项目"${record.name}"已有关联的需求，无法删除。请先删除或解除关联的需求后再试。`,
      });
      return;
    }

    // 如果没有关联需求，显示确认对话框
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除计件项目"${record.name}"吗？删除后无法恢复。`,
      onOk: async () => {
        try {
          await deleteFramework(record.id);
          Message.success('删除成功');
          fetchData();
        } catch (error: any) {
          Message.error(error.message || '删除失败，请重试');
        }
      },
    });
  }, []);

  const tableCallback = useCallback(
    (record: FrameworkAgreement, type: string) => {
      if (type === 'edit') {
        history.push(`/frameworks/create?id=${record.id}`);
      }
    },
    [history]
  );

  const columns = useMemo(
    () => getColumns(tableCallback, handleDelete),
    [tableCallback, handleDelete]
  );

  const [data, setData] = useState<FrameworkAgreement[]>([]);
  const [pagination, setPagination] = useState<PaginationProps>({
    sizeCanChange: true,
    showTotal: true,
    pageSize: 10,
    current: 1,
    pageSizeChangeResetCurrent: true,
  });
  const [loading, setLoading] = useState(true);
  const [formParams, setFormParams] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, JSON.stringify(formParams)]);

  function fetchData() {
    const { current, pageSize } = pagination;
    setLoading(true);
    getFrameworks({
      current,
      pageSize,
      ...formParams,
    })
      .then((res) => {
        setData(res.data);
        setPagination({
          ...pagination,
          current,
          pageSize,
          total: res.total,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleSearch(params: Record<string, any>) {
    setFormParams(params);
    setPagination({ ...pagination, current: 1 });
  }

  function handleAdd() {
    history.push('/frameworks/create');
  }

  return (
    <div>
      <Card>
        <div className={styles.header}>
          <Title heading={6}>计件项目管理</Title>
        </div>

        <SearchForm onSearch={handleSearch} />

        <div className={styles['button-group']}>
          <Space>
            <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
              创建计件项目
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          data={data}
          border={{
            wrapper: true,
            cell: true,
          }}
          pagination={pagination}
          onChange={(pagination) => {
            setPagination(pagination);
          }}
        />
      </Card>
    </div>
  );
}

export default FrameworkList;
