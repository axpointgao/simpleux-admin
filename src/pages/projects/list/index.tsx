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
import DesignConfirmModal from './design-confirm-modal';
import ArchiveModal from './archive-modal';
import './mock';
import styles from './style/index.module.less';

const { Title } = Typography;

function ProjectList() {
  const t = useLocale(locale);
  const history = useHistory();

  const tableCallback = async (record: Project, type: string) => {
    if (type === 'change') {
      // 项目变更 - 跳转到变更页面
      history.push(`/projects/change?id=${record.id}`);
    } else if (type === 'pendingEntry') {
      // 提交补录申请 - 跳转到补录申请页面
      history.push(`/projects/pending-entry?id=${record.id}`);
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
    // 跳转到项目变更页面
    history.push(`/projects/change?id=${project.id}`);
  }

  function handleDesignConfirm(project: Project) {
    setDesignConfirmProject(project);
    setDesignConfirmVisible(true);
  }

  async function handleDesignConfirmSubmit(data: {
    description?: string;
    attachmentUrl: string;
  }) {
    if (!designConfirmProject) return;

    try {
      // TODO: 调用设计确认申请API
      console.log('提交设计确认申请:', {
        projectId: designConfirmProject.id,
        ...data,
      });

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      Message.success('设计确认申请提交成功');
      setDesignConfirmVisible(false);
      setDesignConfirmProject(null);
      // 刷新列表数据
      fetchData();
    } catch (error) {
      Message.error('提交失败，请重试');
      throw error;
    }
  }

  function handleArchive(project: Project) {
    setArchiveProject(project);
    setArchiveVisible(true);
  }

  async function handleArchiveSubmit(data: { description?: string }) {
    if (!archiveProject) return;

    try {
      // TODO: 调用归档申请API
      console.log('提交归档申请:', {
        projectId: archiveProject.id,
        ...data,
      });

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      Message.success('归档申请提交成功');
      setArchiveVisible(false);
      setArchiveProject(null);
      // 刷新列表数据
      fetchData();
    } catch (error) {
      Message.error('提交失败，请重试');
      throw error;
    }
  }

  function handleCancelArchive(project: Project) {
    Modal.confirm({
      title: '确认取消归档',
      content: `确定要取消归档项目"${
        project.name || project.demandName
      }"吗？取消归档后项目状态将变为"已确认"。`,
      onOk: async () => {
        try {
          // TODO: 调用取消归档API
          console.log('取消归档:', {
            projectId: project.id,
          });

          // 模拟API调用
          await new Promise((resolve) => setTimeout(resolve, 500));

          Message.success('取消归档成功');
          setDetailVisible(false);
          fetchData();
        } catch (error) {
          Message.error('取消归档失败，请重试');
        }
      },
    });
  }

  function handlePendingEntry(project: Project) {
    setDetailVisible(false);
    // TODO: 打开补录申请弹窗或跳转到补录申请页面
    Message.info('提交补录申请功能开发中');
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
  const [designConfirmVisible, setDesignConfirmVisible] = useState(false);
  const [designConfirmProject, setDesignConfirmProject] =
    useState<Project | null>(null);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);

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
      />
      <DesignConfirmModal
        visible={designConfirmVisible}
        project={designConfirmProject}
        onClose={() => {
          setDesignConfirmVisible(false);
          setDesignConfirmProject(null);
        }}
        onConfirm={handleDesignConfirmSubmit}
      />
      <ArchiveModal
        visible={archiveVisible}
        project={archiveProject}
        onClose={() => {
          setArchiveVisible(false);
          setArchiveProject(null);
        }}
        onConfirm={handleArchiveSubmit}
      />
    </Card>
  );
}

export default ProjectList;
