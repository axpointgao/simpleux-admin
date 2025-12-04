/**
 * 商业项目列表页面
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  PaginationProps,
  Button,
  Space,
  Typography,
  Message,
  Modal,
  Checkbox,
} from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useHistory } from 'react-router-dom';
import useLocale from '@/utils/useLocale';
import SearchForm from './form';
import locale from './locale';
import { getColumns } from './constants';
import { getProjects } from './mock';
import { Project } from '@/types';
import ProjectDetailDrawer from './detail-drawer';
import './mock';
import styles from './style/index.module.less';

const { Title } = Typography;

function ProjectList() {
  const t = useLocale(locale);
  const history = useHistory();

  const tableCallback = async (record: Project, type: string) => {
    if (type === 'change') {
      // 项目变更
      // TODO: 打开项目变更弹窗或跳转到项目变更页面
      Message.info('项目变更功能开发中');
    } else if (type === 'pendingEntry') {
      // 提交补录申请
      // TODO: 打开补录申请弹窗或跳转到补录申请页面
      Message.info('提交补录申请功能开发中');
    } else if (type === 'updateProgress') {
      // 更新进度
      // TODO: 打开更新进度弹窗
      Message.info('更新进度功能开发中');
    }
  };

  function handleDetailClose() {
    setDetailVisible(false);
    setSelectedProjectId(null);
  }

  function handleProjectChange(project: Project) {
    setDetailVisible(false);
    // TODO: 打开项目变更弹窗或跳转到项目变更页面
    Message.info('项目变更功能开发中');
  }

  function handleDesignConfirm(project: Project) {
    // TODO: 打开设计确认弹窗
    Message.info('发起设计确认功能开发中');
  }

  function handleArchive(project: Project) {
    // TODO: 打开归档弹窗
    Message.info('发起归档功能开发中');
  }

  function handleCancelArchive(project: Project) {
    Modal.confirm({
      title: '确认取消归档',
      content: `确定要取消归档项目"${project.name}"吗？`,
      onOk: async () => {
        // TODO: 调用取消归档API
        Message.success('取消归档成功');
        setDetailVisible(false);
        fetchData();
      },
    });
  }

  function handlePendingEntry(project: Project) {
    setDetailVisible(false);
    // TODO: 打开补录申请弹窗或跳转到补录申请页面
    Message.info('提交补录申请功能开发中');
  }

  function handleEnterExpense(project: Project) {
    // TODO: 打开录入支出弹窗或跳转到录入支出页面
    Message.info('录入支出功能开发中');
  }

  const columns = useMemo(() => getColumns(t, tableCallback), [t]);

  const [data, setData] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationProps>({
    sizeCanChange: true,
    showTotal: true,
    pageSize: 10,
    current: 1,
    pageSizeChangeResetCurrent: true,
  });
  const [loading, setLoading] = useState(true);
  const [formParams, setFormParams] = useState<Record<string, any>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, [
    pagination.current,
    pagination.pageSize,
    JSON.stringify(formParams),
    showArchived,
  ]);

  function fetchData() {
    const { current, pageSize } = pagination;
    setLoading(true);
    getProjects({
      current,
      pageSize,
      ...formParams,
      showArchived,
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

  function onChangeTable({
    current,
    pageSize,
  }: {
    current: number;
    pageSize: number;
  }) {
    setPagination({
      ...pagination,
      current,
      pageSize,
    });
  }

  function handleSearch(params: Record<string, any>) {
    setFormParams(params);
    setPagination({ ...pagination, current: 1 });
  }

  function handleAdd() {
    history.push('/projects/create');
  }

  return (
    <Card>
      <Title heading={6}>{t['projects.list.title']}</Title>
      <SearchForm onSearch={handleSearch} />
      <div className={styles['button-group']}>
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            {t['projects.list.create']}
          </Button>
        </Space>
        <Space>
          <Checkbox
            checked={showArchived}
            onChange={(checked) => setShowArchived(checked)}
          >
            显示归档项目
          </Checkbox>
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        onChange={onChangeTable}
        pagination={pagination}
        columns={columns}
        data={data}
        onRow={(record) => ({
          onClick: () => {
            setSelectedProjectId(record.id);
            setDetailVisible(true);
          },
          style: { cursor: 'pointer' },
        })}
      />
      <ProjectDetailDrawer
        visible={detailVisible}
        projectId={selectedProjectId}
        onClose={handleDetailClose}
        onProjectChange={handleProjectChange}
        onDesignConfirm={handleDesignConfirm}
        onArchive={handleArchive}
        onCancelArchive={handleCancelArchive}
        onPendingEntry={handlePendingEntry}
        onEnterExpense={handleEnterExpense}
      />
    </Card>
  );
}

export default ProjectList;
